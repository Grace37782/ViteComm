import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export const register = async (req, res) => {
  const { nom, prenom, telephone, email, mot_de_passe, role, ...extra } = req.body;

  if (!nom || !prenom || !telephone || !email || !mot_de_passe) {
    return res.status(400).json({ error: 'Tous les champs obligatoires de base doivent être fournis.' });
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.utilisateur.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Cette adresse email est déjà utilisée.' });
    }

    const hashedPassword = await bcryptjs.hash(mot_de_passe, 10);

    // Create user and specialization transactionally
    await prisma.$transaction(async (tx) => {
      const newUser = await tx.utilisateur.create({
        data: {
          nom,
          prenom,
          telephone,
          email,
          mot_de_passe: hashedPassword,
          statut_compte: 'Actif'
        }
      });

      if (role === 'client') {
        if (!extra.adresse_livraison) throw new Error("L'adresse de livraison est obligatoire pour les clients.");
        await tx.client.create({
          data: {
            id_user: newUser.id_user,
            adresse_livraison: extra.adresse_livraison
          }
        });
      } else if (role === 'vendeur') {
        if (!extra.nom_etablissement || !extra.localisation_marche) {
          throw new Error("Le nom de l'établissement et la localisation du marché sont obligatoires pour les vendeurs.");
        }
        await tx.vendeur.create({
          data: {
            id_user: newUser.id_user,
            nom_etablissement: extra.nom_etablissement,
            localisation_marche: extra.localisation_marche,
            score_reputation: 0.0
          }
        });
      } else if (role === 'livreur') {
        if (!extra.type_vehicule || !extra.immatriculation) {
          throw new Error("Le type de véhicule et l'immatriculation sont obligatoires pour les livreurs.");
        }
        await tx.livreur.create({
          data: {
            id_user: newUser.id_user,
            type_vehicule: extra.type_vehicule,
            immatriculation: extra.immatriculation,
            score_reputation: 0.0
          }
        });
      }
    });

    return res.status(201).json({ message: 'Inscription réussie.' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  const { email, telephone, mot_de_passe } = req.body;

  if ((!email && !telephone) || !mot_de_passe) {
    return res.status(400).json({ error: 'Email ou Téléphone avec mot de passe requis.' });
  }

  try {
    const user = await prisma.utilisateur.findFirst({
      where: {
        OR: [
          email ? { email } : undefined,
          telephone ? { telephone } : undefined
        ].filter(Boolean)
      },
      include: {
        client: true,
        vendeur: true,
        livreur: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    if (user.statut_compte !== 'Actif') {
      return res.status(403).json({ error: 'Votre compte a été suspendu ou banni.' });
    }

    const isValidPassword = await bcryptjs.compare(mot_de_passe, user.mot_de_passe);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    // Determine role (RG17)
    let role = 'admin';
    if (user.client) role = 'client';
    else if (user.vendeur) role = 'vendeur';
    else if (user.livreur) role = 'livreur';

    const token = jwt.sign(
      { id_user: user.id_user, role },
      process.env.JWT_SECRET || 'super-secret-jwt-key-vitecomm-2026-academic-mvp',
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id_user: user.id_user,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        role
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la connexion.' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.utilisateur.findUnique({
      where: { id_user: req.user.id_user },
      include: {
        client: true,
        vendeur: true,
        livreur: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    const { mot_de_passe, ...userData } = user;
    return res.json(userData);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};

export const updateProfile = async (req, res) => {
  const { nom, prenom, telephone, email, ...extra } = req.body;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.utilisateur.update({
        where: { id_user: req.user.id_user },
        data: { nom, prenom, telephone, email }
      });

      if (req.user.role === 'client' && extra.adresse_livraison) {
        await tx.client.update({
          where: { id_user: req.user.id_user },
          data: { adresse_livraison: extra.adresse_livraison }
        });
      } else if (req.user.role === 'vendeur') {
        await tx.vendeur.update({
          where: { id_user: req.user.id_user },
          data: {
            nom_etablissement: extra.nom_etablissement,
            localisation_marche: extra.localisation_marche
          }
        });
      } else if (req.user.role === 'livreur') {
        await tx.livreur.update({
          where: { id_user: req.user.id_user },
          data: {
            type_vehicule: extra.type_vehicule,
            immatriculation: extra.immatriculation
          }
        });
      }
    });

    return res.json({ message: 'Profil mis à jour avec succès.' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
