import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcryptjs from 'bcryptjs';

const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({
  url: databaseUrl
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Début du peuplement de la base de données (Seeding)...');

  // Clear existing data in reverse order of dependencies
  await prisma.bonDeLivraison.deleteMany({});
  await prisma.paiement.deleteMany({});
  await prisma.facture.deleteMany({});
  await prisma.mediaPreuve.deleteMany({});
  await prisma.litige.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.detailCommande.deleteMany({});
  await prisma.livraison.deleteMany({});
  await prisma.preuveCollecte.deleteMany({});
  await prisma.commande.deleteMany({});
  await prisma.detailPanier.deleteMany({});
  await prisma.panier.deleteMany({});
  await prisma.historiquePrix.deleteMany({});
  await prisma.produit.deleteMany({});
  await prisma.categorie.deleteMany({});
  await prisma.disponibiliteLivreur.deleteMany({});
  await prisma.signalement.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.vendeur.deleteMany({});
  await prisma.marche.deleteMany({});
  await prisma.livreur.deleteMany({});
  await prisma.utilisateur.deleteMany({});

  const hashedPassword = await bcryptjs.hash('admin123', 12);
  const commonPassword = await bcryptjs.hash('password123', 12);

  // 0. Create Categories (RG30)
  console.log('Création des catégories...');
  const catLegumes = await prisma.categorie.create({
    data: { nom_categorie: 'Légumes', description_categorie: 'Produits maraîchers frais' }
  });
  const catEpices = await prisma.categorie.create({
    data: { nom_categorie: 'Épices & Condiments', description_categorie: 'Épices traditionnelles et mélanges' }
  });
  const catHuiles = await prisma.categorie.create({
    data: { nom_categorie: 'Huiles & Matières Grasses', description_categorie: 'Huiles végétales et animales' }
  });

  // 0.1 Create Markets (Localmarts)
  console.log('Création des marchés du Bénin (Localmarts)...');
  const marcheDantokpa = await prisma.marche.create({
    data: {
      nom: 'Marché Dantokpa',
      latitude: 6.3764,
      longitude: 2.4430,
      image_url: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=600&h=400&q=80',
      description: "Le plus grand marché à ciel ouvert de l'Afrique de l'Ouest, situé au bord de la lagune de Cotonou. Célèbre pour son dynamisme, ses épices, ses tissus et ses produits locaux."
    }
  });

  const marcheGanhi = await prisma.marche.create({
    data: {
      nom: 'Marché Ganhi',
      latitude: 6.3532,
      longitude: 2.4340,
      image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&h=400&q=80',
      description: "Marché historique de Cotonou, situé au cœur du quartier commercial. Idéal pour trouver des fruits, légumes et produits frais de consommation courante."
    }
  });

  const marcheSaintMichel = await prisma.marche.create({
    data: {
      nom: 'Marché Saint Michel',
      latitude: 6.3685,
      longitude: 2.4180,
      image_url: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&h=400&q=80',
      description: "Marché populaire de Cotonou réputé pour les produits artisanaux, les fruits frais et les légumes de saison."
    }
  });

  const marcheOuando = await prisma.marche.create({
    data: {
      nom: 'Marché de Ouando',
      latitude: 6.5120,
      longitude: 2.6170,
      image_url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&h=400&q=80',
      description: "Grand marché de Porto-Novo, carrefour d'échanges agricoles majeurs entre le sud et l'intérieur du Bénin."
    }
  });

  // 1. Create Users
  console.log('Création des utilisateurs...');
  
  // Admin
  const admin = await prisma.utilisateur.create({
    data: {
      nom: 'Nkoulou',
      prenom: 'Lionel',
      email: 'admin@vitecomm.com',
      telephone: '+237600000001',
      mot_de_passe: hashedPassword,
      statut_compte: 'Actif',
      est_admin: true,
      photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
    }
  });

  // Clients
  const client1 = await prisma.utilisateur.create({
    data: {
      nom: 'Mbia',
      prenom: 'Immaculée',
      email: 'immaculee@gmail.com',
      telephone: '+237699999991',
      mot_de_passe: commonPassword,
      statut_compte: 'Actif',
      est_admin: false,
      photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
      client: {
        create: { adresse_livraison: 'Fidjrossè, Cotonou' }
      }
    }
  });
  await prisma.panier.create({ data: { id_user_client: client1.id_user } });

  const client2 = await prisma.utilisateur.create({
    data: {
      nom: 'Kamdem',
      prenom: 'Pierre',
      email: 'pierre.kamdem@yahoo.com',
      telephone: '+237699999992',
      mot_de_passe: commonPassword,
      statut_compte: 'Actif',
      est_admin: false,
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
      client: {
        create: { adresse_livraison: 'Haie Vive, Cotonou' }
      }
    }
  });
  await prisma.panier.create({ data: { id_user_client: client2.id_user } });

  // Vendeurs
  const vendeur1 = await prisma.utilisateur.create({
    data: {
      nom: 'Eto\'o',
      prenom: 'Samuel',
      email: 'samuel.eto@boutique.com',
      telephone: '+237677777771',
      mot_de_passe: commonPassword,
      statut_compte: 'Actif',
      est_admin: false,
      photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&h=200&q=80',
      vendeur: {
        create: {
          nom_etablissement: 'Frais du Sud',
          localisation_marche: 'Marché Dantokpa - Allée A, Box 15',
          id_marche: marcheDantokpa.id_marche,
          latitude: 6.3768,
          longitude: 2.4435,
          score_reputation: 4.8
        }
      }
    }
  });

  const vendeur2 = await prisma.utilisateur.create({
    data: {
      nom: 'Song',
      prenom: 'Rigobert',
      email: 'rigobert.song@shop.com',
      telephone: '+237677777772',
      mot_de_passe: commonPassword,
      statut_compte: 'Actif',
      est_admin: false,
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=200&q=80',
      vendeur: {
        create: {
          nom_etablissement: 'Épices Dantokpa',
          localisation_marche: 'Marché Dantokpa - Allée D, Box 45',
          id_marche: marcheDantokpa.id_marche,
          latitude: 6.3760,
          longitude: 2.4425,
          score_reputation: 4.2
        }
      }
    }
  });

  const vendeur3 = await prisma.utilisateur.create({
    data: {
      nom: 'Kamga',
      prenom: 'Jean',
      email: 'jean.kamga@shop.com',
      telephone: '+237677777773',
      mot_de_passe: commonPassword,
      statut_compte: 'Actif',
      est_admin: false,
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=200&q=80',
      vendeur: {
        create: {
          nom_etablissement: 'Ganhi Primeurs',
          localisation_marche: 'Marché Ganhi - Secteur Fruits',
          id_marche: marcheGanhi.id_marche,
          latitude: 6.3535,
          longitude: 2.4345,
          score_reputation: 4.5
        }
      }
    }
  });

  const vendeur4 = await prisma.utilisateur.create({
    data: {
      nom: 'Ngo',
      prenom: 'Marie',
      email: 'marie.ngo@shop.com',
      telephone: '+237677777774',
      mot_de_passe: commonPassword,
      statut_compte: 'Actif',
      est_admin: false,
      photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=200&q=80',
      vendeur: {
        create: {
          nom_etablissement: 'Épices de Saint Michel',
          localisation_marche: 'Marché Saint Michel - Allée Centrale',
          id_marche: marcheSaintMichel.id_marche,
          latitude: 6.3688,
          longitude: 2.4185,
          score_reputation: 4.0
        }
      }
    }
  });

  const vendeur5 = await prisma.utilisateur.create({
    data: {
      nom: 'Tchinda',
      prenom: 'Marc',
      email: 'marc.tchinda@shop.com',
      telephone: '+237677777775',
      mot_de_passe: commonPassword,
      statut_compte: 'Actif',
      est_admin: false,
      photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&h=200&q=80',
      vendeur: {
        create: {
          nom_etablissement: 'Ouando Vivres',
          localisation_marche: 'Marché de Ouando - Secteur Maraîcher',
          id_marche: marcheOuando.id_marche,
          latitude: 6.5125,
          longitude: 2.6175,
          score_reputation: 4.6
        }
      }
    }
  });

  // Livreurs
  const livreur1 = await prisma.utilisateur.create({
    data: {
      nom: 'Aboubakar',
      prenom: 'Vincent',
      email: 'vincent.aboubakar@express.com',
      telephone: '+237655555551',
      mot_de_passe: commonPassword,
      statut_compte: 'Actif',
      est_admin: false,
      photo_url: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&w=300&h=200&q=80',
      livreur: {
        create: {
          type_vehicule: 'Moto',
          immatriculation: 'LT-777-EX',
          score_reputation: 4.5
        }
      }
    }
  });
  // Availability history (RG29)
  await prisma.disponibiliteLivreur.create({
    data: {
      id_user_livreur: livreur1.id_user,
      est_disponible: true,
      distance_marche: 8.5,
      heure_debut_dispo: '07:30',
      heure_fin_dispo: '19:00'
    }
  });

  const livreur2 = await prisma.utilisateur.create({
    data: {
      nom: 'Toko',
      prenom: 'Karl',
      email: 'karl.toko@delivery.com',
      telephone: '+237655555552',
      mot_de_passe: commonPassword,
      statut_compte: 'Actif',
      est_admin: false,
      photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&h=200&q=80',
      livreur: {
        create: {
          type_vehicule: 'Tricycle',
          immatriculation: 'LT-888-TR',
          score_reputation: 3.9
        }
      }
    }
  });
  await prisma.disponibiliteLivreur.create({
    data: {
      id_user_livreur: livreur2.id_user,
      est_disponible: true,
      distance_marche: 5.0,
      heure_debut_dispo: '08:00',
      heure_fin_dispo: '18:00'
    }
  });

  // 2. Create Products + Price Histories
  console.log('Création des produits et de l\'historique des prix...');
  
  // Vendeur 1 Products
  const prod1 = await prisma.produit.create({
    data: {
      id_user_vendeur: vendeur1.id_user,
      id_categorie: catLegumes.id_categorie,
      nom: 'Tomates Fraîches (Panier)',
      description: 'Panier de tomates de Foumban sélectionnées.',
      prix_reference: 2500,
      stock_disponible: 15,
      photo_url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=300&h=200&q=80',
      historiques: {
        createMany: {
          data: [
            { date_modification: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), prix: 2800 },
            { date_modification: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), prix: 2500 }
          ]
        }
      }
    }
  });

  const prod2 = await prisma.produit.create({
    data: {
      id_user_vendeur: vendeur1.id_user,
      id_categorie: catLegumes.id_categorie,
      nom: 'Piment Rouge Séché (Sachet)',
      description: 'Piment de qualité supérieure bien sec.',
      prix_reference: 500,
      stock_disponible: 50,
      photo_url: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=300&h=200&q=80',
      historiques: {
        createMany: {
          data: [
            { date_modification: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), prix: 500 }
          ]
        }
      }
    }
  });

  // Vendeur 2 Products
  const prod3 = await prisma.produit.create({
    data: {
      id_user_vendeur: vendeur2.id_user,
      id_categorie: catEpices.id_categorie,
      nom: 'Épices de Ndolè (Kit)',
      description: 'Mélange traditionnel complet pour réussir votre Ndolè.',
      prix_reference: 1200,
      stock_disponible: 30,
      photo_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=300&h=200&q=80',
      historiques: {
        createMany: {
          data: [
            { date_modification: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), prix: 1200 }
          ]
        }
      }
    }
  });

  const prod4 = await prisma.produit.create({
    data: {
      id_user_vendeur: vendeur2.id_user,
      id_categorie: catHuiles.id_categorie,
      nom: 'Huile de Palme (Litre)',
      description: 'Huile de palme raffinée et clarifiée.',
      prix_reference: 1500,
      stock_disponible: 25,
      photo_url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=300&h=200&q=80',
      historiques: {
        createMany: {
          data: [
            { date_modification: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), prix: 1500 }
          ]
        }
      }
    }
  });

  // Vendeur 3 Products (Marché Bonamoussadi)
  const prod5 = await prisma.produit.create({
    data: {
      id_user_vendeur: vendeur3.id_user,
      id_categorie: catLegumes.id_categorie,
      nom: 'Gombo Frais (Sachet)',
      description: 'Gombo vert tendre récolté ce matin.',
      prix_reference: 800,
      stock_disponible: 40,
      photo_url: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?auto=format&fit=crop&w=300&h=200&q=80',
      historiques: {
        createMany: {
          data: [{ date_modification: new Date(), prix: 800 }]
        }
      }
    }
  });

  const prod6 = await prisma.produit.create({
    data: {
      id_user_vendeur: vendeur3.id_user,
      id_categorie: catLegumes.id_categorie,
      nom: 'Bananes Douces (Régime)',
      description: 'Bananes mûres et douces du Moungo.',
      prix_reference: 2000,
      stock_disponible: 10,
      photo_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=300&h=200&q=80',
      historiques: {
        createMany: {
          data: [{ date_modification: new Date(), prix: 2000 }]
        }
      }
    }
  });

  // Vendeur 4 Products (Marché Central Yaoundé)
  const prod7 = await prisma.produit.create({
    data: {
      id_user_vendeur: vendeur4.id_user,
      id_categorie: catEpices.id_categorie,
      nom: 'Poivre Noir de Penja',
      description: 'Le célèbre poivre noir de Penja, moulu ou en grains.',
      prix_reference: 3500,
      stock_disponible: 20,
      photo_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=300&h=200&q=80',
      historiques: {
        createMany: {
          data: [{ date_modification: new Date(), prix: 3500 }]
        }
      }
    }
  });

  // Vendeur 5 Products (Marché Mokolo Yaoundé)
  const prod8 = await prisma.produit.create({
    data: {
      id_user_vendeur: vendeur5.id_user,
      id_categorie: catLegumes.id_categorie,
      nom: 'Oignons Rouges (Sac)',
      description: 'Sac d\'oignons de Garoua de calibre moyen.',
      prix_reference: 4000,
      stock_disponible: 8,
      photo_url: 'https://images.unsplash.com/photo-1508747702-f222958a8a25?auto=format&fit=crop&w=300&h=200&q=80',
      historiques: {
        createMany: {
          data: [{ date_modification: new Date(), prix: 4000 }]
        }
      }
    }
  });

  // 3. Create Orders + Order Details
  console.log('Création des commandes de démonstration...');

  // Order 1: Delivered & Completed
  const order1 = await prisma.commande.create({
    data: {
      id_user_client: client1.id_user,
      date_creation: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      statut: 'Livree',
      code_verification: '123456',
      total_marchandises: 6200,
      frais_livraison: 1500,
      commission: 6200 * 0.006,
      detailsCommande: {
        createMany: {
          data: [
            { id_produit: prod1.id_produit, quantite_commandee: 2, prix_vente_applique: 2500, statut_acceptation: 'Accepte' },
            { id_produit: prod3.id_produit, quantite_commandee: 1, prix_vente_applique: 1200, statut_acceptation: 'Accepte' }
          ]
        }
      }
    }
  });

  const delivery1 = await prisma.livraison.create({
    data: {
      id_commande: order1.id_commande,
      id_user_livreur: livreur1.id_user,
      statut_livraison: 'Livree',
      date_prise_en_charge: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      date_fin_reelle: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      frais_retour_calcules: 0
    }
  });

  // Feedback for Order 1
  await prisma.feedback.create({
    data: {
      note: 5,
      commentaire: 'Livraison super rapide et soignée.',
      type_feedback: 'LIVREUR',
      id_user_client: client1.id_user,
      id_livraison: delivery1.id_livraison
    }
  });

  // Invoice + Payment for Order 1 (RG25-26)
  const facture1 = await prisma.facture.create({
    data: {
      id_commande: order1.id_commande,
      montant_marchandises: 6200,
      montant_frais_livraison: 1500,
      montant_frais_retour: 0,
      montant_commission: 6200 * 0.006,
      montant_total_du: 6200 + 1500,
      statut_paiement: 'Paye'
    }
  });
  await prisma.paiement.create({
    data: {
      id_facture: facture1.id_facture,
      montant_percu: 7700,
      mode_reglement: 'MOBILE_MONEY',
      statut: 'Effectue'
    }
  });

  // Delivery receipt for Order 1 (RG27)
  await prisma.bonDeLivraison.create({
    data: {
      id_livraison: delivery1.id_livraison,
      statut_bon: 'SIGNE',
      date_signature_client: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000),
      observations_livreur: 'Client satisfait, colis en bon état.'
    }
  });

  // Order 2: Disputed / Litige
  const order2 = await prisma.commande.create({
    data: {
      id_user_client: client2.id_user,
      date_creation: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      statut: 'Livree',
      code_verification: '654321',
      total_marchandises: 5000,
      frais_livraison: 2000,
      commission: 5000 * 0.006,
      detailsCommande: {
        createMany: {
          data: [
            { id_produit: prod1.id_produit, quantite_commandee: 2, prix_vente_applique: 2500, statut_acceptation: 'Rejete' }
          ]
        }
      }
    }
  });

  const delivery2 = await prisma.livraison.create({
    data: {
      id_commande: order2.id_commande,
      id_user_livreur: livreur2.id_user,
      statut_livraison: 'Retourne',
      date_prise_en_charge: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      frais_retour_calcules: 500
    }
  });

  // Collect Proof for Order 2 (RG07)
  const collectProof2 = await prisma.preuveCollecte.create({
    data: {
      id_commande: order2.id_commande,
      date_heure: new Date(),
      statut_validation: 'En attente'
    }
  });

  await prisma.mediaPreuve.createMany({
    data: [
      { id_preuve: collectProof2.id_preuve, url_media: '/uploads/tomates_abimees_1.jpg', type_media: 'photo' },
      { id_preuve: collectProof2.id_preuve, url_media: '/uploads/tomates_abimees_2.jpg', type_media: 'photo' }
    ]
  });

  // Litige entry
  const litige2 = await prisma.litige.create({
    data: {
      id_livraison: delivery2.id_livraison,
      id_preuve: collectProof2.id_preuve,
      description: 'Les tomates étaient toutes écrasées au fond du sac.',
      statut: 'Ouvert',
      date_ouverture: new Date(),
      decision_admin: null,
      montant_rembourse: 0.0
    }
  });

  await prisma.detailCommande.updateMany({
    where: { id_commande: order2.id_commande, id_produit: prod1.id_produit },
    data: { id_litige: litige2.id_litige }
  });

  // 4. Create Signalements
  console.log('Création des signalements de démonstration...');
  
  await prisma.signalement.create({
    data: {
      id_auteur: client1.id_user,
      id_cible: vendeur2.id_user,
      type_cible_cible: 'Vendeur',
      motif: 'Comportement impoli et prix non conformes à la pesée lors du retrait.',
      statut_traitement: 'En attente',
      date_heure: new Date()
    }
  });

  await prisma.signalement.create({
    data: {
      id_auteur: livreur1.id_user,
      id_cible: client2.id_user,
      type_cible_cible: 'Client',
      motif: 'Refus injustifié de communiquer le code de vérification à l\'arrivée.',
      statut_traitement: 'En attente',
      date_heure: new Date()
    }
  });

  console.log('Db Seeding terminé avec grand succès !');
  console.log('Comptes de test crées :');
  console.log('  - Admin : admin@vitecomm.com (admin123)');
  console.log('  - Client : immaculee@gmail.com (password123)');
  console.log('  - Vendeur : samuel.eto@boutique.com (password123)');
  console.log('  - Livreur : vincent.aboubakar@express.com (password123)');
}

main()
  .catch((e) => {
    console.error('Erreur lors du seeding de la db:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
