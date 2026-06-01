import prisma from '../config/db.js';

// --- 2.1. Tableau de bord Client - Recherche de produits et marchés ---

export const getProducts = async (req, res) => {
  const { search, marche } = req.query;

  try {
    const products = await prisma.produit.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { nom: { contains: search } },
                  { description: { contains: search } }
                ]
              }
            : undefined,
          marche
            ? {
                vendeur: {
                  localisation_marche: { contains: marche }
                }
              }
            : undefined,
          { stock_disponible: { gt: 0 } }
        ].filter(Boolean)
      },
      include: {
        vendeur: {
          include: {
            utilisateur: {
              select: { nom: true, prenom: true }
            }
          }
        }
      }
    });

    return res.json(products);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des produits.' });
  }
};

// Get price history for a product (public - RG24)
export const getProductPriceHistory = async (req, res) => {
  const { id_produit } = req.params;

  try {
    const history = await prisma.historiquePrix.findMany({
      where: { id_produit: parseInt(id_produit, 10) },
      orderBy: { date_modification: 'asc' }
    });
    return res.json(history);
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors du chargement de l'historique des prix." });
  }
};

// Get list of available delivery drivers for checkout selection (RG05, RG19)
export const getDrivers = async (req, res) => {
  try {
    // Get IDs of livreurs whose latest availability record has est_disponible = true (RG29)
    const availableEntries = await prisma.disponibiliteLivreur.groupBy({
      by: ['id_user_livreur'],
      _max: { date_mise_a_jour: true },
      where: { est_disponible: true }
    });
    const availableDriverIds = availableEntries.map(e => e.id_user_livreur);

    const drivers = await prisma.livreur.findMany({
      where: {
        id_user: { in: availableDriverIds },
        utilisateur: { statut_compte: 'Actif' }
      },
      include: {
        utilisateur: {
          select: { nom: true, prenom: true, telephone: true }
        }
      }
    });
    return res.json(drivers);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des livreurs.' });
  }
};

// --- 2.2. Gestion du Panier (RG22) ---

export const getCart = async (req, res) => {
  try {
    const cart = await prisma.panier.findUnique({
      where: { id_user_client: req.user.id_user },
      include: {
        details: {
          include: {
            produit: {
              include: {
                vendeur: { select: { nom_etablissement: true } }
              }
            }
          }
        }
      }
    });
    return res.json(cart || { details: [] });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement du panier.' });
  }
};

export const upsertCartItem = async (req, res) => {
  const { id_produit, quantite } = req.body;

  if (!id_produit || quantite === undefined || quantite < 0) {
    return res.status(400).json({ error: 'Produit et quantité (≥ 0) requis.' });
  }

  try {
    const product = await prisma.produit.findUnique({ where: { id_produit: parseInt(id_produit, 10) } });
    if (!product) return res.status(404).json({ error: 'Produit introuvable.' });
    if (quantite > product.stock_disponible) {
      return res.status(400).json({ error: `Stock insuffisant. Restant : ${product.stock_disponible}` });
    }

    await prisma.$transaction(async (tx) => {
      // Ensure cart exists (RG22)
      const cart = await tx.panier.upsert({
        where: { id_user_client: req.user.id_user },
        update: { date_mise_a_jour: new Date() },
        create: { id_user_client: req.user.id_user }
      });

      if (quantite === 0) {
        // Remove item
        await tx.detailPanier.deleteMany({
          where: { id_panier: cart.id_panier, id_produit: product.id_produit }
        });
      } else {
        // Upsert cart line
        await tx.detailPanier.upsert({
          where: { id_panier_id_produit: { id_panier: cart.id_panier, id_produit: product.id_produit } },
          update: { quantite: parseInt(quantite, 10) },
          create: { id_panier: cart.id_panier, id_produit: product.id_produit, quantite: parseInt(quantite, 10) }
        });
      }
    });

    return res.json({ message: 'Panier mis à jour.' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const cart = await prisma.panier.findUnique({ where: { id_user_client: req.user.id_user } });
    if (cart) {
      await prisma.detailPanier.deleteMany({ where: { id_panier: cart.id_panier } });
    }
    return res.json({ message: 'Panier vidé.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du vidage du panier.' });
  }
};

// --- 2.3. Passer une commande (Checkout - RG01, RG05, RG08, RG22, RG24) ---

export const createOrder = async (req, res) => {
  const { id_user_livreur, items } = req.body;
  // items: [{ id_produit, quantite_commandee }]

  if (!id_user_livreur || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Détails de la commande invalides.' });
  }

  try {
    const client = await prisma.client.findUnique({ where: { id_user: req.user.id_user } });
    if (!client) return res.status(403).json({ error: 'Seuls les clients peuvent passer des commandes.' });

    const command = await prisma.$transaction(async (tx) => {
      let totalGoods = 0;
      const parsedItems = [];

      for (const item of items) {
        const product = await tx.produit.findUnique({ where: { id_produit: item.id_produit } });

        if (!product) throw new Error(`Produit ID ${item.id_produit} non trouvé.`);
        if (product.stock_disponible < item.quantite_commandee) {
          throw new Error(`Stock insuffisant pour "${product.nom}". Restant : ${product.stock_disponible}`);
        }

        // Deduct stock
        await tx.produit.update({
          where: { id_produit: item.id_produit },
          data: { stock_disponible: product.stock_disponible - item.quantite_commandee }
        });

        // Freeze price at order time (RG24)
        const appliedPrice = product.prix_reference;
        totalGoods += appliedPrice * item.quantite_commandee;

        parsedItems.push({
          id_produit: product.id_produit,
          quantite_commandee: item.quantite_commandee,
          prix_vente_applique: appliedPrice
        });
      }

      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase(); // RG06
      const commission = parseFloat((totalGoods * 0.006).toFixed(2)); // RG08
      const deliveryFee = 1500;

      const newCommand = await tx.commande.create({
        data: {
          total_marchandises: totalGoods,
          frais_livraison: deliveryFee,
          commission,
          code_verification: verificationCode,
          id_user_client: client.id_user,
          statut: 'En attente'
        }
      });

      // Create DetailCommande rows - keyed by (id_commande, id_produit) only (RG18)
      for (const pi of parsedItems) {
        await tx.detailCommande.create({
          data: {
            id_commande: newCommand.id_commande,
            id_produit: pi.id_produit,
            quantite_commandee: pi.quantite_commandee,
            prix_vente_applique: pi.prix_vente_applique,
            statut_acceptation: 'En attente'
          }
        });
      }

      // Assign driver (RG05) -> create Livraison
      await tx.livraison.create({
        data: {
          id_commande: newCommand.id_commande,
          id_user_livreur,
          statut_livraison: 'En cours de collecte',
          frais_retour_calcules: 0.0
        }
      });

      // Clear cart after order is placed (RG22)
      const cart = await tx.panier.findUnique({ where: { id_user_client: client.id_user } });
      if (cart) {
        await tx.detailPanier.deleteMany({ where: { id_panier: cart.id_panier } });
      }

      return newCommand;
    });

    return res.status(201).json({
      message: 'Commande créée avec succès.',
      id_commande: command.id_commande,
      code_verification: command.code_verification
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// --- 2.4. Suivi des commandes ---

export const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.commande.findMany({
      where: { id_user_client: req.user.id_user },
      include: {
        detailsCommande: {
          include: { produit: true }
        },
        livraison: {
          include: {
            livreur: {
              include: {
                utilisateur: { select: { nom: true, prenom: true, telephone: true } }
              }
            }
          }
        },
        preuvesCollecte: {
          include: { medias: true }
        }
      },
      orderBy: { date_creation: 'desc' }
    });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des commandes.' });
  }
};

// --- 2.6. Évaluations (Feedback - RG10, RG15, RG20, RG23) ---
// The client creates one Feedback per type (LIVREUR or VENDEUR) per delivery.

export const createFeedback = async (req, res) => {
  const { id_livraison, type_feedback, note, commentaire, id_user_vendeur, id_produits } = req.body;
  // id_produits: optional array of id_produit to link DETAIL_COMMANDE lines to this feedback

  if (!id_livraison || !type_feedback || !note) {
    return res.status(400).json({ error: 'id_livraison, type_feedback et note sont requis.' });
  }
  if (!['LIVREUR', 'VENDEUR'].includes(type_feedback)) {
    return res.status(400).json({ error: "type_feedback doit être 'LIVREUR' ou 'VENDEUR'." });
  }
  if (type_feedback === 'VENDEUR' && !id_user_vendeur) {
    return res.status(400).json({ error: 'id_user_vendeur requis pour un feedback VENDEUR.' });
  }

  try {
    const livraison = await prisma.livraison.findUnique({
      where: { id_livraison: parseInt(id_livraison, 10) },
      include: { commande: true }
    });

    if (!livraison || livraison.commande.id_user_client !== req.user.id_user) {
      return res.status(404).json({ error: 'Livraison introuvable.' });
    }
    if (livraison.statut_livraison !== 'Livree') {
      return res.status(400).json({ error: "Vous ne pouvez évaluer qu'une livraison terminée." });
    }

    await prisma.$transaction(async (tx) => {
      const feedback = await tx.feedback.create({
        data: {
          id_user_client: req.user.id_user,
          type_feedback,
          note: parseInt(note, 10),
          commentaire: commentaire || null,
          id_livraison: parseInt(id_livraison, 10),
          id_user_vendeur: type_feedback === 'VENDEUR' ? parseInt(id_user_vendeur, 10) : null
        }
      });

      // Link specific DETAIL_COMMANDE lines to this feedback (RG23)
      if (id_produits && Array.isArray(id_produits) && id_produits.length > 0) {
        for (const id_produit of id_produits) {
          await tx.detailCommande.updateMany({
            where: {
              id_commande: livraison.id_commande,
              id_produit: parseInt(id_produit, 10)
            },
            data: { id_feedback: feedback.id_feedback }
          });
        }
      }

      // Update reputation scores (RG10, RG15)
      if (type_feedback === 'LIVREUR') {
        const allDriverFeedbacks = await tx.feedback.findMany({
          where: { id_livraison: { not: null }, type_feedback: 'LIVREUR', livraison: { id_user_livreur: livraison.id_user_livreur } }
        });
        const avg = allDriverFeedbacks.reduce((s, f) => s + f.note, 0) / allDriverFeedbacks.length;
        await tx.livreur.update({
          where: { id_user: livraison.id_user_livreur },
          data: { score_reputation: parseFloat(avg.toFixed(1)) }
        });
      } else if (type_feedback === 'VENDEUR' && id_user_vendeur) {
        const vendorId = parseInt(id_user_vendeur, 10);
        const allVendorFeedbacks = await tx.feedback.findMany({
          where: { type_feedback: 'VENDEUR', id_user_vendeur: vendorId }
        });
        const avg = allVendorFeedbacks.reduce((s, f) => s + f.note, 0) / allVendorFeedbacks.length;
        await tx.vendeur.update({
          where: { id_user: vendorId },
          data: { score_reputation: parseFloat(avg.toFixed(1)) }
        });
      }
    });

    return res.json({ message: 'Évaluation enregistrée avec succès.' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// --- 2.7. Signalement (RG14) ---

export const createSignalement = async (req, res) => {
  const { motif, type_cible_cible, id_cible } = req.body;

  if (!motif || !type_cible_cible || !id_cible) {
    return res.status(400).json({ error: 'Motif et cible requis.' });
  }

  try {
    const targetUser = await prisma.utilisateur.findUnique({ where: { id_user: parseInt(id_cible, 10) } });
    if (!targetUser) return res.status(404).json({ error: 'Cible introuvable.' });

    const signalement = await prisma.signalement.create({
      data: {
        motif,
        type_cible_cible,
        id_auteur: req.user.id_user,
        id_cible: parseInt(id_cible, 10),
        statut_traitement: 'En attente'
      }
    });

    return res.status(201).json({
      message: "Signalement envoyé. L'administrateur étudiera le cas.",
      id_signalement: signalement.id_signalement
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du signalement.' });
  }
};
