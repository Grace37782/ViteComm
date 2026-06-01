/*
  Warnings:

  - You are about to drop the `PhotoPreuve` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `distance_marche` on the `Livreur` table. All the data in the column will be lost.
  - You are about to drop the column `est_disponible` on the `Livreur` table. All the data in the column will be lost.
  - You are about to drop the column `heure_debut_dispo` on the `Livreur` table. All the data in the column will be lost.
  - You are about to drop the column `heure_fin_dispo` on the `Livreur` table. All the data in the column will be lost.
  - Added the required column `id_categorie` to the `Produit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN "photo_url" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PhotoPreuve";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "DisponibiliteLivreur" (
    "id_dispo" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date_mise_a_jour" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "est_disponible" BOOLEAN NOT NULL DEFAULT true,
    "distance_marche" REAL NOT NULL DEFAULT 0.0,
    "heure_debut_dispo" TEXT,
    "heure_fin_dispo" TEXT,
    "id_user_livreur" INTEGER NOT NULL,
    CONSTRAINT "DisponibiliteLivreur_id_user_livreur_fkey" FOREIGN KEY ("id_user_livreur") REFERENCES "Livreur" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Categorie" (
    "id_categorie" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom_categorie" TEXT NOT NULL,
    "description_categorie" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "MediaPreuve" (
    "id_media" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url_media" TEXT NOT NULL,
    "type_media" TEXT NOT NULL DEFAULT 'photo',
    "id_preuve" INTEGER NOT NULL,
    CONSTRAINT "MediaPreuve_id_preuve_fkey" FOREIGN KEY ("id_preuve") REFERENCES "PreuveCollecte" ("id_preuve") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Facture" (
    "id_facture" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date_emission" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montant_marchandises" REAL NOT NULL,
    "montant_frais_livraison" REAL NOT NULL,
    "montant_frais_retour" REAL NOT NULL DEFAULT 0.0,
    "montant_commission" REAL NOT NULL DEFAULT 0.0,
    "montant_total_du" REAL NOT NULL,
    "statut_paiement" TEXT NOT NULL DEFAULT 'En attente',
    "id_commande" INTEGER NOT NULL,
    CONSTRAINT "Facture_id_commande_fkey" FOREIGN KEY ("id_commande") REFERENCES "Commande" ("id_commande") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id_paiement" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date_paiement" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montant_percu" REAL NOT NULL,
    "mode_reglement" TEXT NOT NULL DEFAULT 'ESPECES',
    "reference_transaction" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'Effectue',
    "id_facture" INTEGER NOT NULL,
    CONSTRAINT "Paiement_id_facture_fkey" FOREIGN KEY ("id_facture") REFERENCES "Facture" ("id_facture") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BonDeLivraison" (
    "id_bon" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date_emission" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_signature_client" DATETIME,
    "statut_bon" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "observations_livreur" TEXT,
    "id_livraison" INTEGER NOT NULL,
    CONSTRAINT "BonDeLivraison_id_livraison_fkey" FOREIGN KEY ("id_livraison") REFERENCES "Livraison" ("id_livraison") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Livreur" (
    "id_user" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type_vehicule" TEXT NOT NULL,
    "immatriculation" TEXT NOT NULL,
    "score_reputation" REAL NOT NULL DEFAULT 0.0,
    CONSTRAINT "Livreur_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "Utilisateur" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Livreur" ("id_user", "immatriculation", "score_reputation", "type_vehicule") SELECT "id_user", "immatriculation", "score_reputation", "type_vehicule" FROM "Livreur";
DROP TABLE "Livreur";
ALTER TABLE "new_Livreur" RENAME TO "Livreur";
CREATE TABLE "new_Produit" (
    "id_produit" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prix_reference" REAL NOT NULL,
    "stock_disponible" INTEGER NOT NULL,
    "id_user_vendeur" INTEGER NOT NULL,
    "id_categorie" INTEGER NOT NULL,
    "photo_url" TEXT,
    CONSTRAINT "Produit_id_user_vendeur_fkey" FOREIGN KEY ("id_user_vendeur") REFERENCES "Vendeur" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Produit_id_categorie_fkey" FOREIGN KEY ("id_categorie") REFERENCES "Categorie" ("id_categorie") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Produit" ("description", "id_produit", "id_user_vendeur", "nom", "prix_reference", "stock_disponible") SELECT "description", "id_produit", "id_user_vendeur", "nom", "prix_reference", "stock_disponible" FROM "Produit";
DROP TABLE "Produit";
ALTER TABLE "new_Produit" RENAME TO "Produit";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
