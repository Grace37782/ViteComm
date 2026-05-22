# Guide de Développement Frontend - ViteComm

Ce guide est destiné à **Grace** (Développement Frontend React) et rédigé par **Lionel** (Développement Backend Node.js). Il liste de manière superficielle l'ensemble des sections et écrans de l'interface utilisateur (UI) de l'application **ViteComm**, structurés selon les spécifications d'architecture et les diagrammes UML (cas d'utilisation, classes et activités).

L'objectif de ce document est de servir de feuille de route pour la création des routes, des composants et de la navigation, sans entrer dans le détail des champs ou du comportement précis de chaque formulaire pour le moment.

---

## 1. Espace Commun (Authentification & Profil)

Ces écrans sont accessibles à tous les utilisateurs selon leur rôle respectif.

- **Page d'Accueil Générale (Landing Page)** : Présentation de la plateforme ViteComm.
- **Écran de Connexion (Login)** : Authentification unique (Administrateur, Client, Vendeur, Livreur).
- **Écran d'Inscription (Sign-up)** :
  - Inscription Client.
  - Inscription Vendeur.
  - Inscription Livreur.
- **Gestion du Profil** : Mise à jour des informations de compte de base (nom, prénom, téléphone, email).

---

## 2. Espace Client (Acheteur)

Espace dédié à la recherche, à l'achat de produits et au suivi des commandes.

- **Tableau de Bord Client (Accueil Client)** :
  - Barre de recherche de produits et catégories.
  - Liste des marchés locaux.
  - Consultation des catalogues de produits des différents vendeurs.
- **Gestion du Panier (Shopping Cart)** :
  - Liste des articles ajoutés (possibilité de commander chez plusieurs vendeurs simultanément).
  - Gestion des quantités par article.
- **Tunnel de Commande (Checkout)** :
  - Formulaire de saisie/validation de l'adresse de livraison.
  - Écran de sélection du livreur (affichage des réputations et types de véhicules).
  - Résumé financier de la commande (marchandises, frais de livraison, commission).
- **Suivi des Commandes en Cours (Order Tracking)** :
  - Suivi de l'état de la livraison.
  - Affichage du code de vérification unique (à communiquer au livreur).
- **Gestion des Rejets et Retours (Product Rejects)** :
  - Interface de rejet individuel ou partiel d'un produit lors de la livraison (calcul des frais de retour).
- **Historique des Commandes terminées** : Liste de tous les achats passés.
- **Évaluation et Feedback (Reviews)** :
  - Écran d'évaluation du produit et du vendeur.
  - Écran d'évaluation du transport (note du livreur).
- **Formulaire de Signalement (Report Form)** : Possibilité de signaler un autre utilisateur (vendeur ou livreur).

---

## 3. Espace Vendeur (Commerçant)

Espace dédié à la gestion des produits, du stock et des ventes.

- **Tableau de Bord Vendeur (Dashboard)** :
  - Vue d'ensemble des ventes, des revenus réels (déduction faite de la commission de 0,6 % et des produits rejetés).
  - Affichage du score de réputation du vendeur.
- **Gestion du Catalogue de Produits (Product Management / CRUD)** :
  - Écran d'ajout d'un produit.
  - Écran de modification d'un produit existant.
  - Liste et statut du stock disponible.
- **Gestion des Commandes Vendeur (Order Collection)** :
  - Liste des commandes clients contenant des produits du vendeur.
  - Suivi du statut de collecte (statut_collecte_vendeur).
  - Écran de validation de la remise des articles (saisie du code de vérification unique fourni par le livreur).
  - Module d'enregistrement et d'envoi de la preuve photographique obligatoire.
- **Gestion des Retours (Returned Products)** : Liste des articles retournés/rejetés par les clients à récupérer.
- **Formulaire de Signalement (Report Form)** : Possibilité de signaler un client ou un livreur.

---

## 4. Espace Livreur (Logistique)

Espace mobile-first dédié à la prise en charge et à la livraison physique des marchandises.

- **Tableau de Bord Livreur (Driver Dashboard)** :
  - Résumé des courses effectuées et des gains associés.
  - Affichage du score de réputation du livreur.
- **Gestion des Courses Disponibles (Delivery Marketplace)** : Liste des commandes en attente d'affectation à un livreur.
- **Étape de Collecte (Pick-up Flow)** :
  - Liste des vendeurs chez qui récupérer les articles pour la commande en cours.
  - Écran de validation de la preuve photographique obligatoire pour chaque vendeur.
  - Saisie du code de validation vendeur pour confirmer la prise en charge.
- **Étape de Livraison (Delivery Flow & Cash on Delivery)** :
  - Adresse et informations de contact du client.
  - Interface d'encaissement du paiement à la livraison (COD).
  - Interface de gestion en direct des rejets de produits par le client (mise à jour dynamique des montants et frais de retour).
  - Validation de fin de livraison.
- **Formulaire de Signalement (Report Form)** : Possibilité de signaler un client ou un vendeur.

---

## 5. Espace Administrateur (Modération & Analytics)

Espace de contrôle global de la plateforme, avec respect de la confidentialité des clients (RGPD).

- **Tableau de Bord Administrateur (Admin Dashboard)** :
  - Statistiques globales de vente et commissions prélevées.
  - Liste des produits les plus vendus / les plus rejetés.
- **Gestion des Comptes Utilisateurs (User Administration)** :
  - Liste et recherche globale des utilisateurs (Vendeurs, Livreurs, Administrateurs, et infos de base des Clients).
  - *Note : Conformément au RGPD, aucun accès à l'historique d'achat ou de navigation privé des clients n'est visible ici.*
  - Module de bannissement et suspension définitive des vendeurs ou livreurs.
- **Centre de Gestion des Signalements (Universal Moderation)** :
  - Liste centralisée de tous les signalements émis sur la plateforme.
  - Outils d'action corrective (sanctions, suspensions de comptes de tous types).
- **Gestion et Arbitrage des Litiges (Dispute Center)** :
  - Liste des litiges ouverts suite à des non-conformités ou rejets.
  - Interface de décision administrative (arbitrage, validation de remboursement).
