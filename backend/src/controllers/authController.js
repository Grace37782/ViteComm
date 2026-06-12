import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/db.js';
import { sendVerificationCode, sendPasswordResetCode } from '../services/mail.js';
import { moveToPermanent } from '../middleware/upload.js';
import { errorMessage, internalError } from '../utils/errors.js';

const { JWT_SECRET, JWT_EXPIRES_IN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL } = process.env;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables.');
}
const JWT_EXPIRES = JWT_EXPIRES_IN || '7d';

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Derive role from user specialization rows (RG17)
const deriveRole = (user) => {
  if (user.client) return 'client';
  if (user.vendeur) return 'vendeur';
  if (user.livreur) return 'livreur';
  return 'admin'; // No specialization = admin by default
};

// Build safe user payload for API responses (strip password, shape role-specific data)
const buildUserPayload = async (user) => {
  const role = deriveRole(user);

  const base = {
    id_user: user.id_user,
    nom: user.nom,
    prenom: user.prenom,
    telephone: user.telephone,
    email: user.email,
    statut_compte: user.statut_compte,
    est_admin: user.est_admin,
    photo_url: user.photo_url,
    auth_provider: user.auth_provider || 'local',
    role
  };

  // Attach role-specific fields (guide §1.4 - profil par rôle)
  if (role === 'client') {
    base.profil = {
      adresse_livraison: user.client.adresse_livraison
      // No score_reputation for clients (RG15)
    };
  } else if (role === 'vendeur') {
    base.profil = {
      nom_etablissement: user.vendeur.nom_etablissement,
      localisation_marche: user.vendeur.localisation_marche,
      score_reputation: user.vendeur.score_reputation // Read-only (RG15)
    };
  } else if (role === 'livreur') {
    const latestDispo = await prisma.disponibiliteLivreur.findFirst({
      where: { id_user_livreur: user.id_user },
      orderBy: { date_mise_a_jour: 'desc' }
    });
    base.profil = {
      type_vehicule: user.livreur.type_vehicule,
      immatriculation: user.livreur.immatriculation,
      score_reputation: user.livreur.score_reputation,
      est_disponible: latestDispo?.est_disponible ?? true,
      distance_marche: latestDispo?.distance_marche ?? 0,
      heure_debut_dispo: latestDispo?.heure_debut_dispo ?? null,
      heure_fin_dispo: latestDispo?.heure_fin_dispo ?? null
    };
  }

  return base;
};

// Fetch a user with all specializations included
const findUserWithRole = (where) =>
  prisma.utilisateur.findUnique({
    where,
    include: { client: true, vendeur: true, livreur: true }
  });

// ────────────────────────────────────────────────────────────
// POST /auth/register
// Guide §1.3 - Écran d'Inscription
// Étape 1 : valide les champs, génère un code, envoie l'email,
//            stocke un VerificationToken (pas d'utilisateur en DB)
// Body: { nom, prenom, telephone, email, mot_de_passe,
//         mot_de_passe_confirmation, role,
//         /* client */ adresse_livraison,
//         /* vendeur */ nom_etablissement, localisation_marche,
//         /* livreur */ type_vehicule, immatriculation }
// ────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  const {
    nom, prenom, telephone, email,
    mot_de_passe, mot_de_passe_confirmation,
    role,
    adresse_livraison,
    nom_etablissement, localisation_marche, id_marche,
    type_vehicule, immatriculation
  } = req.body;

  // ── Validate common required fields ──────────────────────
  if (!nom || !prenom || !mot_de_passe) {
    return res.status(400).json({
      error: 'Champs obligatoires manquants : nom, prenom, mot_de_passe.'
    });
  }

  if (!email && !telephone) {
    return res.status(400).json({
      error: 'Email ou téléphone obligatoire.'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    return res.status(400).json({ error: "Format de l'adresse email invalide." });
  }

  if (mot_de_passe_confirmation !== undefined && mot_de_passe !== mot_de_passe_confirmation) {
    return res.status(400).json({ error: 'Les mots de passe ne correspondent pas.' });
  }

  if (!['client', 'vendeur', 'livreur'].includes(role)) {
    return res.status(400).json({
      error: "Le rôle doit être 'client', 'vendeur' ou 'livreur'."
    });
  }

  if (role === 'client' && !adresse_livraison) {
    return res.status(400).json({ error: "L'adresse de livraison est obligatoire pour les clients." });
  }
  if (role === 'vendeur' && (!nom_etablissement || !localisation_marche)) {
    return res.status(400).json({
      error: "Le nom de l'établissement et la localisation du marché sont obligatoires pour les vendeurs."
    });
  }
  if (role === 'livreur' && (!type_vehicule || !immatriculation)) {
    return res.status(400).json({
      error: "Le type de véhicule et l'immatriculation sont obligatoires pour les livreurs."
    });
  }

  try {
    // Check if email already has an active user (only if email provided)
    if (email) {
      const existingUser = await prisma.utilisateur.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: 'Cette adresse email est déjà utilisée.' });
      }

      // Check for existing pending verification for this email
      const existingPending = await prisma.verificationToken.findFirst({
        where: { email, expires_at: { gt: new Date() } }
      });
      if (existingPending) {
        return res.status(429).json({
          error: 'Un code de vérification a déjà été envoyé à cet email. Vérifiez vos spams ou attendez 10 minutes.',
          pending: true
        });
      }
    }

    // ── Telephone-only is NOT allowed: email is required for verification ──
    if (!email && telephone) {
      return res.status(400).json({
        error: 'Une adresse email est requise pour vérifier votre compte.'
      });
    }

    // ── Email provided: send verification code ──
    // Generate 6-digit code and unique token
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const token = crypto.randomUUID();

    // Build payload as JSON
    const photoFile = req.file?.filename;
    const payload = JSON.stringify({
      nom, prenom, telephone, email, mot_de_passe,
      adresse_livraison, nom_etablissement, localisation_marche, id_marche,
      type_vehicule, immatriculation,
      photo: photoFile || null,
    });

    // Store verification token (expires in 10 min)
    await prisma.verificationToken.create({
      data: {
        email,
        code,
        token,
        data: payload,
        role,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
      }
    });

    // Send email
    await sendVerificationCode(email, code, prenom);

    return res.status(200).json({
      message: 'Code de vérification envoyé par email.',
      token, // frontend uses this to verify later
    });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

// ────────────────────────────────────────────────────────────
// POST /auth/verify-email
// Étape 2 : vérifie le code, crée l'utilisateur en DB, connecte
// Body: { token, code }
// ────────────────────────────────────────────────────────────
export const verifyEmail = async (req, res) => {
  const { token, code } = req.body;

  if (!token || !code) {
    return res.status(400).json({ error: 'Token et code requis.' });
  }

  try {
    const vt = await prisma.verificationToken.findUnique({ where: { token } });

    if (!vt) {
      return res.status(404).json({ error: 'Token de vérification invalide.' });
    }

    if (new Date() > vt.expires_at) {
      await prisma.verificationToken.delete({ where: { id: vt.id } });
      return res.status(410).json({ error: 'Code expiré. Veuillez recommencer l\'inscription.' });
    }

    if (vt.code !== code) {
      return res.status(400).json({ error: 'Code incorrect.' });
    }

    // Check email still free (defensive)
    const existingUser = await prisma.utilisateur.findUnique({ where: { email: vt.email } });
    if (existingUser) {
      await prisma.verificationToken.delete({ where: { id: vt.id } });
      return res.status(409).json({ error: 'Cette adresse email est déjà utilisée.' });
    }

    const data = JSON.parse(vt.data);
    const hashedPassword = await bcryptjs.hash(data.mot_de_passe, 12);

    // ── Create user + specialization ──
    const newUser = await prisma.$transaction(async (tx) => {
      const photoUrl = data.photo ? moveToPermanent(data.photo) : null;
      const created = await tx.utilisateur.create({
        data: {
          nom: data.nom,
          prenom: data.prenom,
          telephone: data.telephone,
          email: vt.email,
          mot_de_passe: hashedPassword,
          statut_compte: 'Actif',
          est_admin: false,
          photo_url: photoUrl,
        }
      });

      if (vt.role === 'client') {
        await tx.client.create({
          data: { id_user: created.id_user, adresse_livraison: data.adresse_livraison }
        });
        await tx.panier.create({ data: { id_user_client: created.id_user } });
      } else if (vt.role === 'vendeur') {
        await tx.vendeur.create({
          data: {
            id_user: created.id_user,
            nom_etablissement: data.nom_etablissement,
            localisation_marche: data.localisation_marche || '',
            id_marche: data.id_marche ? parseInt(data.id_marche, 10) : undefined,
            score_reputation: 0.0,
          }
        });
      } else if (vt.role === 'livreur') {
        await tx.livreur.create({
          data: {
            id_user: created.id_user,
            type_vehicule: data.type_vehicule,
            immatriculation: data.immatriculation,
            score_reputation: 0.0,
          }
        });
        await tx.disponibiliteLivreur.create({
          data: {
            id_user_livreur: created.id_user,
            est_disponible: true,
            distance_marche: 0.0,
            heure_debut_dispo: null,
            heure_fin_dispo: null,
          }
        });
      }

      return created;
    });

    // Clean up used token
    await prisma.verificationToken.delete({ where: { id: vt.id } });

    // Issue JWT
    const fullUser = await findUserWithRole({ id_user: newUser.id_user });
    const userPayload = await buildUserPayload(fullUser);
    const jwtToken = jwt.sign(
      { id_user: newUser.id_user, role: vt.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.status(201).json({
      message: 'Compte créé avec succès.',
      token: jwtToken,
      user: userPayload,
    });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

// ────────────────────────────────────────────────────────────
// POST /auth/resend-code
// Body: { token }
// ────────────────────────────────────────────────────────────
export const resendCode = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token requis.' });
  }

  try {
    const vt = await prisma.verificationToken.findUnique({ where: { token } });
    if (!vt) {
      return res.status(404).json({ error: 'Token invalide ou inscription expirée.' });
    }

    // Generate new code, extend expiry
    const newCode = String(Math.floor(100000 + Math.random() * 900000));
    const data = JSON.parse(vt.data);

    await prisma.verificationToken.update({
      where: { id: vt.id },
      data: {
        code: newCode,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
      }
    });

    await sendVerificationCode(vt.email, newCode, data.prenom);

    return res.json({ message: 'Nouveau code envoyé par email.' });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

// ────────────────────────────────────────────────────────────
// POST /auth/forgot-password
// Envoie un code à 6 chiffres par email pour réinitialiser le mot de passe
// Body: { email }
// ────────────────────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis.' });

  try {
    const user = await prisma.utilisateur.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Aucun compte trouvé avec cet email.' });

    const existing = await prisma.passwordResetToken.findFirst({
      where: { email, expires_at: { gt: new Date() } }
    });
    if (existing) {
      return res.status(429).json({
        error: 'Un code a déjà été envoyé. Vérifiez vos spams ou attendez 10 minutes.',
        pending: true
      });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const token = crypto.randomUUID();

    await prisma.passwordResetToken.create({
      data: { email, code, token, expires_at: new Date(Date.now() + 10 * 60 * 1000) }
    });

    await sendPasswordResetCode(email, code, user.prenom);

    return res.json({ message: 'Code de réinitialisation envoyé par email.', token });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

// ────────────────────────────────────────────────────────────
// POST /auth/reset-password
// Valide le code et réinitialise le mot de passe
// Body: { token, code, mot_de_passe, mot_de_passe_confirmation }
// ────────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  const { token, code, mot_de_passe, mot_de_passe_confirmation } = req.body;

  if (!token || !code || !mot_de_passe) {
    return res.status(400).json({ error: 'Token, code et nouveau mot de passe requis.' });
  }
  if (mot_de_passe_confirmation !== undefined && mot_de_passe !== mot_de_passe_confirmation) {
    return res.status(400).json({ error: 'Les mots de passe ne correspondent pas.' });
  }
  if (mot_de_passe.length < 8) return res.status(400).json({ error: 'Minimum 8 caractères.' });
  if (!/[A-Z]/.test(mot_de_passe)) return res.status(400).json({ error: 'Une majuscule requise.' });
  if (!/[a-z]/.test(mot_de_passe)) return res.status(400).json({ error: 'Une minuscule requise.' });
  if (!/\d/.test(mot_de_passe)) return res.status(400).json({ error: 'Un chiffre requis.' });
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(mot_de_passe))
    return res.status(400).json({ error: 'Un caractère spécial requis.' });

  try {
    const rt = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!rt) return res.status(404).json({ error: 'Token invalide.' });
    if (new Date() > rt.expires_at) {
      await prisma.passwordResetToken.delete({ where: { id: rt.id } });
      return res.status(410).json({ error: 'Code expiré. Veuillez recommencer.' });
    }
    if (rt.code !== code) return res.status(400).json({ error: 'Code incorrect.' });

    const hashedPassword = await bcryptjs.hash(mot_de_passe, 12);
    await prisma.utilisateur.update({
      where: { email: rt.email },
      data: { mot_de_passe: hashedPassword }
    });

    await prisma.passwordResetToken.delete({ where: { id: rt.id } });

    return res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

// ────────────────────────────────────────────────────────────
// POST /auth/login
// Guide §1.2 - Écran de Connexion
// Body: { email?, telephone?, mot_de_passe }
// ────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  const { email, telephone, mot_de_passe } = req.body;

  if ((!email && !telephone) || !mot_de_passe) {
    return res.status(400).json({ error: 'Email ou téléphone et mot de passe requis.' });
  }

  try {
    // Find by email OR telephone (guide §1.2)
    const user = await prisma.utilisateur.findFirst({
      where: {
        OR: [
          email ? { email } : undefined,
          telephone ? { telephone } : undefined
        ].filter(Boolean)
      },
      include: { client: true, vendeur: true, livreur: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    // Block Google-only accounts from traditional login
    if (user.auth_provider === 'google') {
      return res.status(403).json({ error: 'Ce compte utilise uniquement la connexion Google. Veuillez cliquer sur "Continuer avec Google".' });
    }

    // Block suspended/banned accounts (guide §1.2 - gestion du statut_compte)
    if (user.statut_compte !== 'Actif') {
      return res.status(403).json({
        error: 'Votre compte a été suspendu ou banni. Veuillez contacter le support.',
        statut_compte: user.statut_compte
      });
    }

    const isValidPassword = await bcryptjs.compare(mot_de_passe, user.mot_de_passe);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const role = deriveRole(user);

    const token = jwt.sign(
      { id_user: user.id_user, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    // Return full profile data so frontend can pre-fill UI without extra call
    const userPayload = await buildUserPayload(user);

    return res.json({
      message: 'Connexion réussie.',
      token,
      user: userPayload
    });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

// ────────────────────────────────────────────────────────────
// GET /auth/markets
// Public — liste des marchés disponibles (pour le select d'inscription)
// ────────────────────────────────────────────────────────────
export const getMarkets = async (req, res) => {
  try {
    const markets = await prisma.marche.findMany({
      select: { id_marche: true, nom: true },
      orderBy: { nom: 'asc' }
    });
    return res.json(markets);
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

// ────────────────────────────────────────────────────────────
// GET /auth/profile
// Guide §1.4 - Gestion du Profil (lecture seule par défaut)
// ────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = await findUserWithRole({ id_user: req.user.id_user });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });

    return res.json(await buildUserPayload(user));
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

// ────────────────────────────────────────────────────────────
// PUT /auth/profile
// Guide §1.4 - Mode édition du profil
// Editable: nom, prenom, telephone, email, mot_de_passe
//   + role-specific fields (NOT score_reputation - read-only per RG15)
// ────────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  const {
    nom, prenom, telephone, email,
    mot_de_passe, mot_de_passe_confirmation,
    // Client
    adresse_livraison,
    // Vendeur
    nom_etablissement, localisation_marche,
    // Livreur
    type_vehicule, immatriculation,
    est_disponible, distance_marche, heure_debut_dispo, heure_fin_dispo
  } = req.body;

  // Validate new password if provided
  if (mot_de_passe) {
    // Block password change for Google OAuth users
    const currentUser = await prisma.utilisateur.findUnique({ where: { id_user: req.user.id_user } });
    if (currentUser.auth_provider === 'google') {
      return res.status(403).json({ error: 'Les comptes Google ne peuvent pas modifier leur mot de passe. Utilisez la connexion Google.' });
    }
    if (mot_de_passe_confirmation !== undefined && mot_de_passe !== mot_de_passe_confirmation) {
      return res.status(400).json({ error: 'Les mots de passe ne correspondent pas.' });
    }
    if (mot_de_passe.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Build base update data
      const baseData = {};
      if (nom) baseData.nom = nom;
      if (prenom) baseData.prenom = prenom;
      if (telephone) baseData.telephone = telephone;
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) throw new Error('Format de l\'adresse email invalide.');
        // Check uniqueness (ignore own email)
        const existing = await tx.utilisateur.findFirst({
          where: { email, NOT: { id_user: req.user.id_user } }
        });
        if (existing) throw new Error('Cette adresse email est déjà utilisée.');
        baseData.email = email;
      }
      if (mot_de_passe) {
        baseData.mot_de_passe = await bcryptjs.hash(mot_de_passe, 12);
      }
      if (req.file) {
        baseData.photo_url = moveToPermanent(req.file.filename);
      }

      if (Object.keys(baseData).length > 0) {
        await tx.utilisateur.update({
          where: { id_user: req.user.id_user },
          data: baseData
        });
      }

      // Role-specific updates (guide §1.4)
      if (req.user.role === 'client' && adresse_livraison) {
        await tx.client.update({
          where: { id_user: req.user.id_user },
          data: { adresse_livraison }
        });
      } else if (req.user.role === 'vendeur') {
        const vendeurData = {};
        if (nom_etablissement) vendeurData.nom_etablissement = nom_etablissement;
        if (localisation_marche) vendeurData.localisation_marche = localisation_marche;
        if (Object.keys(vendeurData).length > 0) {
          await tx.vendeur.update({ where: { id_user: req.user.id_user }, data: vendeurData });
        }
      } else if (req.user.role === 'livreur') {
        const livreurData = {};
        if (type_vehicule) livreurData.type_vehicule = type_vehicule;
        if (immatriculation) livreurData.immatriculation = immatriculation;
        if (Object.keys(livreurData).length > 0) {
          await tx.livreur.update({ where: { id_user: req.user.id_user }, data: livreurData });
        }
        // Availability fields now stored in DisponibiliteLivreur (RG29)
        const hasAvailUpdate = est_disponible !== undefined || distance_marche !== undefined ||
          heure_debut_dispo !== undefined || heure_fin_dispo !== undefined;
        if (hasAvailUpdate) {
          await tx.disponibiliteLivreur.create({
            data: {
              id_user_livreur: req.user.id_user,
              est_disponible: est_disponible !== undefined ? Boolean(est_disponible) : true,
              distance_marche: distance_marche !== undefined ? parseFloat(distance_marche) : 0,
              heure_debut_dispo: heure_debut_dispo ?? null,
              heure_fin_dispo: heure_fin_dispo ?? null
            }
          });
        }
      }
    });

    // Return fresh profile
    const updated = await findUserWithRole({ id_user: req.user.id_user });
    return res.json({
      message: 'Profil mis à jour avec succès.',
      user: await buildUserPayload(updated)
    });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

// ────────────────────────────────────────────────────────────
// POST /auth/google
// Google OAuth - reçoit un access_token, vérifie via Google userinfo, connecte ou crée l'utilisateur
// Body: { credential: access_token }
// ────────────────────────────────────────────────────────────
export const googleAuth = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Token Google requis.' });
  }

  try {
    // Frontend sends access_token (useGoogleLogin with flow:'implicit')
    // Verify it by calling Google's userinfo endpoint
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${credential}` },
    });
    if (!googleRes.ok) {
      return res.status(401).json({ error: 'Token Google invalide ou expiré.' });
    }
    const profile = await googleRes.json();
    const { email, given_name, family_name, sub } = profile;

    if (!email) {
      return res.status(400).json({ error: 'Email requis pour la connexion Google.' });
    }

    // Check if user exists
    let user = await prisma.utilisateur.findUnique({
      where: { email },
      include: { client: true, vendeur: true, livreur: true },
    });

    let isNewGoogleUser = false;

    if (!user) {
      // Auto-create account as client with Google data
      isNewGoogleUser = true;
      user = await prisma.$transaction(async (tx) => {
        const created = await tx.utilisateur.create({
          data: {
            nom: family_name || sub,
            prenom: given_name || 'Utilisateur',
            telephone: '',
            email,
            mot_de_passe: await bcryptjs.hash(crypto.randomUUID(), 12),
            statut_compte: 'Actif',
            est_admin: false,
            auth_provider: 'google',
          }
        });
        await tx.client.create({
          data: { id_user: created.id_user, adresse_livraison: '' }
        });
        await tx.panier.create({ data: { id_user_client: created.id_user } });
        return tx.utilisateur.findUnique({
          where: { id_user: created.id_user },
          include: { client: true, vendeur: true, livreur: true },
        });
      });
    } else {
      // Existing user — check auth_provider
      if (user.auth_provider === 'local') {
        return res.status(403).json({ error: 'Ce compte utilise une connexion par email/mot de passe. Veuillez vous connecter normalement.' });
      }
      // Mark as Google user if not yet set (backward compat)
      if (!user.auth_provider || user.auth_provider === 'local') {
        await prisma.utilisateur.update({ where: { id_user: user.id_user }, data: { auth_provider: 'google' } });
      }
    }

    if (user.statut_compte !== 'Actif') {
      return res.status(403).json({ error: 'Votre compte a été suspendu ou banni.' });
    }

    const role = deriveRole(user);
    const token = jwt.sign(
      { id_user: user.id_user, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.json({
      message: 'Connexion Google réussie.',
      token,
      user: await buildUserPayload(user),
      is_new_google_user: isNewGoogleUser,
    });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Échec de l\'authentification Google.') });
  }
};

// ────────────────────────────────────────────────────────────
// GET /auth/google — Redirect to Google consent screen
// ────────────────────────────────────────────────────────────
export const googleRedirect = (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URL) {
    return res.status(500).json({ error: 'Google OAuth redirect non configuré côté serveur.' });
  }

  const oauth2 = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL);
  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account',
  });

  res.redirect(authUrl);
};

// ────────────────────────────────────────────────────────────
// GET /auth/google/callback — Handle Google redirect, exchange code, login/create user
// ────────────────────────────────────────────────────────────
export const googleCallback = async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    const frontendUrl = process.env.APP_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/connect?error=google_cancelled`);
  }

  if (!code || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URL) {
    const frontendUrl = process.env.APP_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/connect?error=google_failed`);
  }

  try {
    const oauth2 = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL);
    const { tokens } = await oauth2.getToken(code);
    const ticket = await oauth2.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { email, given_name, family_name, sub } = payload;

    if (!email) {
      const frontendUrl = process.env.APP_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/connect?error=google_no_email`);
    }

    let user = await prisma.utilisateur.findUnique({
      where: { email },
      include: { client: true, vendeur: true, livreur: true },
    });

    let isNewGoogleUser = false;

    if (!user) {
      isNewGoogleUser = true;
      user = await prisma.$transaction(async (tx) => {
        const created = await tx.utilisateur.create({
          data: {
            nom: family_name || sub,
            prenom: given_name || 'Utilisateur',
            telephone: '',
            email,
            mot_de_passe: await bcryptjs.hash(crypto.randomUUID(), 12),
            statut_compte: 'Actif',
            est_admin: false,
            auth_provider: 'google',
          }
        });
        await tx.client.create({
          data: { id_user: created.id_user, adresse_livraison: '' }
        });
        await tx.panier.create({ data: { id_user_client: created.id_user } });
        return tx.utilisateur.findUnique({
          where: { id_user: created.id_user },
          include: { client: true, vendeur: true, livreur: true },
        });
      });
    } else {
      if (user.auth_provider === 'local') {
        const frontendUrl = process.env.APP_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/connect?error=google_wrong_account`);
      }
      if (!user.auth_provider || user.auth_provider === 'local') {
        await prisma.utilisateur.update({ where: { id_user: user.id_user }, data: { auth_provider: 'google' } });
      }
    }

    if (user.statut_compte !== 'Actif') {
      const frontendUrl = process.env.APP_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/connect?error=account_suspended`);
    }

    const role = deriveRole(user);
    const token = jwt.sign(
      { id_user: user.id_user, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    const frontendUrl = process.env.APP_URL || 'http://localhost:5173';
    const params = new URLSearchParams({
      token,
      user: JSON.stringify(await buildUserPayload(user)),
      new: String(isNewGoogleUser),
    });
    res.redirect(`${frontendUrl}/auth/google/callback?${params.toString()}`);
  } catch (err) {
    console.error('Google callback error:', err);
    const frontendUrl = process.env.APP_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/connect?error=google_failed`);
  }
};

// ────────────────────────────────────────────────────────────
// POST /auth/google/complete-registration
// After first Google login, user chooses role: client/vendeur/livreur
// Body: { role: 'client'|'vendeur'|'livreur', nom_etablissement?, localisation_marche?, type_vehicule?, immatriculation? }
// ────────────────────────────────────────────────────────────
export const completeGoogleRegistration = async (req, res) => {
  const { role, nom_etablissement, localisation_marche, type_vehicule, immatriculation } = req.body;

  if (!role || !['client', 'vendeur', 'livreur'].includes(role)) {
    return res.status(400).json({ error: 'Rôle invalide. Choisissez: client, vendeur ou livreur.' });
  }

  try {
    const user = await prisma.utilisateur.findUnique({
      where: { id_user: req.user.id_user },
      include: { client: true, vendeur: true, livreur: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    // If already has the requested role, just return
    if ((role === 'client' && user.client) ||
        (role === 'vendeur' && user.vendeur) ||
        (role === 'livreur' && user.livreur)) {
      return res.json({
        message: 'Rôle déjà configuré.',
        user: await buildUserPayload(user),
      });
    }

    await prisma.$transaction(async (tx) => {
      // Remove existing role rows
      if (user.client) {
        // Delete cart first ( FK constraint )
        await tx.panier.deleteMany({ where: { id_user_client: user.id_user } });
        await tx.client.delete({ where: { id_user: user.id_user } });
      }
      if (user.vendeur) {
        await tx.vendeur.delete({ where: { id_user: user.id_user } });
      }
      if (user.livreur) {
        await tx.disponibiliteLivreur.deleteMany({ where: { id_user_livreur: user.id_user } });
        await tx.livreur.delete({ where: { id_user: user.id_user } });
      }

      // Create the new role row
      if (role === 'client') {
        await tx.client.create({
          data: { id_user: user.id_user, adresse_livraison: '' }
        });
        await tx.panier.create({ data: { id_user_client: user.id_user } });
      } else if (role === 'vendeur') {
        if (!nom_etablissement || !localisation_marche) {
          throw new Error('Pour devenir vendeur, nom_etablissement et localisation_marche sont requis.');
        }
        await tx.vendeur.create({
          data: {
            id_user: user.id_user,
            nom_etablissement,
            localisation_marche,
          }
        });
      } else if (role === 'livreur') {
        if (!type_vehicule || !immatriculation) {
          throw new Error('Pour devenir livreur, type_vehicule et immatriculation sont requis.');
        }
        await tx.livreur.create({
          data: {
            id_user: user.id_user,
            type_vehicule,
            immatriculation,
          }
        });
      }
    });

    const updated = await prisma.utilisateur.findUnique({
      where: { id_user: req.user.id_user },
      include: { client: true, vendeur: true, livreur: true },
    });

    return res.json({
      message: `Compte ${role} configuré avec succès.`,
      user: await buildUserPayload(updated),
    });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error, 'Une erreur est survenue.') });
  }
};

// ────────────────────────────────────────────────────────────
// DELETE /auth/logout
// Guide §1.4 - Bouton de déconnexion
// JWT is stateless; client clears its token on 200 response.
// ────────────────────────────────────────────────────────────
export const logout = async (req, res) => {
  // Stateless: nothing to invalidate server-side for JWT
  // The frontend clears localStorage/cookies on this 200 response
  return res.json({
    message: 'Déconnexion réussie. Veuillez supprimer votre token côté client.'
  });
};
