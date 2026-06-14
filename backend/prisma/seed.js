import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcryptjs from 'bcryptjs';

const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const pickN = (arr, n) => {
  const result = [];
  for (let i = 0; i < n; i++) result.push(arr[i % arr.length]);
  return result;
};
const uid = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const now = Date.now();
const day = 86400000;
const hour = 3600000;

const prenoms = [
  'Adela', 'Bodjona', 'Chantal', 'Deborah', 'Esperance', 'Felicite', 'Grace', 'Honorine',
  'Irene', 'Josiane', 'Kekeli', 'Lydie', 'Marie', 'Nadia', 'Ophelia', 'Priscilla',
  'Rachelle', 'Seraphine', 'Therese', 'Victoire', 'Wardah', 'Ximenes', 'Yvette', 'Zeline',
  'Alassane', 'Bernard', 'Christian', 'David', 'Emmanuel', 'Fabrice', 'Gratien', 'Herve',
  'Ibrahim', 'Jean', 'Koffi', 'Luc', 'Michel', 'Norbert', 'Olivier', 'Pascal',
  'Quentin', 'Rodrigue', 'Sylvestre', 'Theodore', 'Ulrich', 'Victor', 'Wiliam', 'Yves',
  'Zacharie', 'Armand', 'Celestin', 'Delphin', 'Etienne', 'Fortune', 'Gaston', 'Hyacinthe',
  'Isidore', 'Joseph', 'Konrad', 'Lazare', 'Maxime', 'Noel', 'Oscar', 'Patrice',
  'Renelde', 'Stanislas', 'Tancrède', 'Urbain', 'Valentin', 'Wilfried', 'Xavier', 'Yannick',
  'Zephirin', 'Adrien', 'Bruno', 'Clement', 'Dominique', 'Edouard', 'Florian', 'Ghislain',
  'Hugues', 'Ignace', 'Julien', 'Kevin', 'Laurent', 'Marius', 'Nathan', 'Orel',
];
const noms = [
  'Agbeke', 'Koudjo', 'Fagnon', 'Dossou', 'Hounbedji', 'Sehoue', 'Kponton', 'Adjovi',
  'Gbehounme', 'Tossou', 'Ahouansou', 'Lokonon', 'Sossa', 'Gnonlonfin', 'Degboe', 'Achode',
  'Aidoo', 'Gankpovi', 'Sassou', 'Hounkponou', 'Zinsou', 'Dekple', 'Akakpo', 'Assouma',
  'Gbegbeni', 'Houedeo', 'Senan', 'Kpatcha', 'Djaguidi', 'Gbedji', 'Tchala', 'Alladaye',
  'Amoussou', 'Gandonou', 'Kpekpli', 'Dossenou', 'Houedo', 'Senou', 'Kpevi', 'Adja',
  'Agossa', 'Boko', 'Chabi', 'Dangbo', 'Egbo', 'Fandou', 'Glo', 'Houngbo',
  'Igbinoba', 'Jegbefumeh', 'Koffi', 'Lahlou', 'Missihen', 'Nonvide', 'Ohin', 'Ponsin',
  'Quenum', 'Rochegude', 'Socli', 'Tognon', 'Vowan', 'Wekpe', 'Yayi', 'Zinsou',
  'Ahouangan', 'Biaou', 'Cassi', 'Dogbo', 'Eklo', 'Fassinou', 'Ganoud', 'Houndeton',
];
const etablissements = [
  'Frais du Sud', 'Epices Dantokpa', 'Ganhi Primeurs', 'Delices de Saint Michel', 'Ouando Vivres',
  'Togba Frais', 'Missèbo Bio', 'Aklakou Marche', 'Djegbanje Poissons', 'Benin Saveurs',
  'Cotonou Fresh', 'Porto Gout', 'Calavi Marche', 'Semme Delices', 'Abomey Saveurs',
  'Parakou Nord', 'Natitingou Hauts', 'Lokossa Sud', 'Come Marche', 'Grand-Popo Fruits',
  'Kandi Racines', 'Nikki Tubercules', 'Bohicon Igname', 'Sakete Tomates', 'Pobe Fruits',
  'Adjarra Epices', 'Ouinon Oignons', 'Semme-Kpodji Riz', 'Ketou Arachides', 'Ifangni Gombo',
  'Allada Bananes', 'Ze Ananas', 'Toffo Mais', 'Aplahoue Haricots', 'Djougou Millet',
  'Bassila Soja', 'Cove Igname', 'Lokoli Manioc', 'Dogbo Taro', 'Aoudjou Piment',
  'Cocotiers Huile', 'Palmeraie Palme', 'Savanes Boeuf', 'Nord Poulet', 'Sud Crabe',
  'Lac Crevettes', 'Riviere Tilapia', 'Foret Champignons', 'Jardin Salade', 'Plaine Carottes',
];
const adresses = [
  'Fidjrosse, Cotonou', 'Haie Vive, Cotonou', 'Akpakpa, Cotonou', 'Cadjehoun, Cotonou',
  'Togba, Porto-Novo', 'Calavi, Abomey-Calavi', 'Semme-Kpodji', 'Ouando, Porto-Novo',
  'Godomey, Abomey-Calavi', 'Avakpa, Cotonou', 'Semme, Cotonou', 'Hekandou, Porto-Novo',
  'Ekpe, Porto-Novo', 'Miserenkpa, Abomey-Calavi', 'Cite CPN, Cotonou', 'Betou, Cotonou',
  'Zongo, Porto-Novo', 'Gbojde, Semme-Kpodji', 'Agblangandan, Cotonou', 'Akebedo, Porto-Novo',
  'Fidjrossè C2', 'Akpakpa Ganhi', 'Togba C3', 'Calavi Kpota', 'Godomey H9',
];
const marcheData = [
  { nom: 'Marche Dantokpa', lat: 6.3764, lon: 2.4430, desc: "Le plus grand marche a ciel ouvert d\'Afrique de l\'Ouest." },
  { nom: 'Marche Ganhi', lat: 6.3532, lon: 2.4340, desc: "Marche historique de Cotonou, au coeur du quartier commercial." },
  { nom: 'Marche Saint Michel', lat: 6.3685, lon: 2.4180, desc: "Marche populaire repu pour les produits artisanaux et frais." },
  { nom: 'Marche de Ouando', lat: 6.5120, lon: 2.6170, desc: "Grand marche de Porto-Novo, carrefour d\'echanges agricoles." },
  { nom: 'Marche Missebo', lat: 6.3600, lon: 2.4250, desc: "Marche bio et local, specialise en produits du terroir beninois." },
  { nom: 'Marche Togba', lat: 6.4400, lon: 2.3500, desc: "Marche d\'Abomey-Calavi, vivier de produits frais du sud." },
  { nom: 'Marche Aklakou', lat: 6.4900, lon: 2.6300, desc: "Marche de Porto-Novo, specialite en tubercules et racines." },
  { nom: 'Marche Djegbanje', lat: 6.3100, lon: 2.5900, desc: "Marche cotier de Semme-Kpodji, repu pour ses poissons frais." },
];
const categorieData = [
  { nom: 'Legumes', desc: 'Produits maraichers frais' },
  { nom: 'Epices & Condiments', desc: 'Epices traditionnelles et melanges' },
  { nom: 'Huiles & Matieres Grasses', desc: 'Huiles vegetales et animales' },
  { nom: 'Tubercules & Racines', desc: 'Igname, manioc, taro, patate douce' },
  { nom: 'Fruits', desc: 'Mangue, ananas, banane, agrumes' },
  { nom: 'Proteines Animales', desc: 'Poisson, crevette, poulet, boeuf' },
  { nom: 'Vetements & Accessoires', desc: 'Vetements, chaussures, bijoux' },
  { nom: 'Electronique & Multimédia', desc: 'Telephones, ordinateurs, accessoires' },
  { nom: 'Maison & Decoration', desc: 'Meubles, objets deco, menager' },
  { nom: 'Sante & Beaute', desc: 'Produits pharmaceutiques et bien-etre' },
  { nom: 'Beaute & Cosmétiques', desc: 'Maquillage, soins, parfums' },
  { nom: 'Scolaire & Bureau', desc: 'Fournitures, papeterie, materiel' },
  { nom: 'Outillage & Bricolage', desc: 'Outils, quincaillerie, materiel' },
];
const productTemplates = [
  { cat: 0, items: ['Tomates Fraiches (Panier)', 'Piment Rouge (Sachet)', 'Gombo Frais (Sachet)', 'Oignons Verts (Botte)', 'Aubergines (Panier)', 'Carottes Fraiches (Kg)', 'Chou Blanc (Piece)', 'Laitue Verte (Botte)', 'Haricots Verts (Sachet)', 'Okra Seche (Sachet)'], basePrice: [2500, 500, 800, 300, 1200, 1000, 750, 600, 900, 400] },
  { cat: 1, items: ['Epices de Ndole (Kit)', 'Poivre Noir de Penja', 'Gingembre Moulu (Sachet)', 'Curcuma Bio (Pot)', 'Piment vif (Sachet)', 'Seloide (Kg)', 'Cube Maggi (Boite)', "Huile d\'arachide (Litre)"], basePrice: [1200, 3500, 800, 1500, 400, 300, 500, 2000] },
  { cat: 2, items: ['Huile de Palme (Litre)', 'Huile de coco (Litre)', 'Beurre de Karite (Pot)', 'Saindoux (Kg)', "Huile d\'arachide raffinee (Litre)"], basePrice: [1500, 2500, 3000, 1800, 2200] },
  { cat: 3, items: ['Igname Blanche (Kg)', 'Igname Viandox (Kg)', 'Manioc Frais (Kg)', 'Taro (Kg)', 'Patate Douce (Kg)', 'Feuilles de Manioc (Botte)'], basePrice: [800, 1200, 400, 600, 500, 300] },
  { cat: 4, items: ['Mangue Julie (Piece)', 'Ananas (Piece)', 'Banane Douce (Regime)', 'Agrumes (Sac)', 'Papaye (Piece)', 'Citron Vert (Sachet)', 'Fruit de la Passion (Sachet)'], basePrice: [1500, 1000, 2000, 3000, 1200, 400, 800] },
  { cat: 5, items: ['Poisson Frais (Kg)', 'Crevettes Sechees (Kg)', 'Poulet Entier (Piece)', 'Boeuf Decoupe (Kg)', 'Tilapia (Kg)', 'Crabe Vivant (Kg)', 'Corne de Buffle (Kg)', 'Sardines (Kg)'], basePrice: [3000, 5000, 2500, 4500, 2800, 4000, 3500, 1500] },
  { cat: 6, items: ['T-Shirt Coton (Piece)', 'Pagne wax (3m)', 'Chapeau paille (Piece)', 'Sandales cuir (Paire)', 'Robe wax (Piece)', 'Short sport (Piece)', 'Sac a main (Piece)', 'Ceinture cuir (Piece)'], basePrice: [2500, 4000, 1500, 5000, 6000, 2000, 3500, 2500] },
  { cat: 7, items: ['Smartphone Android (Piece)', 'Ecouteurs Bluetooth (Piece)', 'Chargeur universel (Piece)', 'Coque telephone (Piece)', 'Powerbank 10000mAh (Piece)', 'Classeur USB (Piece)', 'Lampe solaire (Piece)', 'Radio FM (Piece)'], basePrice: [45000, 5000, 2500, 1500, 8000, 3000, 4000, 6000] },
  { cat: 8, items: ['Lampe de table (Piece)', 'Miroir mural (Piece)', 'Tapis sol (Piece)', 'Coussin canape (Piece)', 'Vase fleurs (Piece)', 'Horloge murale (Piece)', 'Rideau fenetre (Piece)', 'Bougeoir (Piece)'], basePrice: [5000, 7000, 4000, 2500, 3000, 6000, 4500, 1500] },
  { cat: 9, items: ['Savon noir (Piece)', 'Huile essentialielle (Flacon)', 'Sirop bio (Flacon)', 'The vert (Boite)', 'Miel pur (Pot)', 'Vitamine C (Boite)', 'Gel douche (Flacon)', 'Creme solaire (Tube)'], basePrice: [500, 3000, 2000, 1500, 4000, 2500, 1800, 3500] },
  { cat: 10, items: ['Rouge a levres (Piece)', 'Mascara (Piece)', 'Parfum femme (Flacon)', 'Creme visage (Pot)', 'Poudre libre (Piece)', 'Vernis a ongles (Piece)', 'Huile cheveux (Flacon)', 'Savon beton (Piece)'], basePrice: [1500, 2000, 8000, 3500, 2500, 1000, 2000, 800] },
  { cat: 11, items: ['Cahier 200p (Piece)', 'Stylo bille (Piece)', 'Ruler 30cm (Piece)', 'Tolerance geometrique (Livre)', 'Calculatrice (Piece)', 'Sac a dos ecole (Piece)', 'Crayon a bois (Boite)', 'Gomme (Piece)'], basePrice: [300, 100, 200, 2500, 4000, 5000, 500, 50] },
  { cat: 12, items: ['Marteau (Piece)', 'Tournevis (Piece)', 'Scie manuelle (Piece)', 'Pince multiprise (Piece)', 'Perceuse electrique (Piece)', 'Tapis soudures (Piece)', 'Mesure ruban (Piece)', 'Vis assortment (Boite)'], basePrice: [2000, 800, 3000, 2500, 15000, 4000, 1000, 1500] },
];
const photoUrls = [
  'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=300&h=200&q=80',
  'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=300&h=200&q=80',
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=300&h=200&q=80',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=300&h=200&q=80',
  'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?auto=format&fit=crop&w=300&h=200&q=80',
  'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=300&h=200&q=80',
  'https://images.unsplash.com/photo-1508747702-f222958a8a25?auto=format&fit=crop&w=300&h=200&q=80',
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=300&h=200&q=80',
  'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=300&h=200&q=80',
  'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=300&h=200&q=80',
];
const marketPhotos = [
  'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=600&h=400&q=80',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&h=400&q=80',
  'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&h=400&q=80',
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&h=400&q=80',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&h=400&q=80',
  'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=600&h=400&q=80',
  'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&h=400&q=80',
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&h=400&q=80',
];
const clientPhotos = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
];
const vendorPhotos = [
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&h=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=200&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&h=200&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=200&q=80',
];
const driverPhotos = [
  'https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&w=300&h=200&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&h=200&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&h=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=200&q=80',
];
const vehicules = ['Moto', 'Tricycle', 'Moto', 'Moto', 'Tricycle', 'Moto', 'Moto', 'Tricycle', 'Moto', 'Moto'];
const litigeDescriptions = [
  'Produit abime a la reception.', 'Quantite insuffisante.', 'Mauvaise qualite.',
  'Produit perime.', 'Mauvais emballage.', 'Trop mur.', 'Trop petit.',
  'Pas comme decrit.', 'Manquant dans le colis.', 'Ecrase pendant le transport.',
  'Couleur anormale.', 'Odeur suspecte.', 'Insectes dans le produit.',
  'Trop sec, pas frais.', 'Poids inferieur a la commande.',
];

async function main() {
  console.log('Debut du peuplement...');

  const tables = [
    'bonDeLivraison', 'paiement', 'paiementTransaction', 'facture', 'mediaPreuve',
    'litige', 'feedback', 'detailCommande', 'livraison', 'preuveCollecte',
    'commande', 'detailPanier', 'panier', 'historiquePrix', 'produit',
    'categorie', 'disponibiliteLivreur', 'signalement', 'client', 'vendeur',
    'marche', 'livreur', 'utilisateur',
  ];
  for (const t of tables) await prisma[t].deleteMany({});

  const hashedAdmin = await bcryptjs.hash('admin123', 12);
  const hashedCommon = await bcryptjs.hash('password123', 12);

  console.log('Categories...');
  const cats = [];
  for (const c of categorieData) {
    cats.push(await prisma.categorie.create({ data: { nom_categorie: c.nom, description_categorie: c.desc } }));
  }

  console.log('Marches...');
  const marches = [];
  for (let i = 0; i < marcheData.length; i++) {
    const m = marcheData[i];
    marches.push(await prisma.marche.create({
      data: { nom: m.nom, latitude: m.lat, longitude: m.lon, image_url: marketPhotos[i], description: m.desc }
    }));
  }

  console.log('Admin...');
  await prisma.utilisateur.create({
    data: {
      nom: 'Nkoulou', prenom: 'Lionel', email: 'admin@vitecomm.com',
      telephone: '+237600000001', mot_de_passe: hashedAdmin,
      statut_compte: 'Actif', est_admin: true,
      photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
    }
  });

  console.log('Clients (20)...');
  const clients = [];
  for (let i = 0; i < 20; i++) {
    const prenom = prenoms[i];
    const nom = noms[i];
    const c = await prisma.utilisateur.create({
      data: {
        nom, prenom,
        email: `${prenom.toLowerCase()}.${nom.toLowerCase()}${i}@gmail.com`,
        telephone: `+237699${String(100000 + i).slice(-6)}`,
        mot_de_passe: hashedCommon, statut_compte: 'Actif', est_admin: false,
        photo_url: clientPhotos[i % clientPhotos.length],
        client: { create: { adresse_livraison: adresses[i % adresses.length] } }
      }
    });
    await prisma.panier.create({ data: { id_user_client: c.id_user } });
    clients.push(c);
  }

  // Legacy test account
  const immaculee = await prisma.utilisateur.create({
    data: {
      nom: 'Koudjo', prenom: 'Immaculee', email: 'immaculee@gmail.com',
      telephone: '+237699100099', mot_de_passe: hashedCommon,
      statut_compte: 'Actif', est_admin: false,
      photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
      client: { create: { adresse_livraison: 'Fidjrosse, Cotonou' } }
    }
  });
  await prisma.panier.create({ data: { id_user_client: immaculee.id_user } });
  clients.push(immaculee);

  console.log('Vendeurs (50)...');
  const vendeurs = [];
  for (let i = 0; i < 50; i++) {
    const prenom = prenoms[i % prenoms.length];
    const nom = noms[i % noms.length];
    const marche = marches[i % marches.length];
    const baseLat = marche.latitude + (Math.random() - 0.5) * 0.002;
    const baseLon = marche.longitude + (Math.random() - 0.5) * 0.002;
    const v = await prisma.utilisateur.create({
      data: {
        nom, prenom,
        email: `${prenom.toLowerCase()}.${nom.toLowerCase()}${i}@shop.com`,
        telephone: `+237677${String(100000 + i).slice(-6)}`,
        mot_de_passe: hashedCommon, statut_compte: 'Actif', est_admin: false,
        photo_url: vendorPhotos[i % vendorPhotos.length],
        vendeur: {
          create: {
            nom_etablissement: etablissements[i],
            localisation_marche: `${marche.nom} - Allee ${String.fromCharCode(65 + (i % 26))}, Box ${i + 1}`,
            id_marche: marche.id_marche,
            latitude: baseLat, longitude: baseLon,
            score_reputation: +(3.5 + Math.random() * 1.5).toFixed(1)
          }
        }
      }
    });
    vendeurs.push(v);
  }

  console.log('Livreurs (10)...');
  const livreursData = [];
  const prenomsLivreurs = ['Vincent', 'Karl', 'Aristide', 'Sosthene', 'Brice', 'Cedric', 'Desire', 'Fernand', 'Gerard', 'Hugues'];
  const nomsLivreurs = ['Aboubakar', 'Toko', 'Gnonlonfin', 'Koudjo', 'Sehoue', 'Agbeke', 'Dossou', 'Fagnon', 'Hounbedji', 'Sassa'];
  for (let i = 0; i < 10; i++) {
    const l = await prisma.utilisateur.create({
      data: {
        nom: nomsLivreurs[i], prenom: prenomsLivreurs[i],
        email: `${prenomsLivreurs[i].toLowerCase()}.${nomsLivreurs[i].toLowerCase()}${i}@express.com`,
        telephone: `+237655${String(100000 + i).slice(-6)}`,
        mot_de_passe: hashedCommon, statut_compte: 'Actif', est_admin: false,
        photo_url: driverPhotos[i % driverPhotos.length],
        livreur: {
          create: {
            type_vehicule: vehicules[i],
            immatriculation: `LT-${700 + i}-${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i + 3) % 26))}`,
            score_reputation: +(3.5 + Math.random() * 1.5).toFixed(1)
          }
        }
      }
    });
    await prisma.disponibiliteLivreur.create({
      data: {
        id_user_livreur: l.id_user, est_disponible: true,
        distance_marche: +(2 + Math.random() * 8).toFixed(1),
        heure_debut_dispo: `0${7 + (i % 3)}:00`, heure_fin_dispo: `${17 + (i % 3)}:00`
      }
    });
    livreursData.push(l);
  }

  console.log('Produits (~200)...');
  const allProducts = [];
  for (let i = 0; i < 50; i++) {
    const vendor = vendeurs[i];
    const tmpl = productTemplates[i % productTemplates.length];
    const prodCount = 2 + rand(0, 3);
    for (let j = 0; j < prodCount; j++) {
      const tmplIdx = j % tmpl.items.length;
      const price = tmpl.basePrice[tmplIdx] + rand(-200, 500);
      const p = await prisma.produit.create({
        data: {
          id_user_vendeur: vendor.id_user,
          id_categorie: cats[tmpl.cat].id_categorie,
          nom: tmpl.items[tmplIdx],
          description: `${tmpl.items[tmplIdx]} de qualite superieure.`,
          prix_reference: Math.max(200, price),
          stock_disponible: rand(5, 80),
          unite: 'kg',
          photo_url: photoUrls[(i + j) % photoUrls.length],
          historiques: {
            createMany: {
              data: [{ date_modification: new Date(now - rand(1, 30) * day), prix: Math.max(200, price + rand(-300, 300)) }]
            }
          }
        }
      });
      allProducts.push(p);
    }
  }
  console.log(`  -> ${allProducts.length} produits crees`);

  console.log('Commandes (~300)...');
  let orderCount = 0;

  async function createOrder(config) {
    const { clientIdx, driverIdx, daysAgo, prodCount, statut, hasReturn, hasFeedback, paymentMode } = config;
    const cli = clients[clientIdx % clients.length];
    const livreur = livreursData[driverIdx % livreursData.length];
    const products = pickN(allProducts, prodCount || rand(1, 4));
    const quantities = products.map(() => rand(1, 8));
    const totalMarchandises = products.reduce((s, p, i) => s + p.prix_reference * quantities[i], 0);
    const fraisLivraison = 1500;
    const commission = +(totalMarchandises * 0.006).toFixed(2);
    const fraisRetour = hasReturn ? 500 : 0;

    const order = await prisma.commande.create({
      data: {
        id_user_client: cli.id_user,
        date_creation: new Date(now - daysAgo * day + rand(0, 12) * hour),
        statut: statut || 'Livree',
        code_verification: uid(),
        total_marchandises: totalMarchandises,
        frais_livraison: fraisLivraison,
        commission,
        mode_paiement: paymentMode || (Math.random() > 0.4 ? 'ESPECES' : 'MOBILE_MONEY'),
        mode_paiement_status: statut === 'Livree' ? 'paye' : statut === 'En attente' ? 'en_attente' : null,
        detailsCommande: {
          createMany: {
            data: products.map((p, i) => ({
              id_produit: p.id_produit,
              quantite_commandee: quantities[i],
              prix_vente_applique: p.prix_reference,
              statut_acceptation: hasReturn && i === 0 ? 'Rejete' : 'Accepte'
            }))
          }
        }
      }
    });

    const deliveryStatus = statut === 'Echec' ? 'Echec' : statut === 'En attente' ? 'En cours de collecte' : statut === 'Validee' ? 'Collectee' : statut === 'En transit' ? 'En cours de livraison' : 'Livree';

    const delivery = await prisma.livraison.create({
      data: {
        id_commande: order.id_commande,
        id_user_livreur: livreur.id_user,
        statut_livraison: deliveryStatus,
        date_prise_en_charge: new Date(now - daysAgo * day),
        date_fin_reelle: deliveryStatus === 'Livree' || deliveryStatus === 'Echec'
          ? new Date(now - daysAgo * day + rand(20, 60) * 60000) : null,
        frais_retour_calcules: fraisRetour
      }
    });

    if (deliveryStatus === 'Livree') {
      await prisma.bonDeLivraison.create({
        data: {
          id_livraison: delivery.id_livraison, statut_bon: 'SIGNE',
          date_signature_client: new Date(now - daysAgo * day + rand(15, 45) * 60000),
          observations_livreur: 'Colis remis en bon etat.'
        }
      });

      const montantTotal = totalMarchandises + fraisLivraison - fraisRetour;
      const facture = await prisma.facture.create({
        data: {
          id_commande: order.id_commande,
          montant_marchandises: totalMarchandises,
          montant_frais_livraison: fraisLivraison,
          montant_frais_retour: fraisRetour,
          montant_commission: commission,
          montant_total_du: montantTotal,
          statut_paiement: Math.random() > 0.2 ? 'Paye' : 'En attente'
        }
      });

      if (facture.statut_paiement === 'Paye') {
        await prisma.paiement.create({
          data: {
            id_facture: facture.id_facture,
            montant_percu: montantTotal,
            mode_reglement: paymentMode === 'MOBILE_MONEY' ? 'MOBILE_MONEY' : 'ESPECES',
            reference_transaction: paymentMode === 'MOBILE_MONEY' ? `TXN-${uid()}` : undefined,
            statut: 'Effectue'
          }
        });
      }

      if (hasFeedback) {
        await prisma.feedback.create({
          data: {
            note: rand(3, 5),
            commentaire: pick(['Excellent!', 'Tres bien.', 'Correct.', 'Satisfait.', 'Rapide et soigne.', 'Colis en bon etat.', 'Recommande.']),
            type_feedback: pick(['LIVREUR', 'VENDEUR']),
            id_user_client: cli.id_user,
            id_livraison: delivery.id_livraison
          }
        });
      }

      if (hasReturn) {
        const p = products[0];
        const litige = await prisma.litige.create({
          data: {
            id_livraison: delivery.id_livraison,
            description: pick(litigeDescriptions),
            statut: pick(['Ouvert', 'Ferme']),
            statut_retour: pick(['a_recuperer', 'en_cours', 'recupere']),
            montant_rembourse: 0
          }
        });
        await prisma.detailCommande.updateMany({
          where: { id_commande: order.id_commande, id_produit: p.id_produit },
          data: { id_litige: litige.id_litige }
        });
      }
    }

    return order;
  }

  for (let i = 0; i < 200; i++) {
    await createOrder({
      clientIdx: i % 20, driverIdx: i % 10, daysAgo: rand(1, 45),
      prodCount: rand(1, 4), statut: 'Livree',
      hasReturn: Math.random() < 0.15, hasFeedback: Math.random() < 0.6
    });
    orderCount++;
  }

  for (let i = 0; i < 30; i++) {
    await createOrder({
      clientIdx: i % 20, driverIdx: i % 10, daysAgo: rand(0, 2),
      prodCount: rand(1, 3), statut: 'En attente', paymentMode: 'ESPECES'
    });
    orderCount++;
  }

  for (let i = 0; i < 30; i++) {
    await createOrder({
      clientIdx: i % 20, driverIdx: i % 10, daysAgo: rand(0, 3),
      prodCount: rand(1, 3), statut: pick(['Validee', 'En transit'])
    });
    orderCount++;
  }

  for (let i = 0; i < 20; i++) {
    await createOrder({
      clientIdx: i % 20, driverIdx: i % 10, daysAgo: rand(1, 20),
      prodCount: rand(1, 2), statut: 'Echec', paymentMode: 'ESPECES'
    });
    orderCount++;
  }

  for (let i = 0; i < 20; i++) {
    await createOrder({
      clientIdx: i % 20, driverIdx: i % 10, daysAgo: rand(1, 30),
      prodCount: rand(1, 3), statut: 'Livree', hasReturn: true, hasFeedback: true
    });
    orderCount++;
  }

  console.log(`  -> ${orderCount} commandes crees`);

  console.log('Signalements...');
  const sigTypes = ['Vendeur', 'Client', 'Livreur'];
  const allUsers = [...clients, ...vendeurs, ...livreursData];
  for (let i = 0; i < 10; i++) {
    const auteur = allUsers[i % allUsers.length];
    const cible = allUsers[(i + 5) % allUsers.length];
    await prisma.signalement.create({
      data: {
        id_auteur: auteur.id_user, id_cible: cible.id_user,
        type_cible_cible: pick(sigTypes),
        motif: pick(litigeDescriptions),
        statut_traitement: pick(['En attente', 'Traite', 'En attente']),
        date_heure: new Date(now - rand(1, 30) * day)
      }
    });
  }

  // Pre-populate immaculee's cart with items from different vendors (AFTER orders so cart isn't cleared)
  console.log('Panier immaculee...');
  const cartItems = [];
  const usedVendors = new Set();
  for (const p of allProducts) {
    if (cartItems.length >= 4) break;
    if (usedVendors.has(p.id_user_vendeur)) continue;
    usedVendors.add(p.id_user_vendeur);
    cartItems.push(p);
  }
  for (const p of allProducts) {
    if (cartItems.length >= 5) break;
    if (cartItems.find(c => c.id_produit === p.id_produit)) continue;
    cartItems.push(p);
  }
  const immaculeeCart = await prisma.panier.findUnique({ where: { id_user_client: immaculee.id_user } });
  if (immaculeeCart) {
    for (const p of cartItems) {
      await prisma.detailPanier.create({
        data: { id_panier: immaculeeCart.id_panier, id_produit: p.id_produit, quantite: rand(1, 3) }
      });
    }
    console.log(`  -> ${cartItems.length} articles dans le panier immaculee`);
  }

  console.log('=================================');
  console.log('Db Seeding termine !');
  console.log('=================================');
  console.log(`  8 marches | 6 categories | 20 clients`);
  console.log(`  50 vendeurs | 10 livreurs | ${allProducts.length} produits`);
  console.log(`  ${orderCount} commandes | 10 signalements`);
  console.log('---------------------------------');
  console.log('Comptes de test :');
  console.log('  Admin   : admin@vitecomm.com (admin123)');
  console.log('  Client  : adela.agbeke0@gmail.com (password123)');
  console.log('  Vendeur : adela.agbeke0@shop.com (password123)');
  console.log('  Livreur : vincent.aboubakar0@express.com (password123)');
}

main()
  .catch((e) => { console.error('Erreur seeding:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
