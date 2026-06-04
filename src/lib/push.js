"use client";

import { api } from "@/lib/api";

// Conversion clé VAPID (base64url) → Uint8Array attendu par pushManager.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// S'assure que le service worker est enregistré (utile en dev où PwaProvider
// ne l'enregistre qu'en production) puis renvoie le registration prêt.
async function ensureRegistration() {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return navigator.serviceWorker.ready;
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return navigator.serviceWorker.ready;
}

export async function getPushSubscription() {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error("Les notifications push ne sont pas supportées sur cet appareil.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permission de notification refusée.");
  }

  // Clé publique VAPID : récupérée depuis l'API (source unique de vérité).
  const { public_key: publicKey, enabled } = await api.pushKey();
  if (!enabled || !publicKey) {
    throw new Error("Les notifications ne sont pas configurées côté serveur (clés VAPID).");
  }

  const registration = await ensureRegistration();
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await api.pushSubscribe(subscription.toJSON());
  return subscription;
}

export async function unsubscribeFromPush() {
  const subscription = await getPushSubscription();
  if (!subscription) return;

  const { endpoint } = subscription;
  await subscription.unsubscribe();
  await api.pushUnsubscribe(endpoint);
}
