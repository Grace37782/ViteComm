-- CreateTable
CREATE TABLE "PaiementTransaction" (
    "id_paiement_transaction" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_user_client" INTEGER NOT NULL,
    "id_commande" INTEGER NOT NULL,
    "montant" REAL NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "mode_paiement" TEXT NOT NULL,
    "telephone" TEXT,
    "transaction_id" TEXT NOT NULL,
    "fedapay_transaction_id" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL DEFAULT 'fedapay',
    "provider_response" JSONB,
    "failure_reason" TEXT,
    "paid_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "PaiementTransaction_id_user_client_fkey" FOREIGN KEY ("id_user_client") REFERENCES "Client" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaiementTransaction_id_commande_fkey" FOREIGN KEY ("id_commande") REFERENCES "Commande" ("id_commande") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Commande" (
    "id_commande" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date_creation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'En attente',
    "total_marchandises" REAL NOT NULL,
    "frais_livraison" REAL NOT NULL,
    "commission" REAL NOT NULL DEFAULT 0.0,
    "code_verification" TEXT NOT NULL,
    "id_user_client" INTEGER NOT NULL,
    "mode_paiement" TEXT NOT NULL DEFAULT 'ESPECES',
    "mode_paiement_status" TEXT,
    CONSTRAINT "Commande_id_user_client_fkey" FOREIGN KEY ("id_user_client") REFERENCES "Client" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Commande" ("code_verification", "commission", "date_creation", "frais_livraison", "id_commande", "id_user_client", "statut", "total_marchandises") SELECT "code_verification", "commission", "date_creation", "frais_livraison", "id_commande", "id_user_client", "statut", "total_marchandises" FROM "Commande";
DROP TABLE "Commande";
ALTER TABLE "new_Commande" RENAME TO "Commande";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PaiementTransaction_transaction_id_key" ON "PaiementTransaction"("transaction_id");
