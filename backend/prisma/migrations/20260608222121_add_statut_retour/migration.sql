-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Litige" (
    "id_litige" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "date_ouverture" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'Ouvert',
    "statut_retour" TEXT NOT NULL DEFAULT 'a_recuperer',
    "decision_admin" TEXT,
    "montant_rembourse" REAL NOT NULL DEFAULT 0.0,
    "id_preuve" INTEGER,
    "id_livraison" INTEGER NOT NULL,
    CONSTRAINT "Litige_id_preuve_fkey" FOREIGN KEY ("id_preuve") REFERENCES "PreuveCollecte" ("id_preuve") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Litige_id_livraison_fkey" FOREIGN KEY ("id_livraison") REFERENCES "Livraison" ("id_livraison") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Litige" ("date_ouverture", "decision_admin", "description", "id_litige", "id_livraison", "id_preuve", "montant_rembourse", "statut") SELECT "date_ouverture", "decision_admin", "description", "id_litige", "id_livraison", "id_preuve", "montant_rembourse", "statut" FROM "Litige";
DROP TABLE "Litige";
ALTER TABLE "new_Litige" RENAME TO "Litige";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
