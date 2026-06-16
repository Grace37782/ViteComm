import prisma from '../config/db.js';
import { moveToPermanent, moveMarketImage } from '../middleware/upload.js';
import { errorMessage, internalError } from '../utils/errors.js';

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
          statut_livraison: 'Livree'
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

    // --- GLOBAL COUNTS ---
    const [totalUsers, totalClients, totalVendors, totalDrivers, totalOrders, activeOrders, totalLivraisons] = await Promise.all([
      prisma.utilisateur.count(),
      prisma.client.count(),
      prisma.vendeur.count(),
      prisma.livreur.count(),
      prisma.commande.count(),
      prisma.commande.count({ where: { statut: { in: ['En attente', 'En cours', 'Validee'] } } }),
      prisma.livraison.count({ where: { statut_livraison: 'Livree' } })
    ]);

    // --- VENDOR REPUTATION LEADERBOARD ---
    const vendorsForReputation = await prisma.vendeur.findMany({
      where: { score_reputation: { gt: 0 } },
      include: {
        utilisateur: {
          select: { nom: true, prenom: true, photo_url: true }
        }
      },
      orderBy: { score_reputation: 'desc' },
      take: 5
    });
    const vendorReputationLeaderboard = vendorsForReputation.map(v => ({
      id_user: v.id_user,
      nom_etablissement: v.nom_etablissement,
      nom: v.utilisateur.nom,
      prenom: v.utilisateur.prenom,
      photo_url: v.utilisateur.photo_url,
      score_reputation: v.score_reputation
    }));

    // --- VENDOR PRODUCT COUNT ---
    const vendorProductCounts = await prisma.produit.groupBy({
      by: ['id_user_vendeur'],
      _count: { id_produit: true }
    });
    const productCountMap = Object.fromEntries(vendorProductCounts.map(v => [v.id_user_vendeur, v._count.id_produit]));
    const vendorsWithProductCount = vendorsLeaderboard.map(v => ({
      ...v,
      products_count: productCountMap[v.id_user] || 0
    }));

    return res.json({
      financier: {
        total_ventes: totalVentes,
        total_commissions_plateforme: totalCommissions
      },
      compteur: {
        total_utilisateurs: totalUsers,
        total_clients: totalClients,
        total_vendeurs: totalVendors,
        total_livreurs: totalDrivers,
        total_commandes: totalOrders,
        commandes_actives: activeOrders,
        total_livraisons: totalLivraisons
      },
      produits_populaires: popularProducts,
      produits_refuses: avoidedProducts,
      alertes: {
        litiges_ouverts: openLitiges,
        signalements_en_attente: pendingSignalements
      },
      classements: {
        vendeurs: vendorsWithProductCount,
        livreurs: driversLeaderboard,
        clients: clientsLeaderboard,
        vendeurs_reputation: vendorReputationLeaderboard
      }
    });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- 5.2. Gestion des Produits (list all) ---

export const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.produit.findMany({
      include: {
        vendeur: {
          select: {
            nom_etablissement: true,
            localisation_marche: true,
            score_reputation: true
          }
        },
        historiques: {
          orderBy: { date_modification: 'desc' },
          take: 1
        }
      },
      orderBy: { nom: 'asc' }
    });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- 5.2. Gestion des Comptes Utilisateurs (RG11, RG12, RG13, RG15) ---

// Get full user details for admin (info, reputation, role-specific data)
export const getUserDetails = async (req, res) => {
  const { id_user } = req.params;

  try {
    const userId = parseInt(id_user, 10);

    const user = await prisma.utilisateur.findUnique({
      where: { id_user: userId },
      include: {
        client: true,
        vendeur: true,
        livreur: true
      }
    });

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    // eslint-disable-next-line no-unused-vars
    const { mot_de_passe, ...safeUser } = user;

    // Feedback history for reputation
    const orConditions = [];
    if (safeUser.vendeur) orConditions.push({ id_user_vendeur: userId });
    if (safeUser.livreur) orConditions.push({ livraison: { id_user_livreur: userId } });

    const feedbacks = orConditions.length > 0 ? await prisma.feedback.findMany({
      where: { OR: orConditions },
      include: {
        livraison: {
          include: {
            commande: { include: { client: { include: { utilisateur: { select: { nom: true, prenom: true } } } } } },
            livreur: { include: { utilisateur: { select: { nom: true, prenom: true } } } }
          }
        }
      },
      orderBy: { date_publication: 'desc' },
      take: 20
    }) : [];

    let roleData = {};

    if (safeUser.vendeur) {
      const products = await prisma.produit.findMany({
        where: { id_user_vendeur: userId },
        include: {
          historiques: { orderBy: { date_modification: 'asc' } }
        }
      });

      const totalOrders = await prisma.detailCommande.count({
        where: {
          statut_acceptation: 'Accepte',
          produit: { id_user_vendeur: userId }
        }
      });

      const totalRevenue = await prisma.detailCommande.aggregate({
        where: {
          statut_acceptation: 'Accepte',
          produit: { id_user_vendeur: userId }
        },
        _sum: { prix_vente_applique: true }
      });

      roleData = {
        type: 'vendeur',
        products,
        total_ventes: totalOrders,
        total_revenu: totalRevenue._sum.prix_vente_applique || 0,
        score_reputation: safeUser.vendeur.score_reputation,
        nom_etablissement: safeUser.vendeur.nom_etablissement,
        localisation_marche: safeUser.vendeur.localisation_marche
      };
    } else if (safeUser.livreur) {
      const deliveries = await prisma.livraison.findMany({
        where: { id_user_livreur: userId },
        include: {
          commande: {
            include: { client: { include: { utilisateur: { select: { nom: true, prenom: true } } } } }
          }
        },
        orderBy: { date_prise_en_charge: 'desc' },
        take: 20
      });

      const totalDeliveries = deliveries.length;
      const totalVolume = deliveries.reduce((acc, d) => acc + d.commande.total_marchandises, 0);

      roleData = {
        type: 'livreur',
        deliveries,
        total_livraisons: totalDeliveries,
        volume_total: totalVolume,
        score_reputation: safeUser.livreur.score_reputation,
        type_vehicule: safeUser.livreur.type_vehicule,
        immatriculation: safeUser.livreur.immatriculation
      };

      // Fetch latest availability from DisponibiliteLivreur (RG29)
      const latestDispo = await prisma.disponibiliteLivreur.findFirst({
        where: { id_user_livreur: userId },
        orderBy: { date_mise_a_jour: 'desc' }
      });
      if (latestDispo) {
        roleData.est_disponible = latestDispo.est_disponible;
      }
    } else if (safeUser.client) {
      const orders = await prisma.commande.findMany({
        where: { id_user_client: userId },
        orderBy: { date_creation: 'desc' },
        take: 20
      });

      const totalOrders = orders.length;
      const totalSpent = orders.reduce((acc, o) => acc + o.total_marchandises, 0);

      roleData = {
        type: 'client',
        orders,
        total_commandes: totalOrders,
        total_depense: totalSpent,
        adresse_livraison: safeUser.client.adresse_livraison
      };
    }

    return res.json({
      user: safeUser,
      feedbacks,
      roleData
    });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

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
    const parsedUsers = users.map(({ mot_de_passe: _, ...safeUser }) => safeUser);
    return res.json(parsedUsers);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
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
    return res.status(500).json({ error: internalError(error) });
  }
};

// Admin get their own profile
export const getAdminMe = async (req, res) => {
  try {
    const user = await prisma.utilisateur.findUnique({
      where: { id_user: req.user.id_user },
      select: {
        id_user: true, nom: true, prenom: true, telephone: true,
        email: true, photo_url: true, est_admin: true, statut_compte: true
      }
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

// Admin update their own profile
export const updateAdminProfile = async (req, res) => {
  const { nom, prenom, telephone, email, photo_url, mot_de_passe } = req.body;
  const adminId = req.user.id_user;

  if (!nom || !prenom || !telephone || !email) {
    return res.status(400).json({ error: 'Les champs nom, prenom, telephone et email sont requis.' });
  }

  try {
    const data = { nom, prenom, telephone, email };

    // Handle uploaded photo
    if (req.file) {
      data.photo_url = moveToPermanent(req.file.filename);
    } else if (photo_url !== undefined) {
      data.photo_url = photo_url || null;
    }

    // Handle password change
    if (mot_de_passe) {
      const bcryptjs = await import('bcryptjs');
      data.mot_de_passe = await bcryptjs.hash(mot_de_passe, 12);
    }

    const updated = await prisma.utilisateur.update({
      where: { id_user: adminId },
      data,
      select: {
        id_user: true, nom: true, prenom: true, telephone: true,
        email: true, photo_url: true, est_admin: true, statut_compte: true
      }
    });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
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
    return res.status(500).json({ error: internalError(error) });
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
    return res.status(500).json({ error: internalError(error) });
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
    return res.status(500).json({ error: internalError(error) });
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
    return res.status(500).json({ error: internalError(error) });
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
    return res.status(500).json({ error: internalError(error) });
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
          include: { medias: true }
        },
        detailsCommande: {
          include: { produit: true }
        }
      },
      orderBy: { date_ouverture: 'desc' }
    });
    return res.json(litiges);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
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
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

// --- 5.5. Gestion des Marchés par l'Administrateur ---

export const getMarketsAdmin = async (req, res) => {
  try {
    const markets = await prisma.marche.findMany({
      include: {
        _count: { select: { vendeurs: true } }
      },
      orderBy: { nom: 'asc' }
    });
    return res.json(markets);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

export const createMarket = async (req, res) => {
  const { nom, latitude, longitude, image_url, description } = req.body;
  if (!nom || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Nom, latitude et longitude requis.' });
  }

  try {
    const data = {
      nom,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      description
    };

    if (req.file) {
      data.image_url = moveMarketImage(req.file.filename);
    } else if (image_url) {
      data.image_url = image_url;
    }

    const market = await prisma.marche.create({ data });
    return res.status(201).json(market);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

export const updateMarket = async (req, res) => {
  const { id } = req.params;
  const { nom, latitude, longitude, image_url, description } = req.body;

  try {
    const data = {};
    if (nom) data.nom = nom;
    if (latitude !== undefined) data.latitude = parseFloat(latitude);
    if (longitude !== undefined) data.longitude = parseFloat(longitude);
    if (description !== undefined) data.description = description;
    if (image_url !== undefined) data.image_url = image_url;

    if (req.file) {
      data.image_url = moveMarketImage(req.file.filename);
    }

    const market = await prisma.marche.update({
      where: { id_marche: parseInt(id, 10) },
      data
    });
    return res.json(market);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

export const deleteMarket = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.marche.delete({
      where: { id_marche: parseInt(id, 10) }
    });
    return res.json({ message: 'Marché supprimé avec succès.' });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};
