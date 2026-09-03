# La Voûte des Sens — site vitrine

Site one-page pour la suite de luxe **La Voûte** (Villefranche-sur-Saône).
HTML statique + Tailwind compilé + JavaScript natif. Aucune dépendance externe :
polices, styles et images sont servis en local, le site fonctionne hors ligne.

## Lancer en local

```bash
cd "/Users/aurelienwalther/Documents/CLAUDE/la-voute-des-sens" && python3 -m http.server 8972
```

Puis ouvrir <http://localhost:8972>. (Un simple double-clic sur `index.html`
fonctionne aussi, mais passer par un serveur évite toute restriction `file://`.)

## Structure

```
index.html              la page (7 sections + nav + footer)
tailwind.config.js      palette, polices, courbes d'animation
src/input.css           source Tailwind (@tailwind base/components/utilities)
assets/
  tailwind.css          Tailwind compilé et purgé — 16 Ko (NE PAS éditer à la main)
  style.css             identité : tokens, typo, composants, animations
  app.js                préchargeur, révélations, parallaxe, menu, lightbox, curseur
  fonts.css + fonts/    Cormorant Garamond + Plus Jakarta Sans (woff2, 172 Ko)
  img/                  25 photos optimisées (3,8 Mo)
```

## Recompiler le CSS

**Obligatoire dès que vous ajoutez ou modifiez une classe Tailwind dans le HTML** :
les classes non utilisées sont purgées, une classe absente du build ne s'appliquera pas.

Node n'est pas installé sur cette machine — utilisez le binaire autonome officiel :

```bash
curl -sL -o /tmp/tailwindcss https://github.com/tailwindlabs/tailwindcss/releases/download/v3.4.17/tailwindcss-macos-arm64 && chmod +x /tmp/tailwindcss
```

```bash
cd "/Users/aurelienwalther/Documents/CLAUDE/la-voute-des-sens" && /tmp/tailwindcss -c tailwind.config.js -i src/input.css -o assets/tailwind.css --minify
```

Ajoutez `--watch` pendant que vous travaillez pour une recompilation automatique.

> Le CDN `cdn.tailwindcss.com` a été volontairement écarté : il ne générait ni les
> opacités (`bg-charcoal/40`) ni les dégradés, et Tailwind le déconseille en production.

## Contacts branchés

- **Instagram** → <https://www.instagram.com/destinationdevasion/>
- **E-mail** → contact@lavoutedessens.com (le CTA final ouvre un message pré-rempli)
- **Aucun lien Airbnb** : tous les CTA renvoient vers la section réservation de la page,
  qui affiche l'e-mail et l'Instagram.

## À compléter avant mise en ligne

| Emplacement | À remplacer |
|---|---|
| Footer → Legal / Privacy / Terms | `href="#"` (repérables par `data-todo`) → vos pages légales |
| `sitemap.xml`, `robots.txt`, balises `canonical` | `lavoutedessens.com` → votre domaine définitif |

## Avis

La section témoignages reprend de **vrais commentaires de votre annonce Airbnb**
(Mango, Nicolas, Shanon, Mathieu), avec la note **5,0/5 sur 19 commentaires**, les badges
*Coup de cœur voyageurs* et *Superhôte*. La note est aussi déclarée en `aggregateRating`
dans les données structurées — c'est un signal fort pour Google et les assistants IA.
Les avis sont traduits en anglais avec la mention « translated from French ».

> **Correction factuelle appliquée** : l'annonce indique un lit **queen size**, le site
> affichait « king-size » (repris du brief initial). Corrigé partout, FR et EN. Pensez à
> vérifier les autres équipements annoncés — un écart entre le site et la réalité est
> un motif de litige.

## Moteur de réservation SuperHote — branché ✓

L'iframe SuperHote est intégrée dans `<div id="booking-engine">` (FR **et** EN).
Elle affiche le calendrier, les disponibilités, les tarifs poussés par PriceLabs et
gère le paiement Stripe. Testé et fonctionnel.

Les identifiants proviennent de *SuperHote → Hébergements → Voûte des Sens → Intégration* :
`property_key` et UUID de compte. Ce sont des **identifiants publics d'intégration**,
prévus pour figurer dans le HTML d'un site — ce ne sont pas des clés API secrètes.

> **⚠ À corriger dans SuperHote** : la description du logement contient un texte
> manifestement issu d'une autre annonce — « accès aisé via l'**A2**, proximité de
> **Valenciennes** (5 minutes) ». Valenciennes est à 600 km de Villefranche.
> Ce texte s'affiche sur le site via le widget : à reprendre dans
> *SuperHote → Hébergements → Voûte des Sens → Description*.

> **À arbitrer** : le widget affiche l'adresse postale complète du logement, alors que le
> site annonce « l'adresse exacte est communiquée à la confirmation du séjour ».
> Soit vous masquez l'adresse dans SuperHote, soit vous adaptez la formulation du site
> (sections *Accès* et *Réservation*).

**Chaîne de synchronisation** — le site ne parle jamais directement à PriceLabs :

```
PriceLabs  →  SuperHote (PMS : calendrier, tarifs, réservations)  →  Airbnb / Booking
                                                                  →  votre site (widget)
```

Vos réservations existantes n'ont donc rien à « importer » : dès qu'elles remontent dans
SuperHote via vos comptes OTA, le widget les reflète. Si un tarif semble faux sur le site,
le problème est en amont — vérifiez d'abord dans SuperHote, puis forcez la synchro PriceLabs.

> Le widget fonctionne sur un hébergement statique (GitHub Pages, OVH, Hostinger) :
> aucune fonction serveur ni clé API n'est nécessaire. **Ne placez jamais une clé API
> SuperHote dans ces fichiers** — elle serait lisible par tous les visiteurs.

## Mise en ligne

Tous les chemins internes sont **relatifs** : le site fonctionne aussi bien à la racine
d'un domaine que dans un sous-dossier (`username.github.io/la-voute-des-sens/`).

Avant publication, remplacez `lavoutedessens.com` par votre domaine réel dans :
`sitemap.xml`, `robots.txt`, les balises `canonical` et `hreflang`, et les données structurées.

> **Cache** : CSS et JS portent un numéro de version (`?v=…`). À chaque modification de
> `style.css` ou `app.js`, incrémentez-le dans les 6 fichiers HTML, sinon les visiteurs
> garderont l'ancienne version en cache.

## Bons cadeaux (`bons-cadeaux.html`)

Page complète : trois formules fixes (150 / 250 / 400 €), une formule **à montant libre**,
le déroulé en trois étapes, les conditions, et un bloc de contact.

**Il reste 4 liens Stripe à brancher** (repérables par `data-todo="stripe-…"`) :

1. Tableau de bord Stripe → **Produits → Créer un produit** (ex. « Bon cadeau — 250 € »).
2. Pour le montant libre : à l'étape tarification, choisir **« Le client choisit ce qu'il paie »**
   (*customer chooses price*), avec un montant minimum et un montant suggéré.
3. Sur chaque produit → **Créer un lien de paiement**. Stripe fournit une URL `buy.stripe.com/…`.
4. Remplacer les `href="#commander"` des 4 boutons par ces URL.

> Ces liens sont **publics** : ils sont faits pour figurer dans un site. En revanche,
> **aucune clé Stripe** (surtout `sk_live_…`) ne doit apparaître dans ces fichiers —
> elle serait lisible par tous les visiteurs.

Pensez à activer dans Stripe l'envoi automatique des reçus (Paramètres → E-mails clients).

### Modèle de bon (`modele-bon-cadeau.html`)

Bon A5 paysage à votre charte, **non indexé et absent de la navigation**. Les champs
(bénéficiaire, offrant, montant, validité, numéro) se complètent directement dans le
navigateur, puis s'impriment en PDF. Mode d'emploi en bas de la page.

## Équipements

La section `#equipements` de l'accueil liste les équipements en quatre colonnes, d'après
votre annonce Airbnb et vos photos. **À relire** : j'ai retenu ce qui était vérifiable.
Ajoutez ce qui manque (Airbnb en annonce 35).

## Le blog (`/blog/`)

Trois articles optimisés pour le référencement local, **en français** : votre clientèle
cherche « spa privatif Lyon » ou « week-end romantique Beaujolais », pas en anglais.
C'est là qu'est le trafic.

| Fichier | Requête visée |
|---|---|
| `week-end-romantique-pres-de-lyon.html` | week-end romantique près de Lyon |
| `suite-avec-jacuzzi-privatif-beaujolais.html` | suite / jacuzzi privatif Beaujolais |
| `que-faire-a-villefranche-sur-saone-en-couple.html` | que faire à Villefranche-sur-Saône |

Chaque article porte ses balises `title`/`description`, un `canonical`, des données
structurées `Article` + `BreadcrumbList`, et des liens croisés vers les deux autres.
La page d'accueil porte un bloc `LodgingBusiness`.

**Pour publier un nouvel article** : dupliquez un fichier existant, changez le `<title>`,
la `<meta name="description">`, le `canonical`, le JSON-LD, le `<h1>` et le corps `.prose`,
ajoutez la carte dans `blog/index.html` et l'URL dans `sitemap.xml`.

> Contenu volontairement factuel et vérifiable (géographie, saisons, conseils pratiques).
> Aucun nom de restaurant, horaire ni tarif inventé — ajoutez vos bonnes adresses,
> ce sont elles qui feront la différence.

## Langues

Le site est **en français** (`index.html`), avec une **version anglaise** dans `en/index.html`.
Un sélecteur FR/EN figure dans la barre de navigation et dans le menu mobile ; les deux
versions se déclarent mutuellement par `hreflang` (+ `x-default` sur le français).

> Le blog reste en français uniquement — c'est là qu'est le trafic. Le lien est signalé
> `(FR)` côté anglais.

**Attention** : toute modification de contenu doit être répercutée dans les deux fichiers.

## Référencement (SEO / AEO)

- `title`, `meta description` et `keywords` ciblent : *loveroom*, *jacuzzi privatif*,
  *suite de luxe*, *logement insolite / atypique*, *spa privatif couple*,
  sur **Villefranche-sur-Saône**, **Lyon** et le **Beaujolais**.
- Balises `geo.region` / `geo.placename` pour le référencement local.
- **Données structurées** : `LodgingBusiness` (avec `keywords`, `audience: Couples`,
  capacité 2, équipements) et **`FAQPage`** sur l'accueil ; `Article` +
  `BreadcrumbList` sur chaque billet du blog.
- La **section FAQ** (`#faq`) est le levier le plus efficace pour être cité par Google
  et par les assistants IA : ce sont des questions-réponses factuelles et autonomes,
  exactement le format qu'ils reprennent. Enrichissez-la au fil des questions réelles
  de vos voyageurs.

## Choix éditoriaux
- **La chambre secrète** est traitée par la suggestion : masques en dentelle, lumière
  basse, aucun accessoire explicite. Ajustable dans les deux sens.
- **Palette** calée sur le lieu lui-même : ivoire, pierre calcaire dorée, marbre
  rose-beige, laiton brossé, noyer. Aucun gris froid.
- **Photos** : les vôtres, redimensionnées et recompressées (2400 px pour le hero,
  1500–1900 px ailleurs). Deux sources, aucune retouche des originaux :
  - **balnéo et salle de bain** → export Lightroom
    `~/Downloads/lightroom-download-2026-06-03T14_09_02Z` (éclairage chromatique
    rouge et bleu, peignoirs en place — nettement plus évocateur) ;
  - **tout le reste** → `~/Downloads/Smash` (shooting pro 48 Mpx).

  Le dossier `CASIER UPSELLS` a été écarté : les emballages de confiserie cassaient
  le registre haut de gamme. Les variantes non retenues ont été supprimées du projet
  pour ne pas alourdir le déploiement ; elles restent disponibles dans les originaux.

## Accessibilité & performance

- Animations en `transform`/`opacity` uniquement ; `prefers-reduced-motion` respecté.
- Révélations par `IntersectionObserver`, parallaxe throttlée en `requestAnimationFrame`.
- Navigation clavier : lien d'évitement, focus visible, lightbox pilotable
  (`Échap`, `←`, `→`).
- Images en `loading="lazy"` sauf le hero (préchargé).

## Piste d'optimisation

Les images sont en JPEG (ni `cwebp` ni ImageMagick sur cette machine). Convertir en
WebP/AVIF ferait gagner 40–60 % de poids — utile avant une mise en production.
