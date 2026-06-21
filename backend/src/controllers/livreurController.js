import prisma from '../config/db.js';
import bcryptjs from 'bcryptjs';
import { errorMessage, internalError } from '../utils/errors.js';
import { verifyVendorQRToken, verifyFinalizeQRToken } from '../utils/vendorQR.js';
import { moveToPermanent } from '../middleware/upload.js';

// ═══════════════════════════════════════════════════════════
// 4.1. TABLEAU DE BORD (RG10, RG15, RG19)
// ═══════════════════════════════════════════════════════════

export const getDriverDashboard = async (req, res) => {
  try {
    const driverId = req.user.id_user;

    const driver = await prisma.livreur.findUnique({
      where: { id_user: driverId },
      include: { utilisateur: { select: { nom: true, prenom: true, email: true, photo_url: true } } }
    });
    if (!driver) return res.status(403).json({ error: 'Espace réservé aux livreurs.' });

    const completedDeliveries = await prisma.livraison.findMany({
      where: { id_user_livreur: driverId, statut_livraison: 'Livree' },
      include: { commande: true }
    });

    // RG28: Gains are only credited after payment confirmation
    const paidDeliveries = completedDeliveries.filter(d => d.commande.mode_paiement_status === 'paye');
    const totalGains = paidDeliveries.reduce((acc, curr) => acc + curr.commande.frais_livraison, 0);
    const totalReturnFees = paidDeliveries.reduce((acc, curr) => acc + (curr.frais_retour_calcules || 0), 0);

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
      photo_url: driver.utilisateur.photo_url,
      score_reputation: avgRating,
      nb_avis: feedbacks.length,
      total_gains: totalGains,
      total_frais_retour: totalReturnFees,
      courses_effectuees: paidDeliveries.length,
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
    return res.status(500).json({ error: internalError(error) });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.1b. DISPONIBILITÉ (RG19, RG29)
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
    return res.status(500).json({ error: internalError(error) });
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
    return res.status(500).json({ error: internalError(error) });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.2. COURSES DISPONIBLES & ASSIGNATION (RG05)
// ═══════════════════════════════════════════════════════════

export const getAvailableDeliveries = async (req, res) => {
  try {
    const available = await prisma.commande.findMany({
      where: { statut: 'En attente', livraison: null, validee_par_vendeur: true },
      include: {
        detailsCommande: {
          include: {
            produit: {
              include: {
                vendeur: { select: { nom_etablissement: true, localisation_marche: true, latitude: true, longitude: true } }
              }
            }
          }
        },
        client: {
          include: { utilisateur: { select: { nom: true, prenom: true } } }
        }
      },
      orderBy: { date_creation: 'asc' }
    });
    return res.json(available);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

// RG05 - Livreur accepts a delivery → must type client's verification code
export const acceptDelivery = async (req, res) => {
  const { id_commande } = req.params;
  const { code_verification } = req.body;
  const driverId = req.user.id_user;

  if (!code_verification || !code_verification.trim()) {
    return res.status(400).json({ error: 'Le code de vérification du client est obligatoire.' });
  }

  try {
    const commandId = parseInt(id_commande, 10);

    const command = await prisma.commande.findUnique({
      where: { id_commande: commandId },
      include: { livraison: true }
    });

    if (!command) return res.status(404).json({ error: 'Commande introuvable.' });
    if (command.livraison) return res.status(400).json({ error: 'Cette commande a déjà un livreur assigné.' });

    // RG architecture: vendor must validate availability before driver can accept
    if (!command.validee_par_vendeur) {
      return res.status(400).json({ error: 'Le vendeur n\'a pas encore validé la disponibilité des articles. Patientez.' });
    }

    // Verify client's code before accepting (RG06)
    if (command.code_verification !== code_verification.trim().toUpperCase()) {
      return res.status(400).json({ error: 'Code de vérification invalide. Demandez le code au client.' });
    }

    // Check driver is available
    const latestDispo = await prisma.disponibiliteLivreur.findFirst({
      where: { id_user_livreur: driverId },
      orderBy: { date_mise_a_jour: 'desc' }
    });
    if (latestDispo && !latestDispo.est_disponible) {
      return res.status(400).json({ error: 'Vous n\'êtes pas disponible. Mettez-vous en ligne d\'abord.' });
    }

    const livraison = await prisma.$transaction(async (tx) => {
      const liv = await tx.livraison.create({
        data: {
          id_commande: commandId,
          id_user_livreur: driverId,
          statut_livraison: 'En cours de collecte'
        }
      });

      await tx.commande.update({
        where: { id_commande: commandId },
        data: { statut: 'Validee' }
      });

      return liv;
    });

    return res.status(201).json({ message: 'Course acceptée.', livraison });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.3. COLLECTE AVEC PREUVE PHOTO (RG06, RG07)
// ═══════════════════════════════════════════════════════════

// Livreur scans vendor's QR code to confirm collection (RG06)
// The vendor QR is HMAC-signed with the client's verification code.
// Driver scans it with camera → backend verifies signature + embedded code matches order.
export const collectDelivery = async (req, res) => {
  const { id_commande } = req.params;
  const { scanned_qr_data } = req.body;
  const driverId = req.user.id_user;

  if (!scanned_qr_data) {
    return res.status(400).json({ error: 'Le QR code du vendeur est obligatoire.' });
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

    // RG architecture: vendor must validate order availability before driver can collect
    if (!command.validee_par_vendeur) {
      await prisma.livraison.update({
        where: { id_livraison: command.livraison.id_livraison },
        data: { dernier_scan_statut: 'echec', dernier_scan_message: 'Le vendeur n\'a pas encore validé la disponibilité des articles.', dernier_scan_at: new Date() }
      });
      return res.status(400).json({ error: 'Le vendeur n\'a pas encore validé la disponibilité des articles.' });
    }

    // Verify the scanned vendor QR token (HMAC-signed with client code)
    const verified = verifyVendorQRToken(scanned_qr_data);
    if (!verified) {
      await prisma.livraison.update({
        where: { id_livraison: command.livraison.id_livraison },
        data: { dernier_scan_statut: 'echec', dernier_scan_message: 'QR code invalide ou expiré. Demandez un nouveau QR au vendeur.', dernier_scan_at: new Date() }
      });
      return res.status(400).json({ error: 'QR code invalide ou expiré. Demandez un nouveau QR au vendeur.' });
    }

    // Verify QR was generated for THIS specific order
    if (verified.orderId !== commandId) {
      await prisma.livraison.update({
        where: { id_livraison: command.livraison.id_livraison },
        data: { dernier_scan_statut: 'echec', dernier_scan_message: 'Ce QR code ne correspond pas à cette commande.', dernier_scan_at: new Date() }
      });
      return res.status(400).json({ error: 'Ce QR code ne correspond pas à cette commande.' });
    }

    // Verify embedded code matches this order's client verification code
    if (verified.clientCode !== command.code_verification) {
      await prisma.livraison.update({
        where: { id_livraison: command.livraison.id_livraison },
        data: { dernier_scan_statut: 'echec', dernier_scan_message: 'Le code dans le QR ne correspond pas à la commande.', dernier_scan_at: new Date() }
      });
      return res.status(400).json({ error: 'Le code dans le QR ne correspond pas à la commande.' });
    }

    // Create PreuveCollecte (scan-based proof)
    await prisma.preuveCollecte.create({
      data: {
        id_commande: commandId,
        statut_validation: 'Validee'
      }
    });

    // Update livraison statut + store vendor QR for finalize chain + advance commande (RG06)
    await prisma.$transaction([
      prisma.livraison.update({
        where: { id_livraison: command.livraison.id_livraison },
        data: { statut_livraison: 'Collectee', preuve_collecte: scanned_qr_data, dernier_scan_statut: 'succes', dernier_scan_message: 'Collecte confirmée avec succès.', dernier_scan_at: new Date() }
      }),
      prisma.commande.update({
        where: { id_commande: commandId },
        data: { statut: 'En collecte' }
      }),
    ]);

    return res.json({ message: 'Collecte confirmée. QR code validé avec succès.' });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.3a-bis. VÉRIFICATION QR SANS EXÉCUTION
// ═══════════════════════════════════════════════════════════

export const verifyCollectQR = async (req, res) => {
  const { id_commande } = req.params;
  const { scanned_qr_data } = req.body;
  const driverId = req.user.id_user;

  if (!scanned_qr_data) {
    return res.status(400).json({ error: 'Le QR code du vendeur est obligatoire.' });
  }

  try {
    const commandId = parseInt(id_commande, 10);

    const command = await prisma.commande.findUnique({
      where: { id_commande: commandId },
      include: { livraison: true }
    });

    if (!command || !command.livraison || command.livraison.id_user_livreur !== driverId) {
      return res.status(404).json({ error: 'Livraison introuvable ou non assignée.' });
    }

    if (command.livraison.statut_livraison !== 'En cours de collecte') {
      return res.status(400).json({ error: 'Cette livraison n\'est pas en phase de collecte.' });
    }

    if (!command.validee_par_vendeur) {
      return res.status(400).json({ error: 'Le vendeur n\'a pas encore validé la disponibilité des articles.' });
    }

    const verified = verifyVendorQRToken(scanned_qr_data);
    if (!verified) {
      return res.status(400).json({ error: 'QR code invalide ou expiré. Demandez un nouveau QR au vendeur.' });
    }

    if (verified.orderId !== commandId) {
      return res.status(400).json({ error: 'Ce QR code ne correspond pas à cette commande.' });
    }

    if (verified.clientCode !== command.code_verification) {
      return res.status(400).json({ error: 'Le code dans le QR ne correspond pas à la commande.' });
    }

    return res.json({ message: 'QR code validé avec succès.' });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

export const verifyFinalizeQR = async (req, res) => {
  const { id_commande } = req.params;
  const { scanned_qr_data } = req.body;
  const driverId = req.user.id_user;

  if (!scanned_qr_data) {
    return res.status(400).json({ error: 'Le QR code du client est obligatoire.' });
  }

  try {
    const commandId = parseInt(id_commande, 10);

    const command = await prisma.commande.findUnique({
      where: { id_commande: commandId },
      include: { livraison: true }
    });

    if (!command || !command.livraison || command.livraison.id_user_livreur !== driverId) {
      return res.status(404).json({ error: 'Livraison introuvable ou non assignée.' });
    }

    if (command.livraison.statut_livraison !== 'En cours de livraison') {
      return res.status(400).json({ error: 'Le livreur doit être en route pour finaliser.' });
    }

    if (!command.code_verification) {
      return res.status(400).json({ error: 'Code de vérification client manquant.' });
    }

    if (!command.livraison.preuve_collecte) {
      return res.status(400).json({ error: 'Aucune collecte enregistrée. Impossible de vérifier le QR.' });
    }

    const verified = verifyFinalizeQRToken(scanned_qr_data, command.livraison.preuve_collecte);
    if (!verified) {
      return res.status(400).json({ error: 'QR code invalide ou expiré. Demandez au client un nouveau QR.' });
    }

    if (verified.orderId !== commandId) {
      return res.status(400).json({ error: 'Ce QR code ne correspond pas à cette commande.' });
    }

    if (verified.clientCode !== command.code_verification) {
      return res.status(400).json({ error: 'Le code dans le QR ne correspond pas à la commande.' });
    }

    return res.json({ message: 'QR code de finalisation validé.' });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.3a-ter. COLLECTE PAR VENDEUR (multi-vendor)
// ═══════════════════════════════════════════════════════════

export const getVendorCollectStatus = async (req, res) => {
  const { id_commande } = req.params;
  const driverId = req.user.id_user;

  try {
    const commandId = parseInt(id_commande, 10);
    const command = await prisma.commande.findUnique({
      where: { id_commande: commandId },
      include: {
        livraison: true,
        collecteVendeurs: {
          include: {
            vendeur: { include: { utilisateur: { select: { nom: true, prenom: true } } } }
          }
        }
      }
    });

    if (!command || !command.livraison || command.livraison.id_user_livreur !== driverId) {
      return res.status(404).json({ error: 'Livraison introuvable ou non assignée.' });
    }

    const vendors = command.collecteVendeurs.map(cv => ({
      id_collecte: cv.id_collecte,
      id_user_vendeur: cv.id_user_vendeur,
      nom: cv.vendeur?.utilisateur ? `${cv.vendeur.utilisateur.prenom} ${cv.vendeur.utilisateur.nom}` : 'Vendeur',
      nom_etablissement: cv.vendeur?.nom_etablissement || '',
      localisation_marche: cv.vendeur?.localisation_marche || '',
      latitude: cv.vendeur?.latitude || null,
      longitude: cv.vendeur?.longitude || null,
      statut_collecte: cv.statut_collecte,
      qr_scanne_at: cv.qr_scanne_at,
    }));

    return res.json({
      id_commande: commandId,
      total_vendors: vendors.length,
      collected_count: vendors.filter(v => v.statut_collecte === 'collectee').length,
      vendors
    });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

export const collectFromVendor = async (req, res) => {
  const { id_commande, id_collecte } = req.params;
  const { scanned_qr_data } = req.body;
  const driverId = req.user.id_user;

  if (!scanned_qr_data) {
    return res.status(400).json({ error: 'Le QR code du vendeur est obligatoire.' });
  }

  try {
    const commandId = parseInt(id_commande, 10);
    const collecteId = parseInt(id_collecte, 10);

    const command = await prisma.commande.findUnique({
      where: { id_commande: commandId },
      include: { livraison: true, collecteVendeurs: true }
    });

    if (!command || !command.livraison || command.livraison.id_user_livreur !== driverId) {
      return res.status(404).json({ error: 'Livraison introuvable ou non assignée.' });
    }

    if (command.livraison.statut_livraison !== 'En cours de collecte') {
      return res.status(400).json({ error: 'Cette livraison n\'est pas en phase de collecte.' });
    }

    // Find the specific vendor collection record
    const myCollecte = command.collecteVendeurs.find(cv => cv.id_collecte === collecteId);
    if (!myCollecte) {
      return res.status(404).json({ error: 'Enregistrement de collecte introuvable.' });
    }

    if (myCollecte.statut_collecte === 'collectee') {
      return res.status(400).json({ error: 'Vous avez déjà collecté les articles de ce vendeur.' });
    }

    if (myCollecte.statut_collecte !== 'validee') {
      return res.status(400).json({ error: 'Ce vendeur n\'a pas encore validé la disponibilité.' });
    }

    // Verify the scanned vendor QR token
    const verified = verifyVendorQRToken(scanned_qr_data);
    if (!verified) {
      return res.status(400).json({ error: 'QR code invalide ou expiré. Demandez un nouveau QR au vendeur.' });
    }

    if (verified.orderId !== commandId) {
      return res.status(400).json({ error: 'Ce QR code ne correspond pas à cette commande.' });
    }

    if (verified.clientCode !== myCollecte.code_verification) {
      return res.status(400).json({ error: 'Ce QR code ne correspond pas à ce vendeur.' });
    }

    // Mark this vendor as collected
    await prisma.collecteVendeur.update({
      where: { id_collecte: collecteId },
      data: {
        statut_collecte: 'collectee',
        preuve_collecte: scanned_qr_data,
        qr_scanne_at: new Date()
      }
    });

    // Check if ALL vendors collected → advance order status
    const allCollectes = await prisma.collecteVendeur.findMany({
      where: { id_commande: commandId }
    });
    const allCollected = allCollectes.every(cv => cv.statut_collecte === 'collectee');

    if (allCollected) {
      // Store combined vendor QR proof on livraison
      const vendorProofs = allCollectes.filter(cv => cv.preuve_collecte).map(cv => cv.preuve_collecte).join('|');
      await prisma.$transaction([
        prisma.livraison.update({
          where: { id_livraison: command.livraison.id_livraison },
          data: {
            statut_livraison: 'Collectee',
            preuve_collecte: vendorProofs,
            dernier_scan_statut: 'succes',
            dernier_scan_message: `Tous les ${allCollectes.length} vendeurs ont été collectés.`,
            dernier_scan_at: new Date()
          }
        }),
        prisma.commande.update({
          where: { id_commande: commandId },
          data: { statut: 'En collecte' }
        })
      ]);
      return res.json({ message: `Collecte confirmée. Tous les ${allCollectes.length} vendeurs collectés.`, all_collected: true });
    }

    const remaining = allCollectes.filter(cv => cv.statut_collecte !== 'collectee').length;
    return res.json({ message: `Collecte du vendeur confirmée. ${remaining} vendeur(s) restant(s).`, all_collected: false, remaining });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

export const verifyCollectVendorQR = async (req, res) => {
  const { id_commande, id_collecte } = req.params;
  const { scanned_qr_data } = req.body;
  const driverId = req.user.id_user;

  if (!scanned_qr_data) {
    return res.status(400).json({ error: 'Le QR code du vendeur est obligatoire.' });
  }

  try {
    const commandId = parseInt(id_commande, 10);
    const collecteId = parseInt(id_collecte, 10);

    const command = await prisma.commande.findUnique({
      where: { id_commande: commandId },
      include: { livraison: true, collecteVendeurs: true }
    });

    if (!command || !command.livraison || command.livraison.id_user_livreur !== driverId) {
      return res.status(404).json({ error: 'Livraison introuvable ou non assignée.' });
    }

    if (command.livraison.statut_livraison !== 'En cours de collecte') {
      return res.status(400).json({ error: 'Cette livraison n\'est pas en phase de collecte.' });
    }

    const myCollecte = command.collecteVendeurs.find(cv => cv.id_collecte === collecteId);
    if (!myCollecte) {
      return res.status(404).json({ error: 'Enregistrement de collecte introuvable.' });
    }

    if (myCollecte.statut_collecte === 'collectee') {
      return res.status(400).json({ error: 'Déjà collecté.' });
    }

    if (myCollecte.statut_collecte !== 'validee') {
      return res.status(400).json({ error: 'Ce vendeur n\'a pas encore validé la disponibilité.' });
    }

    const verified = verifyVendorQRToken(scanned_qr_data);
    if (!verified) {
      return res.status(400).json({ error: 'QR code invalide ou expiré.' });
    }

    if (verified.orderId !== commandId) {
      return res.status(400).json({ error: 'Ce QR code ne correspond pas à cette commande.' });
    }

    if (verified.clientCode !== myCollecte.code_verification) {
      return res.status(400).json({ error: 'Ce QR code ne correspond pas à ce vendeur.' });
    }

    return res.json({ message: 'QR code validé.' });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
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

    await prisma.$transaction([
      prisma.livraison.update({
        where: { id_livraison: command.livraison.id_livraison },
        data: { statut_livraison: 'En cours de livraison' }
      }),
      prisma.commande.update({
        where: { id_commande: commandId },
        data: { statut: 'En transit' }
      }),
    ]);

    return res.json({ message: 'Départ enregistré. En route vers le client.' });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.4. FINALISATION FACE-À-FACE (RG06, RG08, RG09, RG16, RG21)
// ═══════════════════════════════════════════════════════════

export const finalizeDelivery = async (req, res) => {
  const { id_commande } = req.params;
  const { code_verification, scanned_qr_data } = req.body;

  try {
    const commandId = parseInt(id_commande, 10);
    const driverId = req.user.id_user;

    const command = await prisma.commande.findUnique({
      where: { id_commande: commandId },
      include: {
        livraison: true,
      }
    });

    if (!command || !command.livraison || command.livraison.id_user_livreur !== driverId) {
      return res.status(404).json({ error: 'Livraison introuvable ou non assignée à ce livreur.' });
    }

    // Verify via finalize QR scan (preferred) or manual code (fallback)
    if (scanned_qr_data) {
      // Three-level chain verification: finalize QR must be signed with vendor QR + client code
      const vendorQRToken = command.livraison.preuve_collecte;
      if (!vendorQRToken) {
        await prisma.livraison.update({
          where: { id_livraison: command.livraison.id_livraison },
          data: { dernier_scan_statut: 'echec', dernier_scan_message: 'Aucune collecte enregistrée. Impossible de vérifier le QR.', dernier_scan_at: new Date() }
        });
        return res.status(400).json({ error: 'Aucune collecte enregistrée. Impossible de vérifier le QR.' });
      }
      const verified = verifyFinalizeQRToken(scanned_qr_data, vendorQRToken);
      if (!verified) {
        await prisma.livraison.update({
          where: { id_livraison: command.livraison.id_livraison },
          data: { dernier_scan_statut: 'echec', dernier_scan_message: 'QR code de finalisation invalide. Le client doit afficher le QR.', dernier_scan_at: new Date() }
        });
        return res.status(400).json({ error: 'QR code de finalisation invalide. Le client doit afficher le QR.' });
      }
      if (verified.orderId !== commandId) {
        await prisma.livraison.update({
          where: { id_livraison: command.livraison.id_livraison },
          data: { dernier_scan_statut: 'echec', dernier_scan_message: 'Ce QR code ne correspond pas à cette commande.', dernier_scan_at: new Date() }
        });
        return res.status(400).json({ error: 'Ce QR code ne correspond pas à cette commande.' });
      }
      if (verified.clientCode !== command.code_verification) {
        await prisma.livraison.update({
          where: { id_livraison: command.livraison.id_livraison },
          data: { dernier_scan_statut: 'echec', dernier_scan_message: 'QR code non reconnu pour cette commande.', dernier_scan_at: new Date() }
        });
        return res.status(400).json({ error: 'QR code non reconnu pour cette commande.' });
      }
    } else if (code_verification) {
      // Fallback: manual code entry
      if (command.code_verification !== code_verification) {
        await prisma.livraison.update({
          where: { id_livraison: command.livraison.id_livraison },
          data: { dernier_scan_statut: 'echec', dernier_scan_message: 'Code de vérification invalide.', dernier_scan_at: new Date() }
        });
        return res.status(400).json({ error: 'Code de vérification invalide.' });
      }
    } else {
      return res.status(400).json({ error: 'Scannez le QR du client ou entrez le code de vérification.' });
    }

    if (command.livraison.statut_livraison !== 'En cours de livraison') {
      return res.status(400).json({ error: 'Le livreur doit être en route vers le client.' });
    }

    const livraisonId = command.livraison.id_livraison;

    await prisma.$transaction(async (tx) => {
      await tx.commande.update({
        where: { id_commande: commandId },
        data: { statut: 'Inspectee' }
      });

      await tx.livraison.update({
        where: { id_livraison: livraisonId },
        data: {
          statut_livraison: 'Inspectee',
          date_fin_reelle: new Date(),
          dernier_scan_statut: 'succes',
          dernier_scan_message: 'Livraison finalisée avec succès.',
          dernier_scan_at: new Date(),
        }
      });

      await tx.bonDeLivraison.create({
        data: {
          id_livraison: livraisonId,
          statut_bon: 'EN_ATTENTE',
          observations_livreur: 'En attente de l\'inspection client'
        }
      });

      await tx.disponibiliteLivreur.create({
        data: { id_user_livreur: driverId, est_disponible: true }
      });
    });

    return res.json({ message: 'Livraison finalisée avec succès.' });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
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
              include: { utilisateur: { select: { nom: true, prenom: true } } }
            },
            detailsCommande: {
              include: {
                produit: {
                  include: { vendeur: { select: { nom_etablissement: true, localisation_marche: true, latitude: true, longitude: true } } }
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
    return res.status(500).json({ error: internalError(error) });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.2c. HISTORIQUE LIVREUR (stats + livraisons)
// ═══════════════════════════════════════════════════════════

export const getLivreurHistorique = async (req, res) => {
  try {
    const driverId = req.user.id_user;

    const deliveries = await prisma.livraison.findMany({
      where: { id_user_livreur: driverId },
      include: {
        commande: {
          include: {
            client: {
              include: { utilisateur: { select: { nom: true, prenom: true } } }
            }
          }
        },
        litiges: true,
        feedbacks: true
      },
      orderBy: { date_prise_en_charge: 'desc' }
    });

    const commandIds = [...new Set(deliveries.map(d => d.id_commande))];
    const allDetails = await prisma.detailCommande.findMany({
      where: { id_commande: { in: commandIds } },
      include: { produit: { include: { vendeur: { select: { nom_etablissement: true, localisation_marche: true } } } } }
    });
    const detailsByCommand = {};
    for (const d of allDetails) {
      if (!detailsByCommand[d.id_commande]) detailsByCommand[d.id_commande] = [];
      detailsByCommand[d.id_commande].push(d);
    }

    const enrichedDeliveries = deliveries.map(d => ({
      ...d,
      commande: { ...d.commande, detailsCommande: detailsByCommand[d.id_commande] || [] }
    }));

    const completed = enrichedDeliveries.filter(d => d.statut_livraison === 'Livree');
    const failed = enrichedDeliveries.filter(d => d.statut_livraison === 'Echec');
    const inProgress = enrichedDeliveries.filter(d => d.statut_livraison !== 'Livree' && d.statut_livraison !== 'Echec');

    // RG28: Gains are only credited after payment confirmation
    const paidCompleted = completed.filter(d => d.commande.mode_paiement_status === 'paye');
    const totalGains = paidCompleted.reduce((sum, d) => sum + d.commande.frais_livraison, 0);
    const totalReturnFees = paidCompleted.reduce((sum, d) => sum + (d.frais_retour_calcules || 0), 0);

    return res.json({
      livraisons: enrichedDeliveries,
      stats: {
        total: enrichedDeliveries.length,
        terminees: completed.length,
        en_cours: inProgress.length,
        echecs: failed.length,
        total_gains: totalGains,
        total_frais_retour: totalReturnFees,
        gains_nets: totalGains - totalReturnFees
      }
    });
  } catch (error) {
    console.error('getLivreurHistorique error:', error);
    return res.status(500).json({ error: internalError(error) });
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
        statut_retour: { in: ['a_recuperer', 'en_cours', 'recupere'] }
      },
      include: {
        livraison: {
          include: {
            commande: {
              include: {
                client: { include: { utilisateur: { select: { nom: true, prenom: true } } } }
              }
            }
          }
        }
      },
      orderBy: { date_ouverture: 'desc' }
    });

    const commandIds = [...new Set(returns.map(r => r.livraison?.id_commande).filter(Boolean))];
    const allDetails = await prisma.detailCommande.findMany({
      where: { id_commande: { in: commandIds } },
      include: { produit: { include: { vendeur: { select: { nom_etablissement: true, localisation_marche: true } } } } }
    });
    const detailsByCommand = {};
    for (const d of allDetails) {
      if (!detailsByCommand[d.id_commande]) detailsByCommand[d.id_commande] = [];
      detailsByCommand[d.id_commande].push(d);
    }

    const litigeIds2 = returns.map(r => r.id_litige);
    const litigeDetails2 = await prisma.detailCommande.findMany({
      where: { id_litige: { in: litigeIds2 } },
      include: { produit: true }
    });
    const detailsMap2 = {};
    for (const d of litigeDetails2) {
      if (!detailsMap2[d.id_litige]) detailsMap2[d.id_litige] = [];
      detailsMap2[d.id_litige].push(d);
    }

    // Format for frontend
    const formatted = returns.map(r => {
      const cmd = r.livraison?.commande;
      const lines = detailsMap2[r.id_litige] || [];
      const line = lines[0];
      return {
        id_litige: r.id_litige,
        id_commande: cmd?.id_commande,
        client: cmd?.client?.utilisateur ? `${cmd.client.utilisateur.prenom} ${cmd.client.utilisateur.nom}` : '—',
        origine: line?.produit?.vendeur?.localisation_marche || '—',
        destination: cmd?.client?.adresse_livraison || '—',
        articles: lines.map(d => ({
          nom: d.produit?.nom || '—',
          quantite: d.quantite_commandee,
          prix: d.prix_vente_applique
        })),
        qte: lines.reduce((a, d) => a + d.quantite_commandee, 0),
        montant: lines.reduce((a, d) => a + (d.prix_vente_applique * d.quantite_commandee), 0),
        motif: r.description,
        statut_retour: r.statut_retour,
        date_ouverture: r.date_ouverture,
        vendeur: line?.produit?.vendeur?.nom_etablissement || '—'
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('getReturns error:', error);
    return res.status(500).json({ error: internalError(error) });
  }
};

export const getLivreurRetours = async (req, res) => {
  try {
    const driverId = req.user.id_user;

    const returns = await prisma.litige.findMany({
      where: {
        livraison: { id_user_livreur: driverId },
        statut_retour: { in: ['a_recuperer', 'en_cours', 'recupere'] }
      },
      include: {
        livraison: {
          include: {
            commande: {
              include: {
                client: { include: { utilisateur: { select: { nom: true, prenom: true } } } }
              }
            }
          }
        }
      },
      orderBy: { date_ouverture: 'desc' }
    });

    const litigeIds = returns.map(r => r.id_litige);
    const litigeDetails = await prisma.detailCommande.findMany({
      where: { id_litige: { in: litigeIds } },
      include: { produit: { include: { vendeur: { select: { nom_etablissement: true, localisation_marche: true } } } } }
    });
    const detailsByLitige = {};
    for (const d of litigeDetails) {
      if (!detailsByLitige[d.id_litige]) detailsByLitige[d.id_litige] = [];
      detailsByLitige[d.id_litige].push(d);
    }

    const formatted = returns.map(r => {
      const cmd = r.livraison?.commande;
      const lines = detailsByLitige[r.id_litige] || [];
      const line = lines[0];
      return {
        id_litige: r.id_litige,
        id_commande: cmd?.id_commande,
        client: cmd?.client?.utilisateur ? `${cmd.client.utilisateur.prenom} ${cmd.client.utilisateur.nom}` : '—',
        origine: line?.produit?.vendeur?.localisation_marche || '—',
        destination: cmd?.client?.adresse_livraison || '—',
        articles: lines.map(d => ({
          nom: d.produit?.nom || '—',
          quantite: d.quantite_commandee,
          prix: d.prix_vente_applique
        })),
        qte: lines.reduce((a, d) => a + d.quantite_commandee, 0),
        montant: lines.reduce((a, d) => a + (d.prix_vente_applique * d.quantite_commandee), 0),
        motif: r.description,
        statut_retour: r.statut_retour,
        date_ouverture: r.date_ouverture,
        vendeur: line?.produit?.vendeur?.nom_etablissement || '—'
      };
    });

    const total = formatted.length;
    const aRecuperer = formatted.filter(r => r.statut_retour === 'a_recuperer').length;
    const enCours = formatted.filter(r => r.statut_retour === 'en_cours').length;
    const recupere = formatted.filter(r => r.statut_retour === 'recupere').length;
    const montantTotal = formatted.reduce((sum, r) => sum + (r.montant || 0), 0);

    return res.json({
      retours: formatted,
      stats: {
        total,
        a_recuperer: aRecuperer,
        en_cours: enCours,
        recupere,
        montant_total: montantTotal
      }
    });
  } catch (error) {
    console.error('getLivreurRetours error:', error);
    return res.status(500).json({ error: internalError(error) });
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
    return res.status(500).json({ error: internalError(error) });
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

    // RG28: Gains are only credited after payment confirmation
    const paid = completed.filter(d => d.commande.mode_paiement_status === 'paye');

    const gains = paid.map(d => ({
      id_livraison: d.id_livraison,
      id_commande: d.commande.id_commande,
      client: d.commande.client?.utilisateur
        ? `${d.commande.client.utilisateur.prenom} ${d.commande.client.utilisateur.nom}`
        : '—',
      frais_livraison: d.commande.frais_livraison,
      frais_retour: d.frais_retour_calcules || 0,
      total: d.commande.frais_livraison - (d.frais_retour_calcules || 0),
      date: d.date_fin_reelle
    }));

    const totalLivraisons = gains.reduce((a, g) => a + g.frais_livraison, 0);
    const totalRetours = gains.reduce((a, g) => a + g.frais_retour, 0);

    return res.json({
      total_gains: totalLivraisons - totalRetours,
      total_livraisons: totalLivraisons,
      total_frais_retour: totalRetours,
      nb_livraisons: gains.length,
      livraisons: gains
    });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
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
    return res.status(500).json({ error: internalError(error) });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.8. PROFIL LIVREUR
// ═══════════════════════════════════════════════════════════

export const getLivreurProfil = async (req, res) => {
  try {
    const driver = await prisma.livreur.findUnique({
      where: { id_user: req.user.id_user },
      include: { utilisateur: { select: { nom: true, prenom: true, email: true, photo_url: true, statut_compte: true } } }
    });
    if (!driver) return res.status(403).json({ error: 'Espace réservé aux livreurs.' });

    // Get feedback stats
    const feedbacks = await prisma.feedback.findMany({
      where: { type_feedback: 'LIVREUR', livraison: { id_user_livreur: req.user.id_user } },
      select: { note: true }
    });
    const avgRating = feedbacks.length > 0
      ? (feedbacks.reduce((a, f) => a + f.note, 0) / feedbacks.length)
      : driver.score_reputation;

    return res.json({
      nom: driver.utilisateur.nom,
      prenom: driver.utilisateur.prenom,
      email: driver.utilisateur.email,
      photo_url: driver.utilisateur.photo_url,
      statut_compte: driver.utilisateur.statut_compte,
      type_vehicule: driver.type_vehicule,
      immatriculation: driver.immatriculation,
      score_reputation: avgRating,
      nb_avis: feedbacks.length
    });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

export const updateLivreurProfil = async (req, res) => {
  const { type_vehicule, immatriculation, nom, prenom, email, mot_de_passe, mot_de_passe_confirmation } = req.body;

  try {
    const driver = await prisma.livreur.findUnique({ where: { id_user: req.user.id_user } });
    if (!driver) return res.status(403).json({ error: 'Espace réservé aux livreurs.' });

    // Update livreur-specific fields
    const livreurData = {};
    if (type_vehicule !== undefined) livreurData.type_vehicule = type_vehicule;
    if (immatriculation !== undefined) livreurData.immatriculation = immatriculation;

    if (Object.keys(livreurData).length > 0) {
      await prisma.livreur.update({
        where: { id_user: req.user.id_user },
        data: livreurData
      });
    }

    // Update utilisateur fields
    const userData = {};
    if (nom !== undefined) userData.nom = nom;
    if (prenom !== undefined) userData.prenom = prenom;
    if (email !== undefined) userData.email = email;

    // Handle password change
    if (mot_de_passe) {
      if (mot_de_passe.length < 8) return res.status(400).json({ error: 'Minimum 8 caractères.' });
      if (!/[A-Z]/.test(mot_de_passe)) return res.status(400).json({ error: 'Une majuscule requise.' });
      if (!/[a-z]/.test(mot_de_passe)) return res.status(400).json({ error: 'Une minuscule requise.' });
      if (!/\d/.test(mot_de_passe)) return res.status(400).json({ error: 'Un chiffre requis.' });
      if (mot_de_passe !== mot_de_passe_confirmation) return res.status(400).json({ error: 'Les mots de passe ne correspondent pas.' });
      userData.mot_de_passe = await bcryptjs.hash(mot_de_passe, 12);
    }

    if (Object.keys(userData).length > 0) {
      await prisma.utilisateur.update({
        where: { id_user: req.user.id_user },
        data: userData
      });
    }

    // Handle photo upload — move from temp to permanent
    if (req.file) {
      const photoUrl = moveToPermanent(req.file.filename);
      if (photoUrl) {
        await prisma.utilisateur.update({
          where: { id_user: req.user.id_user },
          data: { photo_url: photoUrl }
        });
      }
    }

    // Return updated profile
    const updated = await prisma.livreur.findUnique({
      where: { id_user: req.user.id_user },
      include: { utilisateur: { select: { nom: true, prenom: true, email: true, photo_url: true } } }
    });

    return res.json({
      message: 'Profil mis à jour.',
      nom: updated.utilisateur.nom,
      prenom: updated.utilisateur.prenom,
      email: updated.utilisateur.email,
      photo_url: updated.utilisateur.photo_url,
      type_vehicule: updated.type_vehicule,
      immatriculation: updated.immatriculation,
      score_reputation: updated.score_reputation
    });
  } catch (error) {
    console.error('updateLivreurProfil error:', error);
    return res.status(500).json({ error: internalError(error) });
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
    return res.status(500).json({ error: internalError(error) });
  }
};

// ═══════════════════════════════════════════════════════════
// 4.10. SCAN STATUS POLLING (real-time feedback for vendor/client)
// ═══════════════════════════════════════════════════════════

export const getCollectScanStatus = async (req, res) => {
  try {
    const { id_commande } = req.params;
    const livraison = await prisma.livraison.findUnique({
      where: { id_commande: parseInt(id_commande, 10) },
      select: { dernier_scan_statut: true, dernier_scan_message: true, dernier_scan_at: true, statut_livraison: true }
    });
    if (!livraison) return res.status(404).json({ error: 'Livraison introuvable.' });
    return res.json({
      statut_livraison: livraison.statut_livraison,
      scan_statut: livraison.dernier_scan_statut,
      scan_message: livraison.dernier_scan_message,
      scan_at: livraison.dernier_scan_at,
    });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

export const getFinalizeScanStatus = async (req, res) => {
  try {
    const { id_commande } = req.params;
    const livraison = await prisma.livraison.findUnique({
      where: { id_commande: parseInt(id_commande, 10) },
      select: { dernier_scan_statut: true, dernier_scan_message: true, dernier_scan_at: true, statut_livraison: true }
    });
    if (!livraison) return res.status(404).json({ error: 'Livraison introuvable.' });
    return res.json({
      statut_livraison: livraison.statut_livraison,
      scan_statut: livraison.dernier_scan_statut,
      scan_message: livraison.dernier_scan_message,
      scan_at: livraison.dernier_scan_at,
    });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};
