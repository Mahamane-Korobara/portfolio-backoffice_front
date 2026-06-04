"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

// Enregistre le service worker et propose l'installation de la PWA.
// - Chrome/Android/desktop : capture l'événement beforeinstallprompt.
// - iOS/Safari : affiche les instructions « Ajouter à l'écran d'accueil ».
export default function PwaProvider() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Enregistrement du service worker (prod uniquement, HTTPS/localhost requis).
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});
    }

    const dismissed = localStorage.getItem("mk-pwa-dismissed") === "1";
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    const ios =
      /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;

    const onBeforeInstall = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      if (!dismissed && !standalone) setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Détection plateforme déférée : évite un setState synchrone dans l'effet.
    // iOS n'émet pas beforeinstallprompt → on affiche l'aide manuelle.
    const frame = window.requestAnimationFrame(() => {
      setIsIOS(ios);
      if (ios && !dismissed && !standalone) setShowBanner(true);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const dismiss = () => {
    setShowBanner(false);
    localStorage.setItem("mk-pwa-dismissed", "1");
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[200] mx-auto max-w-md rounded-2xl border border-[#2BE0B5]/30 bg-[#0D2420] p-4 text-white shadow-[0_18px_50px_rgba(13,36,32,0.4)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2BE0B5] font-extrabold text-[#0D2420]">
          MK
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Installer le backoffice</p>
          {isIOS ? (
            <p className="mt-1 text-xs leading-relaxed text-white/70">
              Appuie sur <Share className="inline size-3.5" /> puis « Sur l&apos;écran
              d&apos;accueil » pour écrire tes articles comme dans une app.
            </p>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-white/70">
              Ajoute l&apos;app à ton écran d&apos;accueil pour rédiger depuis ton
              téléphone, même hors-ligne.
            </p>
          )}

          {!isIOS && deferredPrompt ? (
            <button
              type="button"
              onClick={install}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#2BE0B5] px-4 py-2 text-xs font-bold text-[#0D2420]"
            >
              <Download className="size-4" />
              Installer
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full p-1 text-white/60 hover:text-white"
          aria-label="Fermer"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
