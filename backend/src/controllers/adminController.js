import prisma from '../config/db.js';

// 5.1. Tableau de bord Administrateur - Statistiques globales
export const getAdminDashboard = async (req, res) => {
  try {
    const orders = await prisma.commande.findMany({
      where: { statut: 'Livree' }
    });

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

    // Fetch product details
    const popularProducts = await Promise.all(
      productStats.map(async (stat) => {
        const prod = await prisma.produit.findUnique({
          where: { id_produit: stat.id_produit }
        });
        return { ...prod, total_vendu: stat._sum.quantite_commandee };
      })
    );

    const avoidedProducts = await Promise.all(
      rejectedProductStats.map(async (stat) => {
        const prod = await prisma.produit.findUnique({
          where: { id_produit: stat.id_produit }
        });
        return { ...prod, total_rejete: stat._sum.quantite_commandee };
      })
    );

    return res.json({
      financier: {
        total_ventes: totalVentes,
        total_commissions_plateforme: totalCommissions
      },
      produits_populaires: popularProducts,
      produits_refuses: avoidedProducts
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du calcul du dashboard.' });
  }
};

// 5.2. Gestion des Comptes Utilisateurs (Respect RG11 & RG15)
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.utilisateur.findMany({
      include: {
        client: true,
        vendeur: true,
        livreur: true
      }
    });

    // Strip out private data if needed, but MLD basic properties are allowed (RG12).
    // Ensure that for clients, we do NOT join any private order history (RG11).
    const parsedUsers = users.map((user) => {
      const { mot_de_passe, ...safeUser } = user;
      return safeUser;
    });

    return res.json(parsedUsers);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des utilisateurs.' });
  }
};

export const updateUserStatus = async (req, res) => {
  const { id_user } = req.params;
  const { statut_compte } = req.body; // "Actif" or "Suspendu" / "Banni"

  if (!statut_compte || !['Actif', 'Suspendu', 'Banni'].includes(statut_compte)) {
    return res.status(400).json({ error: 'Statut de compte invalide.' });
  }

  try {
    const userId = parseInt(id_user, 10);
    const user = await prisma.utilisateur.findUnique({ where: { id_user: userId } });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    // Protect against banning self
    if (user.id_user === req.user.id_user) {
      return res.status(400).json({ error: 'Vous ne pouvez pas suspendre votre propre compte administrateur.' });
    }

    await prisma.utilisateur.update({
      where: { id_user: userId },
      data: { statut_compte }
    });

    return res.json({ message: `Le statut du compte a été mis à jour avec succès à : ${statut_compte}` });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
};

// 5.3. Centre de modération globale (Signalements)
export const getSignalements = async (req, res) => {
  try {
    const reports = await prisma.signalement.findMany({
      include: {
        auteur: {
          select: { nom: true, prenom: true, email: true }
        },
        cible: {
          select: { nom: true, prenom: true, email: true, statut_compte: true }
        }
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
  const { statut_traitement } = req.body; // "En attente", "Traite", "Classe"

  try {
    const reportId = parseInt(id_signalement, 10);
    const updated = await prisma.signalement.update({
      where: { id_signalement: reportId },
      data: { statut_traitement }
    });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur de mise à jour du signalement.' });
  }
};

// 5.4. Arbitrage des Litiges (Dispute Center - RG09, RG16)
export const getLitiges = async (req, res) => {
  try {
    const litiges = await prisma.litige.findMany({
      include: {
        commande: {
          include: {
            client: {
              include: { utilisateur: { select: { nom: true, prenom: true } } }
            }
          }
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
      include: { commande: true }
    });

    if (!litige) {
      return res.status(404).json({ error: 'Litige introuvable.' });
    }

    await prisma.$transaction(async (tx) => {
      // Update Litige
      await tx.litige.update({
        where: { id_litige: litigeId },
        data: {
          statut: 'Resolu',
          decision_admin,
          montant_rembourse: parseFloat(montant_rembourse)
        }
      });

      // Update the global Commande state to reflect resolution
      await tx.commande.update({
        where: { id_commande: litige.id_commande },
        data: { statut: 'Livree' } // Final status closed
      });
    });

    return res.json({ message: 'Litige résolu avec succès.' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
