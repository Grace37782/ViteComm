import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-vitecomm-2026-academic-mvp';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

// Derive role from user specialization rows (RG17)
const deriveRole = (user) => {
  if (user.client) return 'client';
  if (user.vendeur) return 'vendeur';
  if (user.livreur) return 'livreur';
  return 'admin'; // No specialization = admin by default
};

// Build safe user payload for API responses (strip password, shape role-specific data)
const buildUserPayload = (user) => {
  const role = deriveRole(user);

  const base = {
    id_user: user.id_user,
    nom: user.nom,
    prenom: user.prenom,
    telephone: user.telephone,
    email: user.email,
    statut_compte: user.statut_compte,
    est_admin: user.est_admin,
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
    base.profil = {
      type_vehicule: user.livreur.type_vehicule,
      immatriculation: user.livreur.immatriculation,
      score_reputation: user.livreur.score_reputation, // Read-only (RG15)
      est_disponible: user.livreur.est_disponible,     // RG19
      distance_marche: user.livreur.distance_marche,
      heure_debut_dispo: user.livreur.heure_debut_dispo,
      heure_fin_dispo: user.livreur.heure_fin_dispo
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
    // Client
    adresse_livraison,
    // Vendeur
    nom_etablissement, localisation_marche,
    // Livreur
    type_vehicule, immatriculation
  } = req.body;

  // ── Validate common required fields ──────────────────────
  if (!nom || !prenom || !telephone || !email || !mot_de_passe) {
    return res.status(400).json({
      error: 'Champs obligatoires manquants : nom, prenom, telephone, email, mot_de_passe.'
    });
  }

  // Email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Format de l\'adresse email invalide.' });
  }

  // Password confirmation (guide §1.3 - validation en temps réel)
  if (mot_de_passe_confirmation !== undefined && mot_de_passe !== mot_de_passe_confirmation) {
    return res.status(400).json({ error: 'Les mots de passe ne correspondent pas.' });
  }

  if (!['client', 'vendeur', 'livreur'].includes(role)) {
    return res.status(400).json({
      error: "Le rôle doit être 'client', 'vendeur' ou 'livreur'. Les administrateurs sont créés manuellement."
    });
  }

  // ── Validate role-specific required fields ────────────────
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
    // Check email uniqueness
    const existingUser = await prisma.utilisateur.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Cette adresse email est déjà utilisée.' });
    }

    const hashedPassword = await bcryptjs.hash(mot_de_passe, 12);

    // ── Create user + specialization in one transaction ──────
    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.utilisateur.create({
        data: {
          nom,
          prenom,
          telephone,
          email,
          mot_de_passe: hashedPassword,
          statut_compte: 'Actif',  // Guide §1.3 - default value
          est_admin: false
        }
      });

      if (role === 'client') {
        await tx.client.create({
          data: { id_user: created.id_user, adresse_livraison }
        });

        // Auto-create empty cart for new client (RG22)
        await tx.panier.create({ data: { id_user_client: created.id_user } });

      } else if (role === 'vendeur') {
        await tx.vendeur.create({
          data: {
            id_user: created.id_user,
            nom_etablissement,
            localisation_marche,
            score_reputation: 0.0  // Guide §1.3 - initialised to 0
          }
        });

      } else if (role === 'livreur') {
        await tx.livreur.create({
          data: {
            id_user: created.id_user,
            type_vehicule,
            immatriculation,
            score_reputation: 0.0,   // Guide §1.3 - initialised to 0
            est_disponible: true,    // RG19 - available by default
            distance_marche: 0.0,
            heure_debut_dispo: null,
            heure_fin_dispo: null
          }
        });
      }

      return created;
    });

    // Fetch full user for response
    const fullUser = await findUserWithRole({ id_user: newUser.id_user });
    const userPayload = buildUserPayload(fullUser);

    // Issue JWT immediately (guide §1.3 - connexion automatique option)
    const token = jwt.sign(
      { id_user: newUser.id_user, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.status(201).json({
      message: 'Inscription réussie.',
      token,
      user: userPayload
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
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
    const userPayload = buildUserPayload(user);

    return res.json({
      message: 'Connexion réussie.',
      token,
      user: userPayload
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la connexion.' });
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

    return res.json(buildUserPayload(user));
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur.' });
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
        // Availability fields (RG19) - also editable from profile page
        if (est_disponible !== undefined) livreurData.est_disponible = Boolean(est_disponible);
        if (distance_marche !== undefined) livreurData.distance_marche = parseFloat(distance_marche);
        if (heure_debut_dispo !== undefined) livreurData.heure_debut_dispo = heure_debut_dispo;
        if (heure_fin_dispo !== undefined) livreurData.heure_fin_dispo = heure_fin_dispo;
        if (Object.keys(livreurData).length > 0) {
          await tx.livreur.update({ where: { id_user: req.user.id_user }, data: livreurData });
        }
      }
    });

    // Return fresh profile
    const updated = await findUserWithRole({ id_user: req.user.id_user });
    return res.json({
      message: 'Profil mis à jour avec succès.',
      user: buildUserPayload(updated)
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
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
