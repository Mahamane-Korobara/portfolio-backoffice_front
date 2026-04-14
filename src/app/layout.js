import "./globals.css";

export const metadata = {
  title: "Backoffice | Mahamane Korobara",
  description:
    "Backoffice personnel pour piloter les articles, médias, commentaires et abonnés du portfolio de Mahamane Korobara.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
