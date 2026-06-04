import "./globals.css";
import PwaProvider from "@/components/pwa/PwaProvider";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  applicationName: "MK Backoffice",
  title: {
    default: "Backoffice | Mahamane Korobara",
    template: "%s | MK Backoffice",
  },
  description:
    "Backoffice personnel pour piloter les articles, médias, commentaires et abonnés du portfolio de Mahamane Korobara.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MK Backoffice",
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
        <Toaster />
      </body>
    </html>
  );
}
