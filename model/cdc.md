# 📘 CAHIER DES CHARGES (CDC) – PROJET ViteComm
**Porteurs du Projet :** Lionel Sisso Timileyin & Immaculee Odjo  
**Durée de Réalisation :** 8 semaines (Projet de Fin de Cycle)  
**Support d'Hébergement :** AlwaysData  

### 📝 Description Synthétique du Projet
**ViteComm (ViteCommerce)** est une plateforme e-commerce multi-rôles conçue pour offrir une expérience d'achat et de vente fluide, sécurisée et esthétiquement moderne. Le système permet une gestion cloisonnée des espaces administrateur, vendeur et acheteur grâce à une architecture multi-tenant, intègre des paiements automatisés via une passerelle locale, et propose une interface visuelle dynamique personnalisable à distance. Conçu pour un déploiement rapide et une maintenance optimisée, ViteComm vise à simplifier les transactions numériques tout en garantissant performance, sécurité et évolutivité.

---

## 1. CONTEXTE
- **Importance stratégique :** La digitalisation des échanges commerciaux requiert des solutions agiles, sécurisées et adaptables aux réalités locales. ViteComm s'inscrit dans cette dynamique en proposant une architecture moderne capable de gérer simultanément plusieurs profils utilisateurs avec une isolation stricte des données.
- **Intégration à l'écosystème :** La plateforme s'articule autour des flux transactionnels existants, en s'appuyant sur des standards web éprouvés et une passerelle de paiement régionale. Elle s'insère sans rupture dans les habitudes de navigation actuelles tout en offrant une interface évolutive.
- **Motivations :** Répondre au besoin d'une solution clé-en-main pour la gestion de catalogues, la traçabilité des commandes et l'intégration sécurisée de paiements locaux, tout en garantissant une expérience utilisateur premium et personnalisable.
- **Problématique ciblée :** Comment concevoir et déployer en 8 semaines une plateforme e-commerce multi-rôles, dotée d'une architecture de données cloisonnée, d'un système de paiement fiable et d'une interface visuellement adaptable, tout en respectant les contraintes académiques et techniques d'un développement en binôme ?

---

## 2. OBJECTIF
### 🔹 Objectif Général
Concevoir, développer, tester et déployer un MVP fonctionnel de **ViteComm** en 8 semaines, offrant une gestion multi-tenant, une intégration paiement automatisée et une interface dynamique, prêt à être présenté et validé dans le cadre académique.

### 🔹 Objectifs Spécifiques (Critères SMART)
| Critère | Description |
|--------|-------------|
| **S**pécifique | Mettre en place une base de données multi-tenant (isolation au niveau des tables), un moteur de paiement avec webhooks, et un panneau admin permettant la modification d'arrière-plans illustratifs. |
| **M**esurable | Livraison du MVP en ≤8 semaines ; ≥90% des parcours critiques (inscription, commande, paiement, validation) validés en test ; temps de réponse < 2s sous charge nominale. |
| **A**tteignable & **A**mbitieux | S'appuyer sur une stack modulaire et une méthodologie de modélisation structurée (Merise, UML) pour garantir la faisabilité tout en intégrant une UI glassmorphique dynamique. |
| **R**éaliste | Scope limité aux fonctionnalités cœur (authentification, catalogues, panier, paiement, rôles, déploiement). Équipe de 2 développeurs avec répartition claire des responsabilités. |
| **T**emporellement défini | Jalon final (mise en production + soutenance) fixé à la fin de la 8ᵉ semaine. Planning découpé en phases hebdomadaires. |

---

## 3. PÉRIMÈTRE
- **Cibles identifiées :**
  - *Super Administrateur :* Supervision globale, gestion des rôles, personnalisation visuelle, supervision des transactions.
  - *Vendeurs (Sellers) :* Gestion de catalogues, suivi des commandes, réception des paiements.
  - *Acheteurs (Buyers) :* Navigation, ajout au panier, paiement sécurisé, suivi de commande.
- **Étendue géographique & linguistique :** Plateforme web responsive accessible mondialement via navigateur. Interface principale en français (extensible multilingue).
- **Dimensionnement & Scalabilité :** Architecture optimisée pour un MVP académique, conçue pour supporter une montée en charge progressive. Séparation logique des données par rôle pour garantir sécurité et maintenabilité future.

---

## 4. DESCRIPTION FONCTIONNELLE
*(Conformément à la méthodologie : focus sur les besoins utilisateurs et métier, sans prescrire de solutions techniques)*

1. **Cloisonnement multi-rôles & multi-tenant :** Le système doit garantir une isolation stricte des données et des interfaces entre les profils administrateur, vendeur et acheteur, empêchant tout accès croisé non autorisé.
2. **Personnalisation visuelle centralisée :** L'administrateur doit pouvoir modifier à distance les éléments visuels de l'interface (notamment les arrière-plans illustratifs) afin d'adapter l'esthétique de la plateforme sans intervention technique.
3. **Traitement automatisé des transactions financières :** Le système doit permettre l'initiation, la vérification et la validation automatique des paiements, avec gestion des retours de confirmation et des échecs en temps réel.
4. **Gestion unifiée des catalogues et commandes :** Permettre la consultation, l'ajout au panier, le passage de commande et le suivi d'état pour chaque acteur, avec historisation des actions.
5. **Environnement de déploiement et de monitoring :** La plateforme doit être hébergeable sur un service cloud mutualisé, avec des procédures standardisées de mise en production, de sauvegarde et de supervision des logs.
6. **Validation par test collaboratif :** Le système doit intégrer un cycle de vérification pré-production (jeux de données, simulation de flux, correction d'anomalies) avant ouverture au public.

---

## 5. BUDGET
*(Estimation indicative conforme aux capacités d'un projet académique)*
- **Hébergement & Infrastructure (AlwaysData) :** Gratuit à faible coût (plan étudiant/entrée de gamme) ~ 0 à 10 €/mois.
- **Passerelle de paiement (FedaPay) :** Aucun coût d'intégration ; frais applicables uniquement par transaction validée.
- **Outils de développement & Collaboratifs :** 0 FCFA (Open-source : Laravel, MySQL, Git/GitHub, VS Code, Inertia/Vite).
- **Connexion & Matériel :** Pris en charge par les porteurs (2 postes de travail, accès internet).
- **Enveloppe globale estimée pour le MVP :** **~0 à 15 000 FCFA** (uniquement pour d'éventuels upgrades d'hébergement ou noms de domaine).  
*Note : Budget volontairement léger, aligné sur un cadre académique et une stack open-source.*

---

## 6. DÉLAIS
*(Durée totale : 8 semaines – Structurable en diagramme de Gantt)*

| Phase | Jalons & Livrables | Durée | Responsables |
|-------|-------------------|-------|--------------|
| **Semaine 1** | **Cadrage & Architecture** : CDC finalisé, dépendances fonctionnelles minimales, MLD (Merise), Diagrammes UML (Cas d'utilisation & Classes) | 7 jours | Immaculee & Lionel |
| **Semaine 2-3** | **Développement Backend & DB** : Structure Laravel, MySQL, logique multi-tenant, authentification, gestion des rôles | 14 jours | Lionel |
| **Semaine 4** | **Développement Frontend & UI** : Intégration Blade/Inertia/Vite, design glassmorphique, panneaux de navigation par rôle, composants dynamiques | 7 jours | Immaculee |
| **Semaine 5** | **Intégration Paiement & Fonctionnalités Cœur** : Connexion passerelle, webhooks, flux commandes/paniers, synchronisation front-back | 7 jours | Lionel & Immaculee |
| **Semaine 6** | **Déploiement & Configuration** | Migration vers AlwaysData, variables d'environnement, sécurisation, SSL, staging | 7 jours | Lionel |
| **Semaine 7** | **Tests & Validation** | Jeux de données, simulation de flux, correction de bugs, optimisation des performances, revue conjointe | 7 jours | Immaculee & Lionel |
| **Semaine 8** | **Production & Clôture** | Mise en production officielle, documentation technique, finalisation du rapport de stage, préparation soutenance | 7 jours | Immaculee & Lionel |

📅 *Dates indicatives à renseigner :* Début : `__ / __ / 20__` | Fin : `__ / __ / 20__`

---

### 📎 Annexe : Répartition des Rôles & Ressources
*(Pour clarification lors de la présentation)*
- **Humain :** Immaculee (Modélisation, Web Design, Frontend, Tests) | Lionel (Modélisation, Backend, Base de données, Déploiement, Maintenance, Tests)
- **Matériel & Logiciel :** 2 ordinateurs, accès internet, Git/GitHub, VS Code, Laravel + Blade + Inertia.js + Vite, MySQL, AlwaysData.
- **Méthodologie de travail :** Réunions de synchronisation hebdomadaires, gestion de version via Git, revues de code croisées, tests en environnement staging avant passage en production.