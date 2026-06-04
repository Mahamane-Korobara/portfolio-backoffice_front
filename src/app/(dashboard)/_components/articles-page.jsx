"use client";

import { useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import { Edit3, ExternalLink, Eye, Globe, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { api, getPublicArticleUrl } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  EmptyState,
  PageHero,
  ShellPanel,
  StatusBadge,
  formatCompactNumber,
  formatDate,
} from "./dashboard-ui";

const statusFilters = [
  { value: "", label: "Tous" },
  { value: "published", label: "Publies" },
  { value: "draft", label: "Brouillons" },
  { value: "scheduled", label: "Programmes" },
];

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, status]);

  useEffect(() => {
    let cancelled = false;

    async function loadArticles() {
      setLoading(true);

      try {
        const payload = await api.articles({
          search: deferredSearch,
          status,
          page,
        });

        if (cancelled) return;

        setArticles(payload?.data || []);
        setMeta(payload?.meta || null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadArticles();

    return () => {
      cancelled = true;
    };
  }, [deferredSearch, status, page]);

  const refresh = async () => {
    setLoading(true);
    try {
      const payload = await api.articles({
        search: deferredSearch,
        status,
        page,
      });
      setArticles(payload?.data || []);
      setMeta(payload?.meta || null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cet article ?")) {
      return;
    }

    try {
      await api.deleteArticle(id);
      refresh();
      toast.success("Article envoyé à la corbeille.");
    } catch (error) {
      toast.error(error.message || "Suppression impossible.");
    }
  };

  const handlePublish = async (id, nextStatus) => {
    try {
      if (nextStatus === "published") {
        await api.publishArticle(id);
        toast.success("Article publié — visible sur le blog.");
      } else {
        await api.unpublishArticle(id);
        toast.success("Article repassé en brouillon.");
      }
      refresh();
    } catch (error) {
      toast.error(error.message || "Action impossible.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Contenu"
        title="Piloter les articles"
        description="Filtre, publie, depublie ou edite tes billets depuis une vue concise et orientee actions."
        actions={
          <Link
            href="/articles/new"
            className={cn(buttonVariants(), "rounded-full px-5")}
          >
            Nouvel article
            <Plus className="size-4" />
          </Link>
        }
      />

      <ShellPanel className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#3D5350]/55" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 rounded-full border-[#0D2420]/8 bg-white pl-10"
              placeholder="Rechercher par titre..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value || "all"}
                type="button"
                onClick={() => setStatus(filter.value)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  status === filter.value
                    ? "border-[#2BE0B5] bg-[#E7FBF5] text-[#0D2420]"
                    : "border-[#0D2420]/8 bg-white text-[#3D5350] hover:border-[#2BE0B5]/55"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </ShellPanel>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-[1.8rem] bg-white/70 shadow-[var(--mk-shadow-soft)]"
            />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="Aucun article trouve"
          description="Commence par creer un article ou ajuste tes filtres pour retrouver un contenu existant."
          action={
            <Link
              href="/articles/new"
              className={cn(buttonVariants(), "rounded-full px-5")}
            >
              Creer un article
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {articles.map((article) => {
            const publicUrl = getPublicArticleUrl(article.slug);

            return (
              <ShellPanel key={article.id} className="p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge
                        status={article.status}
                        label={article.status_label || undefined}
                      />
                      {article.category ? (
                        <span className="rounded-full bg-[#E7FBF5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#0D2420]">
                          {article.category.name}
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <h2 className="text-xl font-black tracking-tight text-[#0D2420]">
                        {article.title}
                      </h2>
                      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#3D5350]/80">
                        {article.excerpt || "Pas d'extrait pour le moment."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(article.tags || []).map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full border border-[#0D2420]/8 bg-white px-3 py-1 text-xs font-medium text-[#3D5350]"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[20rem] xl:max-w-[20rem]">
                    <div className="rounded-[1.35rem] bg-[#F8FFFD] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                        Performance
                      </p>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-[#3D5350]">
                        <div>
                          <p className="text-lg font-black text-[#0D2420]">
                            {formatCompactNumber(article.views_count)}
                          </p>
                          <p>Vues</p>
                        </div>
                        <div>
                          <p className="text-lg font-black text-[#0D2420]">
                            {formatCompactNumber(article.likes_count)}
                          </p>
                          <p>Reactions</p>
                        </div>
                        <div>
                          <p className="text-lg font-black text-[#0D2420]">
                            {formatCompactNumber(article.comments_count)}
                          </p>
                          <p>Com.</p>
                        </div>
                      </div>

                      {(article.reactions || []).some((r) => r.count > 0) ? (
                        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#0D2420]/8 pt-3">
                          {article.reactions
                            .filter((r) => r.count > 0)
                            .map((r) => (
                              <span
                                key={r.type}
                                title={r.label}
                                className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[#0D2420] ring-1 ring-[#0D2420]/8"
                              >
                                <span aria-hidden>{r.emoji}</span>
                                {formatCompactNumber(r.count)}
                              </span>
                            ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-[1.35rem] border border-[#0D2420]/8 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                        Publication
                      </p>
                      <p className="mt-3 text-sm font-semibold text-[#0D2420]">
                        {formatDate(article.published_at)}
                      </p>
                      <p className="mt-1 text-sm text-[#3D5350]/75">{article.slug}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-[#0D2420]/8 pt-5">
                  <Link
                    href={`/articles/${article.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "rounded-full border-[#0D2420]/8 bg-white px-4 text-[#0D2420]"
                    )}
                  >
                    Editer
                    <Edit3 className="size-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      handlePublish(
                        article.id,
                        article.status === "published" ? "draft" : "published"
                      )
                    }
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "rounded-full border-[#0D2420]/8 bg-white px-4 text-[#0D2420]"
                    )}
                  >
                    {article.status === "published" ? "Depublier" : "Publier"}
                    <Globe className="size-4" />
                  </button>

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
                      Voir en ligne
                      <ExternalLink className="size-4" />
                    </Link>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleDelete(article.id)}
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
