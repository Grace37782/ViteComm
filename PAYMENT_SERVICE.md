# ViteComm Payment Service — Implementation Plan

## Do We Actually Need This?

**Short answer: Yes, but as an option — not a replacement.**

### The Problem With Pure COD

ViteComm is currently 100% Cash on Delivery. Here's what that means in practice:

| Risk | Who bears it | What happens |
|------|-------------|--------------|
| Client rejects all items at the door | Vendor + Driver | Driver wasted a trip, vendor prepared for nothing |
| Client doesn't have cash ready | Driver | Driver waits, re-delivers later |
| Client pays cash, vendor doesn't record it | Platform | Commission lost, no audit trail |
| Dispute after payment | Everyone | No digital trail to resolve it |

In Benin's market context, COD works — but it's fragile. The **platform has zero leverage** once goods leave the vendor.

### What Online Payment Solves

1. **Client commitment** — When someone pays 5,000 FCFA via MoMo before delivery, they show up. Rejection rates drop.
2. **Vendor confidence** — Vendors know payment is secured before preparing goods.
3. **Platform commission** — The 0.6% commission can be deducted automatically instead of being a polite suggestion.
4. **Refund mechanism** — If items are rejected during inspection, you can refund digitally instead of hoping the vendor returns cash.
5. **Audit trail** — Every CFA is tracked from client to vendor to platform.

### Why NOT to go all-in on online payment

- COD is the **norm** in Benin. Many customers trust cash-in-hand more than mobile payments.
- Not everyone has MoMo/Moov configured for payments.
- The inspection flow (accept/reject items) means you can't charge the full amount upfront without a refund mechanism.

**The sweet spot: Offer Mobile Money as an alternative at checkout. Keep COD as default.**

---

## Where Payment Fits in the Current Flow

```
CURRENT FLOW (no change to this):
  Client places order → Driver collects → Driver delivers → Client inspects
  → Facture created → Vendor records COD payment

NEW: ADD AN ALTERNATIVE PATH
  Client places order → [CHOOSE: COD or Mobile Money]
    → If Mobile Money: Redirect to FedaPay → Webhook confirms → Order proceeds
    → If COD: Same as today
```

**Integration point**: After order creation, before delivery starts. The client selects payment method at checkout (in `SelectionLivreur.jsx`).

**Payment triggers**:
- Client selects "Mobile Money" at checkout
- Order is created with `mode_paiement: 'MOBILE_MONEY'` (new field on `Commande`)
- Client is redirected to FedaPay hosted checkout page
- Client pays on FedaPay (enters phone, confirms USSD prompt)
- FedaPay sends webhook → ViteComm backend confirms payment
- Order status updates → Delivery proceeds normally

---

## Implementation Plan (Based on CuniApp's FedaPay Pattern)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                          │
│                                                             │
│  SelectionLivreur.jsx                                      │
│    ├── Payment method selector (COD / MoMo / Moov)        │
│    ├── Phone number input (for MoMo)                      │
│    └── "Confirmer et payer" button                        │
│          │                                                  │
│          ├── If COD → POST /api/client/orders (as today)  │
│          └── If MoMo → POST /api/client/orders            │
│                    → POST /api/client/payment/initiate     │
│                    → Redirect to FedaPay checkout          │
│                                                             │
│  PaiementClient.jsx (NEW)                                  │
│    └── Shows transaction status, retry button             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js)                      │
│                                                             │
│  /api/client/payment/initiate   POST                       │
│    → Creates PaiementTransaction record                    │
│    → Calls FedaPay API to create checkout URL             │
│    → Returns { checkout_url }                              │
│                                                             │
│  /api/webhooks/fedapay           POST                      │
│    → Verifies HMAC signature                               │
│    → On transaction.approved:                              │
│        → Updates PaiementTransaction.status = 'completed' │
│        → Updates Commande.mode_paiement_status = 'paye'   │
│        → Creates Paiement record                           │
│        → Updates Facture.statut_paiement = 'Paye'         │
│                                                             │
│  /api/client/payment/status/:id  GET                       │
│    → Returns current payment status for polling           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    FEDAPAY (External)                        │
│                                                             │
│  POST /v1/transactions                                     │
│    → Returns checkout_url                                  │
│                                                             │
│  Webhook POST /webhooks/fedapay                             │
│    → transaction.approved → activate payment               │
│    → transaction.declined → mark failed                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Changes

### New Model: `PaiementTransaction`

```prisma
model PaiementTransaction {
  id_paiement_transaction Int      @id @default(autoincrement())
  id_user_client          Int
  id_commande             Int
  montant                 Float
  devise                  String   @default("XOF")
  mode_paiement           String   // "momo", "moov", "celtis"
  telephone               String?
  transaction_id          String   @unique  // Internal ID (TXN-XXXXX)
  fedapay_transaction_id  String?          // FedaPay's ID
  statut                  String   @default("pending")  // pending, completed, failed, cancelled
  provider                String   @default("fedapay")
  provider_response       Json?
  failure_reason          String?
  paid_at                 DateTime?
  created_at              DateTime @default(now())
  updated_at              DateTime @updatedAt

  client  Client  @relation(fields: [id_user_client], references: [id_user], onDelete: Cascade)
  commande Commande @relation(fields: [id_commande], references: [id_commande], onDelete: Cascade)
}
```

### New Model: `PendingPayment`

```prisma
model PendingPayment {
  id_pending_payment Int      @id @default(autoincrement())
  payment_id         String   @unique  // FedaPay transaction ID
  type               String   @default("order")
  data               Json
  user_id            Int
  status             String   @default("pending")
  expires_at         DateTime?
  created_at         DateTime @default(now())
  updated_at         DateTime @updatedAt
}
```

### Alter `Commande` — Add payment fields

```prisma
model Commande {
  // ... existing fields ...
  mode_paiement        String?   // "ESPECES" (COD) or "MOBILE_MONEY"
  mode_paiement_status String?   // "en_attente", "paye", "echoue"
  paiementTransactions PaiementTransaction[]
}
```

### Alter `Facture` — Already has `statut_paiement`, no change needed

### Settings table entries (via admin panel or seed)

```
fedapay_public_key       = "pk_test_xxxx"
fedapay_secret_key       = "sk_test_xxxx"
fedapay_environment      = "sandbox"
fedapay_webhook_secret   = "whsec_xxxx"
```

---

## API Endpoints

### New Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/client/payment/initiate` | Client | Create FedaPay transaction, return checkout URL |
| GET | `/api/client/payment/status/:id` | Client | Poll payment status |
| POST | `/api/webhooks/fedapay` | None (HMAC verified) | Receive payment confirmation from FedaPay |
| GET | `/api/client/payment/callback` | None | User redirect after FedaPay checkout |

### Modified Endpoints

| Endpoint | Change |
|----------|--------|
| `POST /api/client/orders` | Accept optional `mode_paiement` field |
| `POST /api/vendor/factures/:id/payment` | Handle MOBILE_MONEY mode (already supports `mode_reglement`) |

---

## Backend Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/services/fedapayService.js` | FedaPay API client (initiate payment, verify webhook signature) |
| `src/controllers/paymentController.js` | Payment initiation, webhook handler, callback, status check |
| `src/routes/paymentRoutes.js` | Client payment routes + webhook route |
| `prisma/migrations/XXXX_add_payment_models.sql` | Migration for new tables |

### Modified Files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add PaiementTransaction, PendingPayment, alter Commande |
| `src/index.js` | Register payment routes |
| `src/routes/clientRoutes.js` | Add payment initiate/status routes |
| `src/controllers/clientController.js` | Modify createOrder to accept mode_paiement |
| `src/routes/index.js` | Add webhook route (no auth middleware) |

---

## Frontend Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/pages/client/PaiementClient.jsx` | Payment status page (shows pending/failed/success) |

### Modified Files

| File | Change |
|------|--------|
| `src/pages/client/SelectionLivreur.jsx` | Add payment method selector (COD / MoMo / Moov) |
| `src/App.jsx` | Add route for PaiementClient |
| `src/components/client/BottomNav.jsx` | No change needed |

---

## FedaPay Integration Details (from CuniApp)

### Phone Number Format (Benin)

```
Local:      01XXXXXXXX  →  +22901XXXXXXXX
International: +22901XXXXXXXX  →  +22901XXXXXXXX
```

### FedaPay API Call

```javascript
// POST https://sandbox-api.fedapay.com/v1/transactions
{
  "description": "Commande ViteComm #12345",
  "amount": 12500,
  "currency: { "iso": "XOF" },
  "reference": "TXN-A1B2C3D4E5F6",
  "callback_url": "https://yourdomain.com/api/webhooks/fedapay",
  "return_url": "https://yourdomain.com/client/paiement?ref=TXN-A1B2C3D4E5F6",
  "customer": {
    "firstname": "Kofi",
    "lastname": "Agbéké",
    "email": "kofi@example.com",
    "phone_number": { "number": "+229019700000", "country": "BJ" }
  }
}
```

### Webhook Signature Verification

```javascript
// X-FEDAPAY-SIGNATURE: t=TIMESTAMP,s=HMAC_SHA256
// Verify: HMAC-SHA256(secret, "timestamp.payload") === signature
// Reject if timestamp is > 5 minutes old
```

---

## Payment Flow (Detailed)

### Step 1: Client selects Mobile Money at checkout

In `SelectionLivreur.jsx`, after clicking "Confirmer":
- If `mode_paiement === 'MOBILE_MONEY'`:
  1. POST `/api/client/orders` with `{ id_user_livreur, items, mode_paiement: 'MOBILE_MONEY' }`
  2. On success, POST `/api/client/payment/initiate` with `{ id_commande, mode_paiement, telephone }`
  3. Receive `{ checkout_url }` from backend
  4. Redirect: `window.location.href = checkout_url`

### Step 2: Client pays on FedaPay

- Client enters phone number on FedaPay hosted page
- Confirms USSD prompt on phone
- FedaPay processes payment

### Step 3: Webhook confirms (server-to-server)

FedaPay sends POST to `/api/webhooks/fedapay`:
- Verify HMAC signature
- Find `PaiementTransaction` by reference
- If `transaction.approved`:
  - Update transaction status → `completed`
  - Create `Paiement` record on the Facture
  - Update `Facture.statut_paiement` → `Paye`
  - Update `Commande.mode_paiement_status` → `paye`

### Step 4: Client redirect callback

After FedaPay, client is redirected to `/client/paiement?ref=TXN-XXXXX`:
- Page shows: "Paiement confirmé! Votre commande est en cours de traitement."
- Or if failed: "Échec du paiement. Réessayer."

### Step 5: Delivery proceeds as normal

From this point, the order follows the same flow:
- Driver accepts → Collects → Delivers → Client inspects → Done

---

## What Stays the Same

- **Inspection flow** — Client still inspects items, rejects if needed
- **Refund mechanism** — If items are rejected, vendor records a manual refund (or future feature)
- **COD option** — Still available for clients who prefer cash
- **Vendor payment recording** — Still works for COD payments
- **Driver flow** — Completely unchanged

---

## Migration Strategy

1. **Phase 1**: Add models + FedaPay service + webhook endpoint (backend only)
2. **Phase 2**: Add payment method selector on checkout (frontend)
3. **Phase 3**: Add payment status page + callback handling
4. **Phase 4**: Sandbox testing with FedaPay test keys
5. **Phase 5**: Production keys + admin settings panel

---

## Security Checklist

- [x] Webhook signature verification (HMAC-SHA256)
- [x] CSRF exemption on webhook endpoint only
- [x] Pessimistic locking on transaction processing (from CuniApp pattern)
- [x] Idempotent webhook handling (duplicate events ignored)
- [x] Timestamp validation (reject webhooks > 5 min old)
- [x] User ownership verification on all payment operations
- [x] Phone number normalization before API call
- [x] Environment variable for keys (not hardcoded)

---

## Estimated Effort

| Phase | Scope | Effort |
|-------|-------|--------|
| Phase 1 | Backend models + FedaPay service + webhook | Medium |
| Phase 2 | Frontend payment selector | Small |
| Phase 3 | Payment status page + callback | Small |
| Phase 4 | Testing | Small |
| Phase 5 | Production deploy | Trivial |
| **Total** | | **Medium** |

---

## Decision Point

**Option A: Full implementation (as described above)**
- Adds Mobile Money payment at checkout
- COD remains as default option
- Requires FedaPay account + API keys
- Most value, most work

**Option B: Vendor subscription model (like CuniApp)**
- Vendors pay for platform access via MoMo
- Different from order payments
- Recurring revenue model
- Separate feature entirely

**Option C: Commission collection only**
- Platform collects 0.6% commission via FedaPay
- Vendors pay commission digitally instead of it being tracked but uncollected
- Narrower scope, still adds payment infrastructure

**My recommendation: Option A.** It's the natural fit for an e-commerce marketplace and addresses the real pain points (delivery failures, audit trail, vendor confidence).
