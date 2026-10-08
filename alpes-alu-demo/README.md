# Alpes Alu — maquette de page d’accueil

Maquette de démonstration **non officielle**, proposée à Alpes Alu (menuiserie aluminium, acier et inox à
L’Argentière-la-Bessée, Hautes-Alpes, depuis 1988). Elle n’est pas publique : `meta robots noindex, nofollow`,
en-tête HTTP `X-Robots-Tag: noindex, nofollow`, `robots.txt` qui interdit tout, et la mention « Maquette de
démonstration non officielle, proposée à Alpes Alu » en pied de page. Liens de navigation et boutons sont
inertes (aucune action), mais entièrement animés.

- En ligne (Vercel) : https://alpes-alu-maquette.vercel.app
- Parti pris artistique et spécification des animations : [`docs/design.md`](docs/design.md)
- Captures : [`docs/screens/`](docs/screens) — vidéos de défilement : [`docs/videos/`](docs/videos)

## Lancer le projet

Node 20 ou plus récent.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # vérifie les types puis construit dans dist/
npm run preview   # sert dist/ sur http://localhost:4173
```

Les images optimisées (`public/img/photos/`) et les polices (`public/fonts/`) sont versionnées : `npm run dev`
fonctionne sans étape préalable.

### Scripts annexes

| Commande | Rôle |
|---|---|
| `npm run fetch:source` | Aspire alpesalu.fr (pages listées, 17 pages /service/, 4 articles) et la médiathèque WordPress (originaux) dans `assets/raw/`, avec `manifest.json` |
| `node scripts/verdicts.mjs` | Pose le verdict de chaque image du manifeste (vraie photo / banque d’images probable / sans objet) |
| `npm run images` | Étalonnage commun (montagne froide, jaune du logo préservé), recadrages, AVIF + WebP 640 → 2560, LQIP, duotone, image Open Graph, carte d’environnement des reflets 3D |
| `npm run fonts` + `python3 scripts/subset-fonts.py` | Récupère Archivo, Instrument Sans et IBM Plex Mono, puis les réduit (latin utile, axes figés) |
| `node scripts/gen-svg.mjs` | Génère la crête relevée du hero, les courbes de niveau de la carte et la vue éclatée |
| `node scripts/build-logo-symbols.mjs` | Produit les symboles SVG du logo redessiné (`scripts/logo/` contient l’ajustement sur le PNG d’origine) |
| `npm run svg` | Passe SVGO sur les logos et le favicon |
| `npm run screens` | Captures pleine page aux largeurs 360, 390, 430, 768, 1024, 1280, 1440, 1920, 2560 et téléphone paysage, puis les cinq moments clés (serveur `npm run preview` lancé) |
| `npm run videos` | Vidéos WebM du défilement complet, ordinateur et téléphone (serveur `npm run preview` lancé) |

Seuls les originaux réellement utilisés sont versionnés dans `assets/raw/uploads/` ; `npm run fetch:source`
récupère les autres.

## Structure

```
index.html              tête (méta, Open Graph, JSON-LD, polices), assemble les partials
partials/               les 16 sections en HTML (+ sprite SVG, symboles du logo, SVG générés)
src/styles/             jetons, base, en-tête, préchargement, hero, sections, calques
src/modules/            core (Lenis, préchargement, en-tête, menu, curseur, réglette), hero (+ hero3d WebGL),
                        shutter (volet roulant), sections (une fonction par section)
src/generated/          photos.json (dimensions, largeurs, LQIP) produit par le pipeline d’images
scripts/                aspiration, verdicts, images, polices, SVG, logo, captures, vidéos
assets/raw/             pages et médias aspirés, manifest.json
assets/logo-reference/  PNG d’origine du logo, gardés comme référence
docs/                   design.md, captures, vidéos
```

Pile : Vite 8 + TypeScript (aucun framework d’interface), GSAP 3 (ScrollTrigger, SplitText, Flip), Lenis,
OGL pour la seule fenêtre 3D du hero (chargée à part, 20 Ko compressés).

## Les cinq moments

1. **La fenêtre du hero** : coulissant aluminium modélisé en code (profilés balayés, onglets à 45°), alu anodisé
   brossé dont les reflets viennent du vrai ciel de la photo, vitrage qui laisse voir la vue. La photo est voilée
   autour de la fenêtre ; au scroll, le vantail coulisse, les cotes se tracent, la lumière revient et la fenêtre
   s’efface sur la photo plein écran. Elle suit légèrement la souris. Repli SVG (même animation) sans WebGL,
   sur appareil modeste ou en mouvement réduit ; la scène 3D se charge à la première interaction.
2. **La vue éclatée** : dormant, joints, ouvrant, vitrage, crémone et poignée se rassemblent en cinq étapes,
   cotes tracées, de la prise de mesures à la pose.
3. **Le volet roulant** : entre les grandes sections, un volet descend lame par lame (la lumière passe entre les
   lames), se ferme puis remonte sur la section suivante. Lié au scroll, réversible, jamais bloquant.
4. **Le mur de l’atelier** : vraies photos de l’équipe et de l’atelier encadrées comme des vitrages, reflet qui
   glisse au survol.
5. **La cornière devient le bouton** : à l’appel final, la bande du logo traverse l’écran, montant en tête, puis
   se rétracte jusqu’à n’être plus que le bouton « Demander un devis » ; le titre au-dessus reprend la place du mot
   « Alpes Alu » du logo.

## Faits affichés et leurs sources (site actuel alpesalu.fr)

| Affiché | Source |
|---|---|
| Depuis 1988, société familiale et artisanale | accueil, société (« votre spécialiste portes & fenêtres depuis 1988 », « société artisanale et familiale ») |
| Atelier dans la zone artisanale des Sablonnières | accueil (« atelier situé dans la zone artisanale… ») |
| 37 rue de la Série E, Parc d’activité Les Sablonnières, 05120 L’Argentière-la-Bessée | pied de page de toutes les pages |
| 04 92 23 07 39 ; du lundi au vendredi 8 h 30 – 12 h / 13 h 30 – 17 h | pied de page, contact |
| Réponse sous 24 heures ; devis gratuit | accueil (« Nous vous répondrons sous 24 heures », « propositions sur devis… GRATUITES ») |
| Aluminium, acier, inox ; menuiseries, garde-corps, escaliers, persiennes, vérandas, portails | société |
| Grand Briançonnais, Pays des Écrins, Guillestrois ; particuliers et professionnels | contact, vitrerie, accueil |
| Qualification Qualibat RGE, condition des aides, experts indépendants, formation | article « Qualification RGE » (2022) |
| « Certifié et agréé “Serrurier” », ouverture de porte, serrures, blindage | société, accueil |
| Spécifications des métiers (vantaux, finitions satiné/laqué/brossé, galandage, linteau, coffre arrondi ou pan coupé, bicolore, solaire, caillebotis…) | pages /service/ correspondantes |
| Pierre et Victorien Melquiond, « dirigeant » | page Réalisations ; titres des photos de la médiathèque (`pierre-melquiond-dirigeant-alpes-alu`, `victorien-melquiond-dirigeant-alpes-alu`) |
| Rallye 2022 (n° 211, Haute-Provence autour de Manosque, puis Venasque ; copilote Hugo Poletto) | article « Alpes Alu, sponsor officiel de Gérard BOUCHIE » (2022) |

Rien d’autre : aucun chiffre inventé (ni chantiers, ni clients, ni années cumulées, ni surfaces), aucune
performance technique chiffrée, aucun prix ni délai d’intervention, aucun label non vérifié, aucun témoignage
ni récompense. Les coquilles du site n’ont pas été reprises (« réglages » de menuiseries, « Béssée »,
« privacité », « Cette certificat », « limon tournat »…).

## À valider avec Alpes Alu

Ces points apparaissent dans la page sous forme d’étiquettes « À valider ».

1. **Adresse e-mail** de contact : absente du site actuel.
2. **Citation** de Pierre ou de Victorien Melquiond sur l’entreprise familiale (emplacement réservé).
3. **Qualification Qualibat RGE** : validité en 2026 à vérifier sur qualibat.com (l’article date de 2022).
4. **Agrément « Serrurier »** : nature exacte de la certification et de l’agrément.
5. **Lieux des 20 réalisations** : aucun nom de commune n’a été inventé ; légendes rédigées d’après la photo et
   le nom du fichier, à confirmer.
6. **Logos des partenaires et fournisseurs** (18, repris du site actuel) : liste, droit d’usage, versions couleur.
7. **Partenariat rallye** : toujours d’actualité ? Orthographe du nom (Bouchié ou Bouchie, les deux sur le site).
8. **Fonctions** de Pierre et Victorien Melquiond : « Dirigeant » vient du titre des photos, à confirmer.
9. **Page Facebook** : nom exact à afficher.
10. Contenu des pages liées (mentions légales, confidentialité, cookies, catalogue) : hors maquette, liens inertes.

## Photos utilisées

Toutes sont des **vraies photos** d’Alpes Alu tirées de sa médiathèque (verdict dans
`assets/raw/manifest.json` : 288 images, 92 vraies photos, 149 images de banque probables écartées, 47 sans objet).
Aucune image de banque n’est présentée comme une réalisation, aucune image n’est générée par IA. Fichiers
d’origine (dossier `wp-content/uploads/`) :

- **Hero**, carte des reflets 3D et image de partage : `2021/10/alpes-alu-chantier-pose-vitre-toiture.jpeg`
- **Métiers** : `alpes-alu-fenetre-renovation-sur-mesure.jpeg`, `Alpes-Alu-Chantier-chassis-compose-fenetre-scaled.jpg`,
  `alpes-alu-volet-roulant-exterieur.jpeg`, `alpes-alu-porte-de-garage-premium-haut-de-gamme.jpeg`,
  `alpes-alu-conception-installation-portail-coulissant-exterieur.jpg`, `alpes-alu-fabrication-installation-pergola-vitree.jpg`,
  `alpes-alu-escalier-exterieur-acces-scaled.jpeg`, `alpes-alu-fabrication-sur-mesure-vitrage-separatif-cuisine-interieur-maison.jpeg`,
  `alpes-alu-conception-fabrication-installation-porte-blindee.jpg`
- **Vue éclatée** (pose) : `alpes-alu-chantier-pose-vitre.jpeg`
- **Atelier et famille** : `alpes-alu-qualibat-rge-copie.jpg`, `conception-fabrication-installation-alpes-alu.jpg`,
  `Alpes-alu-conception-fabrication-fenetre-sur-mesure-aluminium.jpeg`, `alpes-alu-siege-social-devanture.jpeg`,
  `alpes-alu-flotte-vehicule.jpeg`, `alpes-alu-enseigne.jpeg`, `equipe-alpes-alu-france.jpeg`,
  `pierre-melquiond-dirigeant-alpes-alu.jpeg`, `victorien-melquiond-dirigeant-alpes-alu.jpg`
- **Volets** : `alpes-alu-realisation-fabrication-conception-porte-fenetre-coulissante-volet-roulant-electrique.jpeg`
- **Qualibat RGE** : `alpes-alu-qualibat-rge-copie.jpg` (photo de l’équipe avec les logos, telle que publiée)
- **Réalisations** (20 vignettes, dont 6 photos des métiers et la pose) : `alpes-alu-conception-fabrication-porte-fenetre-baie-vitree-alu.jpg`,
  `alpes-alu-conception-fabrication-installation-fenetre-baie-vitree-alu.jpg`, `Alpes-Alu-Fenetre-coulissante-renovation.jpeg`,
  `alpes-alu-rideau-metallique-decoration-aspect-bois.jpg`, `alpes-alu-conception-pose-porte-entree-service-commerce-vitrine.jpeg`,
  `porte-entree-2.jpeg`, `alpes-alu-conception-installation-portail-double-exterieur.jpg`, `alpes-alu-conception-fabrication-installation-portail-alu.jpg`,
  `alpes-alu-fabrication-sur-mesure-rampe-pour-escalier-particulier.jpeg`, `alpes-alu-rampe-et-escalier-sur-mesure.jpeg`,
  `alpes-alu-fabrication-pose-structure-escalier-metal.jpg`, `alpes-alu-structure-exterieure-local-velo.jpg`,
  `alpes-alu-fabrication-installation-reglage-escalier-metallique.jpg`, `alpes-alu-conception-verriere-interieur-montant-alu.jpg`,
  `alpes-alu-fabrication-installation-veranda-metal.jpg`, `alpes-alu-chantier-pose-vitres-chantier.jpeg`
- **Rallye** (crédit Frédéric Turion) : `2022/05/294-Manosque-2022-scaled.jpg`, `2022/05/Alpes-Alu-Manosque-2022-Sponsors-Frederic-Turion.jpg`
- **Logos partenaires** (`public/img/partners/`) : Abram, Atlantem, Bricard, Bubendorff, Installux, La Toulousaine,
  Mariton, Picard, Point Fort Fichet, Prolians, Saint-Gobain, Sofradef, Somfy, StoriPro, Thermolaqualp,
  Tordjman Métal, Vachette, Zinq.

Le **logo** est redessiné en SVG d’après les PNG du site (mêmes lettres, même inclinaison, mêmes proportions,
jaune `#F4D20D` mesuré dans le PNG d’origine, profil couleur Display P3 converti en sRGB) ; les PNG restent dans
`assets/logo-reference/`.

## Titres H1 proposés

1. « Vos fenêtres, fabriquées ici depuis 1988. » — retenu.
2. « La montagne mérite un beau cadre. » — gardé pour la section anatomie.
3. « Conçu, fabriqué et posé par une entreprise familiale. » — gardé pour l’atelier.

## Qualité vérifiée

- **Lighthouse** (build de production) — mobile : performance 93 à 95, accessibilité 100, bonnes pratiques 100,
  CLS 0, TBT 40 à 80 ms ; ordinateur : 99 / 100 / 100. Le score SEO est volontairement bas (`noindex`).
  LCP mesuré sur la machine : 0,2 s ; LCP simulé par Lighthouse en 4G lente : 2,7 à 3 s.
- **axe-core** : aucune violation (ordinateur et mobile, avec et sans mouvement réduit). Contrastes AA,
  un seul H1, repères ARIA, `lang="fr"`, textes alternatifs en français.
- **Clavier** : lien d’évitement, focus visible partout, menu mobile (focus piégé, Échap), visionneuse
  (flèches, Échap, focus restitué), hotspots de l’anatomie, filtres, interrupteur des volets.
- **Mouvement réduit** : pas de préchargement, pas de Lenis, pas d’épinglage ; tout le contenu est lisible
  (les neuf métiers passent en grille).
- **Réactif** : aucun défilement horizontal de 360 à 2560 px ni en paysage ; cibles tactiles de 44 px.
- Console sans erreur sur toute la page (ordinateur et téléphone).

## Déploiement

Projet Vercel `alpes-alu-maquette`, relié à ce dépôt (dossier racine `alpes-alu-demo/`, voir `vercel.json`) :
chaque push sur la branche de production redéploie le site. L’adresse vercel.app est accessible à toute
personne qui la connaît ; pour la réserver à Alpes Alu, activer la protection des déploiements (Vercel
Authentication ou mot de passe) dans les réglages du projet.

## Crédits

Photos : Alpes Alu. Rallye : Frédéric Turion. Polices : Archivo, Instrument Sans, IBM Plex Mono (SIL Open Font
License). Bibliothèques : GSAP (licence standard GreenSock, gratuite), Lenis (MIT), OGL (MIT).
