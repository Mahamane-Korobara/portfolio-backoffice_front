"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, MessageSquare, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { api, getPublicArticleUrl } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  EmptyState,
  PageHero,
  ShellPanel,
  StatusBadge,
  formatDate,
} from "./dashboard-ui";

const filters = [
  { value: "pending", label: "En attente" },
  { value: "approved", label: "Approuves" },
  { value: "spam", label: "Spam" },
];

export default function CommentsPage() {
  const [comments, setComments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [status]);

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      setLoading(true);

      try {
        const payload = await api.comments({ status, page });
        if (cancelled) return;

        setComments(payload?.data || []);
        setMeta(payload?.meta || null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadComments();

    return () => {
      cancelled = true;
    };
  }, [page, status]);

  const messages = {
    approve: "Commentaire approuvé — il est désormais visible sur le blog.",
    spam: "Commentaire marqué comme spam.",
    delete: "Commentaire supprimé.",
  };

  const updateStatus = async (id, action) => {
    try {
      if (action === "approve") await api.approveComment(id);
      if (action === "spam") await api.spamComment(id);
      if (action === "delete") await api.deleteComment(id);

      setComments((current) => current.filter((comment) => comment.id !== id));
      toast.success(messages[action]);
    } catch (error) {
      toast.error(error.message || "Action impossible. Réessaie.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Moderation"
        title="Gerer les commentaires"
        description="Un espace resserre pour approuver, filtrer ou supprimer rapidement les retours des visiteurs."
      />

      <ShellPanel className="p-5">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                status === filter.value
                  ? "border-[#2BE0B5] bg-[#E7FBF5] text-[#0D2420]"
                  : "border-[#0D2420]/8 bg-white text-[#3D5350]"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </ShellPanel>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-[1.8rem] bg-white/70"
            />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Aucun commentaire ici"
          description="La file est vide pour ce filtre. Reviens plus tard ou change d'etat."
        />
      ) : (
        <div className="grid gap-4">
          {comments.map((comment) => {
            const publicUrl = getPublicArticleUrl(comment.article?.slug);

            return (
              <ShellPanel key={comment.id} className="p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge status={comment.status} />
                      <span className="text-sm font-semibold text-[#0D2420]">
                        {comment.author_name || "Auteur anonyme"}
                      </span>
                      <span className="text-sm text-[#3D5350]/76">
                        {formatDate(comment.created_at, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    <p className="max-w-4xl text-sm leading-7 text-[#0D2420]">
                      {comment.body}
                    </p>

                    {comment.article ? (
                      <div className="rounded-[1.2rem] bg-[#F8FFFD] px-4 py-3 text-sm text-[#3D5350]">
                        Sur l&apos;article{" "}
                        <span className="font-semibold text-[#0D2420]">
                          {comment.article.title}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 xl:max-w-[18rem] xl:justify-end">
                    {comment.status !== "approved" ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(comment.id, "approve")}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "rounded-full border-[#0D2420]/8 bg-white px-4 text-[#0D2420]"
                        )}
                      >
                        Approuver
                        <Check className="size-4" />
                      </button>
                    ) : null}

                    {comment.status !== "spam" ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(comment.id, "spam")}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "rounded-full border-[#0D2420]/8 bg-white px-4 text-[#0D2420]"
                        )}
                      >
                        Marquer spam
                        <ShieldAlert className="size-4" />
                      </button>
                    ) : null}

                    {publicUrl ? (
                      <Link
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "rounded-full border-[#0D2420]/8 bg-white px-4 text-[#0D2420]"
                        )}
                      >
                        Voir la page
                        <ExternalLink className="size-4" />
                      </Link>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => updateStatus(comment.id, "delete")}
                      className={cn(
                        buttonVariants({ variant: "destructive" }),
                        "rounded-full px-4"
                      )}
                    >
                      Supprimer
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </ShellPanel>
            );
          })}
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
