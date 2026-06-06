import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const { JWT_SECRET } = process.env;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables.');
}

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Accès non autorisé. Token manquant.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch user with specializations to confirm existence, status, and role
    const user = await prisma.utilisateur.findUnique({
      where: { id_user: decoded.id_user },
      include: {
        client: true,
        vendeur: true,
        livreur: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé.' });
    }

    if (user.statut_compte !== 'Actif') {
      return res.status(403).json({ error: 'Votre compte est suspendu ou banni.' });
    }

    // Determine role (RG17)
    let role = 'admin';
    if (user.client) role = 'client';
    else if (user.vendeur) role = 'vendeur';
    else if (user.livreur) role = 'livreur';

    req.user = {
      id_user: user.id_user,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès interdit. Rôle insuffisant.' });
    }

    next();
  };
};
