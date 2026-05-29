import prisma from '../config/db.js';

// --- 5.1. Tableau de bord Administrateur (RG08, RG12) ---

export const getAdminDashboard = async (req, res) => {
  try {
    const orders = await prisma.commande.findMany({ where: { statut: 'Livree' } });

    const totalVentes = orders.reduce((acc, curr) => acc + curr.total_marchandises, 0);
    const totalCommissions = orders.reduce((acc, curr) => acc + curr.commission, 0);

    // Most purchased products (RG12)
    const productStats = await prisma.detailCommande.groupBy({
      by: ['id_produit'],
      _sum: { quantite_commandee: true },
      where: { statut_acceptation: 'Accepte' },
      orderBy: { _sum: { quantite_commandee: 'desc' } },
      take: 5
    });

    // Most rejected products (RG12)
    const rejectedProductStats = await prisma.detailCommande.groupBy({
      by: ['id_produit'],
      _sum: { quantite_commandee: true },
      where: { statut_acceptation: 'Rejete' },
      orderBy: { _sum: { quantite_commandee: 'desc' } },
      take: 5
    });

    const enrichProduct = async (stat) => {
      const prod = await prisma.produit.findUnique({
        where: { id_produit: stat.id_produit },
        include: {
          vendeur: {
            select: {
              nom_etablissement: true,
              localisation_marche: true
            }
          }
        }
      });
      return { ...prod, quantite: stat._sum.quantite_commandee };
    };

    const [popularProducts, avoidedProducts] = await Promise.all([
      Promise.all(productStats.map(enrichProduct)),
      Promise.all(rejectedProductStats.map(enrichProduct))
    ]);

    // Open litiges and pending signalements counts
    const openLitiges = await prisma.litige.count({ where: { statut: 'Ouvert' } });
    const pendingSignalements = await prisma.signalement.count({ where: { statut_traitement: 'En attente' } });

    // --- LEADERBOARDS & CLASSEMENTS FINANCIERS ---
    
    // 1. Vendors ranked by Chiffre d'Affaires (CA)
    const vendors = await prisma.vendeur.findMany({
      include: {
        utilisateur: {
          select: { nom: true, prenom: true, photo_url: true }
        }
      }
    });

    const vendorsLeaderboard = await Promise.all(vendors.map(async (v) => {
      // Find all accepted DetailCommande items for this vendor in delivered orders
      const acceptedItems = await prisma.detailCommande.findMany({
        where: {
          statut_acceptation: 'Accepte',
          produit: { id_user_vendeur: v.id_user },
          commande: { statut: 'Livree' }
        }
      });

      const ca = acceptedItems.reduce((acc, item) => acc + (item.quantite_commandee * item.prix_vente_applique), 0);
      return {
        id_user: v.id_user,
        nom_etablissement: v.nom_etablissement,
        nom: v.utilisateur.nom,
        prenom: v.utilisateur.prenom,
        photo_url: v.utilisateur.photo_url,
        chiffre_affaires: ca
      };
    }));
    vendorsLeaderboard.sort((a, b) => b.chiffre_affaires - a.chiffre_affaires);

    // 2. Drivers ranked by Delivered Volume
    const drivers = await prisma.livreur.findMany({
      include: {
        utilisateur: {
          select: { nom: true, prenom: true, photo_url: true }
        }
      }
    });

    const driversLeaderboard = await Promise.all(drivers.map(async (d) => {
      // Find all delivered Livraisons
      const deliveries = await prisma.livraison.findMany({
        where: {
          id_user_livreur: d.id_user,
          statut: 'Livree'
        },
        include: {
          commande: {
            select: { total_marchandises: true }
          }
        }
      });

      const vol = deliveries.reduce((acc, del) => acc + del.commande.total_marchandises, 0);
      return {
        id_user: d.id_user,
        nom: d.utilisateur.nom,
        prenom: d.utilisateur.prenom,
        photo_url: d.utilisateur.photo_url,
        volume_livre: vol,
        courses_count: deliveries.length
      };
    }));
    driversLeaderboard.sort((a, b) => b.volume_livre - a.volume_livre);

    // 3. Clients ranked by Processed Orders Volume
    const clients = await prisma.client.findMany({
      include: {
        utilisateur: {
          select: { nom: true, prenom: true, photo_url: true }
        }
      }
    });

    const clientsLeaderboard = await Promise.all(clients.map(async (c) => {
      const deliveredOrders = await prisma.commande.findMany({
        where: {
          id_user_client: c.id_user,
          statut: 'Livree'
        }
      });

      const totalAchat = deliveredOrders.reduce((acc, o) => acc + o.total_marchandises, 0);
      return {
        id_user: c.id_user,
        nom: c.utilisateur.nom,
        prenom: c.utilisateur.prenom,
        photo_url: c.utilisateur.photo_url,
        volume_achat: totalAchat,
        commandes_count: deliveredOrders.length
      };
    }));
    clientsLeaderboard.sort((a, b) => b.volume_achat - a.volume_achat);

    return res.json({
      financier: {
        total_ventes: totalVentes,
        total_commissions_plateforme: totalCommissions
      },
      produits_populaires: popularProducts,
      produits_refuses: avoidedProducts,
      alertes: {
        litiges_ouverts: openLitiges,
        signalements_en_attente: pendingSignalements
      },
      classements: {
        vendeurs: vendorsLeaderboard,
        livreurs: driversLeaderboard,
        clients: clientsLeaderboard
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du calcul du dashboard: ' + error.message });
  }
};

// --- 5.2. Gestion des Comptes Utilisateurs (RG11, RG12, RG13, RG15) ---

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.utilisateur.findMany({
      include: {
        client: true,
        vendeur: true,
        livreur: true
      }
    });

    // Strip passwords; strip client order history (RG11)
    const parsedUsers = users.map(({ mot_de_passe, ...safeUser }) => safeUser);
    return res.json(parsedUsers);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des utilisateurs.' });
  }
};

export const updateUserStatus = async (req, res) => {
  const { id_user } = req.params;
  const { statut_compte } = req.body;

  if (!statut_compte || !['Actif', 'Suspendu', 'Banni'].includes(statut_compte)) {
    return res.status(400).json({ error: 'Statut de compte invalide.' });
  }

  try {
    const userId = parseInt(id_user, 10);
    const user = await prisma.utilisateur.findUnique({ where: { id_user: userId } });

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    if (user.id_user === req.user.id_user) {
      return res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre statut.' });
    }

    await prisma.utilisateur.update({ where: { id_user: userId }, data: { statut_compte } });
    return res.json({ message: `Statut mis à jour : ${statut_compte}` });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
};

export const deleteUser = async (req, res) => {
  const { id_user } = req.params;

  try {
    const userId = parseInt(id_user, 10);
    const user = await prisma.utilisateur.findUnique({ where: { id_user: userId } });

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    if (user.id_user === req.user.id_user) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' });
    }

    await prisma.utilisateur.delete({ where: { id_user: userId } });
    return res.json({ message: 'Compte supprimé avec succès.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
};

// Vendor catalogue view for admin (RG12)
export const getVendorCatalogue = async (req, res) => {
  const { id_user } = req.params;

  try {
    const products = await prisma.produit.findMany({
      where: { id_user_vendeur: parseInt(id_user, 10) },
      include: { historiques: { orderBy: { date_modification: 'asc' } } }
    });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement du catalogue.' });
  }
};

// Price history audit (RG24)
export const getPriceHistory = async (req, res) => {
  const { id_produit } = req.params;

  try {
    const history = await prisma.historiquePrix.findMany({
      where: { id_produit: parseInt(id_produit, 10) },
      include: { produit: { select: { nom: true, id_user_vendeur: true } } },
      orderBy: { date_modification: 'asc' }
    });
    return res.json(history);
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors du chargement de l'historique des prix." });
  }
};

// --- 5.3. Centre de modération (Signalements - RG14) ---

export const getSignalements = async (req, res) => {
  try {
    const reports = await prisma.signalement.findMany({
      include: {
        auteur: { select: { nom: true, prenom: true, email: true } },
        cible: { select: { nom: true, prenom: true, email: true, statut_compte: true } }
      },
      orderBy: { date_heure: 'desc' }
    });
    return res.json(reports);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des signalements.' });
  }
};

export const updateSignalementStatus = async (req, res) => {
  const { id_signalement } = req.params;
  const { statut_traitement } = req.body;

  if (!['En attente', 'Traite', 'Classe'].includes(statut_traitement)) {
    return res.status(400).json({ error: 'Statut invalide.' });
  }

  try {
    const updated = await prisma.signalement.update({
      where: { id_signalement: parseInt(id_signalement, 10) },
      data: { statut_traitement }
    });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur de mise à jour du signalement.' });
  }
};

// --- 5.4. Centre d'Arbitrage des Litiges (RG09, RG16, RG21) ---

export const getLitiges = async (req, res) => {
  try {
    const litiges = await prisma.litige.findMany({
      include: {
        livraison: {
          include: {
            commande: {
              include: {
                client: {
                  include: { utilisateur: { select: { nom: true, prenom: true } } }
                }
              }
            },
            livreur: {
              include: { utilisateur: { select: { nom: true, prenom: true } } }
            }
          }
        },
        preuve: {
          include: { photos: true }  // Photographic evidence gallery (RG07)
        },
        detailsCommande: {
          include: { produit: true }
        }
      },
      orderBy: { date_ouverture: 'desc' }
    });
    return res.json(litiges);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des litiges.' });
  }
};

export const resolveLitige = async (req, res) => {
  const { id_litige } = req.params;
  const { decision_admin, montant_rembourse } = req.body;

  if (!decision_admin || montant_rembourse === undefined) {
    return res.status(400).json({ error: 'Décision et montant de remboursement requis.' });
  }

  try {
    const litigeId = parseInt(id_litige, 10);
    const litige = await prisma.litige.findUnique({
      where: { id_litige: litigeId },
      include: { livraison: { include: { commande: true } } }
    });

    if (!litige) return res.status(404).json({ error: 'Litige introuvable.' });

    await prisma.$transaction(async (tx) => {
      await tx.litige.update({
        where: { id_litige: litigeId },
        data: {
          statut: 'Resolu',
          decision_admin,
          montant_rembourse: parseFloat(montant_rembourse)
        }
      });

      // Update vendor reputation after dispute resolution (RG10)
      // Find all rejected products in this litige's detail lines
      const rejectedLines = await tx.detailCommande.findMany({
        where: { id_litige: litigeId },
        include: { produit: true }
      });

      const affectedVendorIds = [...new Set(rejectedLines.map((l) => l.produit.id_user_vendeur))];
      for (const vendorId of affectedVendorIds) {
        const vendorFeedbacks = await tx.feedback.findMany({
          where: { type_feedback: 'VENDEUR', id_user_vendeur: vendorId }
        });
        if (vendorFeedbacks.length > 0) {
          const avg = vendorFeedbacks.reduce((s, f) => s + f.note, 0) / vendorFeedbacks.length;
          await tx.vendeur.update({
            where: { id_user: vendorId },
            data: { score_reputation: parseFloat(avg.toFixed(1)) }
          });
        }
      }
    });

    return res.json({ message: 'Litige résolu avec succès.' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
