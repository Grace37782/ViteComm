import prisma from '../config/db.js';

// --- 3.1. Tableau de bord Vendeur (RG02, RG08, RG16) ---

export const getVendorDashboard = async (req, res) => {
  try {
    const vendorId = req.user.id_user;

    const vendor = await prisma.vendeur.findUnique({ where: { id_user: vendorId } });
    if (!vendor) return res.status(403).json({ error: 'Espace réservé aux vendeurs.' });

    // All order lines for this vendor's products
    const orderLines = await prisma.detailCommande.findMany({
      where: {
        produit: { id_user_vendeur: vendorId }
      }
    });

    let totalBrut = 0;
    let totalPertes = 0;
    let totalNetMarchandises = 0;

    orderLines.forEach((line) => {
      const lineVal = line.prix_vente_applique * line.quantite_commandee;
      totalBrut += lineVal;
      if (line.statut_acceptation === 'Rejete') {
        totalPertes += lineVal;
      } else {
        totalNetMarchandises += lineVal;
      }
    });

    const commission = parseFloat((totalNetMarchandises * 0.006).toFixed(2)); // RG08
    const gainsNets = parseFloat((totalNetMarchandises - commission).toFixed(2));

    // Low stock alerts
    const lowStockAlerts = await prisma.produit.findMany({
      where: { id_user_vendeur: vendorId, stock_disponible: { lte: 5 } }
    });

    return res.json({
      score_reputation: vendor.score_reputation,
      financier: {
        total_brut: totalBrut,
        total_pertes: totalPertes,
        commission_plateforme: commission,
        gains_nets: gainsNets
      },
      alertes_stock: lowStockAlerts
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du calcul des statistiques.' });
  }
};

// --- 3.2. Catalogue de Produits (CRUD - RG03, RG24) ---

export const getMyProducts = async (req, res) => {
  try {
    const products = await prisma.produit.findMany({
      where: { id_user_vendeur: req.user.id_user },
      include: { historiques: { orderBy: { date_modification: 'asc' } } }
    });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des produits.' });
  }
};

export const createProduct = async (req, res) => {
  const { nom, description, prix_reference, stock_disponible } = req.body;

  if (!nom || !description || prix_reference === undefined || stock_disponible === undefined) {
    return res.status(400).json({ error: 'Tous les champs requis doivent être fournis.' });
  }
  if (parseFloat(prix_reference) < 0 || parseInt(stock_disponible, 10) < 0) {
    return res.status(400).json({ error: 'Le prix et le stock doivent être des valeurs positives.' });
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.produit.create({
        data: {
          nom,
          description,
          prix_reference: parseFloat(prix_reference),
          stock_disponible: parseInt(stock_disponible, 10),
          id_user_vendeur: req.user.id_user
        }
      });

      // Record initial price in history (RG24)
      await tx.historiquePrix.create({
        data: {
          id_produit: newProduct.id_produit,
          prix: newProduct.prix_reference
        }
      });

      return newProduct;
    });

    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la création du produit.' });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { nom, description, prix_reference, stock_disponible } = req.body;

  try {
    const productId = parseInt(id, 10);
    const existing = await prisma.produit.findUnique({ where: { id_produit: productId } });

    if (!existing || existing.id_user_vendeur !== req.user.id_user) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    const newPrice = prix_reference !== undefined ? parseFloat(prix_reference) : undefined;
    const priceChanged = newPrice !== undefined && newPrice !== existing.prix_reference;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.produit.update({
        where: { id_produit: productId },
        data: {
          nom: nom ?? undefined,
          description: description ?? undefined,
          prix_reference: newPrice,
          stock_disponible: stock_disponible !== undefined ? parseInt(stock_disponible, 10) : undefined
        }
      });

      // Log price change in history (RG24)
      if (priceChanged) {
        await tx.historiquePrix.create({
          data: { id_produit: productId, prix: newPrice }
        });
      }

      return updatedProduct;
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const productId = parseInt(id, 10);
    const existing = await prisma.produit.findUnique({ where: { id_produit: productId } });

    if (!existing || existing.id_user_vendeur !== req.user.id_user) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    await prisma.produit.delete({ where: { id_produit: productId } });
    return res.json({ message: 'Produit supprimé avec succès.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
};

// --- 3.3. Commandes à collecter (RG06, RG07) ---

export const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.user.id_user;

    // Find commands that contain at least one product from this vendor
    const orders = await prisma.commande.findMany({
      where: {
        detailsCommande: {
          some: {
            produit: { id_user_vendeur: vendorId }
          }
        }
      },
      include: {
        detailsCommande: {
          where: {
            produit: { id_user_vendeur: vendorId }
          },
          include: { produit: true }
        },
        // All collection proofs for this command (vendor deduces own status via produit join)
        preuvesCollecte: {
          include: { photos: true }
        }
      },
      orderBy: { date_creation: 'desc' }
    });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des commandes.' });
  }
};

// Vendor validates handover to driver by submitting code + photo proof (RG06, RG07)
export const verifyHandover = async (req, res) => {
  const { id_commande } = req.params;
  const { code_verification } = req.body;

  if (!code_verification) {
    return res.status(400).json({ error: 'Le code de vérification est requis.' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'La preuve photographique est obligatoire (RG07).' });
  }

  try {
    const commandId = parseInt(id_commande, 10);

    const command = await prisma.commande.findUnique({ where: { id_commande: commandId } });
    if (!command) return res.status(404).json({ error: 'Commande introuvable.' });

    // Verify code (RG06)
    if (command.code_verification !== code_verification) {
      return res.status(400).json({ error: 'Code de vérification invalide.' });
    }

    await prisma.$transaction(async (tx) => {
      // Create PREUVE_COLLECTE (linked only to commande - per MLD)
      const preuve = await tx.preuveCollecte.create({
        data: {
          id_commande: commandId,
          statut_validation: 'Validee'
        }
      });

      // Attach photo to the proof (PHOTO_PREUVE - RG07)
      await tx.photoPreuve.create({
        data: {
          id_preuve: preuve.id_preuve,
          url_photo: `/uploads/${req.file.filename}`
        }
      });

      // Check if all vendors involved have submitted a proof
      // Get distinct vendor IDs from the command's products
      const orderLines = await tx.detailCommande.findMany({
        where: { id_commande: commandId },
        include: { produit: true }
      });
      const uniqueVendorIds = [...new Set(orderLines.map((l) => l.produit.id_user_vendeur))];
      const totalProofs = await tx.preuveCollecte.count({
        where: { id_commande: commandId, statut_validation: 'Validee' }
      });

      // Advance command status
      await tx.commande.update({
        where: { id_commande: commandId },
        data: { statut: totalProofs >= uniqueVendorIds.length ? 'En transit' : 'En collecte' }
      });
    });

    return res.json({ message: 'Remise des articles validée et enregistrée avec succès.' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// --- 3.4. Gestion des retours (RG16) ---

export const getVendorReturns = async (req, res) => {
  try {
    const vendorId = req.user.id_user;

    const returnedLines = await prisma.detailCommande.findMany({
      where: {
        statut_acceptation: 'Rejete',
        produit: { id_user_vendeur: vendorId }
      },
      include: {
        produit: true,
        litige: true
      }
    });

    return res.json(returnedLines);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des retours.' });
  }
};

// --- 3.5. Signalement (RG14) ---

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
