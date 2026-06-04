"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Send } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import {
  getPushSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";
import { Button } from "@/components/ui/button";
import { ShellPanel } from "@/app/(dashboard)/_components/dashboard-ui";

export default function PushNotificationCard() {
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(async () => {
      const ok = isPushSupported();
      if (!active) return;
      setSupported(ok);
      if (ok) {
        const sub = await getPushSubscription();
        if (active) setSubscribed(Boolean(sub));
      }
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      await subscribeToPush();
      setSubscribed(true);
      toast.success("Notifications activées sur cet appareil.");
    } catch (error) {
      toast.error(error.message || "Activation impossible.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
      toast.success("Notifications désactivées.");
    } catch (error) {
      toast.error(error.message || "Désactivation impossible.");
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    try {
      const res = await api.pushTest();
      toast.success(res.message || "Notification de test envoyée.");
    } catch (error) {
      toast.error(error.message || "Envoi impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ShellPanel className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E7FBF5] text-[#0D2420]">
            {subscribed ? <Bell className="size-5" /> : <BellOff className="size-5" />}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3D5350]/66">
              Notifications push
            </p>
            <h3 className="mt-1 text-lg font-semibold text-[#0D2420]">
              Alertes en temps reel
            </h3>
            <p className="mt-1 max-w-md text-sm text-[#3D5350]/78">
              Recois une notification sur cet appareil a chaque nouveau commentaire,
              meme quand le backoffice est ferme.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!ready ? (
            <span className="text-sm text-[#3D5350]/70">Verification...</span>
          ) : !supported ? (
            <span className="text-sm text-[#3D5350]/70">
              Non supporte sur cet appareil
            </span>
          ) : subscribed ? (
            <>
              <Button
                variant="outline"
                onClick={sendTest}
                disabled={busy}
                className="rounded-full border-[#0D2420]/8 bg-white text-[#0D2420]"
              >
                <Send className="size-4" />
                Test
              </Button>
              <Button
                variant="outline"
                onClick={disable}
                disabled={busy}
                className="rounded-full border-[#0D2420]/8 bg-white text-[#0D2420]"
              >
                Desactiver
              </Button>
            </>
          ) : (
            <Button onClick={enable} disabled={busy} className="rounded-full px-5">
              <Bell className="size-4" />
              Activer
            </Button>
          )}
        </div>
      </div>
    </ShellPanel>
  );
}
