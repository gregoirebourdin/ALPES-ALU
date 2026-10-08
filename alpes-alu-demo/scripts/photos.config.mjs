// Photos retenues pour la page : uniquement des vraies photos d'Alpes Alu
// (verdicts dans assets/raw/manifest.json). crop = [x, y, largeur, hauteur]
// en fractions de l'original, appliqué avant l'étalonnage. mobile = recadrage
// d'art direction pour les écrans étroits. grade = réglages propres à la photo.
const U = 'uploads/';

export const PHOTOS = [
  // Hero
  {
    id: 'hero', src: U + '2021/10/alpes-alu-chantier-pose-vitre-toiture.jpeg',
    crop: [0, 0.02, 1, 0.9], mobile: [0.27, 0, 0.46, 1],
    alt: "Un grand vitrage suspendu à une grue au-dessus des toits, guidé par l'équipe Alpes Alu, montagnes en arrière-plan.",
    priority: true,
    q: -10, // photo voilée sous le texte : on peut la compresser davantage
    mobileMax: 760,
  },
  // Métiers
  { id: 'm-fenetres', src: U + '2021/10/alpes-alu-fenetre-renovation-sur-mesure.jpeg', alt: 'Fenêtre de rénovation sur mesure posée dans un mur en pierre.' },
  { id: 'm-baies', src: U + '2021/11/Alpes-Alu-Chantier-chassis-compose-fenetre-scaled.jpg', crop: [0.3, 0.12, 0.445, 0.5], alt: 'Châssis composé aluminium ouvert sur des sommets enneigés.' },
  { id: 'm-volets', src: U + '2021/10/alpes-alu-volet-roulant-exterieur.jpeg', alt: 'Volet roulant blanc posé en façade, baissé devant une large ouverture.' },
  { id: 'm-portes', src: U + '2021/10/alpes-alu-porte-de-garage-premium-haut-de-gamme.jpeg', alt: 'Porte de garage sectionnelle anthracite encadrée par un mur en pierre.' },
  { id: 'm-portails', src: U + '2021/10/alpes-alu-conception-installation-portail-coulissant-exterieur.jpg', alt: "Portail coulissant posé à l'entrée d'une allée, falaise en arrière-plan." },
  { id: 'm-verandas', src: U + '2021/11/alpes-alu-fabrication-installation-pergola-vitree.jpg', alt: "Pergola vitrée posée contre la façade d'une maison de montagne." },
  { id: 'm-escaliers', src: U + '2021/10/alpes-alu-escalier-exterieur-acces-scaled.jpeg', alt: 'Escalier extérieur galvanisé à marches en caillebotis et double rampe.' },
  { id: 'm-vitrerie', src: U + '2021/10/alpes-alu-fabrication-sur-mesure-vitrage-separatif-cuisine-interieur-maison.jpeg', alt: 'Vitrage séparatif sur mesure entre une cuisine et une pièce à vivre.' },
  { id: 'm-serrurerie', src: U + '2021/10/alpes-alu-conception-fabrication-installation-porte-blindee.jpg', alt: 'Porte de service en aluminium posée au bout d’un couloir.' },
  // De l'atelier à votre façade
  { id: 'pose', src: U + '2021/10/alpes-alu-chantier-pose-vitre.jpeg', alt: 'Trois poseurs guident un vitrage suspendu à la grue au-dessus d’une verrière.' },
  // L'atelier
  { id: 'equipe', src: U + '2022/02/alpes-alu-qualibat-rge-copie.jpg', crop: [0, 0, 1, 0.69], alt: "L'équipe Alpes Alu en tenue de travail devant la porte jaune de l'atelier.", duotone: true },
  { id: 'atelier-etabli', src: U + '2022/02/conception-fabrication-installation-alpes-alu.jpg', alt: "Deux techniciens au travail sur un établi de l'atelier, un mètre ruban et un marteau posés devant eux.", duotone: true },
  { id: 'atelier-cadres', src: U + '2021/10/Alpes-alu-conception-fabrication-fenetre-sur-mesure-aluminium.jpeg', alt: "Assemblage de cadres de fenêtres aluminium sur une table de l'atelier." },
  { id: 'devanture', src: U + '2021/10/alpes-alu-siege-social-devanture.jpeg', alt: "La façade de l'atelier Alpes Alu aux Sablonnières, un utilitaire siglé garé devant." },
  { id: 'flotte', src: U + '2021/10/alpes-alu-flotte-vehicule.jpeg', alt: 'Les véhicules Alpes Alu garés devant le bâtiment, montagnes au fond.' },
  { id: 'enseigne', src: U + '2021/10/alpes-alu-enseigne.jpeg', alt: "L'enseigne Alpes Alu au-dessus de la porte sectionnelle jaune de l'atelier." },
  { id: 'equipe-camions', src: U + '2021/10/equipe-alpes-alu-france.jpeg', alt: "Trois membres de l'équipe devant les utilitaires Alpes Alu." },
  { id: 'pierre', src: U + '2021/10/pierre-melquiond-dirigeant-alpes-alu.jpeg', crop: [0, 0, 1, 0.82], alt: 'Portrait de Pierre Melquiond, dirigeant.' },
  { id: 'victorien', src: U + '2021/10/victorien-melquiond-dirigeant-alpes-alu.jpg', crop: [0, 0, 1, 0.82], alt: 'Portrait de Victorien Melquiond, dirigeant.' },
  // Volets
  { id: 'volet-coulissant', src: U + '2021/10/alpes-alu-realisation-fabrication-conception-porte-fenetre-coulissante-volet-roulant-electrique.jpeg', alt: 'Porte-fenêtre coulissante équipée d’un volet roulant électrique à mi-course.' },
  // RGE
  { id: 'equipe-rge', src: U + '2022/02/alpes-alu-qualibat-rge-copie.jpg', alt: "L'équipe Alpes Alu devant l'atelier, avec les logos Alpes Alu et Qualibat RGE." },
  // Réalisations
  { id: 'g-baie-jardin', src: U + '2021/10/alpes-alu-conception-fabrication-porte-fenetre-baie-vitree-alu.jpg', alt: "Baie vitrée toute hauteur ouverte sur un jardin d'automne." },
  { id: 'g-angle', src: U + '2021/10/alpes-alu-conception-fabrication-installation-fenetre-baie-vitree-alu.jpg', alt: "Angle vitré sur jardin, vu de l'intérieur." },
  { id: 'g-coulissant', src: U + '2021/11/Alpes-Alu-Fenetre-coulissante-renovation.jpeg', alt: 'Fenêtre coulissante posée en rénovation, ouverte sur une terrasse.' },
  { id: 'g-rideau-bois', src: U + '2021/11/alpes-alu-rideau-metallique-decoration-aspect-bois.jpg', alt: 'Rideau métallique aspect bois et porte de service assortie.' },
  { id: 'g-entree', src: U + '2021/10/alpes-alu-conception-pose-porte-entree-service-commerce-vitrine.jpeg', alt: "Entrée vitrée d'un bâtiment de services, sous son auvent." },
  { id: 'g-porte-entree', src: U + '2021/11/porte-entree-2.jpeg', grade: { exposure: 0.25 }, alt: "Porte d'entrée anthracite à hublots vitrés." },
  { id: 'g-portail-double', src: U + '2021/10/alpes-alu-conception-installation-portail-double-exterieur.jpg', alt: 'Portail plein anthracite, montagne en arrière-plan.' },
  { id: 'g-portillon', src: U + '2021/10/alpes-alu-conception-fabrication-installation-portail-alu.jpg', alt: 'Portillon à lames verticales posé entre deux piliers.' },
  { id: 'g-rampe-chalet', src: U + '2021/10/alpes-alu-fabrication-sur-mesure-rampe-pour-escalier-particulier.jpeg', alt: "Rampe d'escalier métallique dans un chalet à charpente bois." },
  { id: 'g-rampe-ext', src: U + '2021/10/alpes-alu-rampe-et-escalier-sur-mesure.jpeg', alt: 'Rampe et escalier extérieurs sur mesure, face à la vallée.' },
  { id: 'g-escalier-facade', src: U + '2021/11/alpes-alu-fabrication-pose-structure-escalier-metal.jpg', alt: 'Escalier extérieur en acier fixé sur une façade en bois.' },
  { id: 'g-local-velo', src: U + '2021/10/alpes-alu-structure-exterieure-local-velo.jpg', alt: 'Local vélo en structure acier à panneaux découpés.' },
  { id: 'g-escalier-galva', src: U + '2021/11/alpes-alu-fabrication-installation-reglage-escalier-metallique.jpg', alt: 'Grand escalier extérieur en acier galvanisé, marches en caillebotis et garde-corps.' },
  { id: 'g-verriere', src: U + '2021/10/alpes-alu-conception-verriere-interieur-montant-alu.jpg', alt: "Verrière d'atelier noire dans un intérieur en bois." },
  { id: 'g-veranda', src: U + '2021/11/alpes-alu-fabrication-installation-veranda-metal.jpg', alt: 'Véranda métallique en cours de pose contre une maison.' },
  { id: 'g-grue-immeuble', src: U + '2021/10/alpes-alu-chantier-pose-vitres-chantier.jpeg', alt: "Grue en position devant un immeuble pour une pose de vitrage." },
  // Sponsoring (photos de Frédéric Turion)
  { id: 'rallye-1', src: U + '2022/05/294-Manosque-2022-scaled.jpg', alt: 'La voiture de rallye n° 211 aux couleurs de ses sponsors, rallye de Haute-Provence 2022.', credit: 'Frédéric Turion' },
  { id: 'rallye-2', src: U + '2022/05/Alpes-Alu-Manosque-2022-Sponsors-Frederic-Turion.jpg', alt: 'La voiture n° 211 dans un virage, rallye de Haute-Provence 2022.', credit: 'Frédéric Turion' },
];

// Environnement de reflets de la fenêtre 3D : la vue sur les sommets à
// travers le châssis composé (aucune image de synthèse).
// Environnement des reflets du hero : ciel et crêtes de la photo du hero (moitié gauche, sans la grue),
// mise en miroir pour boucler sans couture ; la ligne de crête tombe juste au-dessus de l'horizon.
export const ENV = { id: 'env-montagne', src: U + '2021/10/alpes-alu-chantier-pose-vitre-toiture.jpeg', crop: [0, 0, 0.48, 0.52], width: 1024, height: 512 };

export const WIDTHS = [640, 1280, 1920, 2560];
