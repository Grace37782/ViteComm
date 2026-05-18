ViteComm — Marché en ligne pour Cotonou

Plateforme de commande multi-étals et de livraison à domicile pour les marchés informels de Cotonou, Bénin.

ViteComm connecte les clients urbains aux vendeurs de marchés (Dantokpa, Missèbo…) via des livreurs locaux (zémidjans), avec vérification qualité obligatoire et suivi en temps réel.

Pourquoi ViteComm ?
Les marchés de Cotonou concentrent l'essentiel de l'activité économique quotidienne, mais les achats restent fragmentés, non traçables et fatigants pour le client. ViteComm crée un pont numérique entre les habitudes d'achat traditionnelles et les standards modernes de traçabilité et de service.

Fonctionnalités principales
RôleFonctionnalités
Client---Recherche géolocalisée, panier multi-étals, suivi livraison, paiement COD, feedback
Vendeur---Catalogue produits, gestion stock, réception commandes, remise via code unique
Livreur---Itinéraire optimisé (Leaflet/OSM), collecte multi-étals, upload photo preuveAdminDashboard analytics, dispatch livreurs, arbitrage litiges, config commissions

Stack technique
Frontend        React 18 + Vite + React Router + react-leaflet
Backend         Node.js + Express.js + JWT
Base de données MySQL 8
Cartographie    Leaflet.js + OpenStreetMap (gratuit)
Hébergement     AlwaysData

Structure du projet
vitecomm/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/          # Connexion unique multi-rôle
│   │   │   ├── client/        # Accueil, catalogue, panier, suivi
│   │   │   ├── vendeur/       # Dashboard, catalogue, remise
│   │   │   ├── livreur/       # Missions, itinéraire, collecte
│   │   │   └── admin/         # Dashboard, dispatch, litiges
│   │   ├── components/        # Composants réutilisables
│   │   └── services/          # Appels API
│   └── package.json
└── backend/
    ├── routes/                # auth, commandes, produits, livraisons
    ├── controllers/
    ├── models/                # MySQL (users, orders, products…)
    ├── middleware/            # JWT auth, role guard
    └── server.js

Installation
Prérequis

Node.js >= 18
MySQL 8
npm ou yarn

Frontend
bashcd frontend
npm install
npm run dev
Backend
bashcd backend
npm install
# Créer un fichier .env (voir .env.example)
npm run dev
Variables d'environnement (backend)
envDB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=vitecomm
JWT_SECRET=votre_secret_jwt
PORT=3001

Équipe
Développeur Rôle
Lionel Sisso Timileyin Backend · API · Déploiement AlwaysData
Immaculée Odjo Frontend · UI/UX · React
Projet de Fin de Cycle — 8 semaines · Bénin · 2025
