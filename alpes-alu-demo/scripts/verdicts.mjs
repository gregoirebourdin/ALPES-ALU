// Verdicts établis à l'œil sur planches-contact (octobre 2026), puis appliqués
// au manifeste par `node scripts/verdicts.mjs`.
// verdict : « vraie photo », « banque d'images probable » ou « sans objet »
// (logos, pictos, schémas). score : 1 à 5, uniquement pour les vraies photos.
// cat : filtre de la galerie Réalisations.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const STOCK = "banque d'images probable";
const REAL = 'vraie photo';
const NA = 'sans objet';

// Vraies photos : une entrée par fichier (nom de fichier exact).
export const REAL_PHOTOS = {
  // Équipe et famille
  'alpes-alu-qualibat-rge-copie.jpg': { score: 5, cat: 'atelier', notes: "L'équipe en tenue grise devant la porte sectionnelle jaune de l'atelier, logos Alpes Alu et Qualibat RGE incrustés." },
  'equipe-alpes-alu-france.jpeg': { score: 4, cat: 'atelier', notes: 'Trois membres de l’équipe devant les utilitaires siglés.' },
  'pierre-melquiond-dirigeant-alpes-alu.jpeg': { score: 4, cat: 'atelier', notes: 'Portrait de Pierre Melquiond, net, lumière douce.' },
  'victorien-melquiond-dirigeant-alpes-alu.jpg': { score: 4, cat: 'atelier', notes: 'Portrait de Victorien Melquiond, visage net, fond flou.' },
  'duo.jpeg': { score: 2, cat: 'atelier', notes: 'Pierre et Victorien côte à côte. Trop petit (641 px) : écarté.' },
  'pierre-melquiond-dirigeant-alpes-alu-200x300-1.jpeg': { score: 1, cat: 'atelier', notes: 'Miniature du portrait de Pierre : doublon.' },
  // Atelier et locaux
  'conception-fabrication-installation-alpes-alu.jpg': { score: 5, cat: 'atelier', notes: "Deux techniciens à l'établi dans l'atelier." },
  'Alpes-alu-conception-fabrication-fenetre-sur-mesure-aluminium.jpeg': { score: 4, cat: 'atelier', notes: "Assemblage de cadres de fenêtres sur la table de l'atelier." },
  'Alpes-alu-conception-fabrication-fenetre-sur-mesure-struture-aluminium.jpeg': { score: 3, cat: 'atelier', notes: 'Même scène, cadrage voisin, un peu sombre : doublon partiel.' },
  'alpes-alu-siege-social-devanture.jpeg': { score: 4, cat: 'atelier', notes: 'Façade de l’atelier aux Sablonnières, utilitaire siglé devant.' },
  'alpes-alu-flotte-vehicule.jpeg': { score: 4, cat: 'atelier', notes: 'Véhicules siglés devant le bâtiment, montagne au fond.' },
  'alpes-alu-enseigne.jpeg': { score: 4, cat: 'atelier', notes: 'Enseigne « Alpes Alu menuiserie aluminium » au-dessus de la porte jaune.' },
  // Chantiers
  'alpes-alu-chantier-pose-vitre-toiture.jpeg': { score: 5, cat: 'chantiers', notes: 'Vitrage levé à la grue au-dessus des toits, montagnes au fond.' },
  'alpes-alu-chantier-pose-vitre.jpeg': { score: 4, cat: 'chantiers', notes: 'Deux poseurs guident le vitrage suspendu, sangles jaunes.' },
  'alpes-alu-chantier-pose-vitres-chantier.jpeg': { score: 3, cat: 'chantiers', notes: 'La grue en position devant l’immeuble.' },
  'Alpes-Alu-Chantier-chassis-compose-fenetre-scaled.jpg': { score: 5, cat: 'fenetres', notes: 'Châssis composé aluminium ouvert sur les sommets : la photo de référence du hero.' },
  // Fenêtres, baies, volets
  'alpes-alu-baie-vitree-chassis-aluminium-haut-de-gamme-sur-mesure.jpeg': { score: 4, cat: 'fenetres', notes: 'Baie coulissante sur balcon, reflet de la vallée. Grand-angle de téléphone : redressée.' },
  'alpes-alu-conception-fabrication-installation-fenetre-baie-vitree-alu.jpg': { score: 3, cat: 'fenetres', notes: 'Angle vitré bois-alu sur jardin.' },
  'alpes-alu-conception-fabrication-porte-fenetre-alu.jpg': { score: 3, cat: 'fenetres', notes: 'Porte-fenêtre coulissante dans un local professionnel.' },
  'alpes-alu-conception-fabrication-porte-fenetre-baie-vitree-alu.jpg': { score: 4, cat: 'fenetres', notes: 'Baie vitrée toute hauteur sur jardin d’automne.' },
  'alpes-alu-conception-fabrication-porte-fenetre-baie-vitree-alu-services.jpg': { score: 1, cat: 'fenetres', notes: 'Miniature de la précédente : doublon.' },
  'alpes-alu-conception-fabrication-porte-fenetre-exterieure-alu.jpg': { score: 3, cat: 'portes', notes: 'Porte vitrée deux vantaux, vue extérieure.' },
  'alpes-alu-fenetre-coulissante-chassis-aluminium-haut-de-gamme-sur-mesure.jpeg': { score: 3, cat: 'fenetres', notes: 'Coulissant sur terrasse, vue intérieure.' },
  'alpes-alu-fenetre-renovation-sur-mesure.jpeg': { score: 4, cat: 'fenetres', notes: 'Fenêtre de rénovation dans un mur de pierre.' },
  'Alpes-Alu-Fenetre-coulissante-renovation.jpeg': { score: 3, cat: 'fenetres', notes: 'Coulissant en rénovation, terrasse et table.' },
  'alpes-alu-fabrication-fenetre-aluminium.jpg': { score: 2, cat: 'fenetres', notes: 'Fenêtre deux vantaux, 800 px : trop petite.' },
  'alpes-alu-fabrication-installation-biae-vitree-sur-mesure.jpg': { score: 3, cat: 'fenetres', notes: 'Baie d’angle dans une construction bois en cours.' },
  'alpes-alu-realisation-fabrication-conception-porte-fenetre-coulissante-volet-roulant-electrique.jpeg': { score: 4, cat: 'fenetres', notes: 'Coulissant avec volet roulant électrique à mi-course : photo de la section volets.' },
  'alpes-alu-volet-roulant-exterieur.jpeg': { score: 3, cat: 'fenetres', notes: 'Volet roulant blanc posé en façade.' },
  'alpes-alu-installation-sav-volet-roulant-electrique.jpg': { score: 2, cat: 'fenetres', notes: 'Volet roulant en tableau, 915 px : trop petite.' },
  'alpes-alu-volet-exterieur-metallique.jpg': { score: 3, cat: 'fenetres', notes: 'Volets battants métalliques sombres.' },
  'alpes-alu-installation-store-interieur.jpg': { score: 2, cat: 'fenetres', notes: 'Store intérieur, cadrage serré peu lisible.' },
  'alpes-alu-pose-store-exterieur-tissu.jpg': { score: 3, cat: 'fenetres', notes: 'Store banne vu de dessous, sommets enneigés au fond.' },
  'alpes-alu-rideau-metal-interieur-store-venitien.jpg': { score: 2, cat: 'fenetres', notes: 'Store vénitien, 910 px : trop petite.' },
  'alpes-alu-pose-volet-roulant-solaire.jpg': { score: 1, cat: 'fenetres', notes: 'Vignette de 214 px.' },
  'volants-solaires-e1645779257805.jpg': { score: 1, cat: 'fenetres', notes: 'Vignette de 214 px.' },
  // Portes et garages
  'alpes-alu-conception-fabrication-installation-porte-blindee.jpg': { score: 3, cat: 'portes', notes: 'Porte de service aluminium en intérieur.' },
  'alpes-alu-conception-pose-porte-de-garage-immeuble-copropriete.jpeg': { score: 3, cat: 'portes', notes: 'Porte de garage sectionnelle d’immeuble, recadrée.' },
  'alpes-alu-conception-pose-porte-entree-commerce-service-vitrine.jpeg': { score: 3, cat: 'portes', notes: 'Entrée vitrée d’un centre médical, façade.' },
  'alpes-alu-conception-pose-porte-entree-service-commerce-vitrine.jpeg': { score: 4, cat: 'portes', notes: 'Même entrée, vue d’ensemble avec auvent.' },
  'alpes-alu-porte-de-garage-premium-haut-de-gamme.jpeg': { score: 4, cat: 'portes', notes: 'Porte sectionnelle anthracite dans un mur de pierre.' },
  'porte-garage-cover-Petite.jpg': { score: 1, cat: 'portes', notes: 'Miniature de la précédente : doublon.' },
  'alpes-alu-installation-porte-entree-vitree.jpg': { score: 2, cat: 'portes', notes: 'Porte d’entrée vitrée, image molle.' },
  'alpes-alu-pose-installation-porte-entree-principale-decoration-vegetal.jpg': { score: 3, cat: 'portes', notes: 'Porte d’entrée à décor végétal découpé.' },
  'porte-entree-1.jpeg': { score: 3, cat: 'portes', notes: 'Porte de service vitrée gris clair.' },
  'porte-entree-2.jpeg': { score: 3, cat: 'portes', notes: 'Porte d’entrée anthracite à hublots.' },
  'alpes-alu-installation-pose-reglage-rideau-metal-garage-sectionnelle.jpg': { score: 3, cat: 'portes', notes: 'Porte sectionnelle jaune de l’atelier, enseigne Alpes Alu.' },
  'alpes-alu-installation-reglagess-porte-garage.jpg': { score: 3, cat: 'portes', notes: 'Porte de garage aspect bois, voiture Alpes Alu devant.' },
  'alpes-alu-rideau-roulant-alu-exterieur.jpeg': { score: 3, cat: 'portes', notes: 'Rideau roulant aluminium baissé.' },
  'alpes-alu-rideau-metallique-decoration-aspect-bois.jpg': { score: 4, cat: 'portes', notes: 'Rideau métallique aspect bois et porte assortie.' },
  // Portails et clôtures
  'alpes-alu-conception-fabrication-installation-portail-alu.jpg': { score: 3, cat: 'portails', notes: 'Portillon à lames verticales entre deux piliers.' },
  'alpes-alu-conception-installation-portail-coulissant-exterieur.jpg': { score: 4, cat: 'portails', notes: 'Portail coulissant, falaise et ciel bleu au fond.' },
  'alpes-alu-conception-installation-portail-double-exterieur.jpg': { score: 4, cat: 'portails', notes: 'Portail plein anthracite, montagne au fond.' },
  'portail-cover-Petite.jpeg': { score: 1, cat: 'portails', notes: 'Miniature du portail coulissant : doublon.' },
  'portail-coulissant.png': { score: 2, cat: 'portails', notes: 'Portail coulissant vert, 1 096 px avec liseré blanc.' },
  'battant-Petite.png': { score: 2, cat: 'portails', notes: 'Portail battant vert, 646 px : trop petit.' },
  'barriere-fabrication-alpes-alu.jpg': { score: 3, cat: 'portails', notes: 'Clôture métallique le long d’une allée.' },
  'alpes-alu-fabrication-barriere-garde-corps-sur-mesure-metal.jpg': { score: 3, cat: 'portails', notes: 'Barrière métallique doublée d’une haie.' },
  // Escaliers, garde-corps, structures
  'alpes-alu-conception-fabrication-escalier-exterieur.jpg': { score: 3, cat: 'escaliers', notes: 'Escalier extérieur caillebotis, vue plongeante.' },
  'alpes-alu-conception-fabrication-installation-marquise-scaled.jpg': { score: 3, cat: 'escaliers', notes: 'Marquise et escalier d’accès en façade.' },
  'alpes-alu-construction-metalique-escalier-1-e1645781528601.jpg': { score: 2, cat: 'escaliers', notes: 'Escalier quart tournant noir, sombre : exposition relevée.' },
  'alpes-alu-construction-metalique-escalier.jpg': { score: 1, cat: 'escaliers', notes: 'Même escalier, très sombre : écarté.' },
  'alpes-alu-escalier-acces-exterieur.jpg': { score: 3, cat: 'escaliers', notes: 'Escalier d’accès extérieur le long d’une main courante bois.' },
  'alpes-alu-escalier-acier-bois-interieur.jpg': { score: 3, cat: 'escaliers', notes: 'Escalier acier et marches bois en intérieur.' },
  'alpes-alu-fabrication-structure-escalier-acier-scaled.jpeg': { score: 2, cat: 'escaliers', notes: 'Même escalier, version agrandie floue : doublon.' },
  'alpes-alu-escalier-acier-exterieur.jpeg': { score: 3, cat: 'escaliers', notes: 'Escalier extérieur acier sur chalet.' },
  'alpes-alu-fabrication-pose-structure-escalier-metallique.jpg': { score: 2, cat: 'escaliers', notes: 'Même escalier que le précédent : doublon.' },
  'alpes-alu-fabrication-pose-structure-escalier-metal.jpg': { score: 4, cat: 'escaliers', notes: 'Escalier extérieur acier sur façade bois, cadrage large.' },
  'alpes-alu-escalier-exterieur-acces-scaled.jpeg': { score: 4, cat: 'escaliers', notes: 'Escalier galvanisé à double rampe.' },
  'alpes-alu-fabrication-sur-mesure-rampe-pour-escalier-particulier.jpeg': { score: 4, cat: 'escaliers', notes: 'Rampe d’escalier dans un chalet, charpente bois.' },
  'alpes-alu-rampe-et-escalier-sur-mesure.jpeg': { score: 4, cat: 'escaliers', notes: 'Rampe et escalier extérieurs, vallée au fond.' },
  'alpes-alu-rembarde-escalier-exterieure.jpg': { score: 3, cat: 'escaliers', notes: 'Garde-corps de terrasse sur soubassement en pierre.' },
  'alpes-alu-fabrication-garde-corps-balcon-exterieur.jpg': { score: 3, cat: 'escaliers', notes: 'Garde-corps de balcon à barreaudage.' },
  'alpes-alu-fabrication-installation-reglage-escalier-metallique.jpg': { score: 3, cat: 'escaliers', notes: 'Escalier métallique extérieur en pente douce.' },
  'alpes-alu-structure-exterieure-local-velo.jpg': { score: 4, cat: 'escaliers', notes: 'Local vélo à panneaux découpés, structure acier.' },
  'alpes-alu-structure-local-velo-exterieure.jpg': { score: 3, cat: 'escaliers', notes: 'Même local vélo, vue de face.' },
  'escaliers-1-Petite-rotated.jpg': { score: 1, cat: 'escaliers', notes: 'Vignette : doublon.' },
  'escaliers-1-Petite.png': { score: 1, cat: 'escaliers', notes: 'Vignette.' },
  'escaliers-2-Petite-rotated.jpg': { score: 1, cat: 'escaliers', notes: 'Vignette.' },
  'escaliers-3-Petite.png': { score: 1, cat: 'escaliers', notes: 'Vignette.' },
  // Vérandas et verrières
  'alpes-alu-conception-fabrication-installation-verriere-interieure-fixe.jpg': { score: 3, cat: 'verandas', notes: 'Verrière fixe d’angle en intérieur.' },
  'alpes-alu-conception-fabrication-installation-verriere.jpg': { score: 1, cat: 'verandas', notes: 'Miniature de la précédente : doublon.' },
  'alpes-alu-conception-fabrication-verriere-aluminium-1.jpg': { score: 3, cat: 'verandas', notes: 'Verrière en pignon, vue en contre-plongée.' },
  'alpes-alu-conception-fabrication-verriere-aluminium.jpg': { score: 2, cat: 'verandas', notes: 'Même verrière : doublon.' },
  'alpes-alu-conception-verriere-interieur-montant-alu.jpg': { score: 4, cat: 'verandas', notes: 'Verrière d’atelier noire dans un intérieur bois.' },
  'alpes-alu-fabrication-sur-mesure-vitrage-separatif-cuisine-interieur-maison.jpeg': { score: 4, cat: 'verandas', notes: 'Vitrage séparatif de cuisine, même chantier que la verrière.' },
  'alpes-alu-fabrication-installation-pergola-vitree.jpg': { score: 4, cat: 'verandas', notes: 'Pergola vitrée en façade de chalet, montagne au fond.' },
  'alpes-alu-fabrication-installation-veranda-metal.jpg': { score: 3, cat: 'verandas', notes: 'Véranda métallique verte en cours de pose.' },
  // Sponsoring (rallye de Manosque 2022, crédit photo Frédéric Turion)
  '294-Manosque-2022-scaled.jpg': { score: 4, cat: 'sponsoring', notes: 'Rallye de Manosque 2022, voiture sponsorisée. Crédit : Frédéric Turion.' },
  '296-Manosque-2022-scaled.jpg': { score: 3, cat: 'sponsoring', notes: 'Rallye de Manosque 2022. Crédit : Frédéric Turion.' },
  '299-Manosque-19-20-mars-2022.jpg': { score: 3, cat: 'sponsoring', notes: 'Rallye de Manosque 2022, signature du photographe. Crédit : Frédéric Turion.' },
  'Alpes-Alu-Manosque-2022-Sponsors-Frederic-Turion.jpg': { score: 3, cat: 'sponsoring', notes: 'Rallye de Manosque 2022. Crédit : Frédéric Turion.' },
};

// Tout le reste : règles par motif, la première qui correspond l'emporte.
export const RULES = [
  [/^logo-alpes-alu-(copie|jaune|blanc)\.png$|^favicon-alpes-alu\.png$/, { verdict: NA, kind: 'logo Alpes Alu', notes: 'Référence du logo, redessiné en SVG.' }],
  [/^(gabari-logo-partenaire|partenaire-alpes-alu|logo-(abram|AtlanteM|mariton|prolians|sofradef|Storipro)|thermolaqualp|zinq)/i, { verdict: NA, kind: 'logo partenaire', notes: 'Logo présent sur le site. Usage [À VALIDER AVEC ALPES ALU].' }],
  [/^logo-afaq|maitre-artisant/i, { verdict: NA, kind: 'label non vérifié', notes: 'Label non vérifié : ne pas afficher.' }],
  [/^(logo-fait-en-france|Made-in-france|devis-gratuit-rapide|icon-customer|icon-cookies)/i, { verdict: NA, kind: 'pictogramme du site', notes: 'Badge ou pictogramme du site actuel.' }],
  [/^(fenetre-(1v|2v|fixe|soufflet)|coulissant-2v|fenetre-coulissante-3-vantaux|miniature-fenetre-1v-ob|votre-fenetre-en-detail)/, { verdict: NA, kind: 'schéma du site', notes: 'Schéma technique du site, sert de référence aux dessins SVG.' }],
  [/(Simple|Double|Feuillete)-Vitrage/, { verdict: NA, kind: 'illustration produit', notes: 'Coupe de vitrage en image de synthèse.' }],
  [/^(contact-tel-alpes-alu|devis-alpes-alu|main-jaune)/, { verdict: NA, kind: 'graphisme du site', notes: 'Vignette graphique du site actuel.' }],
  [/^(promina-|ptt_about|core_counter|h3_slider|tower\.jpg|video_big2|building\.png|testimonial-|testi-bg|service_overlay|box_bg|widget_bg|hand\.jpg|bg-map|chart\.png|marker\.png|client-01|sig\.png|feature-icon|service_icon|Icon-\d|image_box|project-icon|favicon\.png|footer_logo|footer-logo|woocommerce-placeholder)/, { verdict: STOCK, kind: 'démo du thème Promina', notes: 'Fichier de démonstration du thème, sans lien avec Alpes Alu.' }],
  [/^alpes-alu-materiaux-acier-alu-/, { verdict: STOCK, kind: 'texture métal', notes: 'Texture de banque d’images.' }],
  [/^alpes-alu-atelier-(conception|travail|soudure|fabrication)/, { verdict: STOCK, kind: 'atelier générique', notes: 'Soudure et découpe pleines d’étincelles : banque d’images, jamais présentée comme l’atelier.' }],
  [/^alpes-alu-atelier-outil/, { verdict: STOCK, kind: 'atelier générique', notes: 'Machine-outil générique.' }],
  [/^(alpes-alu-service-serrurerie-sav|alpes-alu-sav-secours-serrurerie|alpes-alu-specialiste-fermeture-serrurerie|alpes-alu-service-depannage-serrurier|alpes-alu-service-sav-a-domicile-serrurier)/, { verdict: STOCK, kind: 'serrurerie générique', notes: 'Mains, clés et serrures sans lieu identifiable.' }],
  [/^(alpes-alu-profile-metal-alu-fenetre-premium|alpes-alu-porte-entree-principale-maison-particuliere|alpes-alu-conception-sur-plan-projet-construction-neuf|alpes-alu-illustration-3D|fenetre-alpes-alu-france|alpes-alu-realisation-escalier-sur-mesure-chez-vous|alpes-alu-realisation-projet-sur-mesure)/, { verdict: STOCK, kind: 'image générique', notes: 'Image trop parfaite, sans lieu ni marque : banque d’images.' }],
  [/^(alpes-alu-fabrication-installation-fenetre-ouvrant-aluminium|alpes-alu-fabrication-ouvrants-fenetre-aluminium|realisation-alpes-alu|alpes-alu-installation-fenetre-(coulissante|oscillo-battante))/, { verdict: STOCK, kind: 'rendu 3D ou photomontage', notes: 'Maison ou pièce en image de synthèse, parfois sur fond de montagne : pas une réalisation.' }],
  [/^Volet-roulant-solaire-alpes-alu/, { verdict: STOCK, kind: 'visuel fabricant', notes: 'Photo de catalogue fabricant (coffre solaire), sans lieu identifiable.' }],
  [/(-utc-|^Alpes-Alu-vitrerie-depannage-vitre-casse|^reference-catalogue-|^store-|^veranda-|^moustiquaire|^Moustiquaire|^garde-corps-|^escaliers-(2-Petite|cover)|^escalier-(colimacon|dans-immeuble)|^porte-entree-cover|^autoportant|^baies-vitrees-chassis-compose-Petite|^a-room-with)/, { verdict: STOCK, kind: 'photo produit générique', notes: 'Photo produit ou d’ambiance de banque d’images.' }],
  [/^(banniere-cookies|cgv-|contact-alpes-alu|contacts-alpes-alu|cookies-alpes-alu|mentions-legales|politique-de-confidentialite)/, { verdict: STOCK, kind: 'bandeau de page légale', notes: 'Bandeau d’en-tête de banque d’images.' }],
];

export function verdictFor(filename) {
  const real = REAL_PHOTOS[filename];
  if (real) return { verdict: REAL, kind: 'photo Alpes Alu', ...real };
  for (const [re, v] of RULES) if (re.test(filename)) return { ...v, score: null, cat: null };
  return null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = join(dirname(fileURLToPath(import.meta.url)), '../assets/raw/manifest.json');
  const manifest = JSON.parse(await readFile(file, 'utf8'));
  const missing = [];
  for (const it of manifest.images) {
    const name = it.local.split('/').pop();
    const v = verdictFor(name);
    if (!v) {
      missing.push(name);
      continue;
    }
    Object.assign(it, { verdict: v.verdict, kind: v.kind, score: v.score ?? null, cat: v.cat ?? null, notes: v.notes });
  }
  const unused = Object.keys(REAL_PHOTOS).filter((n) => !manifest.images.some((it) => it.local.endsWith('/' + n)));
  await writeFile(file, JSON.stringify(manifest, null, 2));
  const count = (k) => manifest.images.filter((i) => i.verdict === k).length;
  console.log(`vraies photos : ${count(REAL)} · banque d'images probable : ${count(STOCK)} · sans objet : ${count(NA)}`);
  if (missing.length) console.log('sans verdict :', missing);
  if (unused.length) console.log('entrées inconnues :', unused);
}
