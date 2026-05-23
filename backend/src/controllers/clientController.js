import prisma from '../config/db.js';

// 2.1. Tableau de bord Client - Recherche de produits et marchés
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
          { stock_disponible: { gt: 0 } } // Only active/available products
        ].filter(Boolean)
      },
      include: {
        vendeur: {
          include: {
            utilisateur: {
              select: {
                nom: true,
                prenom: true
              }
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

// Get list of active delivery drivers (Livreurs) for checkout selection
export const getDrivers = async (req, res) => {
  try {
    const drivers = await prisma.livreur.findMany({
      where: {
        utilisateur: {
          statut_compte: 'Actif'
        }
      },
      include: {
        utilisateur: {
          select: {
            nom: true,
            prenom: true,
            telephone: true
          }
        }
      }
    });
    return res.json(drivers);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des livreurs.' });
  }
};

// 2.3. Passer une commande (Tunnel de Commande - Règle RG01, RG05, RG08)
export const createOrder = async (req, res) => {
  const { id_user_livreur, items, adresse_livraison_override } = req.body;

  if (!id_user_livreur || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Détails de la commande invalides.' });
  }

  try {
    // Verify client role
    const client = await prisma.client.findUnique({
      where: { id_user: req.user.id_user }
    });
    if (!client) {
      return res.status(403).json({ error: 'Seuls les clients peuvent passer des commandes.' });
    }

    // Process order in a transaction
    const command = await prisma.$transaction(async (tx) => {
      let totalGoods = 0;
      const parsedItems = [];

      for (const item of items) {
        const product = await tx.produit.findUnique({
          where: { id_produit: item.id_produit }
        });

        if (!product) {
          throw new Error(`Produit ID ${item.id_produit} non trouvé.`);
        }

        if (product.stock_disponible < item.quantite_commandee) {
          throw new Error(`Stock insuffisant pour le produit "${product.nom}". Restant: ${product.stock_disponible}`);
        }

        // Deduct stock
        await tx.produit.update({
          where: { id_produit: item.id_produit },
          data: { stock_disponible: product.stock_disponible - item.quantite_commandee }
        });

        const lineTotal = product.prix_reference * item.quantite_commandee;
        totalGoods += lineTotal;

        parsedItems.push({
          id_produit: product.id_produit,
          id_user_vendeur: product.id_user_vendeur,
          quantite_commandee: item.quantite_commandee,
          prix_vente_applique: product.prix_reference,
          statut_acceptation: 'En attente'
        });
      }

      // Generate verification code (RG06) - 6 characters random string
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Platform commission calculation (0.6%, RG08)
      const commission = parseFloat((totalGoods * 0.006).toFixed(2));
      const deliveryFee = 1500; // Mock delivery fee (FCFA)

      // Create Commande
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

      // Create Details Commande
      for (const pi of parsedItems) {
        await tx.detailCommande.create({
          data: {
            id_commande: newCommand.id_commande,
            id_produit: pi.id_produit,
            id_user_vendeur: pi.id_user_vendeur,
            quantite_commandee: pi.quantite_commandee,
            prix_vente_applique: pi.prix_vente_applique,
            statut_acceptation: pi.statut_acceptation
          }
        });
      }

      // Assign delivery driver (RG05) -> create Livraison
      await tx.livraison.create({
        data: {
          id_commande: newCommand.id_commande,
          id_user_livreur: id_user_livreur,
          statut_livraison: 'En cours de collecte',
          frais_retour_calcules: 0.0
        }
      });

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

// 2.4. Suivi des commandes
export const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.commande.findMany({
      where: { id_user_client: req.user.id_user },
      include: {
        detailsCommande: {
          include: {
            produit: true,
            vendeur: {
              select: {
                nom_etablissement: true
              }
            }
          }
        },
        livraison: {
          include: {
            livreur: {
              include: {
                utilisateur: {
                  select: {
                    nom: true,
                    prenom: true,
                    telephone: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { date_creation: 'desc' }
    });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des commandes.' });
  }
};

// 2.6. Laisser une évaluation (Feedback - Règle RG10, RG15)
export const createFeedback = async (req, res) => {
  const { id_commande, note_produit, note_transport, commentaire } = req.body;

  if (!id_commande || !note_produit || !note_transport) {
    return res.status(400).json({ error: 'Tous les champs obligatoires sont requis.' });
  }

  try {
    const command = await prisma.commande.findUnique({
      where: { id_commande },
      include: { livraison: true, detailsCommande: true }
    });

    if (!command || command.id_user_client !== req.user.id_user) {
      return res.status(404).json({ error: 'Commande introuvable.' });
    }

    if (command.statut !== 'Livree') {
      return res.status(400).json({ error: 'Vous ne pouvez évaluer qu\'une commande livrée.' });
    }

    const existingFeedback = await prisma.feedback.findUnique({
      where: { id_commande }
    });
    if (existingFeedback) {
      return res.status(400).json({ error: 'Vous avez déjà évalué cette commande.' });
    }

    // Save feedback and update reputations
    await prisma.$transaction(async (tx) => {
      // Create feedback record
      await tx.feedback.create({
        data: {
          id_commande,
          id_user_client: req.user.id_user,
          note_produit,
          note_transport,
          commentaire
        }
      });

      // Recalculate Livreur reputation
      if (command.livraison) {
        const driverFeedbacks = await tx.feedback.findMany({
          where: {
            commande: {
              livraison: {
                id_user_livreur: command.livraison.id_user_livreur
              }
            }
          }
        });
        const avgDriverNote = driverFeedbacks.reduce((acc, curr) => acc + curr.note_transport, 0) / driverFeedbacks.length;
        await tx.livreur.update({
          where: { id_user: command.livraison.id_user_livreur },
          data: { score_reputation: parseFloat(avgDriverNote.toFixed(1)) }
        });
      }

      // Recalculate Vendor reputations for all vendors involved in the order
      const uniqueVendorIds = [...new Set(command.detailsCommande.map(d => d.id_user_vendeur))];
      for (const vendorId of uniqueVendorIds) {
        const vendorFeedbacks = await tx.feedback.findMany({
          where: {
            commande: {
              detailsCommande: {
                some: { id_user_vendeur: vendorId }
              }
            }
          }
        });
        const avgVendorNote = vendorFeedbacks.reduce((acc, curr) => acc + curr.note_produit, 0) / vendorFeedbacks.length;
        await tx.vendeur.update({
          where: { id_user: vendorId },
          data: { score_reputation: parseFloat(avgVendorNote.toFixed(1)) }
        });
      }
    });

    return res.json({ message: 'Évaluation enregistrée avec succès.' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// 2.7. Soumettre un signalement (RG14)
export const createSignalement = async (req, res) => {
  const { motif, type_cible_cible, id_cible } = req.body;

  if (!motif || !type_cible_cible || !id_cible) {
    return res.status(400).json({ error: 'Motif et cible requis.' });
  }

  try {
    const targetUser = await prisma.utilisateur.findUnique({
      where: { id_user: id_cible }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Cible introuvable.' });
    }

    const signalement = await prisma.signalement.create({
      data: {
        motif,
        type_cible_cible,
        id_auteur: req.user.id_user,
        id_cible,
        statut_traitement: 'En attente'
      }
    });

    return res.status(201).json({
      message: 'Signalement envoyé avec succès. L\'administrateur étudiera le cas.',
      id_signalement: signalement.id_signalement
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du signalement.' });
  }
};
