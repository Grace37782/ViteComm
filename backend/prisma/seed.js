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

  // Clear existing data in reverse order of dependencies to avoid FK errors
  await prisma.photoPreuve.deleteMany({});
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
  await prisma.signalement.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.vendeur.deleteMany({});
  await prisma.livreur.deleteMany({});
  await prisma.utilisateur.deleteMany({});

  const hashedPassword = await bcryptjs.hash('admin123', 12);
  const commonPassword = await bcryptjs.hash('password123', 12);

  // 1. Create Users
  console.log('Création des utilisateurs...');
  
  // Admin (RG17: no specialization details = Admin by default)
  const admin = await prisma.utilisateur.create({
    data: {
      nom: 'Nkoulou',
      prenom: 'Lionel',
      email: 'admin@vitecomm.com',
      telephone: '+237600000001',
      mot_de_passe: hashedPassword,
      statut_compte: 'Actif',
      est_admin: true
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
      client: {
        create: {
          adresse_livraison: 'Logbessou, Douala'
        }
      }
    }
  });
  // Auto-create cart for Client 1 (RG22)
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
      client: {
        create: {
          adresse_livraison: 'Bastos, Yaoundé'
        }
      }
    }
  });
  // Auto-create cart for Client 2 (RG22)
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
      vendeur: {
        create: {
          nom_etablissement: 'Frais de l\'Ouest',
          localisation_marche: 'Marché Central',
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
      vendeur: {
        create: {
          nom_etablissement: 'Épices de Sandaga',
          localisation_marche: 'Marché Sandaga',
          score_reputation: 4.2
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
      livreur: {
        create: {
          type_vehicule: 'Moto',
          immatriculation: 'LT-777-EX',
          score_reputation: 4.5,
          est_disponible: true,
          distance_marche: 8.5,
          heure_debut_dispo: '07:30',
          heure_fin_dispo: '19:00'
        }
      }
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
      livreur: {
        create: {
          type_vehicule: 'Tricycle',
          immatriculation: 'LT-888-TR',
          score_reputation: 3.9,
          est_disponible: true,
          distance_marche: 5.0,
          heure_debut_dispo: '08:00',
          heure_fin_dispo: '18:00'
        }
      }
    }
  });

  // 2. Create Products (PRODUIT) + Log Price Histories (HISTORIQUE_PRIX) (RG24)
  console.log('Création des produits et de l\'historique des prix...');
  
  // Vendeur 1 Products
  const prod1 = await prisma.produit.create({
    data: {
      id_user_vendeur: vendeur1.id_user,
      nom: 'Tomates Fraîches (Panier)',
      description: 'Panier de tomates de Foumban sélectionnées.',
      prix_reference: 2500,
      stock_disponible: 15,
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
      nom: 'Piment Rouge Séché (Sachet)',
      description: 'Piment de qualité supérieure bien sec.',
      prix_reference: 500,
      stock_disponible: 50,
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
      nom: 'Épices de Ndolè (Kit)',
      description: 'Mélange traditionnel complet pour réussir votre Ndolè.',
      prix_reference: 1200,
      stock_disponible: 30,
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
      nom: 'Huile de Palme (Litre)',
      description: 'Huile de palme raffinée et clarifiée.',
      prix_reference: 1500,
      stock_disponible: 25,
      historiques: {
        createMany: {
          data: [
            { date_modification: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), prix: 1500 }
          ]
        }
      }
    }
  });

  // 3. Create Orders (COMMANDE) + Order Details (DETAIL_COMMANDE) (RG24: frozen price)
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
      commission: 6200 * 0.006, // RG08
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

  // Feedbacks for Order 1 (type_feedback is type-checked)
  await prisma.feedback.create({
    data: {
      note: 5,
      commentaire: 'Livraison super rapide et soignée.',
      type_feedback: 'LIVREUR',
      id_user_client: client1.id_user,
      id_livraison: delivery1.id_livraison
    }
  });

  // Order 2: Disputed / Litige (Client Pierre, Driver Vincent)
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

  // Collect Proof for Order 2 (Double Photo Collect - RG07)
  const collectProof2 = await prisma.preuveCollecte.create({
    data: {
      id_commande: order2.id_commande,
      date_heure: new Date(),
      statut_validation: 'En attente'
    }
  });

  await prisma.photoPreuve.createMany({
    data: [
      { id_preuve: collectProof2.id_preuve, url_photo: '/uploads/tomates_abimees_1.jpg' },
      { id_preuve: collectProof2.id_preuve, url_photo: '/uploads/tomates_abimees_2.jpg' }
    ]
  });

  // Litige entry (Linked to Delivery - RG09, RG16, RG21)
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

  // Link DetailCommande line items to the Litige (RG21 - precise item attribution)
  await prisma.detailCommande.updateMany({
    where: { id_commande: order2.id_commande, id_produit: prod1.id_produit },
    data: { id_litige: litige2.id_litige }
  });

  // 4. Create Signalement (Universal Moderation - RG14)
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
