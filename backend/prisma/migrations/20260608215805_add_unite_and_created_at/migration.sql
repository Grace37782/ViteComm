-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Produit" (
    "id_produit" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prix_reference" REAL NOT NULL,
    "stock_disponible" INTEGER NOT NULL,
    "unite" TEXT NOT NULL DEFAULT 'kg',
    "id_user_vendeur" INTEGER NOT NULL,
    "id_categorie" INTEGER NOT NULL,
    "photo_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Produit_id_user_vendeur_fkey" FOREIGN KEY ("id_user_vendeur") REFERENCES "Vendeur" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Produit_id_categorie_fkey" FOREIGN KEY ("id_categorie") REFERENCES "Categorie" ("id_categorie") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Produit" ("description", "id_categorie", "id_produit", "id_user_vendeur", "nom", "photo_url", "prix_reference", "stock_disponible") SELECT "description", "id_categorie", "id_produit", "id_user_vendeur", "nom", "photo_url", "prix_reference", "stock_disponible" FROM "Produit";
DROP TABLE "Produit";
ALTER TABLE "new_Produit" RENAME TO "Produit";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
