# Massive Seed Data Plan

## Target Counts

| Model | Current | Target | Notes |
|-------|---------|--------|-------|
| Marche | 4 | 8 | Add 4 more Benin markets |
| Categorie | 3 | 6 | Add more product types |
| Utilisateur | 10 | ~85 | 20 clients + 50 vendors + 10 drivers + admin |
| Client | 2 | 20 | |
| Vendeur | 5 | 50 | Distributed across 8 markets |
| Livreur | 2 | 10 | |
| Produit | 8 | ~200 | 4 products per vendor average |
| Commande | ~52 | ~300 | Mix of statuses |
| Facture | ~42 | ~250 | |
| Paiement | ~30 | ~200 | Mix of ESPECES and MOBILE_MONEY |
| Feedback | ~30 | ~150 | |
| Litige | ~20 | ~40 | |

## New Markets (4 additional)

| Market | City | Lat | Lon |
|--------|------|-----|-----|
| Marche Missèbo | Cotonou | 6.3600 | 2.4250 |
| Marche Togba | Abomey-Calavi | 6.4400 | 2.3500 |
| Marche Aklakou | Porto-Novo | 6.4900 | 2.6300 |
| Marche Djègbanjè | Sèmè-Kpodji | 6.3100 | 2.5900 |

## New Categories (3 additional)

| Category | Description |
|----------|-------------|
| Tubercules & Racines | Igname, manioc, taro, patate douce |
| Fruits | Mangue, ananas, banane, agrumes |
| Proteines Animales | Poisson, crevette, poulet, boeuf |

## Structure of the Script

Keep the existing seed.js pattern but massively expand:

1. **Cleanup** — same cascade order
2. **Categories** — 6 total
3. **Markets** — 8 total (keep 4 + add 4)
4. **Users + Clients** — 20 clients with Beninese names
5. **Users + Vendors** — 50 vendors distributed across 8 markets (6-7 per market)
6. **Users + Drivers** — 10 drivers
7. **Products** — 4 per vendor = ~200 products across categories
8. **Price history** — 1-2 entries per product
9. **Orders** — ~300 orders with varied statuses (En attente, Validee, Livree, Echec)
10. **Deliveries** — 1:1 with orders
11. **Details** — 2-4 items per order
12. **Factures** — for delivered orders
13. **Paiements** — mix of ESPECES and MOBILE_MONEY
14. **Feedbacks** — for ~50% of delivered orders
15. **Litiges** — ~40 disputes
16. **Signalements** — ~10 reports
17. **Bons** — for delivered orders

## Helper Function Approach

Create bulk generation loops instead of hardcoded individual records:
- `generateClients(20)` — Beninese names, Cotonou addresses
- `generateVendors(50)` — distribution across markets
- `generateProducts(vendors, categories)` — 4 per vendor
- `generateOrders(clients, drivers, products)` — varied statuses

## File to Modify

`/home/lionel/Documents/1_Software_Dev/ViteComm/backend/prisma/seed.js`

Complete rewrite — keep same patterns but use loops + arrays of Beninese names.

---

## FedaPay Visual Testing Guide

### Step 1: Start backend
```bash
cd backend && npm run dev
```

### Step 2: Start frontend
```bash
cd frontend && npm run dev
```

### Step 3: Login as client
- Go to `http://localhost:5173/connect`
- Email: `immaculee@gmail.com` / Password: `password123`

### Step 4: Place an order with Mobile Money
1. Browse to a market (`/client/accueil` → click a market)
2. Add products to cart
3. Go to cart → click "Passer la commande"
4. Select a driver
5. **Select "Mobile Money"** payment method
6. Enter phone number: `0197000000` (FedaPay test number)
7. Click "Confirmer et payer"
8. **Expected:** Redirect to FedaPay sandbox checkout page

### Step 5: Complete payment on FedaPay
- On FedaPay sandbox page, enter the test phone number
- Confirm the payment
- **Expected:** Redirect back to `/client/paiement?ref=TXN-XXXXX&status=success`

### Step 6: Verify webhook
- Check backend console for webhook received log
- Check database: `PaiementTransaction.statut` should be `completed`
- Check `Facture.statut_paiement` should be `Paye`

### Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Client | immaculee@gmail.com | password123 |
| Client | pierre.kamdem@yahoo.com | password123 |
| Vendeur | samuel.eto@boutique.com | password123 |
| Admin | admin@vitecomm.com | admin123 |

### FedaPay Sandbox Test Numbers
- Phone: `0197000000` (or any `01XXXXXXXX` format)
- The sandbox will simulate payment approval automatically
