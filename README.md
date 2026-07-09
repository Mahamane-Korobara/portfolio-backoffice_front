# Backoffice — Dashboard éditorial & portfolio (PWA)

Backoffice (panneau d'administration) pour piloter un **portfolio + blog** :

- **Articles** riches (éditeur TipTap), **collections** (séries d'épisodes)
- **Projets / réalisations** (galerie, vidéo, épinglage sur la home)
- **Médias**, **commentaires**, **abonnés newsletter**, **statistiques**
- **CV téléchargeable** remplaçable en un clic

Conçu comme une **PWA** : installable sur mobile/desktop pour gérer depuis le
téléphone, avec coque hors-ligne et sauvegarde automatique des brouillons.

Il consomme l'API admin d'un backend Laravel (`/api/v1/admin`). Le site public
(portfolio/blog) consomme la partie publique de la même API.

> **Réutilisable** : aucune donnée ni identité n'est codée en dur. Pour
> t'approprier ce back-office, tu ne modifies que le `.env` (voir
> [Réutiliser ce projet](#réutiliser-ce-projet)).

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TipTap 3** pour l'éditeur d'articles (contenu stocké en JSON)
- **Zustand** (état d'authentification persisté) — `src/lib/store.js`
- **Tailwind CSS 4** + composants shadcn (`src/components/ui`)
- **lucide-react**, **sonner** (toasts)

## Prérequis

- Node.js 20+
- L'API Laravel `mon-api-backoffice` démarrée (par défaut sur `http://localhost:8000`)

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis adapter les valeurs
npm run dev                  # http://localhost:3000
```

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base de l'API admin Laravel (sans slash final), pointe vers `/api/v1/admin` |
| `NEXT_PUBLIC_SITE_URL` | URL publique du portfolio/blog (liens « voir l'article/projet », prévisualisation) |
| `NEXT_PUBLIC_BRAND_NAME` | Nom affiché (sidebar, titres, manifeste PWA). Ex. `"Mahamane Korobara"` |
| `NEXT_PUBLIC_BRAND_SHORT` | Initiales du logo (optionnel, sinon dérivées du nom). Ex. `"MK"` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | (Optionnel) clé publique VAPID pour les notifications push |

> Toutes les variables sont **publiques** (préfixe `NEXT_PUBLIC_`, inlinées au
> build). Ne jamais y mettre de secret. Sur Vercel : *Settings → Environment
> Variables* puis redéployer.

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Sert le build de production |
| `npm run lint` | ESLint |

## Architecture

```
src/
├── app/
│   ├── (auth)/login/          # Connexion admin
│   ├── (dashboard)/           # Espace protégé
│   │   ├── articles/           # Liste + éditeur d'articles
│   │   ├── projects/           # Liste + éditeur de projets (galerie, vidéo, épinglage)
│   │   ├── _components/        # Vues du dashboard (dont projects-page, project-editor-page)
│   │   └── layout.js           # Garde d'authentification (DashboardShell)
│   ├── layout.js               # Métadonnées + viewport PWA + PwaProvider
│   └── manifest.js             # Web App Manifest (PWA)
├── components/
│   ├── Editor.jsx              # Éditeur TipTap complet
│   ├── MediaPicker.jsx         # Bibliothèque média / upload (images + vidéos)
│   ├── CvManagerCard.jsx       # Gestion du CV (upload + aperçu inline)
│   ├── pwa/PwaProvider.jsx     # Enregistrement SW + invite d'installation
│   └── ui/                     # Composants shadcn
├── lib/
│   ├── api.js                  # Client HTTP de l'API admin
│   ├── brand.js                # Identité de marque (lue depuis le .env)
│   ├── store.js                # Auth (Zustand + persist)
│   ├── editor/lowlight.js      # Langages de coloration syntaxique
│   └── hooks/useDraftAutosave.js
public/
├── sw.js                       # Service worker (offline + push)
├── offline.html               # Page de secours hors-ligne
└── icon-*.png                  # Icônes PWA (générées)
```

## Éditeur d'articles

L'éditeur (`src/components/Editor.jsx`) prend en charge :

- Titres (H1–H3), gras, italique, souligné, barré, **surlignage**, code inline
- **Blocs de code** avec coloration syntaxique et **sélecteur de langage par bloc**
  (28 langages — voir `src/lib/editor/lowlight.js`)
- Listes à puces / numérotées / **listes de tâches**
- Citations, séparateurs, liens
- **Images** : depuis la bibliothèque média, par téléversement, par
  **glisser-déposer** ou **collage** (upload automatique vers l'API)
- **Tableaux** redimensionnables (lignes/colonnes, ligne d'en-tête)
- Alignement du texte, exposant/indice, compteur de mots

Le contenu est sérialisé en **JSON TipTap** et envoyé à l'API. Le rendu HTML
côté site public doit utiliser le même schéma (ex. `@tiptap/html`).

## PWA

- **Manifest** : `src/app/manifest.js` (servi sur `/manifest.webmanifest`)
- **Service worker** : `public/sw.js` — coque applicative en cache,
  stale-while-revalidate sur les assets, réseau-only pour l'API, support push
- **Installation** : `PwaProvider` capture `beforeinstallprompt` (Android/desktop)
  et affiche l'aide « Ajouter à l'écran d'accueil » sur iOS
- **Hors-ligne** : page de secours `public/offline.html` + autosave local des
  brouillons (`useDraftAutosave`)

> Le service worker n'est enregistré qu'en **production** (`npm run build && npm run start`)
> et nécessite HTTPS (ou `localhost`). Pour tester les notifications en local :
> `next dev --experimental-https`.

## Réactions (style réseaux sociaux)

Les articles reçoivent des réactions emoji (👍 ❤️ 🔥 👏 😮 👌) — un visiteur peut
laisser une réaction de chaque type, sans compte. La liste des types est définie
côté API dans `config/reactions.php`. Le backoffice affiche le détail par emoji
sur la liste d'articles et dans le panneau « Engagement » de l'éditeur.

API publique : `POST /articles/{slug}/react` `{ "type": "fire" }`,
`GET /articles/{slug}/reactions`.

## Notifications push

Le backoffice peut recevoir des notifications push (nouveau commentaire…), même
fermé. Mise en route :

1. **Backend** (`mon-api-backoffice`) :
   ```bash
   php artisan webpush:vapid     # génère la paire de clés VAPID
   # → reporter VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY dans .env
   php artisan migrate           # crée la table push_subscriptions
   ```
2. **Activer** : Réglages → « Notifications push » → *Activer* (la clé publique
   est récupérée automatiquement via `GET /admin/push/key`). Bouton *Test* pour
   vérifier.

> Push et installation PWA nécessitent HTTPS (ou `localhost`) et le build de
> production (`npm run build && npm start`).

## Réutiliser ce projet

Ce back-office est un **template**. Pour l'utiliser pour ton propre
portfolio, aucune ligne de code à toucher :

1. `cp .env.example .env.local`
2. Renseigne :
   - `NEXT_PUBLIC_API_URL` → ton API Laravel (`.../api/v1/admin`)
   - `NEXT_PUBLIC_SITE_URL` → l'URL de ton portfolio public
   - `NEXT_PUBLIC_BRAND_NAME` / `NEXT_PUBLIC_BRAND_SHORT` → ton nom / tes initiales
3. `npm run build` (ou déploie sur Vercel avec ces variables)

L'identité (nom dans la sidebar, titres d'onglet, manifeste PWA) est lue depuis
`src/lib/brand.js`, qui dérive tout du `.env`. Côté backend, l'identité SEO et
les origines CORS sont pareillement pilotées par le `.env` (voir le README du
back).

## Backend associé

API Laravel `mon-api-backoffice`. Points de configuration importants :

- `APP_FRONTEND_URL` doit pointer vers l'URL publique du blog (utilisée pour les
  URLs canoniques, la prévisualisation, le JSON-LD et les redirections newsletter).
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` pour les notifications push.
- L'authentification admin se fait par token Bearer (Laravel Sanctum).
