import prisma from '../config/db.js';
import { errorMessage, internalError } from '../utils/errors.js';
import QRCode from 'qrcode';
import { generateVendorQRToken } from '../utils/vendorQR.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Shared helper: extract emoji from photo_url (handles URLs from seed data)
function safeEmoji(photoUrl) {
  if (!photoUrl || photoUrl.startsWith('http') || photoUrl.startsWith('/uploads')) return '📦';
  return photoUrl;
}

// --- 3.1. Tableau de bord Vendeur (RG02, RG08, RG16) ---

export const getVendorDashboard = async (req, res) => {
  try {
    const vendorId = req.user.id_user;

    const vendor = await prisma.vendeur.findUnique({
      where: { id_user: vendorId },
      include: { utilisateur: true, feedbacks: true }
    });
    if (!vendor) return res.status(403).json({ error: 'Espace réservé aux vendeurs.' });

    const orderLines = await prisma.detailCommande.findMany({
      where: { produit: { id_user_vendeur: vendorId } }
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

    const commission = parseFloat((totalNetMarchandises * 0.006).toFixed(2));
    const gainsNets = parseFloat((totalNetMarchandises - commission).toFixed(2));

    const lowStockAlerts = await prisma.produit.findMany({
      where: { id_user_vendeur: vendorId, stock_disponible: { lte: 5 } }
    });

    // Count total orders
    const nbCommandes = await prisma.commande.count({
      where: { detailsCommande: { some: { produit: { id_user_vendeur: vendorId } } } }
    });

    return res.json({
      vendeur: {
        prenom: vendor.utilisateur?.prenom || 'Vendeur',
        etal: vendor.nom_etablissement || 'Mon étal',
        marche: vendor.localisation_marche || 'Marché'
      },
      score_reputation: vendor.score_reputation,
      nb_avis: vendor.feedbacks?.length || 0,
      nb_commandes: nbCommandes,
      financier: {
        revenu_brut: totalBrut,
        commission_plateforme: commission,
        pertes_rejets: totalPertes,
        gains_nets: gainsNets
      },
      alertes_stock: lowStockAlerts.map((a) => ({
        id: a.id_produit,
        emoji: safeEmoji(a.photo_url),
        nom: a.nom,
        stock: a.stock_disponible
      }))
    });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- 3.2. Catalogue de Produits (CRUD - RG03, RG24, RG30, RG31) ---

// Helper: resolve category name to id_categorie (RG30)
async function resolveCategoryId(categoryName) {
  if (!categoryName) return null;
  const cat = await prisma.categorie.findFirst({
    where: { nom_categorie: categoryName }
  });
  if (!cat) {
    // Auto-create category if not found (RG31)
    const created = await prisma.categorie.create({
      data: {
        nom_categorie: categoryName,
        description_categorie: `Catégorie: ${categoryName}`
      }
    });
    return created.id_categorie;
  }
  return cat.id_categorie;
}

// Helper: format product for frontend
function formatProduct(p) {
  return {
    id: p.id_produit,
    nom: p.nom,
    description: p.description,
    prix: p.prix_reference,
    stock: p.stock_disponible,
    unite: p.unite || 'kg',
    emoji: safeEmoji(p.photo_url),
    photo_url: (p.photo_url && p.photo_url.startsWith('http')) ? p.photo_url : null,
    categorie: p.categorie?.nom_categorie || null,
    id_categorie: p.id_categorie,
    created_at: p.created_at,
    historiques: p.historiques
  };
}

export const getMyProducts = async (req, res) => {
  try {
    const products = await prisma.produit.findMany({
      where: { id_user_vendeur: req.user.id_user },
      include: {
        categorie: true,
        historiques: { orderBy: { date_modification: 'asc' } }
      }
    });
    return res.json(products.map(formatProduct));
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

export const createProduct = async (req, res) => {
  const { nom, description, prix, stock, unite, emoji, categorie, id_categorie } = req.body;

  if (!nom || !description || prix === undefined || stock === undefined) {
    return res.status(400).json({ error: 'Tous les champs requis doivent être fournis.' });
  }
  if (parseFloat(prix) < 0 || parseInt(stock, 10) < 0) {
    return res.status(400).json({ error: 'Le prix et le stock doivent être des valeurs positives.' });
  }

  try {
    // Resolve category: accept either id_categorie or categorie name (RG30/RG31)
    let resolvedCategoryId = id_categorie ? parseInt(id_categorie, 10) : null;
    if (!resolvedCategoryId && categorie) {
      resolvedCategoryId = await resolveCategoryId(categorie);
    }
    if (!resolvedCategoryId) {
      // Fallback to first available category
      const defaultCat = await prisma.categorie.findFirst();
      resolvedCategoryId = defaultCat?.id_categorie || 1;
    }

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.produit.create({
        data: {
          nom,
          description,
          prix_reference: parseFloat(prix),
          stock_disponible: parseInt(stock, 10),
          unite: unite || 'kg',
          photo_url: emoji || null,
          id_user_vendeur: req.user.id_user,
          id_categorie: resolvedCategoryId
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

    // Fetch full product with categorie for response
    const full = await prisma.produit.findUnique({
      where: { id_produit: product.id_produit },
      include: { categorie: true }
    });

    return res.status(201).json(formatProduct(full));
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { nom, description, prix, stock, unite, emoji, categorie, id_categorie } = req.body;

  try {
    const productId = parseInt(id, 10);
    const existing = await prisma.produit.findUnique({ where: { id_produit: productId } });

    if (!existing || existing.id_user_vendeur !== req.user.id_user) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    const newPrice = prix !== undefined ? parseFloat(prix) : undefined;
    const priceChanged = newPrice !== undefined && newPrice !== existing.prix_reference;

    // Resolve category if changed
    let resolvedCategoryId = undefined;
    if (id_categorie !== undefined) {
      resolvedCategoryId = parseInt(id_categorie, 10);
    } else if (categorie !== undefined) {
      resolvedCategoryId = await resolveCategoryId(categorie);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.produit.update({
        where: { id_produit: productId },
        data: {
          nom: nom ?? undefined,
          description: description ?? undefined,
          prix_reference: newPrice,
          stock_disponible: stock !== undefined ? parseInt(stock, 10) : undefined,
          unite: unite ?? undefined,
          photo_url: emoji !== undefined ? emoji : undefined,
          id_categorie: resolvedCategoryId
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

    // Fetch full product with categorie for response
    const full = await prisma.produit.findUnique({
      where: { id_produit: updated.id_produit },
      include: { categorie: true }
    });

    return res.json(formatProduct(full));
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
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
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- 3.2b. Catégories (RG30, RG31) ---

export const getVendorCategories = async (req, res) => {
  try {
    const categories = await prisma.categorie.findMany({
      include: {
        _count: {
          select: { produits: { where: { id_user_vendeur: req.user.id_user } } }
        }
      },
      orderBy: { nom_categorie: 'asc' }
    });

    return res.json(categories.map((c) => ({
      id: c.id_categorie,
      nom: c.nom_categorie,
      description: c.description_categorie,
      nb_produits: c._count.produits
    })));
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

export const createCategory = async (req, res) => {
  const { nom, description } = req.body;

  if (!nom || !nom.trim()) {
    return res.status(400).json({ error: 'Le nom de la catégorie est requis.' });
  }

  try {
    // Check if category already exists
    const existing = await prisma.categorie.findFirst({
      where: { nom_categorie: nom.trim() }
    });
    if (existing) {
      return res.status(409).json({ error: 'Cette catégorie existe déjà.', id: existing.id_categorie });
    }

    const category = await prisma.categorie.create({
      data: {
        nom_categorie: nom.trim(),
        description_categorie: description || `Catégorie: ${nom.trim()}`
      }
    });

    return res.status(201).json({
      id: category.id_categorie,
      nom: category.nom_categorie,
      description: category.description_categorie,
      nb_produits: 0
    });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- 3.2c. Upload photo produit ---

export const uploadProductPhoto = async (req, res) => {
  const { id } = req.params;

  try {
    const productId = parseInt(id, 10);
    const existing = await prisma.produit.findUnique({ where: { id_produit: productId } });

    if (!existing || existing.id_user_vendeur !== req.user.id_user) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier image fourni.' });
    }

    // Move file to products subdirectory
    const fs = await import('fs');
    const productsDir = path.join(__dirname, '../../uploads/products');
    fs.default.mkdirSync(productsDir, { recursive: true });
    const srcPath = req.file.path;
    const destPath = path.join(productsDir, req.file.filename);
    if (fs.default.existsSync(srcPath)) {
      fs.default.renameSync(srcPath, destPath);
    }

    const updated = await prisma.produit.update({
      where: { id_produit: productId },
      data: { photo_url: `/uploads/products/${req.file.filename}` }
    });

    return res.json({ photo_url: updated.photo_url });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- 3.3. Commandes à collecter (RG06, RG07) ---

export const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.user.id_user;

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
        livraison: {
          include: {
            livreur: {
              include: { utilisateur: true }
            }
          }
        },
        preuvesCollecte: {
          include: { medias: true }
        }
      },
      orderBy: { date_creation: 'desc' }
    });

    const formatted = orders.map((o) => {
      // Determine statut_collecte from livraison + proofs
      let statut_collecte = 'en_attente';
      if (o.livraison) {
        const hasPhotoProof = o.preuvesCollecte.some(
          (p) => p.medias.length > 0 && p.statut_validation === 'Validee'
        );
        const allProofsValidated = o.preuvesCollecte.length > 0 &&
          o.preuvesCollecte.every((p) => p.statut_validation === 'Validee');

        if (allProofsValidated && o.statut !== 'En attente') {
          statut_collecte = 'collecte';
        } else if (hasPhotoProof) {
          statut_collecte = 'code_saisi';
        }
      }

      // Livreur info
      const livreur = o.livraison?.livreur?.utilisateur
        ? { nom: `${o.livraison.livreur.utilisateur.prenom} ${o.livraison.livreur.utilisateur.nom}`, telephone: o.livraison.livreur.utilisateur.telephone }
        : { nom: 'Non assigné', telephone: '' };

      // Photo indicator: any proof with media
      const photo_collecte = o.preuvesCollecte.some((p) => p.medias.length > 0);

      // Articles (vendor's products only)
      const articles = o.detailsCommande.map((d) => ({
        id: d.produit.id_produit,
        emoji: safeEmoji(d.produit.photo_url),
        nom: d.produit.nom,
        qte: d.quantite_commandee,
        prix: d.prix_vente_applique,
        unite: d.produit.unite || 'kg'
      }));

      return {
        id: o.id_commande,
        heure: formatHeure(o.date_creation),
        statut_collecte,
        validee_par_vendeur: o.validee_par_vendeur,
        livreur,
        photo_collecte,
        code_correct: o.code_verification,
        articles
      };
    });

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

// Helper: format heure from date
function formatHeure(date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffHours < 48) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

// Vendor validates order availability (RG architecture: validation_par_vendeur)
export const validateOrder = async (req, res) => {
  const { id_commande } = req.params;
  const vendorId = req.user.id_user;

  const commandId = parseInt(id_commande);
  if (isNaN(commandId)) {
    return res.status(400).json({ error: 'ID de commande invalide.' });
  }

  try {
    const order = await prisma.commande.findUnique({
      where: { id_commande: commandId },
      include: {
        detailsCommande: true,
        client: true
      }
    });

    if (!order) return res.status(404).json({ error: 'Commande introuvable.' });

    // Verify vendor owns at least one product in this order
    const vendorProducts = await prisma.detailCommande.findMany({
      where: {
        id_commande: commandId,
        produit: { id_user_vendeur: vendorId }
      }
    });

    if (vendorProducts.length === 0) {
      return res.status(403).json({ error: 'Cette commande ne contient aucun de vos produits.' });
    }

    if (order.validee_par_vendeur) {
      return res.status(400).json({ error: 'Cette commande a déjà été validée.' });
    }

    await prisma.commande.update({
      where: { id_commande: commandId },
      data: { validee_par_vendeur: true }
    });

    return res.json({ message: 'Commande validée. Les articles sont disponibles pour retrait.' });
  } catch (error) {
    console.error('validateOrder error:', error);
    return res.status(500).json({ error: internalError(error) });
  }
};

// Vendor validates handover by entering driver's verification code (RG06)
export const verifyHandover = async (req, res) => {
  const { id_commande } = req.params;
  const { code_verification } = req.body;

  if (!code_verification) {
    return res.status(400).json({ error: 'Le code de vérification est requis.' });
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
      // Create PREUVE_COLLECTE (vendor validation proof)
      const preuve = await tx.preuveCollecte.create({
        data: {
          id_commande: commandId,
          statut_validation: 'Validee'
        }
      });

      // Attach photo if provided (RG07)
      if (req.file) {
        await tx.mediaPreuve.create({
          data: {
            id_preuve: preuve.id_preuve,
            url_media: `/uploads/${req.file.filename}`,
            type_media: 'photo'
          }
        });
      }

      // Check if all vendors have submitted proofs
      const orderLines = await tx.detailCommande.findMany({
        where: { id_commande: commandId },
        include: { produit: true }
      });
      const uniqueVendorIds = [...new Set(orderLines.map((l) => l.produit.id_user_vendeur))];
      const totalProofs = await tx.preuveCollecte.count({
        where: { id_commande: commandId, statut_validation: 'Validee' }
      });

      // Advance command status
      const newStatut = totalProofs >= uniqueVendorIds.length ? 'En transit' : 'En collecte';
      await tx.commande.update({
        where: { id_commande: commandId },
        data: { statut: newStatut }
      });
    });

    return res.json({
      message: 'Remise des articles validée et enregistrée avec succès.',
      code_correct: command.code_verification,
      statut_collecte: 'collecte'
    });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

// Vendor generates a signed QR code for driver to scan at collection (RG06)
// Like JWT: vendor signs the client's code with order context
export const getOrderQRCode = async (req, res) => {
  const { id_commande } = req.params;
  const vendorId = req.user.id_user;

  try {
    const commandId = parseInt(id_commande, 10);
    const order = await prisma.commande.findUnique({ where: { id_commande: commandId } });
    if (!order) return res.status(404).json({ error: 'Commande introuvable.' });

    // Verify vendor owns at least one product in this order
    const vendorProducts = await prisma.detailCommande.findMany({
      where: { id_commande: commandId, produit: { id_user_vendeur: vendorId } }
    });
    if (vendorProducts.length === 0) {
      return res.status(403).json({ error: 'Cette commande ne contient aucun de vos produits.' });
    }

    // Generate signed QR token (like JWT) based on client's verification code
    const signedToken = generateVendorQRToken(commandId, order.code_verification);

    const qrDataUrl = await QRCode.toDataURL(signedToken, {
      width: 300, margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });
    return res.json({ qrcode: qrDataUrl, code: order.code_verification, signed: true });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
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
        litige: true,
        commande: {
          include: {
            client: { include: { utilisateur: true } },
            livraison: true
          }
        }
      }
    });

    const formatted = returnedLines.map((r) => ({
      id: `${r.id_commande}-${r.id_produit}`,
      id_commande: r.id_commande,
      id_produit: r.id_produit,
      date: formatDate(r.commande.date_creation),
      commandeId: r.id_commande,
      produit: r.produit.nom,
      qte: r.quantite_commandee,
      unite: r.produit.unite || 'kg',
      motif: r.litige?.description || 'Produit rejeté par le client',
      client: r.commande.client?.utilisateur
        ? `${r.commande.client.utilisateur.prenom} ${r.commande.client.utilisateur.nom}`
        : 'Client inconnu',
      statut: r.litige?.statut_retour || 'a_recuperer',
      lieu: r.commande.livraison?.statut_livraison === 'Retourne'
        ? 'Marché / Point de collecte'
        : (r.litige?.decision_admin || 'Point de collecte'),
      perte: r.prix_vente_applique * r.quantite_commandee
    }));

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

export const markReturnRecovered = async (req, res) => {
  const { id_commande, id_produit } = req.params;
  const vendorId = req.user.id_user;

  try {
    const cmdId = parseInt(id_commande, 10);
    const prodId = parseInt(id_produit, 10);

    // Find the litige linked to this order line
    const detail = await prisma.detailCommande.findUnique({
      where: { id_commande_id_produit: { id_commande: cmdId, id_produit: prodId } },
      include: { litige: true, produit: true }
    });

    if (!detail) return res.status(404).json({ error: 'Ligne de commande introuvable.' });
    if (detail.produit.id_user_vendeur !== vendorId) return res.status(403).json({ error: 'Accès refusé.' });
    if (!detail.id_litige || !detail.litige) {
      return res.status(400).json({ error: 'Aucun litige associé à cette ligne.' });
    }

    await prisma.litige.update({
      where: { id_litige: detail.id_litige },
      data: { statut_retour: 'recupere' }
    });

    return res.json({ message: 'Retour marqué comme récupéré.' });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// --- 3.5. Commandes récentes pour le dashboard ---

export const getVendorRecentOrders = async (req, res) => {
  try {
    const vendorId = req.user.id_user;

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
        }
      },
      orderBy: { date_creation: 'desc' },
      take: 5
    });

    const formatted = orders.map((o) => {
      const total = o.detailsCommande.reduce((s, d) => s + d.prix_vente_applique * d.quantite_commandee, 0);
      const nbArticles = o.detailsCommande.reduce((s, d) => s + d.quantite_commandee, 0);

      let statut = 'en_attente';
      if (o.statut === 'Livree') statut = 'livre';
      else if (o.statut === 'En transit' || o.statut === 'En collecte') statut = 'collecte';

      return {
        id: o.id_commande,
        heure: formatHeure(o.date_creation),
        articles: nbArticles,
        total,
        statut
      };
    });

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- 3.6. Statistiques Produits (RG12) ---

export const getVendorStatistiques = async (req, res) => {
  try {
    const vendorId = req.user.id_user;

    const products = await prisma.produit.findMany({
      where: { id_user_vendeur: vendorId },
      include: {
        detailsCommande: {
          include: { commande: true }
        }
      }
    });

    const stats = products.map((product) => {
      let vendus = 0;
      let rejets = 0;
      let revenu = 0;

      product.detailsCommande.forEach((dc) => {
        if (dc.statut_acceptation === 'Accepte' || dc.statut_acceptation === 'En attente') {
          vendus += dc.quantite_commandee;
          revenu += dc.quantite_commandee * dc.prix_vente_applique;
        }
        if (dc.statut_acceptation === 'Rejete') {
          rejets += dc.quantite_commandee;
        }
      });

      return {
        id: product.id_produit,
        emoji: safeEmoji(product.photo_url),
        nom: product.nom,
        unite: product.unite || 'kg',
        stock: product.stock_disponible,
        vendus,
        rejets,
        revenu
      };
    });

    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- 3.7. Factures & Paiements (RG25, RG26) ---

function formatFacture(f) {
  const vendorArticles = f.commande.detailsCommande.map((dc) => ({
    id: dc.id_produit,
    nom: dc.produit.nom,
    emoji: safeEmoji(dc.produit.photo_url),
    qte: dc.quantite_commandee,
    prix: dc.prix_vente_applique,
    unite: dc.produit.unite || 'kg',
    statut: dc.statut_acceptation,
    sous_total: dc.quantite_commandee * dc.prix_vente_applique
  }));

  const totalMarchandises = vendorArticles.reduce((s, a) => s + a.sous_total, 0);
  const clientNom = f.commande.client
    ? `${f.commande.client.utilisateur.prenom} ${f.commande.client.utilisateur.nom}`
    : 'Client inconnu';
  const clientTelephone = f.commande.client?.utilisateur?.telephone || null;

  return {
    id: `FAC-${new Date(f.date_emission).getFullYear()}-${String(f.id_facture).padStart(4, '0')}`,
    id_facture: f.id_facture,
    date: formatDate(f.date_emission),
    date_raw: f.date_emission,
    commandeId: f.commande.id_commande,
    client: clientNom,
    client_telephone: clientTelephone,
    articles: vendorArticles,
    nb_articles: vendorArticles.length,
    nb_acceptes: vendorArticles.filter((a) => a.statut === 'Accepte').length,
    nb_rejetes: vendorArticles.filter((a) => a.statut === 'Rejete').length,
    total_marchandises: totalMarchandises,
    frais_livraison: f.montant_frais_livraison,
    commission: f.montant_commission,
    frais_retour: f.montant_frais_retour,
    montant_total_du: f.montant_total_du,
    statut_paiement: f.statut_paiement === 'Paye' ? 'paye' : f.statut_paiement === 'Partiel' ? 'partiel' : 'en_attente',
    mode_reglement: f.paiements[0]?.mode_reglement || null,
    date_paiement: f.paiements[0]?.date_paiement ? formatDate(f.paiements[0].date_paiement) : null,
    montant_recu: f.paiements[0]?.montant_percu || 0,
    reste_a_payer: Math.max(0, f.montant_total_du - (f.paiements[0]?.montant_percu || 0))
  };
}

const factureInclude = (vendorId) => ({
  commande: {
    include: {
      detailsCommande: {
        where: { produit: { id_user_vendeur: vendorId } },
        include: { produit: true }
      },
      client: { include: { utilisateur: true } },
      livraison: true
    }
  },
  paiements: true
});

export const getVendorFactures = async (req, res) => {
  try {
    const vendorId = req.user.id_user;

    const factures = await prisma.facture.findMany({
      where: {
        commande: {
          detailsCommande: {
            some: { produit: { id_user_vendeur: vendorId } }
          }
        }
      },
      include: factureInclude(vendorId),
      orderBy: { date_emission: 'desc' }
    });

    return res.json(factures.map(formatFacture));
  } catch (error) {
    console.error('getVendorFactures error:', error);
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- 3.7a. Résumé financier (toutes les factures) ---

export const getVendorFactureSummary = async (req, res) => {
  try {
    const vendorId = req.user.id_user;

    const factures = await prisma.facture.findMany({
      where: {
        commande: {
          detailsCommande: {
            some: { produit: { id_user_vendeur: vendorId } }
          }
        }
      },
      include: { paiements: true }
    });

    let totalEnAttente = 0;
    let totalPaye = 0;
    let totalPartiel = 0;
    let totalCommission = 0;
    let totalFraisRetour = 0;
    let countEnAttente = 0;
    let countPaye = 0;
    let countPartiel = 0;

    for (const f of factures) {
      totalCommission += f.montant_commission;
      totalFraisRetour += f.montant_frais_retour;
      const recu = f.paiements[0]?.montant_percu || 0;

      if (f.statut_paiement === 'Paye') {
        totalPaye += f.montant_total_du;
        countPaye++;
      } else if (f.statut_paiement === 'Partiel') {
        totalPartiel += recu;
        totalEnAttente += Math.max(0, f.montant_total_du - recu);
        countPartiel++;
      } else {
        totalEnAttente += f.montant_total_du;
        countEnAttente++;
      }
    }

    return res.json({
      total_factures: factures.length,
      total_en_attente: totalEnAttente,
      total_paye: totalPaye,
      total_partiel: totalPartiel,
      total_commission: totalCommission,
      total_frais_retour: totalFraisRetour,
      count_en_attente: countEnAttente,
      count_paye: countPaye,
      count_partiel: countPartiel
    });
  } catch (error) {
    console.error('getVendorFactureSummary error:', error);
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- 3.7b. Détail d'une facture ---

export const getVendorFactureDetail = async (req, res) => {
  try {
    const vendorId = req.user.id_user;
    const factureId = parseInt(req.params.id, 10);

    if (isNaN(factureId)) {
      return res.status(400).json({ error: 'ID de facture invalide.' });
    }

    const facture = await prisma.facture.findUnique({
      where: { id_facture: factureId },
      include: factureInclude(vendorId)
    });

    if (!facture) {
      return res.status(404).json({ error: 'Facture introuvable.' });
    }

    // Verify vendor owns at least one product in this order
    const vendorItems = facture.commande.detailsCommande.filter(
      (dc) => dc.produit.id_user_vendeur === vendorId
    );
    if (vendorItems.length === 0) {
      return res.status(403).json({ error: 'Facture non autorisée pour ce vendeur.' });
    }

    const formatted = formatFacture(facture);

    // Include livraison info
    const livraison = facture.commande.livraison;
    formatted.livraison = livraison
      ? {
          id: livraison.id_livraison,
          statut: livraison.statut_livraison,
          date_prise_en_charge: formatDate(livraison.date_prise_en_charge),
          date_fin: livraison.date_fin_reelle ? formatDate(livraison.date_fin_reelle) : null,
          frais_retour: livraison.frais_retour_calcules
        }
      : null;

    return res.json(formatted);
  } catch (error) {
    console.error('getVendorFactureDetail error:', error);
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- 3.7c. Enregistrer un paiement COD (RG26) ---

export const recordPayment = async (req, res) => {
  try {
    const vendorId = req.user.id_user;
    const factureId = parseInt(req.params.id, 10);
    const { montant_percu, mode_reglement, reference_transaction } = req.body;

    if (isNaN(factureId)) {
      return res.status(400).json({ error: 'ID de facture invalide.' });
    }
    if (!montant_percu || montant_percu <= 0) {
      return res.status(400).json({ error: 'Le montant perçu doit être supérieur à 0.' });
    }

    const validModes = ['ESPECES', 'CARTE', 'MOBILE_MONEY', 'VIREMENT'];
    const mode = (mode_reglement || 'ESPECES').toUpperCase();
    if (!validModes.includes(mode)) {
      return res.status(400).json({
        error: `Mode de règlement invalide. Valeurs acceptées: ${validModes.join(', ')}`
      });
    }

    const facture = await prisma.facture.findUnique({
      where: { id_facture: factureId },
      include: {
        commande: {
          include: {
            detailsCommande: { include: { produit: true } }
          }
        },
        paiements: true
      }
    });

    if (!facture) {
      return res.status(404).json({ error: 'Facture introuvable.' });
    }

    // Verify vendor owns products in this order
    const vendorItems = facture.commande.detailsCommande.filter(
      (dc) => dc.produit.id_user_vendeur === vendorId
    );
    if (vendorItems.length === 0) {
      return res.status(403).json({ error: 'Facture non autorisée pour ce vendeur.' });
    }

    // RG26: un seul paiement par facture pour le MVP — update or create
    const existingPayment = facture.paiements[0];

    // Determine new status based on amount received
    let newStatut;
    if (montant_percu >= facture.montant_total_du) {
      newStatut = 'Paye';
    } else if (montant_percu > 0) {
      newStatut = 'Partiel';
    } else {
      newStatut = 'En attente';
    }

    let paiement;
    if (existingPayment) {
      // Update existing payment — montant_percu is the new total received
      paiement = await prisma.paiement.update({
        where: { id_paiement: existingPayment.id_paiement },
        data: {
          montant_percu,
          mode_reglement: mode,
          reference_transaction: reference_transaction || existingPayment.reference_transaction,
          date_paiement: new Date()
        }
      });
    } else {
      // Create new payment
      paiement = await prisma.paiement.create({
        data: {
          id_facture: factureId,
          montant_percu,
          mode_reglement: mode,
          reference_transaction: reference_transaction || null,
          statut: 'Effectue'
        }
      });
    }

    // Update facture status
    await prisma.facture.update({
      where: { id_facture: factureId },
      data: { statut_paiement: newStatut }
    });

    return res.json({
      message: 'Paiement enregistré avec succès.',
      paiement: {
        id_paiement: paiement.id_paiement,
        montant_percu: paiement.montant_percu,
        mode_reglement: paiement.mode_reglement,
        date_paiement: formatDate(paiement.date_paiement)
      },
      facture: {
        id_facture: factureId,
        montant_total_du: facture.montant_total_du,
        statut_paiement: newStatut,
        reste_a_payer: Math.max(0, facture.montant_total_du - montant_percu)
      }
    });
  } catch (error) {
    console.error('recordPayment error:', error);
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- 3.7d. Modifier le statut de paiement ---

export const updateFactureStatus = async (req, res) => {
  try {
    const vendorId = req.user.id_user;
    const factureId = parseInt(req.params.id, 10);
    const { statut_paiement } = req.body;

    if (isNaN(factureId)) {
      return res.status(400).json({ error: 'ID de facture invalide.' });
    }

    const validStatuses = ['En attente', 'Paye', 'Partiel'];
    if (!statut_paiement || !validStatuses.includes(statut_paiement)) {
      return res.status(400).json({
        error: `Statut invalide. Valeurs acceptées: ${validStatuses.join(', ')}`
      });
    }

    const facture = await prisma.facture.findUnique({
      where: { id_facture: factureId },
      include: {
        commande: {
          include: {
            detailsCommande: { include: { produit: true } }
          }
        }
      }
    });

    if (!facture) {
      return res.status(404).json({ error: 'Facture introuvable.' });
    }

    // Verify vendor ownership
    const vendorItems = facture.commande.detailsCommande.filter(
      (dc) => dc.produit.id_user_vendeur === vendorId
    );
    if (vendorItems.length === 0) {
      return res.status(403).json({ error: 'Facture non autorisée pour ce vendeur.' });
    }

    await prisma.facture.update({
      where: { id_facture: factureId },
      data: { statut_paiement }
    });

    return res.json({
      message: 'Statut mis à jour.',
      id_facture: factureId,
      statut_paiement: statut_paiement === 'Paye' ? 'paye' : statut_paiement === 'Partiel' ? 'partiel' : 'en_attente'
    });
  } catch (error) {
    console.error('updateFactureStatus error:', error);
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- 3.8. Historique des Prix (RG24) ---

export const getVendorPriceHistory = async (req, res) => {
  try {
    const vendorId = req.user.id_user;

    const products = await prisma.produit.findMany({
      where: { id_user_vendeur: vendorId },
      include: {
        historiques: {
          orderBy: { date_modification: 'desc' }
        }
      }
    });

    const result = products.map((p) => ({
      id: p.id_produit,
      emoji: safeEmoji(p.photo_url),
      nom: p.nom,
      unite: p.unite || 'kg',
      prix_actuel: p.prix_reference,
      historique: p.historiques.map((h, i) => {
        const prev = p.historiques[i + 1];
        return {
          id: h.id_historique,
          date: formatDate(h.date_modification),
          ancien: prev ? prev.prix : h.prix,
          nouveau: h.prix
        };
      })
    }));

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- 3.9. Signalements du vendeur (RG14) ---

export const getVendorSignalements = async (req, res) => {
  try {
    const signalements = await prisma.signalement.findMany({
      where: { id_auteur: req.user.id_user },
      include: {
        cible: {
          select: { nom: true, prenom: true, email: true, telephone: true }
        }
      },
      orderBy: { date_heure: 'desc' }
    });

    const result = signalements.map((s) => {
      // Parse stored motif: "MOTIF|||DESCRIPTION"
      const parts = s.motif.split('|||');
      const motif = parts[0] || s.motif;
      const description = parts[1] || '';

      return {
        id: s.id_signalement,
        cible: `${s.cible.prenom} ${s.cible.nom}`,
        cible_email: s.cible.email,
        cible_telephone: s.cible.telephone,
        type: s.type_cible_cible,
        motif,
        description,
        statut: s.statut_traitement === 'En attente' ? 'en_attente'
              : s.statut_traitement === 'En cours' ? 'en_cours'
              : 'traite',
        statut_raw: s.statut_traitement,
        date: s.date_heure
      };
    });

    return res.json(result);
  } catch (error) {
    console.error('getVendorSignalements error:', error);
    return res.status(500).json({ error: internalError(error) });
  }
};

export const createSignalement = async (req, res) => {
  const { motif, type_cible, cible, description } = req.body;

  if (!motif) {
    return res.status(400).json({ error: 'Le motif est requis.' });
  }
  if (!cible || !cible.trim()) {
    return res.status(400).json({ error: 'Le nom de la personne signalée est requis.' });
  }
  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'La description est requise.' });
  }

  const validTypes = ['client', 'vendeur', 'livreur'];
  const cibleType = validTypes.includes(type_cible) ? type_cible : 'client';

  try {
    // Search target user: try full name match first, then partial on nom/prenom/email/telephone
    const searchTerms = cible.trim().split(/\s+/);
    let targetUser = null;

    if (searchTerms.length >= 2) {
      // Full name search: prenom + nom
      targetUser = await prisma.utilisateur.findFirst({
        where: {
          AND: [
            { OR: [{ prenom: { contains: searchTerms[0] } }, { nom: { contains: searchTerms[0] } }] },
            { OR: [{ prenom: { contains: searchTerms.slice(1).join(' ') } }, { nom: { contains: searchTerms.slice(1).join(' ') } }] }
          ]
        }
      });
    }

    // Fallback: search by single name, email, or telephone
    if (!targetUser) {
      targetUser = await prisma.utilisateur.findFirst({
        where: {
          OR: [
            { nom: { contains: cible.trim() } },
            { prenom: { contains: cible.trim() } },
            { email: { contains: cible.trim() } },
            { telephone: { contains: cible.trim() } }
          ]
        }
      });
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'Utilisateur introuvable. Vérifiez le nom, email ou téléphone.' });
    }

    // Prevent self-reporting
    if (targetUser.id_user === req.user.id_user) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous signaler vous-même.' });
    }

    // Store motif + description with ||| separator
    const fullMotif = `${motif.trim()}|||${description.trim()}`;

    const signalement = await prisma.signalement.create({
      data: {
        motif: fullMotif,
        type_cible_cible: cibleType,
        id_auteur: req.user.id_user,
        id_cible: targetUser.id_user,
        statut_traitement: 'En attente'
      }
    });

    return res.status(201).json({
      message: "Signalement envoyé. L'administrateur étudiera le cas.",
      id_signalement: signalement.id_signalement
    });
  } catch (error) {
    console.error('createSignalement error:', error);
    return res.status(500).json({ error: internalError(error) });
  }
};

export const deleteSignalement = async (req, res) => {
  try {
    const vendorId = req.user.id_user;
    const signalementId = parseInt(req.params.id, 10);

    if (isNaN(signalementId)) {
      return res.status(400).json({ error: 'ID de signalement invalide.' });
    }

    const signalement = await prisma.signalement.findUnique({
      where: { id_signalement: signalementId }
    });

    if (!signalement) {
      return res.status(404).json({ error: 'Signalement introuvable.' });
    }

    if (signalement.id_auteur !== vendorId) {
      return res.status(403).json({ error: 'Ce signalement ne vous appartient pas.' });
    }

    // Only allow deletion if still "En attente"
    if (signalement.statut_traitement !== 'En attente') {
      return res.status(400).json({ error: 'Impossible de supprimer un signalement déjà en cours de traitement.' });
    }

    await prisma.signalement.delete({
      where: { id_signalement: signalementId }
    });

    return res.json({ message: 'Signalement supprimé.' });
  } catch (error) {
    console.error('deleteSignalement error:', error);
    return res.status(500).json({ error: internalError(error) });
  }
};

// --- 3.10. Profil Vendeur ---

export const getVendorProfil = async (req, res) => {
  try {
    const user = await prisma.utilisateur.findUnique({
      where: { id_user: req.user.id_user },
      include: { vendeur: true }
    });

    if (!user || !user.vendeur) {
      return res.status(404).json({ error: 'Profil vendeur introuvable.' });
    }

    // Count products
    const productCount = await prisma.produit.count({
      where: { id_user_vendeur: req.user.id_user }
    });

    // Count completed orders (delivered or returned)
    const orderCount = await prisma.detailCommande.count({
      where: {
        produit: { id_user_vendeur: req.user.id_user },
        statut_acceptation: { in: ['Accepte', 'Rejete'] }
      }
    });

    // Count feedbacks received
    const feedbackCount = await prisma.feedback.count({
      where: { id_user_vendeur: req.user.id_user }
    });

    // Calculate average note
    const feedbacks = await prisma.feedback.findMany({
      where: { id_user_vendeur: req.user.id_user },
      select: { note: true }
    });
    const avgNote = feedbacks.length > 0
      ? parseFloat((feedbacks.reduce((s, f) => s + f.note, 0) / feedbacks.length).toFixed(1))
      : 0;

    // Count reports made by this vendor
    const signalementCount = await prisma.signalement.count({
      where: { id_auteur: req.user.id_user }
    });

    return res.json({
      id_user: user.id_user,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      photo_url: user.photo_url,
      statut_compte: user.statut_compte,
      vendeur: {
        nom_etablissement: user.vendeur.nom_etablissement,
        localisation_marche: user.vendeur.localisation_marche,
        score_reputation: user.vendeur.score_reputation,
        latitude: user.vendeur.latitude,
        longitude: user.vendeur.longitude,
        productCount,
        orderCount,
        feedbackCount,
        signalementCount,
        avgNote
      }
    });
  } catch (error) {
    console.error('getVendorProfil error:', error);
    return res.status(500).json({ error: internalError(error) });
  }
};

export const updateVendorProfil = async (req, res) => {
  const { nom_etablissement, localisation_marche, latitude, longitude } = req.body;

  try {
    // Update vendeur-specific fields
    const vendeurData = {};
    if (nom_etablissement !== undefined) vendeurData.nom_etablissement = nom_etablissement || null;
    if (localisation_marche !== undefined) vendeurData.localisation_marche = localisation_marche || null;
    if (latitude !== undefined) vendeurData.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) vendeurData.longitude = longitude ? parseFloat(longitude) : null;

    let updated;
    if (Object.keys(vendeurData).length > 0) {
      updated = await prisma.vendeur.update({
        where: { id_user: req.user.id_user },
        data: vendeurData
      });
    } else {
      updated = await prisma.vendeur.findUnique({
        where: { id_user: req.user.id_user }
      });
    }

    // Handle photo upload if present
    if (req.file) {
      await prisma.utilisateur.update({
        where: { id_user: req.user.id_user },
        data: { photo_url: `/uploads/${req.file.filename}` }
      });
    }

    return res.json({
      message: 'Profil vendeur mis à jour.',
      vendeur: updated
    });
  } catch (error) {
    console.error('updateVendorProfil error:', error);
    return res.status(500).json({ error: internalError(error) });
  }
};
