import { Router } from 'express';
import { register, verifyEmail, resendCode, login, getProfile, updateProfile, logout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Guide §1.3 - Inscription (étape 1 : envoi du code email)
router.post('/register', register);

// Vérification email (étape 2 : validation du code → création du compte)
router.post('/verify-email', verifyEmail);

// Renvoi du code
router.post('/resend-code', resendCode);

// Guide §1.2 - Connexion (email or telephone + password → role-based redirect)
router.post('/login', login);

// Guide §1.4 - Profil (read & edit; score_reputation read-only per RG15)
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);

// Guide §1.4 - Déconnexion (stateless JWT; client clears token on 200)
router.delete('/logout', requireAuth, logout);

export default router;

