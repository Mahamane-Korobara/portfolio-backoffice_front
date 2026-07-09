import "./globals.css";
import PwaProvider from "@/components/pwa/PwaProvider";
import { Toaster } from "@/components/ui/sonner";
import { BRAND_NAME, BRAND_SHORT } from "@/lib/brand";

export const metadata = {
  applicationName: `${BRAND_SHORT} Backoffice`,
  title: {
    default: `Backoffice | ${BRAND_NAME}`,
    template: `%s | ${BRAND_SHORT} Backoffice`,
  },
  description: `Backoffice pour piloter les articles, projets, médias, commentaires et abonnés du portfolio de ${BRAND_NAME}.`,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: `${BRAND_SHORT} Backoffice`,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: "#0D2420",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        {children}
        <PwaProvider />
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
