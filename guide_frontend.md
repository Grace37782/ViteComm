# Guide de Développement Frontend - ViteComm

Ce guide est destiné à **Grace** (Développement Frontend React) et rédigé par **Lionel** (Développement Backend Node.js). Il liste de manière superficielle l'ensemble des sections et écrans de l'interface utilisateur (UI) de l'application **ViteComm**, structurés selon les spécifications d'architecture et les diagrammes UML (cas d'utilisation, classes et activités).

L'objectif de ce document est de servir de feuille de route pour la création des routes, des composants et de la navigation, sans entrer dans le détail des champs ou du comportement précis de chaque formulaire pour le moment.

---

## 1. Espace Commun (Authentification & Profil)

Ces écrans constituent la porte d'entrée de l'application et sont partagés par l'ensemble des acteurs (Clients, Vendeurs, Livreurs et Administrateurs).

### 1.1. Page d'Accueil Générale (Landing Page)
* **Éléments à afficher :**
  - Section de présentation dynamique de la plateforme **ViteComm** (liaison directe entre acheteurs locaux, commerçants de marchés et livreurs indépendants).
  - Navigation principale claire avec boutons d'accès vers la **Connexion** et l'**Inscription**.
  - Raccourcis visuels expliquant les 3 rôles métiers (Acheter en tant que Client, Vendre en tant que Vendeur, Livrer en tant que Livreur).

### 1.2. Écran de Connexion (Login)
* **Champs présents à l'écran (basé sur l'entité `UTILISATEUR`) :**
  - **Identifiant :** Saisie de l'adresse `email` ou du numéro de `telephone`.
  - **Mot de passe :** Saisie sécurisée (masquée).
* **Comportement et logique frontend :**
  - **Validation des champs :** Vérification en temps réel du format de l'adresse email (si saisie) et de la présence obligatoire du mot de passe.
  - **Gestion du statut du compte (`statut_compte`) :** Si le backend renvoie un statut suspendu/banni (ex : suite à un signalement), l'interface doit bloquer la connexion et afficher un message d'erreur clair indiquant la suspension.
  - **Redirection par Rôle :** Une fois l'authentification validée par le backend, l'application redirige automatiquement l'utilisateur vers son espace dédié :
    - Sans rôle spécialisé (rôle administrateur par défaut dans `UTILISATEUR`) : Redirection vers **l'Espace Administrateur**.
    - Rôle Client : Redirection vers **l'Espace Client**.
    - Rôle Vendeur : Redirection vers **l'Espace Vendeur**.
    - Rôle Livreur : Redirection vers **l'Espace Livreur**.

### 1.3. Écran d'Inscription (Sign-up)
* **Structure générale :** Un formulaire unifié ou à onglets permettant de choisir explicitement le type de profil à créer.
* **Champs par type de profil (basés sur les entités MLD) :**
  1. **Tronc commun (obligatoire pour tous - Entité `UTILISATEUR`) :**
     - `nom` (Nom de famille)
     - `prenom` (Prénom)
     - `telephone` (Numéro de téléphone portable)
     - `email` (Adresse email unique)
     - `mot_de_passe` (Saisie + confirmation pour vérification)
  2. **Champs spécifiques au CLIENT :**
     - `adresse_livraison` (Saisie de l'adresse physique complète ou sélection géographique)
  3. **Champs spécifiques au VENDEUR :**
     - `nom_etablissement` (Nom de la boutique ou du stand)
     - `localisation_marche` (Sélection parmi une liste de marchés locaux ou saisie textuelle)
  4. **Champs spécifiques au LIVREUR :**
     - `type_vehicule` (Sélection : Moto, Tricycle, Voiture, etc.)
     - `immatriculation` (Numéro de plaque minéralogique du véhicule)
* **Comportement et logique frontend :**
  - **Validation en temps réel :** 
    - Validation du format email.
    - Vérification de la correspondance des deux champs de mot de passe.
    - Limitation numérique et format du numéro de téléphone.
  - **Comportement post-inscription :** Redirection vers la page de connexion avec affichage d'un toast/notification de succès, ou connexion automatique immédiate vers le tableau de bord associé au rôle créé.
  - **Valeurs par défaut (reflétées à l'UI) :** Le compte est créé avec un `statut_compte` à "Actif", et les scores de réputation des vendeurs et livreurs sont initialisés à zéro.

### 1.4. Gestion du Profil & Informations Personnelles
* **Éléments présents à l'écran :**
  - Formulaire affichant les attributs de l'entité `UTILISATEUR` (`nom`, `prenom`, `telephone`, `email`) pré-remplis.
  - Affichage des champs spécifiques selon le rôle connecté (ex : l'adresse de livraison pour un Client).
  - **Indicateurs non modifiables (Lecture seule) :**
    - Pour les **Vendeurs** et **Livreurs** : Affichage très visible du `score_reputation` (attribut d'évaluation métier).
    - Pour les **Clients** : Pas de score de réputation affiché (conformément à la règle **RG15**).
* **Comportement et logique frontend :**
  - **Mode Lecture / Édition :** Par défaut, les champs sont en lecture seule. Un bouton "Modifier le profil" permet d'activer les champs éditables.
  - **Validation de mise à jour :** Même niveau de validation que pour l'inscription.
  - **Bouton de déconnexion (Logout) :** Déconnexion propre, nettoyage du token d'authentification (ex : localStorage/cookies) et redirection immédiate vers la Landing Page.


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
