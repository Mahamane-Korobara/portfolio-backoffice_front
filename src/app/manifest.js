// Web App Manifest (Next.js App Router) — sert /manifest.webmanifest.
// Permet l'installation du backoffice comme application (PWA) sur mobile/desktop.

import { BRAND_NAME, BRAND_SHORT } from "@/lib/brand";

export default function manifest() {
  return {
    name: `Backoffice — ${BRAND_NAME}`,
    short_name: `${BRAND_SHORT} Backoffice`,
    description:
      "Rédige et publie tes articles de blog depuis ton téléphone. Gestion des articles, médias, commentaires et abonnés.",
    id: "/dashboard",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0D2420",
    theme_color: "#0D2420",
    lang: "fr",
    categories: ["productivity", "business"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Nouvel article",
        short_name: "Écrire",
        url: "/articles/new",
        description: "Rédiger un nouvel article",
      },
      {
        name: "Articles",
        url: "/articles",
      },
      {
        name: "Commentaires",
        url: "/comments",
      },
    ],
  };
}
