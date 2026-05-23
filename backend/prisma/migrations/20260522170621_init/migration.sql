-- CreateTable
CREATE TABLE "Utilisateur" (
    "id_user" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mot_de_passe" TEXT NOT NULL,
    "statut_compte" TEXT NOT NULL DEFAULT 'Actif'
);

-- CreateTable
CREATE TABLE "Client" (
    "id_user" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adresse_livraison" TEXT NOT NULL,
    CONSTRAINT "Client_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "Utilisateur" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vendeur" (
    "id_user" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom_etablissement" TEXT NOT NULL,
    "localisation_marche" TEXT NOT NULL,
    "score_reputation" REAL NOT NULL DEFAULT 0.0,
    CONSTRAINT "Vendeur_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "Utilisateur" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Livreur" (
    "id_user" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type_vehicule" TEXT NOT NULL,
    "immatriculation" TEXT NOT NULL,
    "score_reputation" REAL NOT NULL DEFAULT 0.0,
    CONSTRAINT "Livreur_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "Utilisateur" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Produit" (
    "id_produit" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prix_reference" REAL NOT NULL,
    "stock_disponible" INTEGER NOT NULL,
    "id_user_vendeur" INTEGER NOT NULL,
    CONSTRAINT "Produit_id_user_vendeur_fkey" FOREIGN KEY ("id_user_vendeur") REFERENCES "Vendeur" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Commande" (
    "id_commande" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date_creation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'En attente',
    "total_marchandises" REAL NOT NULL,
    "frais_livraison" REAL NOT NULL,
    "commission" REAL NOT NULL DEFAULT 0.0,
    "code_verification" TEXT NOT NULL,
    "id_user_client" INTEGER NOT NULL,
    CONSTRAINT "Commande_id_user_client_fkey" FOREIGN KEY ("id_user_client") REFERENCES "Client" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Livraison" (
    "id_livraison" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date_prise_en_charge" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_fin_reelle" DATETIME,
    "statut_livraison" TEXT NOT NULL DEFAULT 'En cours de collecte',
    "frais_retour_calcules" REAL NOT NULL DEFAULT 0.0,
    "id_commande" INTEGER NOT NULL,
    "id_user_livreur" INTEGER NOT NULL,
    CONSTRAINT "Livraison_id_commande_fkey" FOREIGN KEY ("id_commande") REFERENCES "Commande" ("id_commande") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Livraison_id_user_livreur_fkey" FOREIGN KEY ("id_user_livreur") REFERENCES "Livreur" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DetailCommande" (
    "id_commande" INTEGER NOT NULL,
    "id_produit" INTEGER NOT NULL,
    "id_user_vendeur" INTEGER NOT NULL,
    "quantite_commandee" INTEGER NOT NULL,
    "prix_vente_applique" REAL NOT NULL,
    "statut_acceptation" TEXT NOT NULL DEFAULT 'En attente',

    PRIMARY KEY ("id_commande", "id_produit", "id_user_vendeur"),
    CONSTRAINT "DetailCommande_id_commande_fkey" FOREIGN KEY ("id_commande") REFERENCES "Commande" ("id_commande") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DetailCommande_id_produit_fkey" FOREIGN KEY ("id_produit") REFERENCES "Produit" ("id_produit") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DetailCommande_id_user_vendeur_fkey" FOREIGN KEY ("id_user_vendeur") REFERENCES "Vendeur" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PreuveCollecte" (
    "id_preuve" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date_heure" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url_photo" TEXT NOT NULL,
    "statut_validation" TEXT NOT NULL DEFAULT 'En attente',
    "id_commande" INTEGER NOT NULL,
    "id_user_vendeur" INTEGER NOT NULL,
    CONSTRAINT "PreuveCollecte_id_commande_fkey" FOREIGN KEY ("id_commande") REFERENCES "Commande" ("id_commande") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PreuveCollecte_id_user_vendeur_fkey" FOREIGN KEY ("id_user_vendeur") REFERENCES "Vendeur" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Litige" (
    "id_litige" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "date_ouverture" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'Ouvert',
    "decision_admin" TEXT,
    "montant_rembourse" REAL NOT NULL DEFAULT 0.0,
    "id_commande" INTEGER NOT NULL,
    CONSTRAINT "Litige_id_commande_fkey" FOREIGN KEY ("id_commande") REFERENCES "Commande" ("id_commande") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id_feedback" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "note_produit" INTEGER NOT NULL,
    "note_transport" INTEGER NOT NULL,
    "commentaire" TEXT,
    "date_publication" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_commande" INTEGER NOT NULL,
    "id_user_client" INTEGER NOT NULL,
    CONSTRAINT "Feedback_id_commande_fkey" FOREIGN KEY ("id_commande") REFERENCES "Commande" ("id_commande") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Feedback_id_user_client_fkey" FOREIGN KEY ("id_user_client") REFERENCES "Client" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Signalement" (
    "id_signalement" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date_heure" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motif" TEXT NOT NULL,
    "statut_traitement" TEXT NOT NULL DEFAULT 'En attente',
    "type_cible_cible" TEXT NOT NULL,
    "id_auteur" INTEGER NOT NULL,
    "id_cible" INTEGER NOT NULL,
    CONSTRAINT "Signalement_id_auteur_fkey" FOREIGN KEY ("id_auteur") REFERENCES "Utilisateur" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Signalement_id_cible_fkey" FOREIGN KEY ("id_cible") REFERENCES "Utilisateur" ("id_user") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Livraison_id_commande_key" ON "Livraison"("id_commande");

-- CreateIndex
CREATE UNIQUE INDEX "Litige_id_commande_key" ON "Litige"("id_commande");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_id_commande_key" ON "Feedback"("id_commande");
