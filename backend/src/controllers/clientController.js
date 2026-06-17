import prisma from '../config/db.js';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { errorMessage, internalError } from '../utils/errors.js';

// --- 2.1. Tableau de bord Client - Recherche de produits et marchés ---

export const getProducts = async (req, res) => {
  const { search, marche, vendeur_id } = req.query;

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
          vendeur_id
            ? { id_user_vendeur: parseInt(vendeur_id, 10) }
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
        },
        categorie: {
          select: { id_categorie: true, nom_categorie: true }
        }
      }
    });

    return res.json(products);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
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
    return res.status(500).json({ error: internalError(error) });
  }
};

// Get a single vendor by ID — for Catalogue page
export const getVendorById = async (req, res) => {
  const { id } = req.params;
  try {
    const vendor = await prisma.vendeur.findUnique({
      where: { id_user: parseInt(id, 10) },
      include: {
        utilisateur: {
          select: { nom: true, prenom: true, photo_url: true }
        },
        _count: {
          select: { produits: true }
        }
      }
    });
    if (!vendor) return res.status(404).json({ error: 'Vendeur introuvable.' });
    return res.json(vendor);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

// Get all active vendors (stalls) grouped by market location — for AccueilClient
export const getVendors = async (req, res) => {
  try {
    const vendors = await prisma.vendeur.findMany({
      where: {
        utilisateur: { statut_compte: 'Actif' }
      },
      include: {
        utilisateur: {
          select: { nom: true, prenom: true, photo_url: true }
        },
        _count: {
          select: { produits: true }
        }
      },
      orderBy: { score_reputation: 'desc' }
    });
    return res.json(vendors);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.categorie.findMany({
      include: {
        _count: { select: { produits: true } }
      },
      orderBy: { nom_categorie: 'asc' }
    });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
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
    return res.status(500).json({ error: internalError(error) });
  }
};

// Get user details by ID (driver, vendor, or client profile)
export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const userId = parseInt(id, 10);
    const user = await prisma.utilisateur.findUnique({
      where: { id_user: userId },
      include: { client: true, vendeur: true, livreur: true }
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    // eslint-disable-next-line no-unused-vars
    const { mot_de_passe, ...safeUser } = user;

    let roleData = {};

    if (safeUser.vendeur) {
      const market = safeUser.vendeur.id_marche ? await prisma.marche.findUnique({
        where: { id_marche: safeUser.vendeur.id_marche },
        select: { id_marche: true, nom: true }
      }) : null;

      const productCount = await prisma.produit.count({
        where: { id_user_vendeur: userId }
      });

      const products = await prisma.produit.findMany({
        where: { id_user_vendeur: userId },
        take: 10,
        orderBy: { nom: 'asc' }
      });

      const feedbacks = await prisma.feedback.findMany({
        where: { id_user_vendeur: userId },
        include: {
          livraison: {
            include: {
              commande: { include: { client: { include: { utilisateur: { select: { nom: true, prenom: true } } } } } }
            }
          }
        },
        orderBy: { date_publication: 'desc' },
        take: 10
      });

      roleData = {
        type: 'vendeur',
        vendorId: userId,
        nom_etablissement: safeUser.vendeur.nom_etablissement,
        score_reputation: safeUser.vendeur.score_reputation,
        marche: market,
        productCount,
        products,
        feedbacks
      };
    } else if (safeUser.livreur) {
      const dispo = await prisma.disponibiliteLivreur.findFirst({
        where: { id_user_livreur: userId },
        orderBy: { date_mise_a_jour: 'desc' }
      });

      const livraisonCount = await prisma.livraison.count({
        where: { id_user_livreur: userId }
      });

      const feedbacks = await prisma.feedback.findMany({
        where: { livraison: { id_user_livreur: userId } },
        include: {
          livraison: {
            include: {
              commande: { include: { client: { include: { utilisateur: { select: { nom: true, prenom: true } } } } } }
            }
          }
        },
        orderBy: { date_publication: 'desc' },
        take: 10
      });

      roleData = {
        type: 'livreur',
        type_vehicule: safeUser.livreur.type_vehicule,
        immatriculation: safeUser.livreur.immatriculation,
        score_reputation: safeUser.livreur.score_reputation,
        est_disponible: dispo?.est_disponible ?? false,
        livraisonCount,
        feedbacks
      };
    } else if (safeUser.client) {
      const orderCount = await prisma.commande.count({
        where: { id_user_client: userId }
      });

      roleData = {
        type: 'client',
        adresse_livraison: safeUser.client.adresse_livraison,
        orderCount
      };
    } else {
      roleData = { type: 'admin' };
    }

    return res.json({ user: safeUser, roleData });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
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
    return res.status(500).json({ error: internalError(error) });
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
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
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
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- 2.3. Passer une commande (Checkout - RG01, RG05, RG08, RG22, RG24) ---

export const createOrder = async (req, res) => {
  const { id_user_livreur, items, mode_paiement = 'MOBILE_MONEY' } = req.body;
  // items: [{ id_produit, quantite_commandee }]

  if (!id_user_livreur || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Détails de la commande invalides.' });
  }

  if (!['ESPECES', 'MOBILE_MONEY'].includes(mode_paiement)) {
    return res.status(400).json({ error: 'mode_paiement invalide.' });
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
          statut: 'En attente',
          mode_paiement,
          mode_paiement_status: null,
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
      code_verification: command.code_verification,
    });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

// --- 2.4. Suivi des commandes ---

export const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.commande.findMany({
      where: { id_user_client: req.user.id_user },
      include: {
        detailsCommande: {
          include: {
            produit: {
              include: {
                vendeur: {
                  include: {
                    utilisateur: { select: { nom: true, prenom: true } }
                  }
                }
              }
            }
          }
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
        factures: {
          include: { paiements: true }
        },
        preuvesCollecte: {
          include: { medias: true }
        }
      },
      orderBy: { date_creation: 'desc' }
    });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
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
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
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
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- 2.5. Inspection à la livraison (RG07, RG09, RG21, RG25, RG27) ---

export const inspectionOrder = async (req, res) => {
  const { id_commande } = req.params;
  let statuts, motifs;
  try {
    statuts = typeof req.body.statuts === 'string' ? JSON.parse(req.body.statuts) : req.body.statuts;
    motifs = typeof req.body.motifs === 'string' ? JSON.parse(req.body.motifs) : req.body.motifs;
  } catch {
    return res.status(400).json({ error: 'Format JSON invalide pour statuts/motifs.' });
  }
  // statuts: { [id_produit]: 'accepte' | 'rejete' }
  // motifs:  { [id_produit]: string } (required for rejected items)

  if (!statuts || typeof statuts !== 'object') {
    return res.status(400).json({ error: 'statuts requis (objet id_produit -> accepte/rejete).' });
  }

  try {
    const commande = await prisma.commande.findUnique({
      where: { id_commande: parseInt(id_commande, 10) },
      include: {
        detailsCommande: true,
        livraison: true,
      }
    });

    if (!commande) return res.status(404).json({ error: 'Commande introuvable.' });
    if (commande.id_user_client !== req.user.id_user) {
      return res.status(403).json({ error: 'Accès interdit.' });
    }
    if (!commande.livraison) {
      return res.status(400).json({ error: 'Aucune livraison associée à cette commande.' });
    }
    if (commande.statut !== 'Inspectee') {
      return res.status(400).json({ error: 'La commande n\'est pas encore prête pour l\'inspection.' });
    }

    // Validate all items have a status
    for (const detail of commande.detailsCommande) {
      if (!statuts[detail.id_produit]) {
        return res.status(400).json({ error: `Article ${detail.id_produit} non inspecté.` });
      }
      if (statuts[detail.id_produit] === 'rejete' && (!motifs || !motifs[detail.id_produit]?.trim())) {
        return res.status(400).json({ error: `Motif de rejet requis pour l'article ${detail.id_produit}.` });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      let fraisRetour = 0;
      const FRAIS_RETOUR_PAR_ARTICLE = 500; // RG28

      for (const detail of commande.detailsCommande) {
        const statut = statuts[detail.id_produit];

        if (statut === 'accepte') {
          // Update detail line to accepted
          await tx.detailCommande.update({
            where: { id_commande_id_produit: { id_commande: commande.id_commande, id_produit: detail.id_produit } },
            data: { statut_acceptation: 'Accepte' }
          });
        } else {
          // Rejected — create litige (RG09, RG21)
          const litige = await tx.litige.create({
            data: {
              description: motifs[detail.id_produit] || 'Article rejeté par le client',
              id_livraison: commande.livraison.id_livraison,
              statut: 'Ouvert',
              montant_rembourse: detail.prix_vente_applique * detail.quantite_commandee,
            }
          });

          // Link detail to litige
          await tx.detailCommande.update({
            where: { id_commande_id_produit: { id_commande: commande.id_commande, id_produit: detail.id_produit } },
            data: { statut_acceptation: 'Rejete', id_litige: litige.id_litige }
          });

          fraisRetour += FRAIS_RETOUR_PAR_ARTICLE;
        }
      }

      // Update delivery: mark as Livree + return fees (RG27, RG28)
      await tx.livraison.update({
        where: { id_livraison: commande.livraison.id_livraison },
        data: {
          statut_livraison: 'Livree',
          date_fin_reelle: new Date(),
          frais_retour_calcules: fraisRetour
        }
      });

      // Update order statut to Livree (delivery complete after inspection)
      await tx.commande.update({
        where: { id_commande: commande.id_commande },
        data: { statut: 'Livree' }
      });

      // Save client proof photos (RG31)
      if (req.files && req.files.length > 0) {
        const preuve = await tx.preuveCollecte.create({
          data: {
            id_commande: commande.id_commande,
            statut_validation: 'Validée'
          }
        });
        for (const file of req.files) {
          // Move file to permanent location
          const proofsDir = path.join(process.cwd(), 'uploads/proofs');
          const destPath = path.join(proofsDir, file.filename);
          if (fs.existsSync(file.path)) {
            fs.mkdirSync(proofsDir, { recursive: true });
            fs.renameSync(file.path, destPath);
          }
          await tx.mediaPreuve.create({
            data: {
              id_preuve: preuve.id_preuve,
              url_media: `/uploads/proofs/${file.filename}`,
              type_media: 'photo'
            }
          });
        }
      }

      // Generate facture (RG25) — only after inspection
      const acceptedDetails = commande.detailsCommande.filter(d => statuts[d.id_produit] === 'accepte');
      const totalMarchandises = acceptedDetails.reduce((s, d) => s + d.prix_vente_applique * d.quantite_commandee, 0);
      const fraisLivraison = commande.frais_livraison;
      const commission = parseFloat((totalMarchandises * 0.006).toFixed(2));
      const montantTotalDu = totalMarchandises + fraisLivraison + fraisRetour;

      const existingFacture = await tx.facture.findFirst({
        where: { id_commande: commande.id_commande }
      });

      if (!existingFacture) {
        await tx.facture.create({
          data: {
            montant_marchandises: totalMarchandises,
            montant_frais_livraison: fraisLivraison,
            montant_frais_retour: fraisRetour,
            montant_commission: commission,
            montant_total_du: montantTotalDu,
            statut_paiement: 'En attente',
            id_commande: commande.id_commande,
          }
        });
      }

      return { fraisRetour, totalFinal: montantTotalDu };
    });

    return res.json({
      message: 'Inspection enregistrée.',
      frais_retour: result.fraisRetour,
      total_final: result.totalFinal,
    });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

// --- 2.8. Marchés (Localmarts) ---

export const getMarkets = async (req, res) => {
  try {
    const markets = await prisma.marche.findMany({
      include: {
        _count: {
          select: { vendeurs: true }
        }
      }
    });
    return res.json(markets);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

export const getMarketById = async (req, res) => {
  const { id } = req.params;
  try {
    const market = await prisma.marche.findUnique({
      where: { id_marche: parseInt(id, 10) },
      include: {
        vendeurs: {
          where: {
            utilisateur: { statut_compte: 'Actif' }
          },
          include: {
            utilisateur: {
              select: { nom: true, prenom: true, photo_url: true }
            },
            produits: {
              where: { stock_disponible: { gt: 0 } },
              include: {
                categorie: { select: { id_categorie: true, nom_categorie: true } }
              }
            },
            _count: {
              select: { produits: true }
            }
          },
          orderBy: { score_reputation: 'desc' }
        }
      }
    });
    if (!market) return res.status(404).json({ error: 'Marché introuvable.' });
    return res.json(market);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- QR Code generation (RG06) ---

export const getOrderQRCode = async (req, res) => {
  const { id_commande } = req.params;

  try {
    const order = await prisma.commande.findUnique({
      where: { id_commande: parseInt(id_commande, 10) },
    });

    if (!order) return res.status(404).json({ error: 'Commande introuvable.' });
    if (order.id_user_client !== req.user.id_user) {
      return res.status(403).json({ error: 'Accès interdit.' });
    }

    const qrDataUrl = await QRCode.toDataURL(order.code_verification, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    return res.json({ qrcode: qrDataUrl, code: order.code_verification });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- Get facture/receipt for paid order (RG25) ---

export const getOrderFacture = async (req, res) => {
  const { id_commande } = req.params;

  try {
    const order = await prisma.commande.findUnique({
      where: { id_commande: parseInt(id_commande, 10) },
      include: {
        factures: {
          include: {
            paiements: true,
            commande: {
              include: {
                detailsCommande: {
                  include: { produit: { select: { nom: true } } }
                }
              }
            }
          }
        }
      }
    });

    if (!order) return res.status(404).json({ error: 'Commande introuvable.' });
    if (order.id_user_client !== req.user.id_user) {
      return res.status(403).json({ error: 'Accès interdit.' });
    }

    const facture = order.factures[0];
    if (!facture) {
      return res.status(404).json({ error: 'Aucune facture disponible pour cette commande.' });
    }

    return res.json({
      facture: {
        id_facture: facture.id_facture,
        date_emission: facture.date_emission,
        montant_marchandises: facture.montant_marchandises,
        montant_frais_livraison: facture.montant_frais_livraison,
        montant_frais_retour: facture.montant_frais_retour,
        montant_commission: facture.montant_commission,
        montant_total_du: facture.montant_total_du,
        statut_paiement: facture.statut_paiement,
      },
      paiement: facture.paiements[0] ? {
        date_paiement: facture.paiements[0].date_paiement,
        montant_percu: facture.paiements[0].montant_percu,
        mode_reglement: facture.paiements[0].mode_reglement,
        reference_transaction: facture.paiements[0].reference_transaction,
        statut: facture.paiements[0].statut,
      } : null,
      commande: {
        id_commande: order.id_commande,
        date_creation: order.date_creation,
        articles: order.detailsCommande
          .filter(d => d.statut_acceptation !== 'Rejete')
          .map(d => ({
            nom: d.produit?.nom,
            quantite: d.quantite_commandee,
            prix_unitaire: d.prix_vente_applique,
            sous_total: (d.quantite_commandee || 0) * (d.prix_vente_applique || 0),
          })),
      }
    });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- Cancel order (RG17) ---

export const cancelOrder = async (req, res) => {
  const { id_commande } = req.params;

  try {
    const order = await prisma.commande.findUnique({
      where: { id_commande: parseInt(id_commande, 10) },
      include: { livraison: true }
    });

    if (!order) return res.status(404).json({ error: 'Commande introuvable.' });
    if (order.id_user_client !== req.user.id_user) {
      return res.status(403).json({ error: 'Accès interdit.' });
    }
    if (!['En attente', 'Validee'].includes(order.statut)) {
      return res.status(400).json({ error: 'Commande ne peut plus être annulée.' });
    }

    await prisma.$transaction(async (tx) => {
      // Restore stock
      const details = await tx.detailCommande.findMany({
        where: { id_commande: order.id_commande }
      });
      for (const d of details) {
        await tx.produit.update({
          where: { id_produit: d.id_produit },
          data: { stock_disponible: { increment: d.quantite_commandee } }
        });
      }

      // Cancel order
      await tx.commande.update({
        where: { id_commande: order.id_commande },
        data: { statut: 'Annulee' }
      });

      // Cancel delivery if exists
      if (order.livraison) {
        await tx.livraison.update({
          where: { id_livraison: order.livraison.id_livraison },
          data: { statut_livraison: 'Echec' }
        });
      }
    });

    return res.json({ message: 'Commande annulée.' });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

// --- Get all client factures (RG25) ---

export const getClientFactures = async (req, res) => {
  try {
    const factures = await prisma.facture.findMany({
      where: {
        commande: { id_user_client: req.user.id_user }
      },
      include: {
        paiements: true,
        commande: {
          include: {
            detailsCommande: {
              include: { produit: { select: { nom: true } } }
            }
          }
        }
      },
      orderBy: { date_emission: 'desc' }
    });

    return res.json(factures.map((f) => ({
      id_facture: f.id_facture,
      date_emission: f.date_emission,
      montant_marchandises: f.montant_marchandises,
      montant_frais_livraison: f.montant_frais_livraison,
      montant_frais_retour: f.montant_frais_retour,
      montant_commission: f.montant_commission,
      montant_total_du: f.montant_total_du,
      statut_paiement: f.statut_paiement,
      id_commande: f.id_commande,
      paiement: f.paiements[0] ? {
        date_paiement: f.paiements[0].date_paiement,
        montant_percu: f.paiements[0].montant_percu,
        mode_reglement: f.paiements[0].mode_reglement,
        reference_transaction: f.paiements[0].reference_transaction,
        statut: f.paiements[0].statut,
      } : null,
      articles: f.commande.detailsCommande
        .filter(d => d.statut_acceptation !== 'Rejete')
        .map(d => ({
          nom: d.produit?.nom,
          quantite: d.quantite_commandee,
          prix_unitaire: d.prix_vente_applique,
          sous_total: (d.quantite_commandee || 0) * (d.prix_vente_applique || 0),
        })),
    })));
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};
