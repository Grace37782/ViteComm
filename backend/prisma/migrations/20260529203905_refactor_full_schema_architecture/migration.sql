/*
  Warnings:

  - The primary key for the `DetailCommande` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_user_vendeur` on the `DetailCommande` table. All the data in the column will be lost.
  - You are about to drop the column `id_commande` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `note_produit` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `note_transport` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `id_commande` on the `Litige` table. All the data in the column will be lost.
  - You are about to drop the column `id_user_vendeur` on the `PreuveCollecte` table. All the data in the column will be lost.
  - You are about to drop the column `url_photo` on the `PreuveCollecte` table. All the data in the column will be lost.
  - Added the required column `note` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type_feedback` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_livraison` to the `Litige` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Panier" (
    "id_panier" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date_creation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_mise_a_jour" DATETIME NOT NULL,
    "id_user_client" INTEGER NOT NULL,
    CONSTRAINT "Panier_id_user_client_fkey" FOREIGN KEY ("id_user_client") REFERENCES "Client" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DetailPanier" (
    "id_panier" INTEGER NOT NULL,
    "id_produit" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL,

    PRIMARY KEY ("id_panier", "id_produit"),
    CONSTRAINT "DetailPanier_id_panier_fkey" FOREIGN KEY ("id_panier") REFERENCES "Panier" ("id_panier") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DetailPanier_id_produit_fkey" FOREIGN KEY ("id_produit") REFERENCES "Produit" ("id_produit") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PhotoPreuve" (
    "id_photo" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url_photo" TEXT NOT NULL,
    "id_preuve" INTEGER NOT NULL,
    CONSTRAINT "PhotoPreuve_id_preuve_fkey" FOREIGN KEY ("id_preuve") REFERENCES "PreuveCollecte" ("id_preuve") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistoriquePrix" (
    "id_historique" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prix" REAL NOT NULL,
    "date_modification" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_produit" INTEGER NOT NULL,
    CONSTRAINT "HistoriquePrix_id_produit_fkey" FOREIGN KEY ("id_produit") REFERENCES "Produit" ("id_produit") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DetailCommande" (
    "id_commande" INTEGER NOT NULL,
    "id_produit" INTEGER NOT NULL,
    "quantite_commandee" INTEGER NOT NULL,
    "prix_vente_applique" REAL NOT NULL,
    "statut_acceptation" TEXT NOT NULL DEFAULT 'En attente',
    "id_litige" INTEGER,
    "id_feedback" INTEGER,

    PRIMARY KEY ("id_commande", "id_produit"),
    CONSTRAINT "DetailCommande_id_commande_fkey" FOREIGN KEY ("id_commande") REFERENCES "Commande" ("id_commande") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DetailCommande_id_produit_fkey" FOREIGN KEY ("id_produit") REFERENCES "Produit" ("id_produit") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DetailCommande_id_litige_fkey" FOREIGN KEY ("id_litige") REFERENCES "Litige" ("id_litige") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DetailCommande_id_feedback_fkey" FOREIGN KEY ("id_feedback") REFERENCES "Feedback" ("id_feedback") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DetailCommande" ("id_commande", "id_produit", "prix_vente_applique", "quantite_commandee", "statut_acceptation") SELECT "id_commande", "id_produit", "prix_vente_applique", "quantite_commandee", "statut_acceptation" FROM "DetailCommande";
DROP TABLE "DetailCommande";
ALTER TABLE "new_DetailCommande" RENAME TO "DetailCommande";
CREATE TABLE "new_Feedback" (
    "id_feedback" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "note" INTEGER NOT NULL,
    "commentaire" TEXT,
    "date_publication" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type_feedback" TEXT NOT NULL,
    "id_user_client" INTEGER NOT NULL,
    "id_livraison" INTEGER,
    "id_user_vendeur" INTEGER,
    CONSTRAINT "Feedback_id_user_client_fkey" FOREIGN KEY ("id_user_client") REFERENCES "Client" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Feedback_id_livraison_fkey" FOREIGN KEY ("id_livraison") REFERENCES "Livraison" ("id_livraison") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Feedback_id_user_vendeur_fkey" FOREIGN KEY ("id_user_vendeur") REFERENCES "Vendeur" ("id_user") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Feedback" ("commentaire", "date_publication", "id_feedback", "id_user_client") SELECT "commentaire", "date_publication", "id_feedback", "id_user_client" FROM "Feedback";
DROP TABLE "Feedback";
ALTER TABLE "new_Feedback" RENAME TO "Feedback";
CREATE TABLE "new_Litige" (
    "id_litige" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "date_ouverture" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'Ouvert',
    "decision_admin" TEXT,
    "montant_rembourse" REAL NOT NULL DEFAULT 0.0,
    "id_preuve" INTEGER,
    "id_livraison" INTEGER NOT NULL,
    CONSTRAINT "Litige_id_preuve_fkey" FOREIGN KEY ("id_preuve") REFERENCES "PreuveCollecte" ("id_preuve") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Litige_id_livraison_fkey" FOREIGN KEY ("id_livraison") REFERENCES "Livraison" ("id_livraison") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Litige" ("date_ouverture", "decision_admin", "description", "id_litige", "montant_rembourse", "statut") SELECT "date_ouverture", "decision_admin", "description", "id_litige", "montant_rembourse", "statut" FROM "Litige";
DROP TABLE "Litige";
ALTER TABLE "new_Litige" RENAME TO "Litige";
CREATE TABLE "new_Livreur" (
    "id_user" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type_vehicule" TEXT NOT NULL,
    "immatriculation" TEXT NOT NULL,
    "score_reputation" REAL NOT NULL DEFAULT 0.0,
    "est_disponible" BOOLEAN NOT NULL DEFAULT true,
    "distance_marche" REAL NOT NULL DEFAULT 0.0,
    "heure_debut_dispo" TEXT,
    "heure_fin_dispo" TEXT,
    CONSTRAINT "Livreur_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "Utilisateur" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Livreur" ("id_user", "immatriculation", "score_reputation", "type_vehicule") SELECT "id_user", "immatriculation", "score_reputation", "type_vehicule" FROM "Livreur";
DROP TABLE "Livreur";
ALTER TABLE "new_Livreur" RENAME TO "Livreur";
CREATE TABLE "new_PreuveCollecte" (
    "id_preuve" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date_heure" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut_validation" TEXT NOT NULL DEFAULT 'En attente',
    "id_commande" INTEGER NOT NULL,
    CONSTRAINT "PreuveCollecte_id_commande_fkey" FOREIGN KEY ("id_commande") REFERENCES "Commande" ("id_commande") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PreuveCollecte" ("date_heure", "id_commande", "id_preuve", "statut_validation") SELECT "date_heure", "id_commande", "id_preuve", "statut_validation" FROM "PreuveCollecte";
DROP TABLE "PreuveCollecte";
ALTER TABLE "new_PreuveCollecte" RENAME TO "PreuveCollecte";
CREATE TABLE "new_Utilisateur" (
    "id_user" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mot_de_passe" TEXT NOT NULL,
    "statut_compte" TEXT NOT NULL DEFAULT 'Actif',
    "est_admin" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Utilisateur" ("email", "id_user", "mot_de_passe", "nom", "prenom", "statut_compte", "telephone") SELECT "email", "id_user", "mot_de_passe", "nom", "prenom", "statut_compte", "telephone" FROM "Utilisateur";
DROP TABLE "Utilisateur";
ALTER TABLE "new_Utilisateur" RENAME TO "Utilisateur";
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Panier_id_user_client_key" ON "Panier"("id_user_client");
