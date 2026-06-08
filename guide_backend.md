# Guide de Développement Backend — ViteComm (Architecture MVC)

Ce document sert de feuille de route pour l'architecture **backend MVC** de ViteComm. Il liste l'intégralité des fichiers, leur rôle, les endpoints exposés et les règles de gestion (RG) implémentées.

---

## Architecture Générale

```
backend/
├── prisma/
│   ├── schema.prisma          # Modèle de données (16 entités + 3 tables pivot)
│   ├── seed.js                # Peuplement DB de démonstration
│   └── migrations/            # Migrations Prisma générées
├── src/
│   ├── index.js               # Point d'entrée Express (montage des routes, middlewares globaux)
│   ├── config/
│   │   └── db.js              # Instance PrismaClient (adaptateur Better-SQLite3)
│   ├── middleware/
│   │   ├── auth.js            # requireAuth + requireRole (JWT, vérification statut, déduction du rôle)
│   │   └── upload.js          # Multer config (avatars, images marchés — upload temporaire puis permanent)
│   ├── services/
│   │   └── mail.js            # Nodemailer (envoi code vérification + réinitialisation mot de passe)
│   ├── controllers/
│   │   ├── authController.js  # Authentification & Profil
│   │   ├── clientController.js
│   │   ├── vendeurController.js
│   │   ├── livreurController.js
│   │   └── adminController.js
│   └── routes/
│       ├── authRoutes.js
│       ├── clientRoutes.js
│       ├── vendeurRoutes.js
│       ├── livreurRoutes.js
│       └── adminRoutes.js
```

---

## 1. Point d'Entrée — `src/index.js`

Monte les 5 routeurs sur les préfixes suivants :
| Routeur | Préfixe |
|---|---|
| `authRoutes` | `/api/auth` |
| `clientRoutes` | `/api/client` |
| `vendeurRoutes` | `/api/vendor` |
| `livreurRoutes` | `/api/driver` |
| `adminRoutes` | `/api/admin` |

---

## 2. Modèle de Données — `prisma/schema.prisma`

17 modèles (SQLite via Better-SQLite3) :

| Modèle | Clé / Particularité |
|---|---|
| `Utilisateur` | Table pivot rôles : `client?`, `vendeur?`, `livreur?`. `est_admin` pour admin. |
| `Client` | FK → `Utilisateur`. Lien 1:1 → `Panier`, 1:N → `Commande`, `Feedback`. |
| `Vendeur` | FK → `Utilisateur`. Lien 1:N → `Produit`, `Feedback`. Score réputation. |
| `Livreur` | FK → `Utilisateur`. Lien 1:N → `Livraison`, `DisponibiliteLivreur`. Score réputation. |
| `DisponibiliteLivreur` | FK → `Livreur`. Historique des disponibilités (RG29). |
| `Marche` | Marchés locaux avec coordonnées GPS. Lié aux `Vendeur`. |
| `Categorie` | Catégories de produits. Lié aux `Produit`. |
| `Produit` | FK → `Vendeur`, `Categorie`. Lien 1:N → `DetailCommande`, `DetailPanier`, `HistoriquePrix`. |
| `Panier` | FK → `Client` (unique). Lien 1:N → `DetailPanier`. |
| `DetailPanier` | PK composite `(id_panier, id_produit)`. |
| `Commande` | FK → `Client`. Lien 1:1 → `Livraison`, 1:N → `DetailCommande`, `PreuveCollecte`, `Facture`. |
| `DetailCommande` | PK composite `(id_commande, id_produit)`. FK → `Litige?`, `Feedback?`. |
| `Livraison` | FK → `Commande` (unique), `Livreur`. Lien 1:N → `Litige`, `Feedback`, `BonDeLivraison`. |
| `PreuveCollecte` | FK → `Commande`. Lien 1:N → `MediaPreuve`, `Litige`. |
| `MediaPreuve` | FK → `PreuveCollecte`. |
| `Litige` | FK → `Livraison`, `PreuveCollecte?`. Lien 1:N → `DetailCommande`. |
| `Feedback` | FK → `Client`, `Livraison?`, `Vendeur?`. Lien 1:N → `DetailCommande`. |
| `Signalement` | FK → `Utilisateur` (auteur), `Utilisateur` (cible). |
| `HistoriquePrix` | FK → `Produit`. Traçabilité des prix (RG24). |
| `Facture` | FK → `Commande`. 1:N → `Paiement`. |
| `Paiement` | FK → `Facture`. |
| `VerificationToken` | Token + code à 6 chiffres pour inscription email. |
| `PasswordResetToken` | Token + code pour réinitialisation mot de passe. |
| `BonDeLivraison` | FK → `Livraison`. Reçu de livraison signé (RG27). |

---

## 3. Middleware

### `src/middleware/auth.js`
- **`requireAuth`** : Vérifie le Bearer JWT, charge l'utilisateur, contrôle `statut_compte`, déduit le rôle (RG17), attache `req.user`.
- **`requireRole([...])`** : Vérifie que `req.user.role` est parmi les rôles autorisés.

### `src/middleware/upload.js`
- **`uploadAvatar`** : Multer → `uploads/avatars/temp/` → `moveToPermanent()` vers `uploads/avatars/`.
- **`uploadMarketImage`** : Multer → `uploads/markets/temp/` → `moveMarketImage()` vers `uploads/markets/`.

---

## 4. Services

### `src/services/mail.js`
- `sendVerificationCode(email, code, prenom)` : Email HTML avec code 6 chiffres (inscription).
- `sendPasswordResetCode(email, code, prenom)` : Email HTML avec code 6 chiffres (reset password).

---

## 5. Routes & Controllers — Par Espace

### 5.1. Authentification & Profil — `authRoutes.js` (prefixe: `/api/auth`)

| Méthode | Endpoint | Controller | Guide Frontend | Description |
|---|---|---|---|---|
| POST | `/register` | `register` | §1.3 Inscription | Étape 1 : validation champs → envoi code email → stocke `VerificationToken` |
| POST | `/verify-email` | `verifyEmail` | §1.3 Inscription | Étape 2 : vérification code → création `Utilisateur` + spécialisation + JWT |
| POST | `/resend-code` | `resendCode` | §1.3 Inscription | Renvoi d'un nouveau code (prolonge l'expiration) |
| POST | `/login` | `login` | §1.2 Connexion | Auth par email/téléphone + mot de passe → JWT + profil complet |
| POST | `/google` | `googleAuth` | §1.2 Connexion | Google OAuth (création auto si nouveau) |
| POST | `/forgot-password` | `forgotPassword` | — | Envoi code reset par email |
| POST | `/reset-password` | `resetPassword` | — | Validation code + nouveau mot de passe |
| GET | `/markets` | `getMarkets` | §1.3 Inscription | Liste des marchés pour le select d'inscription |
| GET | `/profile` | `getProfile` | §1.4 Profil | Profil complet (lecture seule) |
| PUT | `/profile` | `updateProfile` | §1.4 Profil | Édition profil + champs spécifiques au rôle |
| DELETE | `/logout` | `logout` | §1.4 Déconnexion | Déconnexion (stateless — client vide le token) |

**Logique clé** :
- `deriveRole()` : admin si aucune spécialisation, sinon client/vendeur/livreur (RG17).
- `buildUserPayload()` : construit le payload API avec les champs spécifiques au rôle (score_reputation en lecture seule pour vendeur/livreur — RG15).
- Inscription en 2 étapes : pas d'utilisateur en DB avant validation email.

---

### 5.2. Espace Client — `clientRoutes.js` (prefixe: `/api/client`)

| Méthode | Endpoint | Controller | Guide Frontend | Description |
|---|---|---|---|---|
| GET | `/products` | `getProducts` | §2.1 Accueil Client | Produits filtrés (search, marche, vendeur_id, stock > 0) |
| GET | `/products/:id_produit/price-history` | `getProductPriceHistory` | §2.1 Accueil Client | Historique des prix d'un produit (RG24) |
| GET | `/markets` | `getMarkets` | §2.1 Accueil Client | Liste des marchés avec compteur vendeurs |
| GET | `/markets/:id` | `getMarketById` | §2.1 Accueil Client | Marché détaillé avec vendeurs et produits |
| GET | `/vendors` | `getVendors` | §2.1 Accueil Client | Vendeurs actifs triés par réputation |
| GET | `/vendors/:id` | `getVendorById` | §2.1 Accueil Client | Détail d'un vendeur |
| GET | `/categories` | `getCategories` | §2.1 Accueil Client | Catégories avec compteur produits |
| GET | `/drivers` | `getDrivers` | §2.3 Checkout | Livreurs disponibles (RG05, RG19, RG29) |
| GET | `/cart` | `getCart` | §2.2 Panier | Panier du client (regroupé par vendeur) |
| POST | `/cart/item` | `upsertCartItem` | §2.2 Panier | Ajouter/modifier/supprimer ligne panier |
| DELETE | `/cart` | `clearCart` | §2.2 Panier | Vider le panier |
| POST | `/orders` | `createOrder` | §2.3 Checkout | Création commande (multi-vendeurs, choix livreur, RG01/05/08/22/24) |
| GET | `/orders` | `getMyOrders` | §2.4 Suivi | Commandes du client avec timeline |
| POST | `/feedbacks` | `createFeedback` | §2.6 Évaluation | Création feedback LIVREUR/VENDEUR (RG10/15/20/23) |
| POST | `/signalements` | `createSignalement` | §2.7 Signalement | Signalement (RG14) |

**Logique clé** :
- `createOrder` : transaction complète → déduction stock, gel prix (RG24), code vérification (RG06), commission 0.6% (RG08), création livraison, vidage panier (RG22).
- `createFeedback` : met à jour `score_reputation` du livreur ou vendeur (RG10, RG15).
- `getDrivers` : filtre par dernière disponibilité active dans `DisponibiliteLivreur` (RG29).

---

### 5.3. Espace Vendeur — `vendeurRoutes.js` (prefixe: `/api/vendor`)

| Méthode | Endpoint | Controller | Guide Frontend | Description |
|---|---|---|---|---|
| GET | `/dashboard` | `getVendorDashboard` | §3.1 Dashboard | Revenu brut, commissions (RG08), pertes (RG16), alertes stock |
| GET | `/products` | `getMyProducts` | §3.2 Catalogue | Produits du vendeur avec historique prix |
| POST | `/products` | `createProduct` | §3.2 Catalogue | Création produit + enregistrement prix initial (RG24) |
| PUT | `/products/:id` | `updateProduct` | §3.2 Catalogue | Modification produit + log si prix changé (RG24) |
| DELETE | `/products/:id` | `deleteProduct` | §3.2 Catalogue | Suppression produit |
| GET | `/orders` | `getVendorOrders` | §3.3 Commandes | Commandes contenant les produits du vendeur |
| POST | `/orders/:id_commande/verify-handover` | `verifyHandover` | §3.3 Collecte | Validation remise : code vérification (RG06) + preuve photo (RG07) |
| GET | `/returns` | `getVendorReturns` | §3.4 Retours | Articles rejetés (RG16) |
| POST | `/signalements` | `createSignalement` | §3.5 Signalement | Signalement (RG14) |

**Logique clé** :
- `verifyHandover` : vérifie le code de vérification, crée `PreuveCollecte` + `MediaPreuve`, avance le statut commande à "En transit" si tous les vendeurs ont validé.
- `getVendorDashboard` : calcule `total_brut`, `total_pertes` (articles Rejete), commission 0.6%, `gains_nets`.

---

### 5.4. Espace Livreur — `livreurRoutes.js` (prefixe: `/api/driver`)

| Méthode | Endpoint | Controller | Guide Frontend | Description |
|---|---|---|---|---|
| GET | `/dashboard` | `getDriverDashboard` | §4.1 Dashboard | Gains, courses, réputation, dispo (RG19) |
| PUT | `/availability` | `updateAvailability` | §4.1 Dashboard | Crée enregistrement `DisponibiliteLivreur` (RG29) |
| GET | `/deliveries/available` | `getAvailableDeliveries` | §4.2 Marketplace | Commandes en attente sans livreur (RG05) |
| GET | `/deliveries` | `getMyDeliveries` | §4.2 Marketplace | Livraisons assignées (actives + historique) |
| POST | `/deliveries/:id_commande/finalize` | `finalizeDelivery` | §4.4 Livraison | Finalisation face-à-face (RG06/08/09/16/21) |
| POST | `/signalements` | `createSignalement` | §4.5 Signalement | Signalement (RG14) |

**Logique clé** :
- `finalizeDelivery` : transaction → marque chaque ligne Acceptée/Rejetée (RG09), crée `Litige` pour les rejetés (RG21), recalcule les frais, met à jour le statut, marque le livreur disponible via `DisponibiliteLivreur` (RG29).

---

### 5.5. Espace Administrateur — `adminRoutes.js` (prefixe: `/api/admin`)

| Méthode | Endpoint | Controller | Guide Frontend | Description |
|---|---|---|---|---|
| GET | `/dashboard` | `getAdminDashboard` | §5.1 Dashboard | Stats (ventes, commissions, RG08), leaderboards (RG12), alertes |
| GET | `/me` | `getAdminMe` | — | Profil de l'admin connecté |
| PUT | `/profile` | `updateAdminProfile` | — | Mise à jour profil admin |
| GET | `/markets` | `getMarketsAdmin` | §5.5 Marchés | Liste marchés |
| POST | `/markets` | `createMarket` | §5.5 Marchés | Création marché |
| PUT | `/markets/:id` | `updateMarket` | §5.5 Marchés | Modification marché |
| DELETE | `/markets/:id` | `deleteMarket` | §5.5 Marchés | Suppression marché |
| GET | `/users` | `getUsers` | §5.2 Utilisateurs | Tous les utilisateurs (sans mot de passe) |
| GET | `/users/:id_user/details` | `getUserDetails` | §5.2 Utilisateurs | Détail complet : infos, feedbacks, données rôle (RG11/12/15) |
| GET | `/users/:id_user/catalogue` | `getVendorCatalogue` | §5.2 Utilisateurs | Catalogue complet d'un vendeur (RG12) |
| PUT | `/users/:id_user/status` | `updateUserStatus` | §5.2 Modération | Suspendre/Bannir (RG13) |
| DELETE | `/users/:id_user` | `deleteUser` | §5.2 Modération | Supprimer compte (RG13) |
| GET | `/products` | `getAllProducts` | §5.5 Produits | Tous les produits plateforme |
| GET | `/products/:id_produit/price-history` | `getPriceHistory` | §5.5 Produits | Historique prix audit (RG24) |
| GET | `/signalements` | `getSignalements` | §5.3 Signalements | Liste signalements |
| PUT | `/signalements/:id_signalement` | `updateSignalementStatus` | §5.3 Signalements | Traiter un signalement |
| GET | `/litiges` | `getLitiges` | §5.4 Litiges | Liste litiges avec preuves |
| PUT | `/litiges/:id_litige/resolve` | `resolveLitige` | §5.4 Litiges | Arbitrage (RG09/16/21) |

**Logique clé** :
- `getAdminDashboard` : construit les leaderboards (vendeurs par CA, livreurs par volume, clients par achats).
- `getUserDetails` : affiche les feedbacks reçus, les données spécifiques au rôle (catalogue pour vendeur, livraisons pour livreur, commandes pour client sans détail privé — RG11).
- `resolveLitige` : met à jour le statut, enregistre décision + montant, recalcule réputation des vendeurs concernés.

---

## 6. Règles de Gestion (RG) Implémentées

| RG | Description | Localisation |
|---|---|---|
| RG01 | Panier multi-vendeurs dans une seule transaction | `clientController.createOrder` |
| RG02 | Dashboard vendeur : stats financières, réputation | `vendeurController.getVendorDashboard` |
| RG03 | Propriété exclusive des offres (produit → vendeur) | `vendeurController` (CRUD filtré par `id_user_vendeur`) |
| RG04 | Résumé financier dynamique au checkout | `clientController.createOrder` |
| RG05 | Attribution unique d'un livreur à une commande | `clientController.createOrder`, `livreurController.getAvailableDeliveries` |
| RG06 | Code de vérification unique pour remise/livraison | `vendeurController.verifyHandover`, `livreurController.finalizeDelivery` |
| RG07 | Preuve photographique obligatoire à la collecte | `vendeurController.verifyHandover`, `mediaPreuve` |
| RG08 | Commission plateforme 0.6%, paiement COD | `createOrder`, `getVendorDashboard`, `getAdminDashboard` |
| RG09 | Rejet granulaire d'articles individuels | `livreurController.finalizeDelivery` |
| RG10 | Mise à jour score de réputation via feedbacks | `clientController.createFeedback` |
| RG11 | Confidentialité stricte client (admin voit pas l'historique) | `adminController.getUserDetails` (safeUser) |
| RG12 | Analaytiques admin : classements et produits | `adminController.getAdminDashboard` |
| RG13 | Modération : suspendre/bannir/supprimer comptes | `adminController.updateUserStatus`, `deleteUser` |
| RG14 | Signalement universel par tout rôle | `createSignalement` dans client/vendeur/livreur/admin |
| RG15 | Score réputation visible (lecture seule) pour vendeur/livreur uniquement | `authController.buildUserPayload` |
| RG16 | Pertes/recalcul financier pour articles rejetés | `vendeurController.getVendorReturns`, `livreurController.finalizeDelivery` |
| RG17 | Dérivation du rôle : admin par défaut sans spécialisation | `authController.deriveRole` |
| RG18 | Atomicité du détail : rejet par ligne dans `DetailCommande` | `livreurController.finalizeDelivery` |
| RG19 | Paramètres de disponibilité livreur | `livreurController.updateAvailability`, `getDriverDashboard` |
| RG20 | Création litige + feedback après livraison | `livreurController.finalizeDelivery`, `clientController.createFeedback` |
| RG21 | Litige lié à Livraison, détail commande lié à Litige | `livreurController.finalizeDelivery` |
| RG22 | Panier verrouillé → commande, panier vidé | `clientController.createOrder` |
| RG23 | Évaluation séparée livreur/vendeur par le client | `clientController.createFeedback` |
| RG24 | Historique des prix tracé à chaque modification | `vendeurController.createProduct`, `updateProduct`, `clientController.getProductPriceHistory` |
| RG25 | Génération automatique de facture | `prisma/schema.prisma` (modèle Facture) |
| RG26 | Paiement à la livraison (COD) | `livreurController.finalizeDelivery` |
| RG27 | Bon de livraison signé | `prisma/schema.prisma` (modèle BonDeLivraison) |
| RG29 | Disponibilité livreur dans table historique `DisponibiliteLivreur` | `livreurController`, `clientController.getDrivers` |

---

## 7. Peuplement de la Base — `prisma/seed.js`

Comptes de test créés :

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@vitecomm.com | admin123 |
| Client | immaculee@gmail.com | password123 |
| Client | pierre.kamdem@yahoo.com | password123 |
| Vendeur | samuel.eto@boutique.com | password123 |
| Vendeur | rigobert.song@shop.com | password123 |
| Vendeur | jean.kamga@shop.com | password123 |
| Vendeur | marie.ngo@shop.com | password123 |
| Vendeur | marc.tchinda@shop.com | password123 |
| Livreur | vincent.aboubakar@express.com | password123 |
| Livreur | karl.toko@delivery.com | password123 |

Données de démonstration :
- 4 marchés locaux (Dantokpa, Ganhi, Saint Michel, Ouando)
- 3 catégories, 8 produits avec historiques de prix
- 2 commandes (1 livrée acceptée, 1 litige)
- 2 signalements
- Facture + paiement + bon de livraison pour la commande livrée
