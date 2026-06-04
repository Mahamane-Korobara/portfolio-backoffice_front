# MK Backoffice — Dashboard éditorial PWA

Backoffice (panneau d'administration) pour gérer un blog : rédaction d'articles
riches, médias, commentaires, abonnés newsletter et statistiques. Conçu comme
une **PWA** : installable sur mobile/desktop pour rédiger depuis le téléphone,
avec coque hors-ligne et sauvegarde automatique des brouillons.

Il consomme l'API admin d'un backend Laravel (`/api/v1/admin`). Le site public
(portfolio/blog) consomme la partie publique de la même API.

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
| `NEXT_PUBLIC_API_URL` | Base de l'API admin Laravel (sans slash final) |
| `NEXT_PUBLIC_SITE_URL` | URL publique du blog (liens « voir l'article », prévisualisation) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | (Optionnel) clé publique VAPID pour les notifications push |

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
│   ├── (dashboard)/           # Espace protégé (articles, médias, commentaires…)
│   │   ├── _components/        # Vues du dashboard
│   │   └── layout.js           # Garde d'authentification (DashboardShell)
│   ├── layout.js               # Métadonnées + viewport PWA + PwaProvider
│   └── manifest.js             # Web App Manifest (PWA)
├── components/
│   ├── Editor.jsx              # Éditeur TipTap complet
│   ├── MediaPicker.jsx         # Bibliothèque média / upload
│   ├── pwa/PwaProvider.jsx     # Enregistrement SW + invite d'installation
│   └── ui/                     # Composants shadcn
├── lib/
│   ├── api.js                  # Client HTTP de l'API admin
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

## Backend associé

API Laravel `mon-api-backoffice`. Points de configuration importants :

- `APP_FRONTEND_URL` doit pointer vers l'URL publique du blog (utilisée pour les
  URLs canoniques, la prévisualisation, le JSON-LD et les redirections newsletter).
- L'authentification admin se fait par token Bearer (Laravel Sanctum).
