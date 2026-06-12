-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Utilisateur" (
    "id_user" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mot_de_passe" TEXT NOT NULL,
    "statut_compte" TEXT NOT NULL DEFAULT 'Actif',
    "est_admin" BOOLEAN NOT NULL DEFAULT false,
    "photo_url" TEXT,
    "auth_provider" TEXT NOT NULL DEFAULT 'local'
);
INSERT INTO "new_Utilisateur" ("email", "est_admin", "id_user", "mot_de_passe", "nom", "photo_url", "prenom", "statut_compte", "telephone") SELECT "email", "est_admin", "id_user", "mot_de_passe", "nom", "photo_url", "prenom", "statut_compte", "telephone" FROM "Utilisateur";
DROP TABLE "Utilisateur";
ALTER TABLE "new_Utilisateur" RENAME TO "Utilisateur";
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
