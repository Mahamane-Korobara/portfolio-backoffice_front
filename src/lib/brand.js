// Identité de marque du back-office — configurable via .env pour que
// n'importe qui puisse réutiliser ce projet sans toucher au code.
//
//   NEXT_PUBLIC_BRAND_NAME="Prénom Nom"
//   NEXT_PUBLIC_BRAND_SHORT="PN"   (optionnel : sinon dérivé des initiales)

export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || "Mon Portfolio";

export const BRAND_SHORT =
  process.env.NEXT_PUBLIC_BRAND_SHORT ||
  BRAND_NAME.split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ||
  "MP";
