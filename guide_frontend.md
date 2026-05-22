# Guide de Développement Frontend - ViteComm

Ce guide est destiné à **Grace** (Développement Frontend React) et rédigé par **Lionel** (Développement Backend Node.js). Il liste de manière superficielle l'ensemble des sections et écrans de l'interface utilisateur (UI) de l'application **ViteComm**, structurés selon les spécifications d'architecture et les diagrammes UML (cas d'utilisation, classes et activités).

L'objectif de ce document est de servir de feuille de route pour la création des routes, des composants et de la navigation, sans entrer dans le détail des champs ou du comportement précis de chaque formulaire pour le moment.

---

## 1. Espace Commun (Authentification & Profil)

Ces écrans constituent la porte d'entrée de l'application et sont partagés par l'ensemble des acteurs (Clients, Vendeurs, Livreurs et Administrateurs).

### 1.1. Page d'Accueil Générale (Landing Page)
* **Éléments à afficher :**
  - Section de présentation dynamique de la plateforme **ViteComm** (liaison directe entre acheteurs locaux, commerçants de marchés et livreurs indépendants).
  - Navigation principale claire avec boutons d'accès vers la **Connexion** et l'**Inscription**.
  - Raccourcis visuels expliquant les 3 rôles métiers (Acheter en tant que Client, Vendre en tant que Vendeur, Livrer en tant que Livreur).

### 1.2. Écran de Connexion (Login)
* **Champs présents à l'écran (basé sur l'entité `UTILISATEUR`) :**
  - **Identifiant :** Saisie de l'adresse `email` ou du numéro de `telephone`.
  - **Mot de passe :** Saisie sécurisée (masquée).
* **Comportement et logique frontend :**
  - **Validation des champs :** Vérification en temps réel du format de l'adresse email (si saisie) et de la présence obligatoire du mot de passe.
  - **Gestion du statut du compte (`statut_compte`) :** Si le backend renvoie un statut suspendu/banni (ex : suite à un signalement), l'interface doit bloquer la connexion et afficher un message d'erreur clair indiquant la suspension.
  - **Redirection par Rôle :** Une fois l'authentification validée par le backend, l'application redirige automatiquement l'utilisateur vers son espace dédié :
    - Sans rôle spécialisé (rôle administrateur par défaut dans `UTILISATEUR`) : Redirection vers **l'Espace Administrateur**.
    - Rôle Client : Redirection vers **l'Espace Client**.
    - Rôle Vendeur : Redirection vers **l'Espace Vendeur**.
    - Rôle Livreur : Redirection vers **l'Espace Livreur**.

### 1.3. Écran d'Inscription (Sign-up)
* **Structure générale :** Un formulaire unifié ou à onglets permettant de choisir explicitement le type de profil à créer.
* **Champs par type de profil (basés sur les entités MLD) :**
  1. **Tronc commun (obligatoire pour tous - Entité `UTILISATEUR`) :**
     - `nom` (Nom de famille)
     - `prenom` (Prénom)
     - `telephone` (Numéro de téléphone portable)
     - `email` (Adresse email unique)
     - `mot_de_passe` (Saisie + confirmation pour vérification)
  2. **Champs spécifiques au CLIENT :**
     - `adresse_livraison` (Saisie de l'adresse physique complète ou sélection géographique)
  3. **Champs spécifiques au VENDEUR :**
     - `nom_etablissement` (Nom de la boutique ou du stand)
     - `localisation_marche` (Sélection parmi une liste de marchés locaux ou saisie textuelle)
  4. **Champs spécifiques au LIVREUR :**
     - `type_vehicule` (Sélection : Moto, Tricycle, Voiture, etc.)
     - `immatriculation` (Numéro de plaque minéralogique du véhicule)
* **Comportement et logique frontend :**
  - **Validation en temps réel :** 
    - Validation du format email.
    - Vérification de la correspondance des deux champs de mot de passe.
    - Limitation numérique et format du numéro de téléphone.
  - **Comportement post-inscription :** Redirection vers la page de connexion avec affichage d'un toast/notification de succès, ou connexion automatique immédiate vers le tableau de bord associé au rôle créé.
  - **Valeurs par défaut (reflétées à l'UI) :** Le compte est créé avec un `statut_compte` à "Actif", et les scores de réputation des vendeurs et livreurs sont initialisés à zéro.

### 1.4. Gestion du Profil & Informations Personnelles
* **Éléments présents à l'écran :**
  - Formulaire affichant les attributs de l'entité `UTILISATEUR` (`nom`, `prenom`, `telephone`, `email`) pré-remplis.
  - Affichage des champs spécifiques selon le rôle connecté (ex : l'adresse de livraison pour un Client).
  - **Indicateurs non modifiables (Lecture seule) :**
    - Pour les **Vendeurs** et **Livreurs** : Affichage très visible du `score_reputation` (attribut d'évaluation métier).
    - Pour les **Clients** : Pas de score de réputation affiché (conformément à la règle **RG15**).
* **Comportement et logique frontend :**
  - **Mode Lecture / Édition :** Par défaut, les champs sont en lecture seule. Un bouton "Modifier le profil" permet d'activer les champs éditables.
  - **Validation de mise à jour :** Même niveau de validation que pour l'inscription.
  - **Bouton de déconnexion (Logout) :** Déconnexion propre, nettoyage du token d'authentification (ex : localStorage/cookies) et redirection immédiate vers la Landing Page.


---

## 2. Espace Client (Acheteur)

Espace dédié à la recherche, à l'achat de produits et au suivi des commandes.

### 2.1. Tableau de Bord Client (Accueil Client)
* **Éléments à afficher :**
  - Barre de recherche textuelle globale (filtre sur le `nom` et la `description` des produits).
  - Sélecteur/Filtre par marché local (`localisation_marche` des vendeurs).
  - Grille de produits sous forme de cartes (Cards) contenant : photo, nom du produit, prix de référence (`prix_reference`), nom de l'établissement du vendeur (`nom_etablissement`), et un indicateur visuel de la disponibilité du stock (`stock_disponible`).
* **Comportement et logique frontend :**
  - **Mise à jour en temps réel :** Le filtrage par marché ou par mot-clé doit rafraîchir dynamiquement la liste sans rechargement de page.
  - **Sélection de produit :** Un clic sur un produit ouvre une vue détaillée (modale ou page produit) permettant de choisir la quantité souhaitée (limitée par le `stock_disponible` de l'entité `PRODUIT`).

### 2.2. Gestion du Panier (Shopping Cart)
* **Éléments à afficher :**
  - Liste des articles ajoutés, **regroupés par vendeur** (`nom_etablissement`).
  - Pour chaque article : Nom, prix unitaire (`prix_vente_applique`), quantité choisie, sous-total de la ligne, bouton de suppression.
  - Affichage dynamique du total provisoire des marchandises.
* **Comportement et logique frontend (Règle RG01) :**
  - **Panier Multi-Vendeurs :** L'interface utilisateur doit permettre d'ajouter et de commander simultanément des produits provenant de différents vendeurs au sein d'une seule transaction.
  - **Contrôle des stocks :** Bloquer l'incrémentation de la quantité si elle dépasse le `stock_disponible`.

### 2.3. Tunnel de Commande (Checkout)
* **Éléments à afficher :**
  - **Adresse de livraison :** Saisie pré-remplie avec l'`adresse_livraison` issue de l'entité `CLIENT`, avec possibilité de la modifier ponctuellement pour cette commande.
  - **Sélection du Livreur (Règle RG05) :** Liste des livreurs actifs. Afficher pour chacun :
    - Nom et Prénom.
    - Véhicule (`type_vehicule` et plaque d'`immatriculation`).
    - Score de réputation (`score_reputation` sous forme d'étoiles ou d'indicateur coloré).
  - **Résumé Financier Dynamique :**
    - Total marchandises (`total_marchandises`).
    - Frais de livraison (`frais_livraison` calculés par le backend).
    - Montant total final de la commande.
* **Comportement et logique frontend :**
  - Le choix d'un unique livreur est requis pour finaliser la commande.
  - Affichage obligatoire de la mention **"Paiement à la livraison (COD)"** pour éviter toute ambiguïté (RG08).
  - Un clic sur "Valider la commande" génère l'entité `COMMANDE` et les liaisons correspondantes dans `DETAIL_COMMANDE`.

### 2.4. Suivi des Commandes en Cours (Order Tracking)
* **Éléments à afficher :**
  - Suivi d'avancement sous forme de ligne de temps (Timeline) : En attente -> Validée -> En collecte -> En livraison -> Livrée.
  - **Code de vérification unique (`code_verification`) :** Affiché de manière très visible (gros caractères ou QR Code) avec la consigne stricte : *"Ne transmettez ce code au livreur qu'une fois les marchandises physiques reçues."* (RG06).
  - Liste détaillée des articles commandés avec le statut individuel de collecte chez chaque vendeur (`statut_collecte_vendeur`).

### 2.5. Gestion des Rejets de Produits (Product Rejects Interface)
* **Éléments à afficher :**
  - Écran interactif activé en présence du livreur lors du face-à-face de livraison.
  - Liste des articles de la commande (`DETAIL_COMMANDE`) avec deux options pour chacun : **[Accepter]** ou **[Rejeter]**.
  - Si l'option **Rejeter** est choisie : Un champ de texte obligatoire pour saisir le motif du rejet.
* **Comportement et logique frontend (Règles RG09 & RG16) :**
  - **Rejet Granulaire :** Le client doit pouvoir rejeter un ou plusieurs articles individuellement sans avoir à annuler la totalité de sa commande.
  - **Recalcul dynamique à l'écran :**
    - Le total de la commande est mis à jour instantanément pour exclure les produits rejetés.
    - Calcul et affichage immédiats des `frais_retour_calcules` applicables aux articles retournés.

### 2.6. Historique des Commandes & Évaluation
* **Éléments à afficher :**
  - Liste chronologique des commandes passées (statuts : Entièrement acceptée, Partiellement acceptée, Rejetée).
  - Bouton "Laisser un avis" disponible uniquement sur les commandes finalisées.
  - **Formulaire d'Évaluation (`FEEDBACK`) :**
    - Saisie de la note du produit/vendeur (`note_produit` sur 5 étoiles).
    - Saisie de la note de la livraison (`note_transport` sur 5 étoiles).
    - Zone de texte libre pour le commentaire.

### 2.7. Formulaire de Signalement (Règle RG14)
* **Éléments à afficher :**
  - Formulaire accessible depuis l'historique d'une commande ou le profil d'un vendeur/livreur.
  - Saisie du motif du signalement (`motif`).
* **Comportement et logique frontend :**
  - Soumission sécurisée au backend pour traitement par l'administrateur dans son espace de modération.


---

## 3. Espace Vendeur (Commerçant)

Espace dédié à la gestion des produits, du stock et des ventes de l'établissement.

### 3.1. Tableau de Bord Vendeur (Dashboard)
* **Éléments à afficher :**
  - **Statut Financier Global :** 
    - Revenu brut cumulé.
    - Commission prélevée par la plateforme (automatiquement calculée à **0,6 %** de la valeur des marchandises, voir **RG08**).
    - Pertes liées aux articles rejetés par les clients (exclus automatiquement des gains, voir **RG16**).
    - Gains nets réels à recevoir.
  - **Indicateur de Réputation (Règles RG10 & RG15) :** Affichage très visible du score de réputation (`score_reputation` issu de l'entité `VENDEUR`), mis à jour selon les retours des clients.
  - **Alertes de stock :** Liste des articles dont le `stock_disponible` est proche de zéro.

### 3.2. Gestion du Catalogue de Produits (Product CRUD)
* **Éléments à afficher :**
  - Tableau de bord des produits proposés par le vendeur (Nom, description, prix de référence `prix_reference`, quantité en stock `stock_disponible`).
  - Modale ou page dédiée pour : **[Ajouter un produit]**, **[Modifier]** et **[Supprimer]**.
* **Comportement et logique frontend (Règle RG03) :**
  - **Propriété exclusive de l'offre :** Chaque article créé appartient exclusivement au catalogue de ce vendeur (avec un identifiant unique `id_produit` et la clé étrangère `#id_user_vendeur` liée automatiquement en arrière-plan).
  - **Validation du formulaire :**
    - `prix_reference` et `stock_disponible` doivent obligatoirement être des valeurs numériques positives.
    - Les champs nom et description sont requis.

### 3.3. Gestion des Commandes Vendeur (Order Pick-ups)
* **Éléments à afficher :**
  - Liste des commandes contenant des produits du vendeur, triées par statut de collecte (`statut_collecte_vendeur` : En attente du livreur, Prêt à être collecté, Collecté).
  - Pour chaque commande : ID de commande, heure de validation, liste des articles concernés (quantité commandée et prix appliqué).
* **Comportement frontend de validation de collecte (Règles RG06 & RG07) :**
  - **Preuve photographique obligatoire (RG07) :** L'UI doit forcer le vendeur à prendre ou uploader une photo (qui remplira l'attribut `url_photo` de `PREUVE_COLLECTE`). **Le bouton de validation finale doit rester désactivé (grisé) tant qu'aucune photo n'est fournie.**
  - **Saisie du Code de vérification :** Le vendeur doit saisir à l'écran le code de vérification unique fourni par le livreur lors du retrait physique pour signer numériquement la collecte.
  - **Validation :** Après soumission de la photo et du code corrects, le statut passe à "Collecté".

### 3.4. Gestion des Retours (Returned Products)
* **Éléments à afficher :**
  - Liste des articles de l'établissement rejetés par les clients lors de la livraison (voir **RG16**).
  - Pour chaque retour : ID du produit, Nom, quantité rejetée, Motif du rejet écrit par le client, et statut de récupération (À récupérer au point relais/marché, Récupéré).
* **Comportement et logique frontend :**
  - Cette interface permet de suivre physiquement le retour du stock refusé et de voir l'impact négatif associé sur le score de réputation.

### 3.5. Formulaire de Signalement (Règle RG14)
* **Éléments à afficher :**
  - Formulaire accessible pour signaler un client ou un livreur en cas de comportement abusif.
  - Saisie du motif du signalement (`motif`).


---

## 4. Espace Livreur (Logistique)

Espace mobile-first dédié à la prise en charge, au retrait chez les vendeurs et à la livraison physique chez les clients.

### 4.1. Tableau de Bord Livreur (Driver Dashboard)
* **Éléments à afficher :**
  - **Indicateurs de gains :** Total des gains accumulés (somme des frais de livraison perçus).
  - **Nombre de courses :** Volume de livraisons clôturées.
  - **Indicateur de Réputation (Règles RG10 & RG15) :** Affichage très visible du score de réputation (`score_reputation` issu de l'entité `LIVREUR`), influencé par la note de transport reçue lors des évaluations clients.
  - **Véhicule actif :** Rappel du `type_vehicule` et de la plaque d'`immatriculation` renseignés lors de l'inscription.

### 4.2. Gestion des Courses Disponibles (Delivery Marketplace)
* **Éléments à afficher :**
  - Liste de toutes les commandes validées par des clients en attente d'attribution de livreur.
  - Pour chaque course disponible : 
    - Liste des établissements vendeurs et leurs adresses de collecte.
    - Quartier ou secteur géographique de livraison finale.
    - Rémunération de la livraison (`frais_livraison`).
* **Comportement et logique frontend (Règle RG05) :**
  - **Attribution exclusive :** Un clic sur le bouton "Accepter la course" attribue instantanément la commande à ce livreur de façon unique (création de l'entité `LIVRAISON` avec clé étrangère `#id_user_livreur` et passage de l'état global de la commande à "En cours de collecte").

### 4.3. Étape de Collecte (Pick-up Flow - Étape par Étape)
* **Éléments à afficher :**
  - Liste ordonnée de tous les vendeurs distincts associés à la commande.
  - Pour chaque vendeur : Nom de l'établissement, localisation précise dans le marché, liste des articles à retirer, et statut de collecte du vendeur (`statut_collecte_vendeur`).
* **Comportement et logique frontend de collecte (Règles RG06 & RG07) :**
  - **Suivi de la photo de preuve (RG07) :** L'interface doit afficher un indicateur visuel dynamique confirmant si le vendeur a bien complété le téléversement de sa photo obligatoire de preuve de collecte (`url_photo` de `PREUVE_COLLECTE`).
  - **Remise et validation :** Le livreur communique au vendeur son code de collecte unique et confirme sur l'UI que tous les articles prévus ont été reçus. Une fois tous les points de collecte vendeurs validés, l'application bascule automatiquement le statut général en "En transit" (En cours de livraison).

### 4.4. Étape de Livraison (Delivery Flow & Cash on Delivery)
* **Éléments à afficher :**
  - Adresse physique complète du client et bouton d'appel téléphonique rapide.
  - **Formulaire de livraison interactive (Face-à-face) :**
    - Liste des articles de la commande (`DETAIL_COMMANDE`).
    - Cases à cocher en direct pour chaque produit : **[Accepté]** / **[Rejeté]** (selon le choix physique du client en direct, voir **RG09**).
    - **Calculateur de caisse dynamique (COD - Règle RG08 & RG16) :**
      - Total marchandises (exclut les articles rejetés).
      - Frais de livraison.
      - Frais de retour additionnels (`frais_retour_calcules`) ajoutés si des articles sont rejetés.
      - **Montant net final à collecter** en espèces (calculé automatiquement à l'écran).
    - **Saisie du code client (RG06) :** Champ de saisie obligatoire pour entrer le code de vérification unique (`code_verification`) que le client doit lui dicter lors de la remise.
* **Comportement et logique frontend :**
  - Le livreur valide la transaction sur l'UI uniquement après réception du montant net en espèces et après avoir saisi le code de vérification correct fourni par le client.
  - Un clic sur "Finaliser la livraison" enregistre l'heure de fin réelle (`date_fin_reelle` dans `LIVRAISON`) et libère le livreur pour de nouvelles courses.

### 4.5. Formulaire de Signalement (Règle RG14)
* **Éléments à afficher :**
  - Formulaire accessible pour signaler un client conflictuel ou un vendeur.
  - Saisie du motif du signalement (`motif`).


---

## 5. Espace Administrateur (Modération & Analytics)

Espace de contrôle global de la plateforme, avec respect de la confidentialité des clients (RGPD).

- **Tableau de Bord Administrateur (Admin Dashboard)** :
  - Statistiques globales de vente et commissions prélevées.
  - Liste des produits les plus vendus / les plus rejetés.
- **Gestion des Comptes Utilisateurs (User Administration)** :
  - Liste et recherche globale des utilisateurs (Vendeurs, Livreurs, Administrateurs, et infos de base des Clients).
  - *Note : Conformément au RGPD, aucun accès à l'historique d'achat ou de navigation privé des clients n'est visible ici.*
  - Module de bannissement et suspension définitive des vendeurs ou livreurs.
- **Centre de Gestion des Signalements (Universal Moderation)** :
  - Liste centralisée de tous les signalements émis sur la plateforme.
  - Outils d'action corrective (sanctions, suspensions de comptes de tous types).
- **Gestion et Arbitrage des Litiges (Dispute Center)** :
  - Liste des litiges ouverts suite à des non-conformités ou rejets.
  - Interface de décision administrative (arbitrage, validation de remboursement).
