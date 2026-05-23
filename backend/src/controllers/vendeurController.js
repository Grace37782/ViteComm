import prisma from '../config/db.js';

// 3.1. Tableau de bord Vendeur - Statistiques
export const getVendorDashboard = async (req, res) => {
  try {
    const vendorId = req.user.id_user;

    const vendor = await prisma.vendeur.findUnique({
      where: { id_user: vendorId }
    });

    if (!vendor) {
      return res.status(403).json({ error: 'Espace réservé aux vendeurs.' });
    }

    // Get all order lines for this vendor
    const orderLines = await prisma.detailCommande.findMany({
      where: { id_user_vendeur: vendorId }
    });

    let totalBrut = 0;
    let totalPertes = 0; // Rejected items value
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

    // Commission (0.6% on accepted items, RG08)
    const commission = parseFloat((totalNetMarchandises * 0.006).toFixed(2));
    const gainsNets = parseFloat((totalNetMarchandises - commission).toFixed(2));

    // Low stock warnings
    const lowStockAlerts = await prisma.produit.findMany({
      where: {
        id_user_vendeur: vendorId,
        stock_disponible: { lte: 5 } // Alert threshold
      }
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

// 3.2. Catalogue de Produits (CRUD)
export const getMyProducts = async (req, res) => {
  try {
    const products = await prisma.produit.findMany({
      where: { id_user_vendeur: req.user.id_user }
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

  if (prix_reference < 0 || stock_disponible < 0) {
    return res.status(400).json({ error: 'Le prix et le stock doivent être des valeurs positives.' });
  }

  try {
    const product = await prisma.produit.create({
      data: {
        nom,
        description,
        prix_reference: parseFloat(prix_reference),
        stock_disponible: parseInt(stock_disponible, 10),
        id_user_vendeur: req.user.id_user
      }
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

    const updated = await prisma.produit.update({
      where: { id_produit: productId },
      data: {
        nom: nom !== undefined ? nom : undefined,
        description: description !== undefined ? description : undefined,
        prix_reference: prix_reference !== undefined ? parseFloat(prix_reference) : undefined,
        stock_disponible: stock_disponible !== undefined ? parseInt(stock_disponible, 10) : undefined
      }
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

// 3.3. Commandes à collecter
export const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.user.id_user;

    const orders = await prisma.commande.findMany({
      where: {
        detailsCommande: {
          some: { id_user_vendeur: vendorId }
        }
      },
      include: {
        detailsCommande: {
          where: { id_user_vendeur: vendorId },
          include: { produit: true }
        },
        preuvesCollecte: {
          where: { id_user_vendeur: vendorId }
        }
      },
      orderBy: { date_creation: 'desc' }
    });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des commandes.' });
  }
};

// 3.3. Validation de remise des articles au livreur (RG06, RG07)
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
    const vendorId = req.user.id_user;

    const command = await prisma.commande.findUnique({
      where: { id_commande: commandId }
    });

    if (!command) {
      return res.status(404).json({ error: 'Commande introuvable.' });
    }

    // Verify code matching (RG06)
    if (command.code_verification !== code_verification) {
      return res.status(400).json({ error: 'Code de vérification invalide.' });
    }

    // Add entry in PREUVE_COLLECTE and update command status dynamically
    await prisma.$transaction(async (tx) => {
      // Create proof
      await tx.preuveCollecte.create({
        data: {
          id_commande: commandId,
          id_user_vendeur: vendorId,
          url_photo: `/uploads/${req.file.filename}`,
          statut_validation: 'Validee'
        }
      });

      // Update state for items belonging to this vendor
      await tx.detailCommande.updateMany({
        where: {
          id_commande: commandId,
          id_user_vendeur: vendorId
        },
        data: {
          statut_acceptation: 'En attente' // Wait for delivery finalization
        }
      });

      // Check if all vendors for this order have provided proof
      const allOrderLines = await tx.detailCommande.findMany({
        where: { id_commande: commandId }
      });
      const uniqueVendorIds = [...new Set(allOrderLines.map(line => line.id_user_vendeur))];
      const collectedProofs = await tx.preuveCollecte.findMany({
        where: { id_commande: commandId, statut_validation: 'Validee' }
      });

      if (collectedProofs.length >= uniqueVendorIds.length) {
        // If all vendors collected, set global command status to 'En transit'
        await tx.commande.update({
          where: { id_commande: commandId },
          data: { statut: 'En transit' }
        });
      } else {
        await tx.commande.update({
          where: { id_commande: commandId },
          data: { statut: 'En collecte' }
        });
      }
    });

    return res.json({ message: 'Remise des articles validée et enregistrée avec succès.' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// 3.4. Gestion des retours
export const getVendorReturns = async (req, res) => {
  try {
    const vendorId = req.user.id_user;

    const returnedLines = await prisma.detailCommande.findMany({
      where: {
        id_user_vendeur: vendorId,
        statut_acceptation: 'Rejete'
      },
      include: {
        produit: true,
        commande: {
          include: {
            litige: true
          }
        }
      }
    });

    return res.json(returnedLines);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des retours.' });
  }
};
