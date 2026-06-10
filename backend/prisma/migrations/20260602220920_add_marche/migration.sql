-- CreateTable
CREATE TABLE "Marche" (
    "id_marche" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "image_url" TEXT,
    "description" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vendeur" (
    "id_user" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom_etablissement" TEXT NOT NULL,
    "localisation_marche" TEXT NOT NULL,
    "id_marche" INTEGER,
    "score_reputation" REAL NOT NULL DEFAULT 0.0,
    CONSTRAINT "Vendeur_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "Utilisateur" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vendeur_id_marche_fkey" FOREIGN KEY ("id_marche") REFERENCES "Marche" ("id_marche") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Vendeur" ("id_user", "localisation_marche", "nom_etablissement", "score_reputation") SELECT "id_user", "localisation_marche", "nom_etablissement", "score_reputation" FROM "Vendeur";
DROP TABLE "Vendeur";
ALTER TABLE "new_Vendeur" RENAME TO "Vendeur";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Marche_nom_key" ON "Marche"("nom");
