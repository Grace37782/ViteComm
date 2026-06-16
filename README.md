<div align="center">

# 🛒 ViteComm

### Marketplace Multi-Vendeurs pour le Bénin

**Commandez en ligne, livré chez vous, payez avec Mobile Money**

[![Live Demo](https://img.shields.io/badge/Live_Demo-ViteComm-blue?style=for-the-badge&logo=vercel)](https://vitecomm.vercel.app/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE.txt)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

</div>

---

## 📸 Captures d'Écran

<table>
  <tr>
    <td align="center"><b>Landing Page</b></td>
    <td align="center"><b>Connexion</b></td>
    <td align="center"><b>Inscription</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/landing-page.png" width="280" /></td>
    <td><img src="docs/screenshots/login-page.png" width="280" /></td>
    <td><img src="docs/screenshots/signup-page.png" width="280" /></td>
  </tr>
  <tr>
    <td align="center"><b>Espace Client</b></td>
    <td align="center"><b>Espace Vendeur</b></td>
    <td align="center"><b>Espace Admin</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/accueil-client.png" width="280" /></td>
    <td><img src="docs/screenshots/accueil-vendeur.png" width="280" /></td>
    <td><img src="docs/screenshots/accueil-admin.png" width="280" /></td>
  </tr>
  <tr>
    <td align="center"><b>Espace Livreur</b></td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/accueil-livreur.png" width="280" /></td>
    <td></td>
    <td></td>
  </tr>
</table>

---

## 🏗️ Architecture

ViteComm est construit sur une architecture **full-stack** séparée (frontend / backend) avec une base de données **MariaDB** et l'ORM **Prisma**.

### Architecture Technique

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Client   │  │ Vendeur  │  │ Livreur  │  │  Admin   │   │
│  │  Routes   │  │  Routes  │  │  Routes  │  │  Routes  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       └──────────────┴──────────────┴──────────────┘        │
│                          │  Axios HTTP                      │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    BACKEND (Express.js)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Auth     │  │  Panier  │  │ Commande │  │ Paiement │   │
│  │  Routes   │  │  Routes  │  │  Routes  │  │ MTN MoMo │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       └──────────────┴──────────────┴──────────────┘        │
│                          │  Prisma ORM                      │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                       MariaDB                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Utilisateur│  │ Produit  │  │ Commande │  │ Livraison│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Modèle Conceptuel de Données (MCD)

Les entités principales du système :

| Entité | Description |
|--------|-------------|
| **Utilisateur** | Compte unifié (Client, Vendeur, Livreur, Admin) |
| **Marché** | Marchés physiques du Bénin (Dantokpa, Ganhi, etc.) |
| **Catégorie** | Classification des produits (Légumes, Épices, etc.) |
| **Produit** | Articles en vente avec prix et stock |
| **Panier** | Articles sélectionnés par un client |
| **Commande** | Achat validé avec statut de suivi |
| **Livraison** | Transport du colis par un livreur |
| **Bon de Livraison** | Preuve de remise du colis |
| **Paiement** | Transaction financière (Espèces / Mobile Money) |
| **Facture** | Décompte détaillé de la commande |
| **Litige** | Réclamation sur un produit ou une livraison |
| **Feedback** | Avis et notations du client |
| **Signalement** | Signalement d'abus par un utilisateur |

### Diagrammes d'États - Transitions

<table>
  <tr>
    <td align="center"><b>Commande</b></td>
    <td align="center"><b>Livraison</b></td>
    <td align="center"><b>Paiement</b></td>
    <td align="center"><b>Litige</b></td>
  </tr>
  <tr>
    <td><img src="docs/diagrams/diag-detat-et-transition-de-commande.png" width="200" /></td>
    <td><img src="docs/diagrams/diag-detat-et-transition-de-livraison.png" width="200" /></td>
    <td><img src="docs/diagrams/diag-detat-et-transition-de-paiement.png" width="200" /></td>
    <td><img src="docs/diagrams/diag-detat-et-transition-de-litige.png" width="200" /></td>
  </tr>
</table>

### Diagrammes UML

<table>
  <tr>
    <td align="center"><b>Diagramme de Cas d'Utilisation</b></td>
    <td align="center"><b>Diagramme de Classes</b></td>
  </tr>
  <tr>
    <td><img src="docs/diagrams/uml-use-case-diag.png" width="400" /></td>
    <td><img src="docs/diagrams/uml-class-diag.png" width="400" /></td>
  </tr>
  <tr>
    <td align="center"><b>Commander un Produit</b></td>
    <td align="center"><b>Gestion des Litiges</b></td>
  </tr>
  <tr>
    <td><img src="docs/diagrams/uml-activity-diag-commander-produit.png" width="400" /></td>
    <td><img src="docs/diagrams/uml-activity-diag-gestion-de-litiges.png" width="400" /></td>
  </tr>
  <tr>
    <td align="center"><b>Flux de Livraison</b></td>
    <td></td>
  </tr>
  <tr>
    <td><img src="docs/diagrams/uml-activty-diag-flux-de-livraison.png" width="400" /></td>
    <td></td>
  </tr>
</table>

---

## ⚙️ Stack Technique

<table>
  <tr>
    <td><b>Couche</b></td>
    <td><b>Technologies</b></td>
  </tr>
  <tr>
    <td><b>Frontend</b></td>
    <td>React 19 · Vite 8 · Tailwind CSS 4 · React Router 7 · Leaflet/React-Leaflet (cartes) · Axios · html5-qrcode (QR scan)</td>
  </tr>
  <tr>
    <td><b>Backend</b></td>
    <td>Node.js · Express 5 · Prisma ORM 7 · JWT (auth) · bcryptjs (hachage) · Nodemailer (emails) · QRCode (génération)</td>
  </tr>
  <tr>
    <td><b>Base de données</b></td>
    <td>MariaDB (MySQL-compatible)</td>
  </tr>
  <tr>
    <td><b>Paiement</b></td>
    <td>MTN Mobile Money API (sandbox de test)</td>
  </tr>
  <tr>
    <td><b>Déploiement</b></td>
    <td>Vercel (frontend) · Backend auto-hébergé</td>
  </tr>
</table>

---

## 🎯 Fonctionnalités

### 👤 Espace Client
- Inscription / Connexion (email + mot de passe, QR Code, Google OAuth)
- Parcourir les produits par marché, catégorie, recherche
- Panier multi-vendeurs avec quantités modifiables
- Commande avec vérification par code à 6 chiffres
- Paiement Mobile Money (MTN MoMo) ou Espèces
- Suivi des commandes en temps réel
- Système de litiges avec preuves photos
- Notation et avis sur les livreurs/vendeurs

### 🏪 Espace Vendeur
- Tableau de bord avec statistiques
- Gestion du catalogue produits (CRUD)
- Suivi des commandes et validation
- Gestion des stocks et historique des prix

### 🛵 Espace Livreur
- Liste des livraisons assignées
- Mise à jour du statut de livraison
- Gestion des preuves de collecte
- Gestion des disponibilités

### 🔐 Espace Admin
- Dashboard complet avec métriques
- Gestion des utilisateurs (activer/suspendre)
- Suivi de toutes les commandes et litiges
- Gestion des marchés et catégories
- Tableau des signalements

---

## 🚀 Installation

### Prérequis
- Node.js ≥ 18
- MariaDB
- npm ou yarn

### Backend

```bash
cd backend
npm install
```

Configurer l'environnement :

```bash
# .env
DATABASE_URL="mysql://vitecomm:ViteComm@2026!@localhost:3306/vitecomm"
JWT_SECRET="vitecomm-secret-key"
PORT=5000
```

Migrer et peupler la base :

```bash
npx prisma migrate dev
node prisma/seed.js
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Comptes de Test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Admin** | `admin@vitecomm.com` | `admin123` |
| **Client** | `immaculee@gmail.com` | `password123` |
| **Client** | `adela.agbeke0@gmail.com` | `password123` |
| **Vendeur** | `adela.agbeke0@shop.com` | `password123` |
| **Vendeur** | `bodjona.koudjo1@shop.com` | `password123` |
| **Livreur** | `vincent.aboubakar0@express.com` | `password123` |
| **Livreur** | `karl.toko1@express.com` | `password123` |

> **Note :** Les comptes de test sont générés aléatoirement par le seed. Utilisez les emails ci-dessus pour vous connecter.

---

## 🌐 Démo en Ligne

👉 **https://vitecomm.vercel.app/**

> L'application est déployée sur Vercel. Le backend est accessible en mode démo avec des données de test pré-remplies.

---

## 📁 Structure du Projet

```
ViteComm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Modèle de données
│   │   └── seed.js            # Script de peuplement
│   └── src/
│       ├── index.js            # Point d'entrée Express
│       └── routes/             # Routes API
├── frontend/
│   ├── src/
│   │   ├── components/         # Composants React réutilisables
│   │   ├── pages/              # Pages par rôle
│   │   ├── contexts/           # Contextes React (auth, panier)
│   │   └── utils/              # Fonctions utilitaires
│   └── public/
├── model/
│   ├── architecture.html       # Documentation Merise & UML
│   └── diags/                  # Diagrammes UML
├── docs/
│   ├── screenshots/            # Captures d'application
│   └── diagrams/               # Diagrammes d'architecture
├── LICENSE.txt
└── README.md
```

---

## 📄 Licence

Ce projet est un logiciel **propriétaire**. Voir [LICENSE.txt](LICENSE.txt) pour les conditions d'utilisation.

---

<div align="center">

**Projet de Mémoire ESGIS 2026**

Développé avec ❤️ par Lionel Nkoulou

</div>
