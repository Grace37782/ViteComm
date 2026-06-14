# ViteComm — Plan d'implémentation complet

> Basé sur l'analyse du code existant vs. `model/architecture.html` (RG01–RG31)

---

## Phase 1 — Fix UI Livreur ✅

- [x] **`LivreurLayout.jsx`** : Corriger le body qui ne remplit pas l'écran
  - Ajouté `flex flex-col` sur le conteneur principal
  - Ajouté `<main className="flex-1">` autour de `<Outlet />`

---

## Phase 2 — Produits Vendeur (Photos + Catégories) ✅

### 2.1 Photo de produit dans le formulaire vendeur
- [x] Ajouté champ `<input type="file">` dans `FormProduit` avec preview
- [x] Upload via `FormData` vers `POST /vendor/products/:id/photo` après création
- [x] Affichage photo miniature dans la liste vendeur (déjà existant)
- [x] Bouton supprimer/changer la photo

### 2.2 Afficher les photos produits côté client
- [x] **`Catalogue.jsx`** : Photo produit avec fallback emoji
- [x] **`MarcheDetail.jsx`** : Photos dans la grille de produits

### 2.3 Catégories diversifiées (seed)
- [x] 13 catégories : Alimentation + Vêtements + Électronique + Maison + Santé + Beauté + Scolaire + Outillage
- [x] ~130 produits diversifiés dans les templates

**Fichiers modifiés :**
- `frontend/src/pages/vendeur/Catalogues.jsx`
- `frontend/src/pages/client/Catalogue.jsx`
- `frontend/src/pages/client/MarcheDetail.jsx`
- `backend/prisma/seed.js`
- `backend/src/controllers/vendeurController.js`

---

## Phase 3 — Système QR Code & Vérification (RG06) ✅

### 3.1 Backend : Génération QR Code
- [x] Installé `qrcode` dans `backend/`
- [x] Endpoint `GET /api/client/orders/:id/qrcode` → retourne data URL
- [x] Protégé par auth (client propriétaire uniquement)

### 3.2 Frontend : Affichage QR côté client
- [x] **`SuiviCommande.jsx`** : Modal QR code + code affiché
- [x] Bouton "Afficher le QR code" (si statut = En attente/Validée/En cours de collecte)

### 3.3 Frontend : Scan QR côté livreur
- [x] Installé `html5-qrcode` dans `frontend/`
- [x] **`Commandes.jsx` (livreur)** : Scanner QR à la collecte
- [x] Saisie manuelle du code en alternative

### 3.4 Backend : Vérification du code à la collecte
- [x] **`livreurController.js`** : `collectDelivery` vérifie `code_verification === commande.code_verification`
- [x] Retourne 400 si code invalide

**Fichiers modifiés :**
- `backend/package.json` (+ qrcode)
- `frontend/package.json` (+ html5-qrcode)
- `backend/src/controllers/clientController.js`
- `backend/src/routes/clientRoutes.js`
- `frontend/src/pages/client/SuiviCommande.jsx`
- `frontend/src/pages/livreur/Commandes.jsx`
- `backend/src/controllers/livreurController.js`

---

## Phase 4 — Photos de Preuve (RG07, RG31) ✅

### 4.1 Backend : Config multer pour preuves
- [x] **`livreurRoutes.js`** : `uploadProof` existait déjà (images + vidéos, 10 Mo)
- [x] **`clientRoutes.js`** : Ajouté `uploadProof` pour inspection

### 4.2 Backend : Collecte avec preuve photo (livreur)
- [x] **`livreurController.js`** : `collectDelivery` gère `req.files` + crée `PreuveCollecte` + `MediaPreuve`

### 4.3 Frontend : Preuve photo livreur à la collecte
- [x] **`Commandes.jsx` (livreur)** : Modal collecte avec upload photos de preuve
- [x] Upload via `FormData` vers `POST /livreur/deliveries/:id/collect`

### 4.4 Backend : Inspection client avec preuve photo
- [x] **`clientController.js`** : `inspectionOrder` gère `req.files` → crée `PreuveCollecte` + `MediaPreuve`

### 4.5 Frontend : Preuve photo client à l'inspection
- [x] **`Inspection.jsx`** : Envoie les vrais fichiers via `FormData` (plus d'objectURLs)

**Fichiers modifiés :**
- `backend/src/routes/clientRoutes.js`
- `backend/src/controllers/clientController.js`
- `frontend/src/pages/livreur/Commandes.jsx`
- `frontend/src/pages/client/Inspection.jsx`

---

## Phase 5 — Fix Statuts de Commande ✅

### 5.1 Statut "Inspectee"
- [x] **`clientController.js`** : Inspection met `Commande.statut = "Inspectee"` et `Livraison.statut_livraison = "Inspectee"`
- [x] **`SuiviCommande.jsx`** : Le step "Inspectée" est maintenant atteint

### 5.2 Fix race condition livreur finalize vs client inspection
- [x] **`livreurController.js`** : `finalizeDelivery` ne crée PLUS la facture
- [x] Seul le client crée la facture via `inspectionOrder`
- [x] Le livreur finalise → statut "Inspectee" + `BonDeLivraison`

### 5.3 Statut "Annulee"
- [x] Endpoint `POST /api/client/orders/:id/cancel` ajouté
- [x] Restaure le stock, annule la livraison, uniquement si "En attente" ou "Validee"
- [x] Bouton "Annuler" dans `SuiviCommande.jsx` (si éligible)

**Fichiers modifiés :**
- `backend/src/controllers/clientController.js`
- `backend/src/controllers/livreurController.js`
- `backend/src/routes/clientRoutes.js`
- `frontend/src/pages/client/SuiviCommande.jsx`

---

## Dépendances npm installées

```bash
# Backend
cd backend && npm install qrcode

# Frontend
cd frontend && npm install html5-qrcode
```

---

## Résumé des modifications

**Phase 1** — 1 fichier
**Phase 2** — 5 fichiers (frontend: 3, backend: 2)
**Phase 3** — 7 fichiers (frontend: 2, backend: 5)
**Phase 4** — 4 fichiers (frontend: 2, backend: 2)
**Phase 5** — 4 fichiers (frontend: 1, backend: 3)

**Total : ~20 fichiers modifiés**

---

## Notes importantes

- La table `PreuveCollecte` + `MediaPreuve` existe déjà dans le schéma Prisma
- L'endpoint `uploadProductPhoto` existe déjà dans `vendeurController.js` (maintenant appelé)
- Le middleware `uploadProof` dans `livreurRoutes.js` supporte déjà `req.files`
- Le champ `code_verification` est déjà généré à la création de commande
- Les statuts `Inspectee` sont maintenant correctement gérés dans le backend
- Le flow complet est : En attente → Validee → En cours de collecte → Collectee → Inspectee → Livree
