/* eslint-disable @next/next/no-img-element */
"use client";

import { useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import {
  Edit3,
  ExternalLink,
  Globe,
  Pin,
  PinOff,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { api, getPublicProjectUrl, resolveAssetUrl } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  EmptyState,
  PageHero,
  ShellPanel,
  StatusBadge,
  formatDate,
} from "./dashboard-ui";

const MAX_PINNED = 4;

const statusFilters = [
  { value: "", label: "Tous" },
  { value: "published", label: "Publies" },
  { value: "draft", label: "Brouillons" },
  { value: "trashed", label: "Corbeille" },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const pinnedCount = projects.filter((project) => project.is_pinned).length;

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, status]);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      setLoading(true);

      try {
        const payload = await api.projects({ search: deferredSearch, status, page });
        if (cancelled) return;

        setProjects(payload?.data || []);
        setMeta(payload?.meta || null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, [deferredSearch, status, page]);

  const refresh = async () => {
    setLoading(true);
    try {
      const payload = await api.projects({ search: deferredSearch, status, page });
      setProjects(payload?.data || []);
      setMeta(payload?.meta || null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Envoyer ce projet à la corbeille ?")) return;
    try {
      await api.deleteProject(id);
      refresh();
      toast.success("Projet envoyé à la corbeille.");
    } catch (error) {
      toast.error(error.message || "Suppression impossible.");
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.restoreProject(id);
      refresh();
      toast.success("Projet restauré.");
    } catch (error) {
      toast.error(error.message || "Restauration impossible.");
    }
  };

  const handleForceDelete = async (id) => {
    if (
      !window.confirm(
        "Supprimer DÉFINITIVEMENT ce projet ? Cette action est irréversible."
      )
    ) {
      return;
    }
    try {
      await api.forceDeleteProject(id);
      refresh();
      toast.success("Projet supprimé définitivement.");
    } catch (error) {
      toast.error(error.message || "Suppression impossible.");
    }
  };

  const handlePublish = async (id, nextStatus) => {
    try {
      if (nextStatus === "published") {
        await api.publishProject(id);
        toast.success("Projet publié.");
      } else {
        await api.unpublishProject(id);
        toast.success("Projet repassé en brouillon.");
      }
      refresh();
    } catch (error) {
      toast.error(error.message || "Action impossible.");
    }
  };

  const handleTogglePin = async (project) => {
    try {
      if (project.is_pinned) {
        await api.unpinProject(project.id);
        toast.success("Projet désépinglé.");
      } else {
        await api.pinProject(project.id);
        toast.success("Projet épinglé — mis en avant sur la home.");
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
        title="Piloter les projets"
        description="Gère tes réalisations : publie, épingle (4 max mis en avant sur la home) ou édite chaque projet."
        actions={
          <Link href="/projects/new" className={cn(buttonVariants(), "rounded-full px-5")}>
            Nouveau projet
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

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#0D2420]/8 bg-[#F8FFFD] px-3 py-2 text-xs font-semibold text-[#3D5350]">
              Épinglés : {pinnedCount}/{MAX_PINNED}
            </span>
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
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="Aucun projet trouvé"
          description="Commence par créer un projet ou ajuste tes filtres."
          action={
            <Link href="/projects/new" className={cn(buttonVariants(), "rounded-full px-5")}>
              Créer un projet
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => {
            const publicUrl = getPublicProjectUrl(project.slug);
            const isTrashed = Boolean(project.deleted_at);

            return (
              <ShellPanel key={project.id} className="p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex gap-4">
                    {project.thumbnail ? (
                      <img
                        src={resolveAssetUrl(project.thumbnail)}
                        alt={project.title}
                        className="hidden h-24 w-36 shrink-0 rounded-[1.2rem] object-cover sm:block"
                      />
                    ) : null}

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge status={project.status} />
                        {project.is_pinned ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#E7FBF5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#0D2420]">
                            <Pin className="size-3" />
                            Épinglé
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <h2 className="text-xl font-black tracking-tight text-[#0D2420]">
                          {project.title}
                        </h2>
                        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#3D5350]/80">
                          {project.short_description || "Pas de description."}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(project.tags || []).slice(0, 6).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[#0D2420]/8 bg-white px-3 py-1 text-xs font-medium text-[#3D5350]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.35rem] border border-[#0D2420]/8 bg-white px-4 py-3 xl:min-w-[14rem]">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                      Publication
                    </p>
                    <p className="mt-3 text-sm font-semibold text-[#0D2420]">
                      {formatDate(project.published_at)}
                    </p>
                    <p className="mt-1 text-sm text-[#3D5350]/75">{project.slug}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-[#0D2420]/8 pt-5">
                  {isTrashed ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRestore(project.id)}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "rounded-full border-[#0D2420]/8 bg-white px-4 text-[#0D2420]"
                        )}
                      >
                        Restaurer
                        <RotateCcw className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleForceDelete(project.id)}
                        className={cn(buttonVariants({ variant: "destructive" }), "rounded-full px-4")}
                      >
                        Supprimer définitivement
                        <Trash2 className="size-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/projects/${project.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "rounded-full border-[#0D2420]/8 bg-white px-4 text-[#0D2420]"
                        )}
                      >
                        Éditer
                        <Edit3 className="size-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleTogglePin(project)}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "rounded-full border-[#0D2420]/8 bg-white px-4 text-[#0D2420]"
                        )}
                      >
                        {project.is_pinned ? "Désépingler" : "Épingler"}
                        {project.is_pinned ? (
                          <PinOff className="size-4" />
                        ) : (
                          <Pin className="size-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handlePublish(
                            project.id,
                            project.status === "published" ? "draft" : "published"
                          )
                        }
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "rounded-full border-[#0D2420]/8 bg-white px-4 text-[#0D2420]"
                        )}
                      >
                        {project.status === "published" ? "Dépublier" : "Publier"}
                        <Globe className="size-4" />
                      </button>

                      {publicUrl && project.status === "published" ? (
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
                        onClick={() => handleDelete(project.id)}
                        className={cn(buttonVariants({ variant: "destructive" }), "rounded-full px-4")}
                      >
                        Supprimer
                        <Trash2 className="size-4" />
                      </button>
                    </>
                  )}
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
            onClick={() => setPage((current) => Math.min(meta.last_page, current + 1))}
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
