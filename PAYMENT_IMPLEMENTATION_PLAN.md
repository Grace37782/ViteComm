# ViteComm Payment Service — Implementation Plan

## Context

ViteComm currently has a hardcoded "Paiement a la livraison" (COD) flow. The user wants to understand COD as **online payment through the application** and implement FedaPay (Mobile Money) integration based on the CuniApp pattern.

**Current state:** Payment is tracked via `Facture` + `Paiement` models, but the client never pays through the app — vendors manually record cash payments after delivery.

**Target state:** Client selects payment method (COD default or Mobile Money) at checkout. If Mobile Money, client is redirected to FedaPay, payment is confirmed via webhook, and order proceeds.

---

## Phase 1: Backend — Database + FedaPay Service

### 1.1 Add `PaiementTransaction` model to Prisma schema

**File:** `backend/prisma/schema.prisma`

Add new model after `Paiement`:
```prisma
model PaiementTransaction {
  id_paiement_transaction Int      @id @default(autoincrement())
  id_user_client          Int
  id_commande             Int
  montant                 Float
  devise                  String   @default("XOF")
  mode_paiement           String   // "momo", "moov", "celtis"
  telephone               String?
  transaction_id          String   @unique  // Internal: TXN-XXXXX
  fedapay_transaction_id  String?
  statut                  String   @default("pending") // pending, completed, failed, cancelled
  provider                String   @default("fedapay")
  provider_response       Json?
  failure_reason          String?
  paid_at                 DateTime?
  created_at              DateTime @default(now())
  updated_at              DateTime @updatedAt

  client   Client   @relation(fields: [id_user_client], references: [id_user], onDelete: Cascade)
  commande Commande @relation(fields: [id_commande], references: [id_commande], onDelete: Cascade)
}
```

Alter `Commande` to add payment fields:
```prisma
model Commande {
  // ... existing fields ...
  mode_paiement        String?   // "ESPECES" or "MOBILE_MONEY"
  mode_paiement_status String?   // "en_attente", "paye", "echoue"
  paiementTransactions PaiementTransaction[]
}
```

### 1.2 Create FedaPay service

**File:** `backend/src/services/fedapayService.js` (NEW)

Port from CuniApp's `FedaPayService.php` to Node.js:
- `initiatePayment(transaction)` — POST to FedaPay `/v1/transactions`, return checkout URL
- `verifyWebhookSignature(payload, signatureHeader)` — HMAC-SHA256 verification
- Phone number normalization for Benin (+229 format)
- Config from env vars: `FEDAPAY_SECRET_KEY`, `FEDAPAY_WEBHOOK_SECRET`, `FEDAPAY_ENVIRONMENT`

### 1.3 Add FedaPay env vars

**File:** `backend/.env`

Add:
```
FEDAPAY_SECRET_KEY=sk_test_xxxx
FEDAPAY_WEBHOOK_SECRET=whsec_xxxx
FEDAPAY_ENVIRONMENT=sandbox
FEDAPAY_PUBLIC_KEY=pk_test_xxxx
```

---

## Phase 2: Backend — Payment Controller + Routes

### 2.1 Create payment controller

**File:** `backend/src/controllers/paymentController.js` (NEW)

Handlers:
- `initiatePayment(req, res)` — POST `/client/payment/initiate`
  - Validates order exists, belongs to client, has `mode_paiement: 'MOBILE_MONEY'`
  - Creates `PaiementTransaction` with status `pending`
  - Calls `fedapayService.initiatePayment()`
  - Returns `{ checkout_url }`

- `handleWebhook(req, res)` — POST `/webhooks/fedapay`
  - Verifies HMAC signature
  - Routes by event type: `transaction.approved`, `transaction.declined`, `transaction.canceled`
  - On approved: updates `PaiementTransaction.status = 'completed'`, creates `Paiement` record, updates `Facture.statut_paiement = 'Paye'`
  - Always returns 200

- `getPaymentStatus(req, res)` — GET `/client/payment/status/:id`
  - Returns current payment status for polling

- `handleCallback(req, res)` — GET `/client/payment/callback`
  - User redirect after FedaPay checkout
  - Reads payment status, redirects with flash message

### 2.2 Create payment routes

**File:** `backend/src/routes/paymentRoutes.js` (NEW)

```js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { initiatePayment, getPaymentStatus, handleCallback } from '../controllers/paymentController.js';
import { handleWebhook } from '../controllers/paymentController.js';

const router = Router();

// Client routes (authenticated)
router.post('/initiate', requireAuth, requireRole(['client']), initiatePayment);
router.get('/status/:id', requireAuth, requireRole(['client']), getPaymentStatus);
router.get('/callback', handleCallback);

// Webhook (no auth — verified by HMAC)
// This will be mounted separately at /api/webhooks/fedapay

export default router;
```

### 2.3 Register routes in index.js

**File:** `backend/src/index.js` (MODIFY)

- Import payment routes
- Add: `app.use('/api/client/payment', paymentRoutes)`
- Add webhook route BEFORE auth middleware: `app.post('/api/webhooks/fedapay', handleWebhook)`

---

## Phase 3: Backend — Order Creation Update

### 3.1 Modify `createOrder` in clientController.js

**File:** `backend/src/controllers/clientController.js` (MODIFY)

- Accept `mode_paiement` from request body (default: `'ESPECES'`)
- Set `Commande.mode_paiement` on creation
- If `mode_paiement === 'MOBILE_MONEY'`, return `{ id_commande, code_verification, requires_payment: true }`
- If `mode_paiement === 'ESPECES'`, return `{ id_commande, code_verification, requires_payment: false }` (as today)

---

## Phase 4: Frontend — Payment Method Selector

### 4.1 Modify SelectionLivreur.jsx

**File:** `frontend/src/pages/client/SelectionLivreur.jsx` (MODIFY)

Add payment method selector between driver selection and summary:
- State: `modePaiement` (default: `'ESPECES'`)
- Two option cards: "Paiement a la livraison" (ESPECES) and "Mobile Money" (MOBILE_MONEY)
- If Mobile Money selected: show phone number input + payment provider selector (MTN MoMo, Moov Pay)
- Update `confirmerCommande()`:
  - Include `mode_paiement` in POST body
  - If response `requires_payment === true`:
    - Call `POST /client/payment/initiate` with `{ id_commande, mode_paiement, telephone }`
    - Redirect to `checkout_url`

### 4.2 Create PaiementClient.jsx

**File:** `frontend/src/pages/client/PaiementClient.jsx` (NEW)

Payment status page shown after FedaPay redirect:
- Reads `ref` query param (transaction_id)
- Polls `GET /client/payment/status/:ref` every 3 seconds
- Shows: loading spinner → success (green) → redirect to suivi-commande
- Or: failure (red) → retry button

### 4.3 Add route in App.jsx

**File:** `frontend/src/App.jsx` (MODIFY)

Add: `<Route path="/client/paiement" element={<PaiementClient />} />`

---

## Phase 5: Frontend — Update COD References

### 5.1 Update Panier.jsx

**File:** `frontend/src/pages/client/Panier.jsx` (MODIFY)

Change the hardcoded "Paiement a la livraison" section to:
- "Choisissez votre mode de paiement a l'etape suivante"
- Remove the hardcoded Banknote badge

### 5.2 Update SelectionLivreur.jsx summary

**File:** `frontend/src/pages/client/SelectionLivreur.jsx` (MODIFY)

- Change "Total COD" to "Total a payer"
- Change footer "Vous payez X en especes a la reception" to dynamic text based on selected payment method

### 5.3 Update Accueil.jsx + Footer.jsx

**Files:** `frontend/src/pages/Accueil.jsx`, `frontend/src/components/Footer.jsx`

- Update "Paiement a la livraison" to "Paiement securise"
- Add "Mobile Money" to payment methods mentioned

---

## File Inventory

### New Files (5)
| File | Purpose |
|------|---------|
| `backend/src/services/fedapayService.js` | FedaPay API client |
| `backend/src/controllers/paymentController.js` | Payment handlers |
| `backend/src/routes/paymentRoutes.js` | Payment routes |
| `frontend/src/pages/client/PaiementClient.jsx` | Payment status page |

### Modified Files (7)
| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | Add PaiementTransaction, alter Commande |
| `backend/.env` | Add FEDAPAY_* vars |
| `backend/src/index.js` | Register payment routes + webhook |
| `backend/src/controllers/clientController.js` | Accept mode_paiement |
| `frontend/src/pages/client/SelectionLivreur.jsx` | Add payment selector |
| `frontend/src/pages/client/Panier.jsx` | Update COD text |
| `frontend/src/App.jsx` | Add payment route |

### Optionally Modified (cosmetic)
| File | Change |
|------|--------|
| `frontend/src/pages/Accueil.jsx` | Update payment text |
| `frontend/src/components/Footer.jsx` | Update payment text |

---

## Execution Order

1. **Phase 1** — Schema + FedaPay service + env vars
2. **Phase 2** — Payment controller + routes + register
3. **Phase 3** — Update createOrder
4. **Phase 4** — Frontend payment selector + status page
5. **Phase 5** — Update COD references
6. **Git commit** after each phase

---

## Commit Plan

| Commit | Content |
|--------|---------|
| 1 | `feat: add PaiementTransaction model + FedaPay service` |
| 2 | `feat: add payment controller + routes` |
| 3 | `feat: update createOrder to accept mode_paiement` |
| 4 | `feat: add payment method selector on checkout + payment status page` |
| 5 | `refactor: update COD references to generic payment text` |
