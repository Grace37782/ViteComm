import prisma from '../config/db.js';

// --- 4.1. Tableau de bord Livreur (RG10, RG15, RG19) ---

export const getDriverDashboard = async (req, res) => {
  try {
    const driverId = req.user.id_user;

    const driver = await prisma.livreur.findUnique({ where: { id_user: driverId } });
    if (!driver) return res.status(403).json({ error: 'Espace réservé aux livreurs.' });

    const completedDeliveries = await prisma.livraison.findMany({
      where: { id_user_livreur: driverId, statut_livraison: 'Livree' },
      include: { commande: true }
    });

    const totalGains = completedDeliveries.reduce((acc, curr) => acc + curr.commande.frais_livraison, 0);

    // Fetch latest availability from DisponibiliteLivreur (RG29)
    const latestDispo = await prisma.disponibiliteLivreur.findFirst({
      where: { id_user_livreur: driverId },
      orderBy: { date_mise_a_jour: 'desc' }
    });

    return res.json({
      score_reputation: driver.score_reputation,
      total_gains: totalGains,
      courses_effectuees: completedDeliveries.length,
      vehicule: {
        type_vehicule: driver.type_vehicule,
        immatriculation: driver.immatriculation
      },
      disponibilite: {
        est_disponible: latestDispo?.est_disponible ?? true,
        distance_marche: latestDispo?.distance_marche ?? 0,
        heure_debut_dispo: latestDispo?.heure_debut_dispo ?? null,
        heure_fin_dispo: latestDispo?.heure_fin_dispo ?? null
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du calcul des statistiques.' });
  }
};

// Update driver availability settings (RG19)
export const updateAvailability = async (req, res) => {
  const { est_disponible, distance_marche, heure_debut_dispo, heure_fin_dispo } = req.body;

  try {
    const driver = await prisma.livreur.findUnique({ where: { id_user: req.user.id_user } });
    if (!driver) return res.status(403).json({ error: 'Espace réservé aux livreurs.' });

    // Create a new availability record in DisponibiliteLivreur (RG29)
    const newDispo = await prisma.disponibiliteLivreur.create({
      data: {
        id_user_livreur: req.user.id_user,
        est_disponible: est_disponible !== undefined ? Boolean(est_disponible) : true,
        distance_marche: distance_marche !== undefined ? parseFloat(distance_marche) : 0,
        heure_debut_dispo: heure_debut_dispo ?? null,
        heure_fin_dispo: heure_fin_dispo ?? null
      }
    });

    return res.json({ message: 'Disponibilité mise à jour.', disponibilite: newDispo });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour de la disponibilité.' });
  }
};

// --- 4.2. Gestion des courses disponibles (RG05) ---

// All validated commands waiting for a driver
export const getAvailableDeliveries = async (req, res) => {
  try {
    const available = await prisma.commande.findMany({
      where: { statut: 'En attente', livraison: null },
      include: {
        detailsCommande: {
          include: {
            produit: {
              include: {
                vendeur: { select: { nom_etablissement: true, localisation_marche: true } }
              }
            }
          }
        },
        client: {
          select: { adresse_livraison: true }
        }
      },
      orderBy: { date_creation: 'asc' }
    });
    return res.json(available);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des courses.' });
  }
};

// --- 4.2. Courses assignées (active + historique) ---

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
                utilisateur: { select: { nom: true, prenom: true, telephone: true } }
              }
            },
            detailsCommande: {
              include: {
                produit: {
                  include: {
                    vendeur: { select: { nom_etablissement: true, localisation_marche: true } }
                  }
                }
              }
            },
            preuvesCollecte: {
              include: { medias: true }
            }
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

// --- 4.4. Finalisation de la livraison en face-à-face (RG06, RG08, RG09, RG16, RG21) ---

export const finalizeDelivery = async (req, res) => {
  const { id_commande } = req.params;
  // rejections: [{ id_produit, rejected: boolean, motif: string }]
  const { code_verification, rejections } = req.body;

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
        detailsCommande: { include: { produit: true } }
      }
    });

    if (!command || !command.livraison || command.livraison.id_user_livreur !== driverId) {
      return res.status(404).json({ error: 'Livraison introuvable ou non assignée à ce livreur.' });
    }

    // Verify code given by client (RG06)
    if (command.code_verification !== code_verification) {
      return res.status(400).json({ error: 'Code de vérification invalide.' });
    }

    const livraisonId = command.livraison.id_livraison;

    await prisma.$transaction(async (tx) => {
      let rejectedCount = 0;
      let acceptedGoodsValue = 0;

      for (const line of command.detailsCommande) {
        const rejectSpec = rejections?.find((r) => r.id_produit === line.id_produit);

        if (rejectSpec && rejectSpec.rejected) {
          rejectedCount++;

          // Mark line as rejected (RG09) - PK is now (id_commande, id_produit)
          await tx.detailCommande.update({
            where: {
              id_commande_id_produit: {
                id_commande: commandId,
                id_produit: line.id_produit
              }
            },
            data: { statut_acceptation: 'Rejete' }
          });

          // Create Litige linked to Livraison, not Commande (RG21)
          const litige = await tx.litige.create({
            data: {
              id_livraison: livraisonId,
              description: `Produit "${line.produit.nom}" (ID ${line.id_produit}) rejeté. Motif : ${rejectSpec.motif || 'Non spécifié'}.`,
              statut: 'Ouvert',
              montant_rembourse: 0.0
            }
          });

          // Attach the Litige to the DETAIL_COMMANDE line (RG21)
          await tx.detailCommande.update({
            where: {
              id_commande_id_produit: {
                id_commande: commandId,
                id_produit: line.id_produit
              }
            },
            data: { id_litige: litige.id_litige }
          });
        } else {
          acceptedGoodsValue += line.prix_vente_applique * line.quantite_commandee;

          await tx.detailCommande.update({
            where: {
              id_commande_id_produit: {
                id_commande: commandId,
                id_produit: line.id_produit
              }
            },
            data: { statut_acceptation: 'Accepte' }
          });
        }
      }

      // Recalculate financials (RG16)
      const returnFees = rejectedCount * 500;
      const finalCommission = parseFloat((acceptedGoodsValue * 0.006).toFixed(2));

      await tx.commande.update({
        where: { id_commande: commandId },
        data: { statut: 'Livree', commission: finalCommission }
      });

      await tx.livraison.update({
        where: { id_livraison: livraisonId },
        data: {
          statut_livraison: 'Livree',
          date_fin_reelle: new Date(),
          frais_retour_calcules: returnFees
        }
      });

      // Mark driver as available again via DisponibiliteLivreur (RG29)
      await tx.disponibiliteLivreur.create({
        data: { id_user_livreur: driverId, est_disponible: true }
      });
    });

    return res.json({ message: 'Livraison finalisée avec succès.' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// --- 4.5. Signalement (RG14) ---

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
