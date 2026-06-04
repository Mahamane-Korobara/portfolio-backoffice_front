"use client";

import { useEffect, useRef, useState } from "react";

const PREFIX = "mk-draft:";

// Sauvegarde automatique d'un brouillon dans le localStorage (debounce).
// Permet de ne jamais perdre un article en cours de rédaction sur mobile,
// même hors-ligne ou après fermeture de l'onglet.
//
// Usage :
//   const { recoverable, savedAt, persist, clear, dismiss } =
//     useDraftAutosave(key, { enabled });
//   - persist(value)  → enregistre (à appeler quand le formulaire change)
//   - clear()         → efface (après un enregistrement serveur réussi)
//   - recoverable     → brouillon trouvé au montage (à proposer à la restauration)
//   - dismiss()       → ignore le brouillon trouvé
export function useDraftAutosave(key, { enabled = true, debounceMs = 800 } = {}) {
  const storageKey = `${PREFIX}${key}`;
  const timer = useRef(null);
  const [savedAt, setSavedAt] = useState(null);
  const [recoverable, setRecoverable] = useState(null);

  // Au montage : on regarde s'il existe déjà un brouillon local.
  // Lecture déférée (microtask) pour éviter un setState synchrone dans l'effet
  // et tout risque d'écart d'hydratation SSR.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) setRecoverable(JSON.parse(raw));
      } catch {
        // brouillon corrompu : on l'ignore
      }
    });
    return () => {
      active = false;
    };
  }, [storageKey, enabled]);

  const persist = (value) => {
    if (!enabled || typeof window === "undefined") return;
    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(() => {
      try {
        const record = { value, savedAt: Date.now() };
        localStorage.setItem(storageKey, JSON.stringify(record));
        setSavedAt(record.savedAt);
      } catch {
        // quota dépassé / mode privé : on échoue silencieusement
      }
    }, debounceMs);
  };

  const clear = () => {
    if (typeof window === "undefined") return;
    if (timer.current) clearTimeout(timer.current);
    localStorage.removeItem(storageKey);
    setSavedAt(null);
    setRecoverable(null);
  };

  const dismiss = () => setRecoverable(null);

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  return { recoverable, savedAt, persist, clear, dismiss };
}
