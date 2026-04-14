"use client";

import { useEffect, useState } from "react";
import { Mail, Trash2, Users } from "lucide-react";

import { api } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  EmptyState,
  PageHero,
  ShellPanel,
  StatusBadge,
  formatDate,
} from "./dashboard-ui";

function getSubscriberStatus(subscriber) {
  if (subscriber.unsubscribed_at) return "draft";
  if (subscriber.confirmed) return "active";
  return "pending";
}

function getSubscriberLabel(subscriber) {
  if (subscriber.unsubscribed_at) return "Desabonne";
  if (subscriber.confirmed) return "Actif";
  return "A confirmer";
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSubscribers() {
      setLoading(true);

      try {
        const payload = await api.subscribers({ page });
        if (cancelled) return;

        setSubscribers(payload?.data || []);
        setMeta(payload?.meta || null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSubscribers();

    return () => {
      cancelled = true;
    };
  }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Retirer cet abonne ?")) {
      return;
    }

    await api.deleteSubscriber(id);
    setSubscribers((current) => current.filter((subscriber) => subscriber.id !== id));
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Newsletter"
        title="Suivre les abonnes"
        description="Observe la base newsletter, repere les inscriptions a confirmer et nettoie la liste si besoin."
      />

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-[1.8rem] bg-white/70"
            />
          ))}
        </div>
      ) : subscribers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun abonne enregistre"
          description="Les nouvelles inscriptions a la newsletter apparaitront ici."
        />
      ) : (
        <div className="grid gap-4">
          {subscribers.map((subscriber) => (
            <ShellPanel key={subscriber.id} className="p-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge
                      status={getSubscriberStatus(subscriber)}
                      label={getSubscriberLabel(subscriber)}
                    />
                    <span className="text-sm text-[#3D5350]/78">
                      Inscrit le {formatDate(subscriber.created_at)}
                    </span>
                  </div>

                  <div>
                    <p className="text-lg font-black tracking-tight text-[#0D2420]">
                      {subscriber.name || subscriber.user?.name || subscriber.email}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-sm text-[#3D5350]/80">
                      <Mail className="size-4" />
                      <span>{subscriber.email}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(subscriber.id)}
                  className={cn(
                    buttonVariants({ variant: "destructive" }),
                    "rounded-full px-4"
                  )}
                >
                  Supprimer
                  <Trash2 className="size-4" />
                </button>
              </div>
            </ShellPanel>
          ))}
        </div>
      )}

      {meta?.last_page > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-full border-[#0D2420]/8 bg-white px-4 text-[#0D2420]"
            )}
          >
            Prec.
          </button>
          <span className="rounded-full border border-[#0D2420]/8 bg-white px-4 py-2 text-sm font-semibold text-[#3D5350]">
            Page {meta.current_page} / {meta.last_page}
          </span>
          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(meta.last_page, current + 1))
            }
            disabled={page >= meta.last_page}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-full border-[#0D2420]/8 bg-white px-4 text-[#0D2420]"
            )}
          >
            Suiv.
          </button>
        </div>
      ) : null}
    </div>
  );
}
