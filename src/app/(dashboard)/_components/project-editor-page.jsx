/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Eye,
  ImagePlus,
  Pin,
  Plus,
  Save,
  Trash2,
  Upload,
  Video,
  WandSparkles,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import Editor from "@/components/Editor";
import MediaPicker from "@/components/MediaPicker";
import { api, getPublicProjectUrl, resolveAssetUrl } from "@/lib/api";
import { buttonVariants, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PageHero, ShellPanel, StatusBadge, formatDate, slugify } from "./dashboard-ui";

const EMPTY_DOCUMENT = { type: "doc", content: [{ type: "paragraph" }] };

function createInitialForm() {
  return {
    title: "",
    slug: "",
    short_description: "",
    content: EMPTY_DOCUMENT,
    tags: [],
    features: [],
    results: [],
    role: "",
    duration: "",
    client: "",
    link_github: "",
    link_live: "",
    thumbnail: "",
    gallery: [],
    video_url: "",
    is_pinned: false,
    meta_title: "",
    meta_description: "",
    status: "draft",
  };
}

/** Éditeur d'une liste de chaînes (tags, fonctionnalités, résultats). */
function ListEditor({ label, hint, items, onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    onChange([...items, value]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
        {label}
      </label>
      {hint ? <p className="text-[11px] text-[#3D5350]/66">{hint}</p> : null}

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          className="h-11 rounded-2xl border-[#0D2420]/8 bg-white"
          placeholder={placeholder}
        />
        <Button type="button" onClick={add} className="h-11 rounded-2xl px-4">
          <Plus className="size-4" />
        </Button>
      </div>

      {items.length ? (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#0D2420]/8 bg-white px-4 py-2.5"
            >
              <span className="text-sm text-[#0D2420]">{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                className="text-red-600"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function ProjectEditorPage({ projectId }) {
  const router = useRouter();
  const normalizedId = typeof projectId === "string" ? projectId.trim() : String(projectId || "");
  const isCreate = normalizedId === "new" || normalizedId === "";
  const isEditableId = /^\d+$/.test(normalizedId);
  const pickerResolver = useRef(null);
  const videoInputRef = useRef(null);

  const [form, setForm] = useState(createInitialForm());
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState("");
  const [pickerMode, setPickerMode] = useState(null);
  const [slugTouched, setSlugTouched] = useState(!isCreate);

  const publicUrl = useMemo(() => getPublicProjectUrl(form.slug), [form.slug]);

  useEffect(() => {
    if (isCreate || !isEditableId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadProject() {
      setLoading(true);
      try {
        const payload = await api.project(normalizedId);
        if (cancelled) return;

        const current = payload?.data || payload;
        setProject(current);
        setForm({
          title: current.title || "",
          slug: current.slug || "",
          short_description: current.short_description || "",
          content: current.content || EMPTY_DOCUMENT,
          tags: current.tags || [],
          features: current.features || [],
          results: current.results || [],
          role: current.role || "",
          duration: current.duration || "",
          client: current.client || "",
          link_github: current.link_github || "",
          link_live: current.link_live || "",
          thumbnail: current.thumbnail || "",
          gallery: current.gallery || [],
          video_url: current.video_url || "",
          is_pinned: Boolean(current.is_pinned),
          meta_title: current.meta_title || "",
          meta_description: current.meta_description || "",
          status: current.status || "draft",
        });
        setSlugTouched(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProject();

    return () => {
      cancelled = true;
    };
  }, [isCreate, isEditableId, normalizedId]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleTitleChange = (value) => {
    setField("title", value);
    if (!slugTouched) setField("slug", slugify(value));
  };

  const requestEditorImage = () =>
    new Promise((resolve) => {
      pickerResolver.current = resolve;
      setPickerMode("editor");
    });

  const closePicker = () => {
    pickerResolver.current?.(null);
    pickerResolver.current = null;
    setPickerMode(null);
  };

  const handleMediaSelect = (asset) => {
    if (pickerMode === "editor") {
      pickerResolver.current?.(asset);
      pickerResolver.current = null;
    }

    if (pickerMode === "thumbnail") {
      setField("thumbnail", asset.url);
    }

    if (pickerMode === "gallery") {
      setForm((current) => {
        if (current.gallery.some((image) => image.url === asset.url)) return current;
        return {
          ...current,
          gallery: [...current.gallery, { url: asset.url, alt: asset.alt || "" }],
        };
      });
    }

    setPickerMode(null);
  };

  const updateGalleryAlt = (index, alt) => {
    setForm((current) => ({
      ...current,
      gallery: current.gallery.map((image, i) => (i === index ? { ...image, alt } : image)),
    }));
  };

  const moveGalleryItem = (index, direction) => {
    setForm((current) => {
      const next = [...current.gallery];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, gallery: next };
    });
  };

  const removeGalleryItem = (index) => {
    setForm((current) => ({
      ...current,
      gallery: current.gallery.filter((_, i) => i !== index),
    }));
  };

  const handleVideoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingVideo(true);
    try {
      const created = await api.uploadMedia(formData);
      setField("video_url", created.url);
      toast.success("Vidéo téléversée.");
    } catch (uploadError) {
      toast.error(uploadError.message || "Téléversement impossible (max 50 Mo).");
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const saveProject = async (mode = "draft") => {
    setSaving(mode);
    setError("");

    try {
      const payload = {
        ...form,
        content: form.content || EMPTY_DOCUMENT,
        link_github: form.link_github || null,
        link_live: form.link_live || null,
        thumbnail: form.thumbnail || (form.gallery[0]?.url ?? ""),
        video_url: form.video_url || null,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
      };

      const response = isCreate
        ? await api.createProject(payload)
        : await api.updateProject(normalizedId, payload);

      if (response?.warning) toast.warning(response.warning);

      const saved = response?.project || response?.data || response;
      const savedId = saved?.id || normalizedId;

      if (mode === "publish") {
        await api.publishProject(savedId);
      }

      toast.success(
        mode === "publish" ? "Projet publié — visible sur le portfolio." : "Projet enregistré."
      );

      if (isCreate) {
        router.replace(`/projects/${savedId}`);
        return;
      }

      const fresh = await api.project(savedId);
      setProject(fresh?.data || fresh);
    } catch (currentError) {
      setError(currentError.message || "Impossible d'enregistrer le projet.");
      toast.error(currentError.message || "Impossible d'enregistrer le projet.");
    } finally {
      setSaving("");
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <div className="h-[36rem] animate-pulse rounded-[2rem] bg-white/70" />
        <div className="h-[36rem] animate-pulse rounded-[2rem] bg-white/70" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow={isCreate ? "Nouveau projet" : "Édition"}
        title={isCreate ? "Composer un nouveau projet" : form.title || "Projet en cours"}
        description="Rédige le projet comme un article, ajoute une galerie hero, une vidéo et épingle-le pour la home."
        actions={
          <>
            <Link
              href="/projects"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-full border-[#0D2420]/8 bg-white px-4 text-[#0D2420]"
              )}
            >
              Retour
              <ArrowLeft className="size-4" />
            </Link>
            <Button onClick={() => saveProject("draft")} className="rounded-full px-5" disabled={saving !== ""}>
              {saving === "draft" ? "Sauvegarde..." : "Sauvegarder"}
              <Save className="size-4" />
            </Button>
          </>
        }
      />

      {error ? (
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <div className="space-y-6">
          <ShellPanel className="p-5">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                  Titre
                </label>
                <Input
                  value={form.title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  className="h-12 rounded-2xl border-[#0D2420]/8 bg-white"
                  placeholder="Ex: Plateforme de gestion académique"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                  Slug
                </label>
                <Input
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setField("slug", slugify(event.target.value));
                  }}
                  className="h-12 rounded-2xl border-[#0D2420]/8 bg-white"
                  placeholder="mon-projet"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                  Description courte
                </label>
                <Textarea
                  value={form.short_description}
                  onChange={(event) => setField("short_description", event.target.value)}
                  className="min-h-24 rounded-[1.4rem] border-[#0D2420]/8 bg-white"
                  placeholder="Résumé affiché sur la carte et le SEO."
                />
              </div>
            </div>
          </ShellPanel>

          <ShellPanel className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                  Contenu
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#0D2420]">Éditeur TipTap</h2>
              </div>
              <div className="rounded-full bg-[#E7FBF5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#0D2420]">
                JSON riche
              </div>
            </div>

            <Editor
              content={form.content}
              onChange={(value) => setField("content", value)}
              onRequestImage={requestEditorImage}
            />
          </ShellPanel>

          {/* Galerie hero */}
          <ShellPanel className="p-5">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                  Hero
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#0D2420]">Galerie d&apos;images</h2>
                <p className="mt-1 text-sm text-[#3D5350]/75">
                  L&apos;ordre définit le défilement du hero. La 1ère image sert de vignette par défaut.
                </p>
              </div>

              {form.gallery.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {form.gallery.map((image, index) => (
                    <div
                      key={image.url}
                      className="overflow-hidden rounded-[1.35rem] border border-[#0D2420]/8 bg-white"
                    >
                      <img
                        src={resolveAssetUrl(image.url)}
                        alt={image.alt || "Image du projet"}
                        className="h-40 w-full object-cover"
                      />
                      <div className="space-y-2 p-3">
                        <Input
                          value={image.alt}
                          onChange={(event) => updateGalleryAlt(index, event.target.value)}
                          className="h-10 rounded-xl border-[#0D2420]/8 bg-white text-sm"
                          placeholder="Texte alternatif (accessibilité / SEO)"
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => moveGalleryItem(index, -1)}
                              disabled={index === 0}
                              className="inline-flex size-8 items-center justify-center rounded-full border border-[#0D2420]/8 bg-white text-[#0D2420] disabled:opacity-40"
                            >
                              <ArrowUp className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveGalleryItem(index, 1)}
                              disabled={index === form.gallery.length - 1}
                              className="inline-flex size-8 items-center justify-center rounded-full border border-[#0D2420]/8 bg-white text-[#0D2420] disabled:opacity-40"
                            >
                              <ArrowDown className="size-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeGalleryItem(index)}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-red-600"
                          >
                            Retirer
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-[#0D2420]/12 bg-[#FBFFFE] px-6 text-center">
                  <div className="rounded-full bg-[#E7FBF5] p-4 text-[#0D2420]">
                    <ImagePlus className="size-6" />
                  </div>
                  <p className="text-sm text-[#3D5350]/78">La galerie est vide.</p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full rounded-full border-[#0D2420]/8 bg-white text-[#0D2420]"
                onClick={() => setPickerMode("gallery")}
              >
                Ajouter une image à la galerie
                <Plus className="size-4" />
              </Button>
            </div>
          </ShellPanel>

          {/* Vidéo */}
          <ShellPanel className="p-5">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                  Démo
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#0D2420]">Vidéo (optionnel)</h2>
                <p className="mt-1 text-sm text-[#3D5350]/75">
                  Colle une URL (YouTube, Vimeo…) ou téléverse un fichier depuis ton appareil (max 50 Mo).
                </p>
              </div>

              <Input
                value={form.video_url}
                onChange={(event) => setField("video_url", event.target.value)}
                className="h-12 rounded-2xl border-[#0D2420]/8 bg-white"
                placeholder="https://youtube.com/watch?v=... ou /storage/projects/demo.mp4"
              />

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="rounded-full border-[#0D2420]/8 bg-white text-[#0D2420]"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideo}
                >
                  <Upload className="size-4" />
                  {uploadingVideo ? "Téléversement..." : "Téléverser une vidéo"}
                </Button>
                {form.video_url ? (
                  <Button variant="destructive" className="rounded-full" onClick={() => setField("video_url", "")}>
                    Retirer
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>

              {form.video_url ? (
                <p className="flex items-center gap-2 break-all rounded-xl bg-[#F8FFFD] px-3 py-2 text-xs text-[#3D5350]">
                  <Video className="size-4 shrink-0" />
                  {form.video_url}
                </p>
              ) : null}
            </div>
          </ShellPanel>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          <ShellPanel className="p-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={project?.status || form.status || "draft"} />
                {project?.published_at ? (
                  <span className="text-sm text-[#3D5350]/78">
                    Publié le {formatDate(project.published_at)}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-3">
                <Button onClick={() => saveProject("publish")} disabled={saving !== ""} className="h-11 rounded-full">
                  {saving === "publish" ? "Publication..." : "Publier maintenant"}
                  <WandSparkles className="size-4" />
                </Button>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[1.4rem] border border-[#0D2420]/8 bg-[#FBFFFE] px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-[#0D2420]">
                    <Pin className="size-4" />
                    Épingler sur la home
                  </span>
                  <input
                    type="checkbox"
                    checked={form.is_pinned}
                    onChange={(event) => setField("is_pinned", event.target.checked)}
                    className="size-5 accent-[#2BE0B5]"
                  />
                </label>
                <p className="text-[11px] text-[#3D5350]/66">
                  4 projets épinglés maximum. Au-delà, désépingle-en un d&apos;abord.
                </p>

                {publicUrl && project?.status === "published" ? (
                  <Link
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-11 rounded-full border-[#0D2420]/8 bg-white text-[#0D2420]"
                    )}
                  >
                    Voir la page publique
                    <Eye className="size-4" />
                  </Link>
                ) : null}
              </div>
            </div>
          </ShellPanel>

          <ShellPanel className="p-5">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                  Détails
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#0D2420]">Informations</h2>
              </div>

              <div className="grid gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">Rôle</label>
                  <Input
                    value={form.role}
                    onChange={(event) => setField("role", event.target.value)}
                    className="h-11 rounded-2xl border-[#0D2420]/8 bg-white"
                    placeholder="Développeur full-stack"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">Durée</label>
                  <Input
                    value={form.duration}
                    onChange={(event) => setField("duration", event.target.value)}
                    className="h-11 rounded-2xl border-[#0D2420]/8 bg-white"
                    placeholder="2 mois"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">Client</label>
                  <Input
                    value={form.client}
                    onChange={(event) => setField("client", event.target.value)}
                    className="h-11 rounded-2xl border-[#0D2420]/8 bg-white"
                    placeholder="Nom du client"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">Lien GitHub</label>
                  <Input
                    value={form.link_github}
                    onChange={(event) => setField("link_github", event.target.value)}
                    className="h-11 rounded-2xl border-[#0D2420]/8 bg-white"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">Lien live</label>
                  <Input
                    value={form.link_live}
                    onChange={(event) => setField("link_live", event.target.value)}
                    className="h-11 rounded-2xl border-[#0D2420]/8 bg-white"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </ShellPanel>

          <ShellPanel className="p-5">
            <div className="space-y-5">
              <ListEditor
                label="Tags"
                items={form.tags}
                onChange={(value) => setField("tags", value)}
                placeholder="Next.js, Laravel..."
              />
              <ListEditor
                label="Fonctionnalités clés"
                items={form.features}
                onChange={(value) => setField("features", value)}
                placeholder="Une fonctionnalité par ligne"
              />
              <ListEditor
                label="Résultats observés"
                items={form.results}
                onChange={(value) => setField("results", value)}
                placeholder="Un résultat par ligne"
              />
            </div>
          </ShellPanel>

          {/* Vignette */}
          <ShellPanel className="p-5">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">Carte</p>
                <h2 className="mt-2 text-2xl font-black text-[#0D2420]">Vignette</h2>
                <p className="mt-1 text-sm text-[#3D5350]/75">
                  Optionnel — sinon la 1ère image de la galerie est utilisée.
                </p>
              </div>

              <div className="overflow-hidden rounded-[1.5rem] border border-dashed border-[#0D2420]/12 bg-[#FBFFFE]">
                {form.thumbnail ? (
                  <img src={resolveAssetUrl(form.thumbnail)} alt="Vignette" className="h-44 w-full object-cover" />
                ) : (
                  <div className="flex h-44 items-center justify-center text-sm text-[#3D5350]/78">
                    Aucune vignette.
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full border-[#0D2420]/8 bg-white text-[#0D2420]"
                  onClick={() => setPickerMode("thumbnail")}
                >
                  Choisir une vignette
                </Button>
                {form.thumbnail ? (
                  <Button variant="destructive" className="rounded-full" onClick={() => setField("thumbnail", "")}>
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </ShellPanel>

          <ShellPanel className="p-5">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">SEO</p>
                <h2 className="mt-2 text-2xl font-black text-[#0D2420]">Méta données</h2>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">Meta title</label>
                <Input
                  value={form.meta_title}
                  onChange={(event) => setField("meta_title", event.target.value)}
                  className="h-12 rounded-2xl border-[#0D2420]/8 bg-white"
                  placeholder="Titre SEO"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">Meta description</label>
                <Textarea
                  value={form.meta_description}
                  onChange={(event) => setField("meta_description", event.target.value)}
                  className="min-h-24 rounded-[1.4rem] border-[#0D2420]/8 bg-white"
                  placeholder="Description courte orientée clic."
                />
              </div>
            </div>
          </ShellPanel>
        </div>
      </div>

      {pickerMode ? (
        <MediaPicker
          onSelect={handleMediaSelect}
          onClose={closePicker}
          title={
            pickerMode === "editor"
              ? "Insérer une image dans l'éditeur"
              : pickerMode === "gallery"
                ? "Ajouter une image à la galerie"
                : "Choisir la vignette"
          }
        />
      ) : null}
    </div>
  );
}
