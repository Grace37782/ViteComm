import prisma from '../config/db.js';

// 4.1. Tableau de bord Livreur
export const getDriverDashboard = async (req, res) => {
  try {
    const driverId = req.user.id_user;

    const driver = await prisma.livreur.findUnique({
      where: { id_user: driverId }
    });

    if (!driver) {
      return res.status(403).json({ error: 'Espace réservé aux livreurs.' });
    }

    // Gains = sum of delivery fees for delivered commands
    const completedDeliveries = await prisma.livraison.findMany({
      where: {
        id_user_livreur: driverId,
        statut_livraison: 'Livree'
      },
      include: {
        commande: true
      }
    });

    const totalGains = completedDeliveries.reduce((acc, curr) => acc + curr.commande.frais_livraison, 0);

    return res.json({
      score_reputation: driver.score_reputation,
      total_gains: totalGains,
      courses_effectuees: completedDeliveries.length,
      vehicule: {
        type_vehicule: driver.type_vehicule,
        immatriculation: driver.immatriculation
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du calcul des statistiques.' });
  }
};

// 4.2. Liste des livraisons assignées (actives ou historique)
export const getMyDeliveries = async (req, res) => {
  try {
    const driverId = req.user.id_user;

    const deliveries = await prisma.livraison.findMany({
      where: { id_user_livreur: driverId },
      include: {
        commande: {
          include: {
            client: {
              include: {
                utilisateur: {
                  select: {
                    nom: true,
                    prenom: true,
                    telephone: true
                  }
                }
              }
            },
            detailsCommande: {
              include: {
                produit: true,
                vendeur: {
                  select: {
                    nom_etablissement: true,
                    localisation_marche: true
                  }
                }
              }
            },
            preuvesCollecte: true
          }
        }
      },
      orderBy: { date_prise_en_charge: 'desc' }
    });

    return res.json(deliveries);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des livraisons.' });
  }
};

// 4.4. Finalisation de la livraison en face-à-face (RG06, RG08, RG09, RG16)
export const finalizeDelivery = async (req, res) => {
  const { id_commande } = req.params;
  const { code_verification, rejections } = req.body; // rejections = [{ id_produit, id_user_vendeur, rejected: boolean, motif: string }]

  if (!code_verification) {
    return res.status(400).json({ error: 'Le code de vérification du client est obligatoire.' });
  }

  try {
    const commandId = parseInt(id_commande, 10);
    const driverId = req.user.id_user;

    const command = await prisma.commande.findUnique({
      where: { id_commande: commandId },
      include: {
        livraison: true,
        detailsCommande: true
      }
    });

    if (!command || !command.livraison || command.livraison.id_user_livreur !== driverId) {
      return res.status(404).json({ error: 'Livraison introuvable.' });
    }

    // Verify verification code dictated by the customer (RG06)
    if (command.code_verification !== code_verification) {
      return res.status(400).json({ error: 'Code de vérification invalide.' });
    }

    // Transaction to update rejection status and compute final financial data
    await prisma.$transaction(async (tx) => {
      let rejectedItemsCount = 0;
      let acceptedGoodsValue = 0;

      // Update acceptance status for each article (RG09)
      for (const line of command.detailsCommande) {
        const rejectSpec = rejections?.find(
          (r) => r.id_produit === line.id_produit && r.id_user_vendeur === line.id_user_vendeur
        );

        if (rejectSpec && rejectSpec.rejected) {
          rejectedItemsCount++;
          await tx.detailCommande.update({
            where: {
              id_commande_id_produit_id_user_vendeur: {
                id_commande: commandId,
                id_produit: line.id_produit,
                id_user_vendeur: line.id_user_vendeur
              }
            },
            data: { statut_acceptation: 'Rejete' }
          });

          // Create Litige entry for rejected item to be moderated (RG09)
          await tx.litige.create({
            data: {
              id_commande: commandId,
              description: `Produit ID ${line.id_produit} rejeté par le client. Motif : ${rejectSpec.motif || 'Non spécifié'}.`,
              statut: 'Ouvert',
              montant_rembourse: 0.0 // Managed by admin later
            }
          });
        } else {
          acceptedGoodsValue += line.prix_vente_applique * line.quantite_commandee;
          await tx.detailCommande.update({
            where: {
              id_commande_id_produit_id_user_vendeur: {
                id_commande: commandId,
                id_produit: line.id_produit,
                id_user_vendeur: line.id_user_vendeur
              }
            },
            data: { statut_acceptation: 'Accepte' }
          });
        }
      }

      // Flat return fee (e.g., 500 FCFA per rejected item)
      const returnFees = rejectedItemsCount * 500;
      const finalCommission = parseFloat((acceptedGoodsValue * 0.006).toFixed(2)); // recalculate 0.6% (RG16)

      // Update Commande
      await tx.commande.update({
        where: { id_commande: commandId },
        data: {
          statut: 'Livree',
          commission: finalCommission
        }
      });

      // Finalize Livraison
      await tx.livraison.update({
        where: { id_commande: commandId },
        data: {
          statut_livraison: 'Livree',
          date_fin_reelle: new Date(),
          frais_retour_calcules: returnFees
        }
      });
    });

    return res.json({ message: 'Livraison finalisée avec succès.' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
