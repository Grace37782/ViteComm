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
    - Sans rôle spécialisé (rôle administrateur par défaut dans `UTILISATEUR`, voir **RG17**) : Redirection vers **l'Espace Administrateur**.
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
  - **Sélection de produit :** Un clic sur un produit ouvre une vue détaillée (modale ou page produit) permettant de :
    - Consulter l'historique complet des tarifs du produit sous forme de graphique d'évolution des prix ou d'un tableau récapitulatif (basé sur l'entité `HISTORIQUE_PRIX` publique, conformément à la règle **RG24**).
    - Choisir la quantité souhaitée (limitée par le `stock_disponible` de l'entité `PRODUIT`).

### 2.2. Gestion du Panier (Shopping Cart)
* **Éléments à afficher :**
  - Liste des articles ajoutés, **regroupés par vendeur** (`nom_etablissement`).
  - Pour chaque article : Nom, prix unitaire (`prix_reference` issu de l'entité `PRODUIT`), quantité choisie, sous-total de la ligne, bouton de suppression.
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
  - **Résumé Financier Dynamique (Règle RG04 - initialisée par un seul client) :**
    - Total marchandises (`total_marchandises`).
    - Frais de livraison (`frais_livraison` calculés par le backend).
    - Montant total final de la commande.
* **Comportement et logique frontend :**
  - Le choix d'un unique livreur est requis pour finaliser la commande.
  - Affichage obligatoire de la mention **"Paiement à la livraison (COD)"** pour éviter toute ambiguïté (RG08).
  - **Transition Panier → Commande (RG22) :** À la validation, le contenu du `PANIER` / `DETAIL_PANIER` est verrouillé et transformé en entités `COMMANDE` et `DETAIL_COMMANDE`. Le panier frontend est vidé immédiatement après la confirmation. La persistance intermédiaire du panier est gérée côté backend via le token de session.

### 2.4. Suivi des Commandes en Cours (Order Tracking)
* **Éléments à afficher :**
  - Suivi d'avancement sous forme de ligne de temps (Timeline) : En attente -> Validée -> En collecte -> En livraison -> Livrée.
  - **Code de vérification unique (`code_verification`) :** Affiché de manière très visible (gros caractères ou QR Code) avec la consigne stricte : *"Ne transmettez ce code au livreur qu'une fois les marchandises physiques reçues."* (RG06).
  - Liste détaillée des articles commandés avec le statut individuel de collecte chez chaque vendeur (`statut_collecte_vendeur`). Les prix affichés sont les prix de vente appliqués et figés lors de la commande (`prix_vente_applique` de l'entité `DETAIL_COMMANDE`, conformément à **RG24**).

### 2.5. Gestion des Rejets de Produits (Product Rejects Interface)
* **Éléments à afficher :**
  - Écran interactif activé en présence du livreur lors du face-à-face de livraison.
  - Liste des articles de la commande (`DETAIL_COMMANDE`) avec deux options pour chacun : **[Accepter]** ou **[Rejeter]**.
  - Si l'option **Rejeter** est choisie : Un champ de texte obligatoire pour saisir le motif du rejet.
* **Comportement et logique frontend (Règles RG07, RG09, RG16, RG18, RG20 & RG21) :**
  - **Rejet Granulaire (RG18 - Atomicité du Détail) :** Le client doit pouvoir rejeter un ou plusieurs articles individuellement sans avoir à annuler la totalité de sa commande, grâce à la liaison directe et granulaire dans `DETAIL_COMMANDE`.
  - **Preuve photo client (RG07 & RG21) :** Bouton **"Ajouter des preuves photos"** (optionnel mais recommandé) permettant au client d'uploader une ou plusieurs images de non-conformité en cas de désaccord. Ces photos alimenteront la table `PHOTO_PREUVE` liée à la `PREUVE_COLLECTE` du client (`#id_commande` uniquement dans `PREUVE_COLLECTE`), laquelle sera ensuite associée à l'entité `LITIGE` via la clé étrangère `#id_preuve` si le litige est initié lors de la livraison (les entités litige et feedback n'existant pas au départ, voir **RG20**). Les lignes concernées dans `DETAIL_COMMANDE` sont directement rattachées au litige via `#id_litige`, évitant toute table intermédiaire inutile (RG21).
  - **Recalcul dynamique à l'écran :**
    - Le total de la commande est mis à jour instantanément pour exclure les produits rejetés.
    - Calcul et affichage immédiats des `frais_retour_calcules` applicables aux articles retournés.

### 2.6. Historique des Commandes & Évaluation
* **Éléments à afficher :**
  - Liste chronologique des commandes passées (statuts : Entièrement acceptée, Partiellement acceptée, Rejetée).
  - Bouton "Laisser un avis" disponible uniquement sur les commandes finalisées.
  - **Formulaire d'Évaluation (`FEEDBACK`) :**
    - Sélection du type d'évaluation (`type_feedback`) : **Livreur** (évalue la livraison) ou **Vendeur** (évalue les produits).
    - Le client peut évaluer le livreur (affecte sa réputation) et/ou évaluer un ou plusieurs vendeurs séparément (RG23).
    - Pour chaque évaluation : note (`note` sur 5 étoiles) et commentaire texte libre (`commentaire`).
    - Si `type_feedback = LIVREUR` : la note est liée à la livraison via `#id_livraison`.
    - Si `type_feedback = VENDEUR` : la note est liée au vendeur via `#id_user_vendeur` (ou affecte globalement tous les vendeurs de la commande).
    - Les lignes de `DETAIL_COMMANDE` pointent vers leur feedback respectif via la FK `#id_feedback`.

### 2.7. Formulaire de Signalement (Règle RG14)
* **Éléments à afficher :**
  - Formulaire accessible depuis l'historique d'une commande ou le profil d'un vendeur/livreur.
  - Saisie du motif du signalement (`motif`).
* **Comportement et logique frontend :**
  - Soumission sécurisée au backend pour traitement par l'administrateur dans son espace de modération.


---

## 3. Espace Vendeur (Commerçant)

Espace dédié à la gestion des produits, du stock et des ventes de l'établissement.

### 3.1. Tableau de Bord Vendeur (Dashboard) (Règle RG02)
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
  - Graphiques ou tableaux d'historique des prix pour chaque produit (basé sur l'entité `HISTORIQUE_PRIX`).
  - Modale ou page dédiée pour : **[Ajouter un produit]**, **[Modifier]** et **[Supprimer]**.
* **Comportement et logique frontend (Règles RG03 & RG24) :**
  - **Propriété exclusive de l'offre :** Chaque article créé appartient exclusivement au catalogue de ce vendeur (avec un identifiant unique `id_produit` et la clé étrangère `#id_user_vendeur` liée automatiquement en arrière-plan).
  - **Historique des Tarifs (RG24) :** Lors de l'ajout ou de la modification d'un tarif, le système enregistre automatiquement le changement dans `HISTORIQUE_PRIX`. Les modifications n'impactent pas les commandes passées où le prix appliqué est déjà figé.
  - **Validation du formulaire :**
    - `prix_reference` et `stock_disponible` doivent obligatoirement être des valeurs numériques positives.
    - Les champs nom et description sont requis.

### 3.3. Gestion des Commandes Vendeur (Order Pick-ups)
* **Éléments à afficher :**
  - Liste des commandes contenant des produits du vendeur, triées par statut de collecte (`statut_collecte_vendeur` : En attente du livreur, Prêt à être collecté, Collecté).
  - Pour chaque commande : ID de commande, heure de validation, liste des articles concernés (quantité commandée et prix de vente appliqué `prix_vente_applique` de l'entité `DETAIL_COMMANDE`, voir **RG24**).
* **Comportement frontend de validation de collecte (Règles RG06 & RG07) :**
  - **Vérification du code de collecte (RG06) :** Le vendeur doit saisir à l'écran le code de vérification unique (`code_verification` de l'entité `COMMANDE`) fourni par le livreur lors du retrait physique pour signer numériquement la remise des marchandises. **Le bouton de validation finale reste désactivé (grisé) tant que le code n'est pas saisi.**
  - **Suivi de la preuve de collecte (RG07) :** L'interface affiche un indicateur visuel confirmant si le livreur a bien complété sa preuve photographique de collecte (`PREUVE_COLLECTE`). Le vendeur n'a pas à uploader la photo ; cette responsabilité incombe au livreur (cf. section 4.3). Notez que `PREUVE_COLLECTE` est uniquement liée à `#id_commande` au niveau de la base de données.
  - **Validation :** Après la saisie du code correct et confirmation de la preuve photo par le livreur, le statut passe à "Collecté".

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
  - **Paramètres de Disponibilité (RG19) :** Section dédiée permettant au livreur de définir ses `heure_debut_dispo` et `heure_fin_dispo`, d'activer/désactiver son statut `est_disponible`, et de configurer un rayon d'action maximal (`distance_marche`) pour le filtrage des courses proposées.

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
  - **Preuve photographique obligatoire (RG07) :** Le livreur est responsable de la réalisation de la preuve de collecte. L'UI doit fournir un mécanisme de prise de photo ou de téléversement qui alimentera l'entité `PHOTO_PREUVE` (une ou plusieurs photos avec leur `url_photo`) liée à la `PREUVE_COLLECTE` créée pour cette étape, elle-même liée uniquement à la commande (`#id_commande`) dans le modèle de données relationnel, les informations de livraison et de vendeur étant déduites par jointure.
  - **Indicateur de validation vendeur :** L'interface affiche un indicateur visuel dynamique confirmant si le vendeur a bien saisi le code de vérification (`code_verification`) dans son interface pour valider la remise (cf. section 3.3).
  - **Confirmation de collecte :** Une fois que la preuve photo est prise par le livreur ET que le vendeur a saisi le code de vérification, l'application bascule automatiquement le statut de collecte de ce vendeur à "Collecté". Après validation de tous les points de collecte, le statut général passe en "En transit" (En cours de livraison).

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
    - **Validation de la remise :** Le livreur coche les articles acceptés/rejetés en direct avec le client. Les lignes de `DETAIL_COMMANDE` sont mises à jour avec le `statut_acceptation` correspondant.
* **Comportement et logique frontend :**
  - Le livreur valide la transaction sur l'UI uniquement après réception du montant net en espèces et confirmation visuelle de la remise avec le client.
  - Un clic sur "Finaliser la livraison" enregistre l'heure de fin réelle (`date_fin_reelle` dans `LIVRAISON`) et libère le livreur pour de nouvelles courses.

### 4.5. Formulaire de Signalement (Règle RG14)
* **Éléments à afficher :**
  - Formulaire accessible pour signaler un client conflictuel ou un vendeur.
  - Saisie du motif du signalement (`motif`).


---

## 5. Espace Administrateur (Modération & Analytics)

Espace de contrôle global et de gouvernance de la plateforme, conçu pour arbitrer les litiges et modérer le système, tout en assurant une confidentialité absolue aux acheteurs.

### 5.0. Attributs visuels enrichis (Photos de Profil & Produits)
* **Photos des Utilisateurs (`photo_url` dans `Utilisateur`) :**
  - Permet d'injecter des portraits réels et professionnels (ex. avatars Unsplash) pour humaniser l'interface dans la navbar, les profils et les tables d'administration.
* **Photos des Produits (`photo_url` dans `Produit`) :**
  - Permet d'associer des images réelles d'articles (légumes, épices, objets) affichées dans les listes de produits les plus achetés ou refusés.

### 5.1. Tableau de Bord Administrateur (Admin Dashboard)
* **Barre de Recherche Globale et Filtrage Dynamique :**
  - Un champ de recherche textuel dynamique (`input[type="text"]`) permettant de filtrer instantanément les widgets, les listes, les tableaux d'utilisateurs, de produits et de litiges en temps réel.
* **Cartes de Synthèse de la Plateforme (Counters) :**
  - Des widgets affichant le nombre total de comptes par type : **Vendeurs actifs**, **Clients inscrits**, et **Livreurs certifiés**.
* **Mesures Financières de la Plateforme (Règle RG08) :**
  - **Volume total des ventes (brut) :** ex. `11,200 FCFA` (uniquement sur les articles livrés et acceptés).
  - **Commission plateforme cumulée (0,6 %) :** ex. `67.2 FCFA` (Règle **RG08** prélevée sur la valeur des marchandises).
* **Leaderboards et Classements Financiers :**
  - **Classement des Vendeurs par Chiffre d'Affaires (CA) :** Liste triée des vendeurs avec leur volume de vente généré (ex. Vendeur A, CA : 2000 FCFA).
  - **Classement des Livreurs par Activité :** Liste triée des livreurs avec la valeur cumulée de leurs courses ou livraisons.
  - **Classement des Clients par Volume d'Achat :** Liste triée des clients selon la valeur totale de leurs commandes validées (RGPD-compliant : n'affiche pas le détail de leurs achats).
* **Analyses Produits & Qualité (Règle RG12) :**
  - **Produits les plus populaires :** Tableau enrichi avec la photo de l'article, son nom, le volume vendu, et le nom de l'établissement du vendeur.
  - **Produits les plus refusés (Rejets Qualité) :** Tableau enrichi avec la photo de l'article, son nom, le volume rejeté lors des livraisons, et le nom de l'établissement du vendeur.
  - Indicateurs de statut des alertes (litiges ouverts et signalements en attente).

### 5.2. Gestion des Comptes Utilisateurs (User Administration)
* **Éléments à afficher :**
  - Tableau de bord listant tous les utilisateurs inscrits avec leur portrait (`photo_url`).
  - Recherche et filtrage par rôle (`Client`, `Vendeur`, `Livreur`, `Admin`) ou par `statut_compte`.
  - Pour chaque compte : Nom, prénom, téléphone, email, et statut actuel.
  - Pour les **Vendeurs** et **Livreurs** uniquement : affichage direct de leur `score_reputation` et bouton d'accès pour consulter le catalogue complet d'un vendeur (RG12).
  - Accès aux historiques de modification des prix d'un produit (audit d'évolution des prix via `HISTORIQUE_PRIX`, conformément à la règle **RG24**).
  - **Actions de Modération (Règle RG13) :** Boutons d'action pour suspendre définitivement (bannir) ou supprimer un compte vendeur ou livreur.
* **Panneau de Détails Utilisateur (clic sur une ligne du tableau) :**
  - **En-tête info :** Photo, nom complet, email, téléphone, rôle, statut du compte, et score de réputation (Vendeur/Livreur).
  - **Historique des Évaluations :** Liste chronologique des feedbacks reçus avec note/5, commentaire, auteur, et type d'évaluation (VENDEUR ou LIVREUR). Permet à l'admin de comprendre la réputation de l'utilisateur en un coup d'œil (RG10).
  - **Données spécifiques au rôle :**
    - **Vendeur :** Catalogue complet des produits avec photo, prix actuel, stock disponible, et historique complet d'évolution des prix (RG24) affiché inline. Indicateur du nombre total de ventes et du revenu cumulé.
    - **Livreur :** Tableau des livraisons effectuées incluant l'ID commande, le nom du client, le montant, le statut de livraison, et la date. Résumé du nombre total de livraisons, volume total transporté, type de véhicule et immatriculation.
    - **Client :** Tableau des commandes passées incluant l'ID commande, le montant total, les frais de livraison, le statut et la date. Résumé du nombre total de commandes, dépense cumulée et adresse de livraison. **Aucun détail privé de navigation n'est exposé (RG11).**
  - **Comportement :** Les lignes du tableau des utilisateurs (`Utilisateurs (RG11)`) sont cliquables (`cursor: pointer`). Les items des classements (vendeurs, livreurs, clients) dans l'onglet Analytics & Finance sont également cliquables et ouvrent le même panneau de détails. Un clic ouvre une modale large (max 800px) avec scroll vertical. Le fond de la modale est opaque (`hsl(250, 25%, 10%)`) pour une lisibilité maximale. Le chargement est asynchrone avec indicateur de spinner. La modale se ferme au clic sur la croix ou en cliquant sur l'overlay.
* **Comportement frontend & Confidentialité stricte (Règles RG11 & RG15) :**
  - **Sécurité RGPD :** L'interface administrateur ne doit comporter **aucun lien, bouton ou écran permettant d'accéder à l'historique d'achat ou de navigation privé d'un Client**. L'administrateur n'a accès qu'à ses informations d'identité de base (`nom`, `prenom`, `telephone`, `email`).

### 5.3. Centre de Gestion des Signalements (Universal Moderation)
* **Éléments à afficher :**
  - Liste de tous les signalements de la plateforme (`SIGNALEMENT`) contenant : Heure, motif (`motif`), auteur (`#id_auteur`), type de cible (`type_cible_cible` : Client, Vendeur, Livreur) et identifiant de la cible (`#id_cible`).
  - Indicateur visuel du statut de traitement (En attente / Sanctionné / Classé sans suite).
* **Comportement et logique frontend (Règle RG14) :**
  - **Droit de sanction universel :** Bien que l'historique d'un client soit confidentiel, les signalements reçus permettent à l'administrateur de suspendre ou supprimer tout type de compte s'il y a un abus avéré, **y compris le compte d'un Client**.

### 5.4. Centre de Gestion et d'Arbitrage des Litiges (Dispute Center)
* **Éléments à afficher :**
  - Liste des litiges en cours (`LITIGE`) initiés par les clients suite à des rejets d'articles.
  - Détail par litige : ID de commande, description de l'incident, montant total concerné par les articles rejetés.
  - Galerie de preuves photographiques : Visualisation de l'ensemble des photos (récupérées depuis la table `PHOTO_PREUVE` associée à la `PREUVE_COLLECTE` liée au litige via la clé `#id_preuve`).
* **Comportement et logique frontend d'arbitrage (Règles RG09 & RG16) :**
  - Zone de texte pour rédiger la décision officielle de l'administrateur (`decision_admin`).
  - Saisie du montant final validé pour remboursement au client (`montant_rembourse`).
  - Bouton "Clôturer le litige" qui enregistre la décision, applique le remboursement et actualise la réputation des acteurs professionnels concernés.


