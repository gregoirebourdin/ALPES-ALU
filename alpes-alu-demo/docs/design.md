# Alpes Alu · document de conception

Maquette de démonstration non officielle, proposée à Alpes Alu. Ce document fixe
les choix avant le code ; la planche d'exploration (tendances, palette,
typographies, trois pistes de hero) est sur le canevas Claude Design
« Cadrer la montagne ».

## 1. Concept : « Cadrer la montagne »

Une fenêtre, c'est un cadre posé sur un paysage. La page raconte comment un
profilé brut, coupé et assemblé aux Sablonnières, devient le cadre à travers
lequel une famille regarde les sommets.

Fil rouge visuel : la **coupe technique de menuiserie** (profilés en coupe, cotes,
vitrages, joints) et la **cornière jaune** du logo, qui revient partout comme un
repère de chantier : angles des cadres photo, puces, séparateurs, curseur du mètre
ruban, bouton final.

L'enjeu commercial tient en une phrase : les magasins de réseau revendent, Alpes
Alu conçoit, fabrique et pose depuis son propre atelier. Chaque section doit le
montrer par une preuve (une vraie photo, un geste d'atelier, un fait vérifié),
jamais par un superlatif.

### Pistes de hero explorées

| Piste | Idée | Verdict |
|---|---|---|
| **A · La fenêtre sur le chantier** | Fenêtre aluminium en 3D devant la vraie photo de la vitre levée à la grue au-dessus des toits. Au scroll, l'ouvrant coulisse et la fenêtre s'efface. | **Retenue.** Le 3D porte le « waouh » des premières secondes, la photo apporte la preuve : on fabrique et on vient poser, même à la grue. Personne d'autre ne peut montrer cette image. |
| B · La coupe technique | Fond neige, grande coupe de profilé cotée, titre massif à gauche. | Très juste pour l'univers, mais froide et sans preuve humaine. Reprise dans les sections 06 et 08. |
| C · Le panorama cadré | Bandeau panoramique du châssis composé face aux sommets, encadré de cornières. | Belle image, mais l'intérieur photographié (téléviseur, canapé) oblige à un recadrage très large. Reprise comme environnement de reflets du verre 3D. |

### Les cinq moments à réussir

1. **La fenêtre qui s'ouvre** (hero) : WebGL, alu anodisé brossé, verre qui reflète la montagne et réfracte la photo.
2. **La fenêtre qui se monte toute seule** (section 06) : vue éclatée SVG, pièces qui glissent à leur place, cotes qui se tracent.
3. **Le volet roulant** : transition signature entre les grandes sections, lame par lame, au rythme du scroll.
4. **Le mur de l'atelier** (section 07) : vraies photos sous vitrage encadré, reflet qui suit la souris.
5. **La cornière jaune** (section 15) : la bande en L du logo traverse l'écran et devient le bouton « Demander un devis ».

## 2. Palette et rôles

| Jeton | Valeur | Rôle | Contrastes vérifiés |
|---|---|---|---|
| `--graphite` | `#121417` | fond sombre, texte principal sur clair | neige dessus 16,9:1 |
| `--graphite-2` | `#1B1E22` | surfaces surélevées sur fond sombre | — |
| `--alu` | `#C9CDD1` | surfaces, filets, texte sur fond sombre | sur graphite 11,5:1 |
| `--gris` | `#7E858C` | texte secondaire **sur fond sombre**, filets | sur graphite 4,9:1 |
| `--gris-fonce` | `#5E656C` | texte secondaire **sur fond clair** | sur neige 5,4:1 |
| `--neige` | `#F4F5F2` | fond clair | — |
| `--glacier` | `#B9CED6` | teinte du verre, jamais du texte | — |
| `--jaune` | `#F4D20D` (P3 `0.953 0.820 0.196`) | accent unique | graphite dessus 12,4:1 |

Le jaune est **relevé dans le PNG du logo** : la valeur brute (243, 209, 50)
est exprimée dans un profil « Display P3 » embarqué ; convertie en sRGB, elle
donne `#F4D20D`, la teinte que les navigateurs affichent aujourd'hui sur le
site. Les écrans larges reçoivent la valeur P3 d'origine.

Le gris profilé demandé (`#7E858C`) ne passe pas le contraste AA en texte
courant sur fond neige (3,4:1) : il reste réservé aux fonds sombres et aux
filets, et une nuance plus foncée prend le relais sur fond clair.

Règles : le jaune ne sert qu'aux actions, aux tracés animés et aux cornières ;
le seul aplat jaune est l'appel final. Sur jaune, texte graphite uniquement.
Le site est volontairement mono-thème (alternance neige / graphite dictée par la
narration) : il ne bascule pas avec le thème du système.

## 3. Typographies

| Rôle | Police | Pourquoi |
|---|---|---|
| Titres | **Archivo** variable (graisse 100–900, largeur 62–125) | Grotesque américaine du XIXᵉ redessinée : des épaules carrées et une graisse noire qui répondent au lettrage du logo. La comparaison au pixel près montre qu'Archivo Black Italic recouvre le mot « Alpes Alu » à 89,5 % : les titres et le logo sont de la même famille. L'axe de largeur sert la métaphore de l'extrusion. |
| Texte | **Instrument Sans** variable | Sans-serif sobre, ouverte, très lisible en petit corps, sans le côté « par défaut » d'Inter ou de Roboto. |
| Annotations | **IBM Plex Mono** 300 / 400 | Mono technique pour les cotes, numéros de section, légendes, téléphone : la voix du plan d'atelier. |

Auto-hébergées en WOFF2, sous-ensemble latin, `font-display: swap`, les deux
fichiers utiles au premier écran sont préchargés.

### Échelle (fluide, `clamp()`)

| Style | Taille | Interligne | Réglages |
|---|---|---|---|
| Display (H1) | `clamp(3.25rem, 1.6rem + 6.6vw, 10.5rem)` | 0,9 | Archivo 850, largeur 108, approche −0,028em |
| H2 | `clamp(2.5rem, 1.5rem + 4.4vw, 6rem)` | 0,94 | Archivo 820, largeur 104 |
| H3 | `clamp(1.6rem, 1.3rem + 1.1vw, 2.5rem)` | 1,05 | Archivo 760 |
| Chapô | `clamp(1.2rem, 1.1rem + 0.45vw, 1.5rem)` | 1,45 | Instrument Sans 450 |
| Texte | `clamp(1.0625rem, 1rem + 0.2vw, 1.125rem)` | 1,55 | Instrument Sans 400, 65 caractères max |
| Mono | `clamp(0.6875rem, 0.66rem + 0.12vw, 0.8125rem)` | 1,4 | Plex Mono 400, capitales, +0,14em |

Titres en `text-wrap: balance`, texte en `text-wrap: pretty`.

## 4. Grille

- 12 colonnes, gouttière `clamp(16px, 2vw, 28px)`, marges latérales `clamp(16px, 5vw, 96px)` (16 px minimum sur téléphone, zones sûres ajoutées).
- Conteneur large plafonné à 1 680 px de contenu ; les photos plein cadre et le pied de page débordent volontairement.
- Rythme vertical : sections de `clamp(96px, 14vw, 200px)` de marge intérieure.
- Points de rupture : 1 024 px (versions simplifiées, pas d'épinglage horizontal) et 768 px (une colonne, carrousels tactiles).
- Cadres photo : filet alu de 1 px, passe-partout de 6 à 10 px, cornières jaunes de 3 px à deux angles opposés.

## 5. Plan des sections

| N° | Section | Kicker (mono) | Titre |
|---|---|---|---|
| 01 | Préchargement | Atelier des Sablonnières | Coupe de profilé, compteur 1988 → 2026, ouverture en vantail |
| 02 | Hero | Menuiserie aluminium, acier, inox | Vos fenêtres, fabriquées ici depuis 1988. |
| 03 | Manifeste | Notre façon de faire | Phrase qui s'éclaire mot à mot |
| 04 | Repères | Repères | Des repères, pas des slogans. |
| 05 | Métiers | Nos métiers | Neuf métiers, un seul atelier. |
| 06 | De l'atelier à votre façade | De l'atelier à votre façade | Une fenêtre, cinq étapes, une seule équipe. |
| 07 | L'atelier et la famille | L'atelier des Sablonnières | Fabriqué à L'Argentière-la-Bessée. |
| 08 | Anatomie d'une fenêtre | Anatomie d'une fenêtre | Ce qu'il y a dans un cadre. |
| 09 | Volets et stores | Volets roulants et stores | Électrique ou solaire, à vous de choisir. |
| 10 | Dépannage et SAV | Dépannage & SAV | Un problème avec votre fermeture ? |
| 11 | Réalisations | Réalisations | Posées par notre équipe. |
| 12 | Qualibat RGE | Rénovation énergétique | Qualifiés RGE pour vos travaux. |
| 13 | Zone d'intervention | Zone d'intervention | Du Briançonnais au Guillestrois. |
| 14 | Partenaires | Partenaires et fournisseurs | Nos partenaires et fournisseurs. |
| 15 | Appel final | Votre projet | Parlons de votre projet. |
| 16 | Pied de page | — | Logo géant coupé par le bas |

Transitions « volet roulant » : avant 07 (atelier), avant 10 (dépannage), avant
15 (appel final). Sections épinglées sur ordinateur : 05 (défilement
horizontal), 06 (vue éclatée), et le hero (court épinglage pour l'ouverture) :
trois au maximum.

### Pistes de H1

1. « Vos fenêtres, fabriquées ici depuis 1988. » — **retenue** : cinq mots qui
   portent la différence (ici, l'atelier), la durée (1988) et le métier. « Ici »
   se lit littéralement sur la photo : la vitre est posée dans la vallée.
2. « La montagne mérite un beau cadre. » — gardée pour la section anatomie.
3. « Conçu, fabriqué et posé par la même famille. » — gardée pour l'atelier.

## 6. Spécification des animations

Règles : seules `transform`, `opacity`, `clip-path` et `stroke-dashoffset` sont
animées ; entrées en `expo.out` ou `power4.out`, 0,6 à 1,2 s, décalages de 0,04
à 0,08 s ; le scroll n'est jamais bloqué ; tout se lit sans mouvement.

| Élément | Déclencheur | Durée | Courbe | Détail |
|---|---|---|---|---|
| Préchargement : tracé du profilé | chargement | 0,9 s | `power2.inOut` | `stroke-dashoffset` de chaque trait, décalage 0,05 s |
| Préchargement : compteur 1988 → 2026 | chargement | 1,0 s | `expo.out` | chiffres en mono, tabulaires |
| Préchargement : ouverture en vantail | fin du tracé | 0,7 s | `expo.inOut` | volet sombre qui pivote (`rotateY`) autour de son bord gauche ; total < 1,5 s ; ignoré si déjà vu dans la session |
| Hero : titre | après le préchargement | 1,1 s | `expo.out` | lignes masquées, `yPercent` 110 → 0, décalage 0,08 s |
| Hero : chapô, boutons | +0,35 s | 0,8 s | `power4.out` | fondu + translation 24 px |
| Hero : fenêtre 3D, suivi souris | `pointermove` | lissage 0,08 / image | amorti | ± 4° en lacet, ± 3° en tangage |
| Hero : ouverture | scroll 0 → 100 % du hero (épinglé 120 % de hauteur) | lié au scroll | `scrub: 0.6` | l'ouvrant coulisse (0–40 %), cotes tracées puis effacées (10–55 %), la fenêtre recule et s'efface (45–100 %) |
| Hero : photo | scroll | lié au scroll | linéaire | parallaxe 10 %, flou LQIP → net |
| En-tête | sens du scroll | 0,45 s | `power3.out` | se cache vers le bas, revient vers le haut ; fond flouté après le hero |
| Manifeste | scroll dans la section | lié au scroll | `scrub` | chaque mot passe de 18 % à 100 % d'opacité |
| Repères | entrée à 75 % de l'écran | 1,1 s | `expo.out` | cote tracée (`stroke-dashoffset`), cornière qui se déplie, compteur pour 1988 |
| Métiers : défilement horizontal | épinglage ≥ 1 024 px | lié au scroll | `scrub: 0.8` | piste translatée en X ; barre en cornière qui s'allonge |
| Métiers : photo de carte | carte visible | 1,0 s | `expo.out` | masque `clip-path` en cadre (inset) + dézoom 1,12 → 1 |
| Métiers : pictogramme | carte visible | 0,9 s | `power2.out` | tracé `stroke-dashoffset` |
| Vue éclatée | épinglage (≥ 1 024 px), 5 étapes | lié au scroll | `scrub: 0.7` | pièces qui glissent (`transform`), cotes tracées, photo de pose en fondu à la fin |
| Vue éclatée (mobile) | chaque pièce à l'écran | 0,8 s | `expo.out` | séquence verticale pièce par pièce |
| Volet roulant | entrée de la section suivante | lié au scroll | `scrub` | 14 lames descendent l'une après l'autre (`yPercent`), puis remontent ; réversible |
| Mur de l'atelier | `pointermove` sur la photo | 0,6 s | `power3.out` | reflet de verre (`translateX`) qui suit la souris ; dérive lente au repos |
| Cadres photo | entrée | 1,2 s | `expo.out` | `clip-path: inset()` 12 % → 0 et dézoom |
| Anatomie | survol, focus ou toucher d'un repère | 0,5 s | `power3.out` | pastille + fiche ; repère suivant au clavier |
| Volet électrique / solaire | bascule | 0,9 s | `power2.inOut` | lames qui descendent une à une ; rayon de soleil tracé vers le panneau |
| Dépannage : cylindre | scroll | lié au scroll | `scrub` | rotation du rotor 0 → 90° |
| Dépannage : vitre | entrée | 1,0 s | `expo.out` | éclats qui se recomposent (`transform`) |
| Réalisations : filtres | clic | 0,6 s | `expo.out` (Flip) | réorganisation de la mosaïque |
| Visionneuse | ouverture | 0,5 s | `expo.out` | agrandissement depuis la vignette ; flèches, Échap, glisser |
| RGE : coupe thermique | entrée | 1,2 s | `power2.out` | flèches de froid qui rebondissent, ondes de chaleur gardées |
| Carte | entrée | 1,4 s | `power2.out` | rayons tracés depuis L'Argentière-la-Bessée, décalage 0,15 s |
| Partenaires | survol | 0,4 s | `power2.out` | logo monochrome → couleur |
| Cornière finale | scroll vers l'appel final | lié au scroll | `scrub` | la bande en L traverse l'écran de gauche à droite puis se replie en bouton |
| Boutons magnétiques | `pointermove` | 0,5 s | `power3.out` | attraction ≤ 12 px, remplissage jaune en balayage, flèche qui sort et revient |
| Liens inertes | survol | 0,45 s | `expo.out` | filet tracé de gauche à droite, petite cornière en coin |
| Bandeau des métiers | scroll | continu | linéaire | vitesse et sens indexés sur la vitesse du scroll |
| Mètre ruban | scroll | continu | linéaire | règle graduée, curseur en cornière jaune |
| Curseur viseur | `pointermove` (pointeur fin) | lissage | amorti | affiche « Voir » sur les photos |

`prefers-reduced-motion` : pas de Lenis, pas de préchargement, pas d'épinglage,
pas de volet, fenêtre du hero en SVG statique ouverte, fondus courts seulement.
Sous 1 024 px : ni épinglage horizontal ni vue éclatée épinglée ; sous 768 px :
parallaxe divisée par trois, carrousels tactiles.

## 7. Images

- Uniquement de vraies photos d'Alpes Alu (verdicts dans `assets/raw/manifest.json`).
- Étalonnage commun (`scripts/lib/grade.mjs`) : balance plus froide, courbe en S
  à point noir abaissé, verts de téléphone calmés, jaunes préservés.
- Duotone graphite et jaune pour les fonds sombres : seules les hautes lumières
  virent au jaune.
- AVIF et WebP en 640, 1 280, 1 920 et 2 560 px, LQIP flouté en ligne,
  recadrages différents sur téléphone pour le hero.
