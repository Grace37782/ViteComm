import prisma from '../config/db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../../uploads/proofs');

// ═══════════════════════════════════════════════════════════
// 4.1. TABLEAU DE BORD (RG10, RG15, RG19)
// ═══════════════════════════════════════════════════════════

export const getDriverDashboard = async (req, res) => {
  try {
    const driverId = req.user.id_user;

    const driver = await prisma.livreur.findUnique({
      where: { id_user: driverId },
      include: { utilisateur: { select: { nom: true, prenom: true, email: true, telephone: true, photo_url: true } } }
    });
    if (!driver) return res.status(403).json({ error: 'Espace réservé aux livreurs.' });

    const completedDeliveries = await prisma.livraison.findMany({
      where: { id_user_livreur: driverId, statut_livraison: 'Livree' },
      include: { commande: true }
    });

    const totalGains = completedDeliveries.reduce((acc, curr) => acc + curr.commande.frais_livraison, 0);
    const totalReturnFees = completedDeliveries.reduce((acc, curr) => acc + (curr.frais_retour_calcules || 0), 0);

    const latestDispo = await prisma.disponibiliteLivreur.findFirst({
      where: { id_user_livreur: driverId },
      orderBy: { date_mise_a_jour: 'desc' }
    });

    // Count pending returns (litiges with statut_retour = 'a_recuperer')
    const pendingReturns = await prisma.litige.count({
      where: {
        statut_retour: 'a_recuperer',
        livraison: { id_user_livreur: driverId }
      }
    });

    // Count active deliveries
    const activeDeliveries = await prisma.livraison.count({
      where: {
        id_user_livreur: driverId,
        statut_livraison: { notIn: ['Livree', 'Echec'] }
      }
    });

    // Average feedback rating
    const feedbacks = await prisma.feedback.findMany({
      where: { type_feedback: 'LIVREUR', livraison: { id_user_livreur: driverId } },
      select: { note: true }
    });
    const avgRating = feedbacks.length > 0
      ? (feedbacks.reduce((a, f) => a + f.note, 0) / feedbacks.length)
      : driver.score_reputation;

    return res.json({
      id_user: driverId,
      nom: driver.utilisateur.nom,
      prenom: driver.utilisateur.prenom,
      email: driver.utilisateur.email,
      telephone: driver.utilisateur.telephone,
      photo_url: driver.utilisateur.photo_url,
      score_reputation: avgRating,
      nb_avis: feedbacks.length,
      total_gains: totalGains,
      total_frais_retour: totalReturnFees,
      courses_effectuees: completedDeliveries.length,
      courses_actives: activeDeliveries,
      retours_en_attente: pendingReturns,
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
    console.error('getDriverDashboard error:', error);
    return res.status(500).json({ error: 'Erreur lors du calcul des statistiques.' });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.1b. DISPHOBILITÉ (RG19, RG29)
// ═══════════════════════════════════════════════════════════

export const updateAvailability = async (req, res) => {
  const { est_disponible, distance_marche, heure_debut_dispo, heure_fin_dispo } = req.body;

  try {
    const driver = await prisma.livreur.findUnique({ where: { id_user: req.user.id_user } });
    if (!driver) return res.status(403).json({ error: 'Espace réservé aux livreurs.' });

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

export const getAvailabilityHistory = async (req, res) => {
  try {
    const history = await prisma.disponibiliteLivreur.findMany({
      where: { id_user_livreur: req.user.id_user },
      orderBy: { date_mise_a_jour: 'desc' },
      take: 50
    });
    return res.json(history);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement de l\'historique.' });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.2. COURSES DISPONIBLES & ASSIGNATION (RG05)
// ═══════════════════════════════════════════════════════════

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
          include: { utilisateur: { select: { nom: true, prenom: true, telephone: true } } }
        }
      },
      orderBy: { date_creation: 'asc' }
    });
    return res.json(available);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des courses.' });
  }
};

// RG05 - Livreur accepts a delivery → creates Livraison
export const acceptDelivery = async (req, res) => {
  const { id_commande } = req.params;
  const driverId = req.user.id_user;

  try {
    const commandId = parseInt(id_commande, 10);

    const command = await prisma.commande.findUnique({
      where: { id_commande: commandId },
      include: { livraison: true }
    });

    if (!command) return res.status(404).json({ error: 'Commande introuvable.' });
    if (command.livraison) return res.status(400).json({ error: 'Cette commande a déjà un livreur assigné.' });

    // Check driver is available
    const latestDispo = await prisma.disponibiliteLivreur.findFirst({
      where: { id_user_livreur: driverId },
      orderBy: { date_mise_a_jour: 'desc' }
    });
    if (latestDispo && !latestDispo.est_disponible) {
      return res.status(400).json({ error: 'Vous n\'êtes pas disponible. Mettez-vous en ligne d\'abord.' });
    }

    const livraison = await prisma.$transaction(async (tx) => {
      // Create Livraison (RG05)
      const liv = await tx.livraison.create({
        data: {
          id_commande: commandId,
          id_user_livreur: driverId,
          statut_livraison: 'En cours de collecte'
        }
      });

      // Update commande statut
      await tx.commande.update({
        where: { id_commande: commandId },
        data: { statut: 'Validee' }
      });

      return liv;
    });

    return res.status(201).json({ message: 'Course acceptée.', livraison });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.3. COLLECTE AVEC PREUVE PHOTO (RG06, RG07)
// ═══════════════════════════════════════════════════════════

// Livreur validates vendor code + uploads collection proof photos
export const collectDelivery = async (req, res) => {
  const { id_commande } = req.params;
  const { code_verification } = req.body;
  const driverId = req.user.id_user;

  if (!code_verification) {
    return res.status(400).json({ error: 'Le code de vérification du vendeur est obligatoire (RG06).' });
  }

  try {
    const commandId = parseInt(id_commande, 10);

    const command = await prisma.commande.findUnique({
      where: { id_commande: commandId },
      include: { livraison: true, detailsCommande: { include: { produit: true } } }
    });

    if (!command || !command.livraison || command.livraison.id_user_livreur !== driverId) {
      return res.status(404).json({ error: 'Livraison introuvable ou non assignée.' });
    }

    if (command.livraison.statut_livraison !== 'En cours de collecte') {
      return res.status(400).json({ error: 'Cette livraison n\'est pas en phase de collecte.' });
    }

    // For now, accept any code (vendor verification will be added later)
    // In production, compare with vendor's generated code

    // Create PreuveCollecte with uploaded photos (RG07)
    const preuve = await prisma.preuveCollecte.create({
      data: {
        id_commande: commandId,
        statut_validation: 'Validée'
      }
    });

    // Save uploaded photos
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '.jpg';
        const filename = unique + ext;

        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        const destPath = path.join(UPLOAD_DIR, filename);
        fs.renameSync(file.path, destPath);

        await prisma.mediaPreuve.create({
          data: {
            id_preuve: preuve.id_preuve,
            url_media: `/uploads/proofs/${filename}`,
            type_media: 'photo'
          }
        });
      }
    }

    // Update livraison statut
    await prisma.livraison.update({
      where: { id_livraison: command.livraison.id_livraison },
      data: { statut_livraison: 'Collectee' }
    });

    return res.json({ message: 'Collecte enregistrée avec preuve photo.', preuve_id: preuve.id_preuve });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.3b. DÉPART LIVRAISON
// ═══════════════════════════════════════════════════════════

export const departDelivery = async (req, res) => {
  const { id_commande } = req.params;
  const driverId = req.user.id_user;

  try {
    const commandId = parseInt(id_commande, 10);
    const command = await prisma.commande.findUnique({
      where: { id_commande: commandId },
      include: { livraison: true }
    });

    if (!command || !command.livraison || command.livraison.id_user_livreur !== driverId) {
      return res.status(404).json({ error: 'Livraison introuvable.' });
    }

    if (command.livraison.statut_livraison !== 'Collectee') {
      return res.status(400).json({ error: 'La collecte doit être confirmée d\'abord.' });
    }

    await prisma.livraison.update({
      where: { id_livraison: command.livraison.id_livraison },
      data: { statut_livraison: 'En cours de livraison' }
    });

    return res.json({ message: 'Départ enregistré. En route vers le client.' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.4. FINALISATION FACE-À-FACE (RG06, RG08, RG09, RG16, RG21)
// ═══════════════════════════════════════════════════════════

export const finalizeDelivery = async (req, res) => {
  const { id_commande } = req.params;
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

    // Verify client code (RG06)
    if (command.code_verification !== code_verification) {
      return res.status(400).json({ error: 'Code de vérification invalide.' });
    }

    if (command.livraison.statut_livraison !== 'En cours de livraison') {
      return res.status(400).json({ error: 'Le livreur doit être en route vers le client.' });
    }

    const livraisonId = command.livraison.id_livraison;

    await prisma.$transaction(async (tx) => {
      let rejectedCount = 0;
      let acceptedGoodsValue = 0;

      for (const line of command.detailsCommande) {
        const rejectSpec = rejections?.find((r) => r.id_produit === line.id_produit);

        if (rejectSpec && rejectSpec.rejected) {
          rejectedCount++;

          await tx.detailCommande.update({
            where: { id_commande_id_produit: { id_commande: commandId, id_produit: line.id_produit } },
            data: { statut_acceptation: 'Rejete' }
          });

          // Create Litige linked to Livraison (RG21)
          const litige = await tx.litige.create({
            data: {
              id_livraison: livraisonId,
              description: `Produit "${line.produit.nom}" rejeté. Motif : ${rejectSpec.motif || 'Non spécifié'}.`,
              statut: 'Ouvert',
              statut_retour: 'a_recuperer',
              montant_rembourse: 0.0
            }
          });

          await tx.detailCommande.update({
            where: { id_commande_id_produit: { id_commande: commandId, id_produit: line.id_produit } },
            data: { id_litige: litige.id_litige }
          });

          // Restore stock
          await tx.produit.update({
            where: { id_produit: line.id_produit },
            data: { stock_disponible: { increment: line.quantite_commandee } }
          });
        } else {
          acceptedGoodsValue += line.prix_vente_applique * line.quantite_commandee;

          await tx.detailCommande.update({
            where: { id_commande_id_produit: { id_commande: commandId, id_produit: line.id_produit } },
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

      // Create BonDeLivraison (RG27)
      await tx.bonDeLivraison.create({
        data: {
          id_livraison: livraisonId,
          statut_bon: 'SIGNE',
          date_signature_client: new Date(),
          observations_livreur: rejections?.length > 0 ? `${rejectedCount} produit(s) rejeté(s)` : 'Commande acceptée intégralement'
        }
      });

      // Mark driver available again (RG29)
      await tx.disponibiliteLivreur.create({
        data: { id_user_livreur: driverId, est_disponible: true }
      });

      // Update driver reputation (RG10) - average of all feedbacks
      const feedbacks = await tx.feedback.findMany({
        where: { type_feedback: 'LIVREUR', livraison: { id_user_livreur: driverId } },
        select: { note: true }
      });
      if (feedbacks.length > 0) {
        const avg = feedbacks.reduce((a, f) => a + f.note, 0) / feedbacks.length;
        await tx.livreur.update({
          where: { id_user: driverId },
          data: { score_reputation: parseFloat(avg.toFixed(2)) }
        });
      }
    });

    return res.json({ message: 'Livraison finalisée avec succès.' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.2b. COURSES ASSIGNÉES (active + historique)
// ═══════════════════════════════════════════════════════════

export const getMyDeliveries = async (req, res) => {
  try {
    const driverId = req.user.id_user;

    const deliveries = await prisma.livraison.findMany({
      where: { id_user_livreur: driverId },
      include: {
        commande: {
          include: {
            client: {
              include: { utilisateur: { select: { nom: true, prenom: true, telephone: true } } }
            },
            detailsCommande: {
              include: {
                produit: {
                  include: { vendeur: { select: { nom_etablissement: true, localisation_marche: true } } }
                }
              }
            },
            preuvesCollecte: { include: { medias: true } }
          }
        },
        litiges: true,
        feedbacks: { include: { client: { include: { utilisateur: { select: { nom: true, prenom: true } } } } } }
      },
      orderBy: { date_prise_en_charge: 'desc' }
    });

    return res.json(deliveries);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des livraisons.' });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.5. RETOURS / RÉCUPÉRATION (RG09, RG16)
// ═══════════════════════════════════════════════════════════

export const getReturns = async (req, res) => {
  try {
    const driverId = req.user.id_user;

    const returns = await prisma.litige.findMany({
      where: {
        livraison: { id_user_livreur: driverId },
        statut_retour: { not: null }
      },
      include: {
        livraison: {
          include: {
            commande: {
              include: {
                client: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
                detailsCommande: {
                  include: {
                    produit: {
                      include: { vendeur: { select: { nom_etablissement: true, localisation_marche: true } } }
                    }
                  }
                }
              }
            }
          }
        },
        detailsCommande: { include: { produit: true } }
      },
      orderBy: { date_ouverture: 'desc' }
    });

    // Format for frontend
    const formatted = returns.map(r => {
      const cmd = r.livraison?.commande;
      const line = r.detailsCommande?.[0];
      return {
        id_litige: r.id_litige,
        id_commande: cmd?.id_commande,
        client: cmd?.client?.utilisateur ? `${cmd.client.utilisateur.prenom} ${cmd.client.utilisateur.nom}` : '—',
        origine: line?.produit?.vendeur?.localisation_marche || '—',
        destination: cmd?.client?.adresse_livraison || '—',
        articles: r.detailsCommande.map(d => ({
          nom: d.produit?.nom || '—',
          quantite: d.quantite_commandee,
          prix: d.prix_vente_applique
        })),
        qte: r.detailsCommande.reduce((a, d) => a + d.quantite_commandee, 0),
        montant: r.detailsCommande.reduce((a, d) => a + (d.prix_vente_applique * d.quantite_commandee), 0),
        motif: r.description,
        statut_retour: r.statut_retour,
        date_ouverture: r.date_ouverture,
        vendeur: line?.produit?.vendeur?.nom_etablissement || '—'
      };
    });

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des retours.' });
  }
};

export const updateReturnStatus = async (req, res) => {
  const { id_litige } = req.params;
  const { statut_retour } = req.body;
  const driverId = req.user.id_user;

  const validStatuses = ['a_recuperer', 'en_cours', 'recupere'];
  if (!validStatuses.includes(statut_retour)) {
    return res.status(400).json({ error: `Statut invalide. Valeurs acceptées : ${validStatuses.join(', ')}` });
  }

  try {
    const litige = await prisma.litige.findUnique({
      where: { id_litige: parseInt(id_litige, 10) },
      include: { livraison: true }
    });

    if (!litige) return res.status(404).json({ error: 'Retour introuvable.' });
    if (litige.livraison.id_user_livreur !== driverId) {
      return res.status(403).json({ error: 'Ce retour ne vous est pas assigné.' });
    }

    await prisma.litige.update({
      where: { id_litige: parseInt(id_litige, 10) },
      data: { statut_retour }
    });

    return res.json({ message: 'Statut du retour mis à jour.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.6. GAINS DÉTAILLÉS (RG28)
// ═══════════════════════════════════════════════════════════

export const getGainsDetailed = async (req, res) => {
  try {
    const driverId = req.user.id_user;

    const completed = await prisma.livraison.findMany({
      where: { id_user_livreur: driverId, statut_livraison: 'Livree' },
      include: {
        commande: {
          include: {
            client: { include: { utilisateur: { select: { nom: true, prenom: true } } } }
          }
        }
      },
      orderBy: { date_fin_reelle: 'desc' }
    });

    const gains = completed.map(d => ({
      id_livraison: d.id_livraison,
      id_commande: d.commande.id_commande,
      client: d.commande.client?.utilisateur
        ? `${d.commande.client.utilisateur.prenom} ${d.commande.client.utilisateur.nom}`
        : '—',
      frais_livraison: d.commande.frais_livraison,
      frais_retour: d.frais_retour_calcules || 0,
      total: d.commande.frais_livraison + (d.frais_retour_calcules || 0),
      date: d.date_fin_reelle
    }));

    const totalLivraisons = gains.reduce((a, g) => a + g.frais_livraison, 0);
    const totalRetours = gains.reduce((a, g) => a + g.frais_retour, 0);

    return res.json({
      total_gains: totalLivraisons + totalRetours,
      total_livraisons: totalLivraisons,
      total_frais_retour: totalRetours,
      nb_livraisons: gains.length,
      livraisons: gains
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des gains.' });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.7. AVIS CLIENTS (RG10)
// ═══════════════════════════════════════════════════════════

export const getFeedbacks = async (req, res) => {
  try {
    const driverId = req.user.id_user;

    const feedbacks = await prisma.feedback.findMany({
      where: { type_feedback: 'LIVREUR', livraison: { id_user_livreur: driverId } },
      include: {
        client: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
        livraison: { include: { commande: { select: { id_commande: true } } } }
      },
      orderBy: { date_publication: 'desc' }
    });

    const formatted = feedbacks.map(f => ({
      id_feedback: f.id_feedback,
      note: f.note,
      commentaire: f.commentaire,
      date: f.date_publication,
      client: f.client?.utilisateur
        ? `${f.client.utilisateur.prenom} ${f.client.utilisateur.nom}`
        : 'Anonyme',
      id_commande: f.livraison?.commande?.id_commande
    }));

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement des avis.' });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.8. PROFIL LIVREUR
// ═══════════════════════════════════════════════════════════

export const getLivreurProfil = async (req, res) => {
  try {
    const driver = await prisma.livreur.findUnique({
      where: { id_user: req.user.id_user },
      include: { utilisateur: { select: { nom: true, prenom: true, email: true, telephone: true, photo_url: true } } }
    });
    if (!driver) return res.status(403).json({ error: 'Espace réservé aux livreurs.' });

    return res.json({
      nom: driver.utilisateur.nom,
      prenom: driver.utilisateur.prenom,
      email: driver.utilisateur.email,
      telephone: driver.utilisateur.telephone,
      photo_url: driver.utilisateur.photo_url,
      type_vehicule: driver.type_vehicule,
      immatriculation: driver.immatriculation,
      score_reputation: driver.score_reputation
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors du chargement du profil.' });
  }
};

export const updateLivreurProfil = async (req, res) => {
  const { type_vehicule, immatriculation } = req.body;

  try {
    const driver = await prisma.livreur.findUnique({ where: { id_user: req.user.id_user } });
    if (!driver) return res.status(403).json({ error: 'Espace réservé aux livreurs.' });

    const updateData = {};
    if (type_vehicule) updateData.type_vehicule = type_vehicule;
    if (immatriculation) updateData.immatriculation = immatriculation;

    if (Object.keys(updateData).length > 0) {
      await prisma.livreur.update({
        where: { id_user: req.user.id_user },
        data: updateData
      });
    }

    // Handle photo upload
    if (req.file) {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(req.file.originalname) || '.jpg';
      const filename = unique + ext;

      const avatarDir = path.join(__dirname, '../../uploads/avatars');
      fs.mkdirSync(avatarDir, { recursive: true });
      const destPath = path.join(avatarDir, filename);
      fs.renameSync(req.file.path, destPath);

      await prisma.utilisateur.update({
        where: { id_user: req.user.id_user },
        data: { photo_url: `/uploads/avatars/${filename}` }
      });
    }

    return res.json({ message: 'Profil mis à jour.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil.' });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.9. SIGNALEMENT (RG14)
// ═══════════════════════════════════════════════════════════

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
