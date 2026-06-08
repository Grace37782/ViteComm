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
    emoji: p.photo_url || '📦',
    categorie: p.categorie?.nom_categorie || null,
    id_categorie: p.id_categorie,
    photo_url: p.photo_url,
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
    return res.status(500).json({ error: 'Erreur lors du chargement des produits.' });
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
    return res.status(500).json({ error: 'Erreur lors de la création du produit.' });
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
    return res.status(500).json({ error: 'Erreur lors du chargement des catégories.' });
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
    return res.status(500).json({ error: 'Erreur lors de la création de la catégorie.' });
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

    const updated = await prisma.produit.update({
      where: { id_produit: productId },
      data: { photo_url: `/uploads/products/${req.file.filename}` }
    });

    return res.json({ photo_url: updated.photo_url });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de l\'upload de la photo.' });
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
        emoji: d.produit.photo_url || '📦',
        nom: d.produit.nom,
        qte: d.quantite_commandee,
        prix: d.prix_vente_applique,
        unite: d.produit.unite || 'kg'
      }));

      return {
        id: o.id_commande,
        heure: formatHeure(o.date_creation),
        statut_collecte,
        livreur,
        photo_collecte,
        code_correct: o.code_verification,
        articles
      };
    });

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des commandes.' });
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
        },
        client: {
          include: { utilisateur: true }
        }
      },
      orderBy: { date_creation: 'desc' },
      take: 5
    });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des commandes récentes.' });
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
        id_produit: product.id_produit,
        nom: product.nom,
        description: product.description,
        stock: product.stock_disponible,
        prix: product.prix_reference,
        vendus,
        rejets,
        revenu
      };
    });

    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du calcul des statistiques.' });
  }
};

// --- 3.7. Factures & Paiements (RG25, RG26) ---

export const getVendorFactures = async (req, res) => {
  try {
    const vendorId = req.user.id_user;

    // Find invoices for orders that contain this vendor's products
    const factures = await prisma.facture.findMany({
      where: {
        commande: {
          detailsCommande: {
            some: {
              produit: { id_user_vendeur: vendorId }
            }
          }
        }
      },
      include: {
        commande: {
          include: {
            detailsCommande: {
              where: {
                produit: { id_user_vendeur: vendorId }
              },
              include: { produit: true }
            },
            client: {
              include: { utilisateur: true }
            }
          }
        },
        paiements: true
      },
      orderBy: { date_emission: 'desc' }
    });

    // Only include vendor's products in articles
    const result = factures.map((f) => {
      const vendorArticles = f.commande.detailsCommande.map((dc) => ({
        nom: dc.produit.nom,
        qte: dc.quantite_commandee,
        prix: dc.prix_vente_applique
      }));

      const totalMarchandises = vendorArticles.reduce((s, a) => s + a.qte * a.prix, 0);
      const clientNom = f.commande.client
        ? `${f.commande.client.utilisateur.prenom} ${f.commande.client.utilisateur.nom}`
        : 'Client inconnu';

      return {
        id_facture: f.id_facture,
        reference: `FAC-${new Date(f.date_emission).getFullYear()}-${String(f.id_facture).padStart(4, '0')}`,
        date: f.date_emission,
        commandeId: f.commande.id_commande,
        client: clientNom,
        articles: vendorArticles,
        total_marchandises: totalMarchandises,
        frais_livraison: f.montant_frais_livraison,
        commission: f.montant_commission,
        frais_retour: f.montant_frais_retour,
        montant_total_du: f.montant_total_du,
        statut_paiement: f.statut_paiement === 'Paye' ? 'paye' : f.statut_paiement === 'Partiel' ? 'partiel' : 'en_attente',
        paiements: f.paiements.map((p) => ({
          montant_percu: p.montant_percu,
          mode_reglement: p.mode_reglement,
          date_paiement: p.date_paiement,
          reference_transaction: p.reference_transaction
        }))
      };
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des factures.' });
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
      id_produit: p.id_produit,
      nom: p.nom,
      prix_actuel: p.prix_reference,
      historique: p.historiques.map((h, i) => {
        const prev = p.historiques[i + 1]; // next in desc = previous in time
        return {
          id_historique: h.id_historique,
          date: h.date_modification,
          ancien: prev ? prev.prix : h.prix,
          nouveau: h.prix
        };
      })
    }));

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement de l\'historique.' });
  }
};

// --- 3.9. Signalements du vendeur (RG14) ---

export const getVendorSignalements = async (req, res) => {
  try {
    const signalements = await prisma.signalement.findMany({
      where: { id_auteur: req.user.id_user },
      include: {
        cible: {
          select: { nom: true, prenom: true }
        }
      },
      orderBy: { date_heure: 'desc' }
    });

    const result = signalements.map((s) => ({
      id: s.id_signalement,
      cible: `${s.cible.prenom} ${s.cible.nom}`,
      type: s.type_cible_cible,
      motif: s.motif,
      description: s.motif, // Using motif as description since schema has no separate description field
      statut: s.statut_traitement === 'En attente' ? 'en_attente'
            : s.statut_traitement === 'En cours' ? 'en_cours'
            : 'traite',
      date: s.date_heure
    }));

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des signalements.' });
  }
};

export const createSignalement = async (req, res) => {
  const { motif, type_cible_cible, id_cible, description } = req.body;

  if (!motif || !type_cible_cible || !id_cible) {
    return res.status(400).json({ error: 'Motif et cible requis.' });
  }

  try {
    const targetUser = await prisma.utilisateur.findUnique({ where: { id_user: parseInt(id_cible, 10) } });
    if (!targetUser) return res.status(404).json({ error: 'Cible introuvable.' });

    const signalement = await prisma.signalement.create({
      data: {
        motif: description ? `${motif}: ${description}` : motif,
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

    // Count completed orders
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
        avgNote
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement du profil.' });
  }
};

export const updateVendorProfil = async (req, res) => {
  const { nom_etablissement, localisation_marche, latitude, longitude } = req.body;

  try {
    const updated = await prisma.vendeur.update({
      where: { id_user: req.user.id_user },
      data: {
        nom_etablissement: nom_etablissement ?? undefined,
        localisation_marche: localisation_marche ?? undefined,
        latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
        longitude: longitude !== undefined ? parseFloat(longitude) : undefined
      }
    });

    return res.json({
      message: 'Profil vendeur mis à jour.',
      vendeur: updated
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil.' });
  }
};
