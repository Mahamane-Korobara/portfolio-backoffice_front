/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  Eye,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

import Editor from "@/components/Editor";
import MediaPicker from "@/components/MediaPicker";
import { api, getPublicArticleUrl, resolveAssetUrl, resolveSiteUrl } from "@/lib/api";
import { buttonVariants, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  EmptyState,
  PageHero,
  ShellPanel,
  StatusBadge,
  formatDate,
  fromDateTimeLocalValue,
  slugify,
  toDateTimeLocalValue,
} from "./dashboard-ui";

const EMPTY_DOCUMENT = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function createInitialForm() {
  return {
    title: "",
    slug: "",
    excerpt: "",
    content: EMPTY_DOCUMENT,
    category_id: "",
    series_id: "",
    series_order: "",
    tag_ids: [],
    cover_image: "",
    cover_gallery: [],
    cover_type: "image",
    meta_title: "",
    meta_description: "",
    canonical_url: "",
  };
}

function normalizeList(payload) {
  return Array.isArray(payload) ? payload : payload?.data || [];
}

export default function ArticleEditorPage({ articleId }) {
  const router = useRouter();
  const normalizedArticleId =
    typeof articleId === "string" ? articleId.trim() : String(articleId || "");
  const isCreate = normalizedArticleId === "new" || normalizedArticleId === "";
  const isEditableId = /^\d+$/.test(normalizedArticleId);
  const pickerResolver = useRef(null);

  const [form, setForm] = useState(createInitialForm());
  const [article, setArticle] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [pickerMode, setPickerMode] = useState(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [slugTouched, setSlugTouched] = useState(!isCreate);

  const publicArticleUrl = useMemo(
    () => getPublicArticleUrl(form.slug),
    [form.slug]
  );
  const previewUrl = useMemo(
    () => resolveSiteUrl(article?.preview_url),
    [article?.preview_url]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadReferences() {
      const [categoriesPayload, tagsPayload, seriesPayload] = await Promise.all([
        api.categories(),
        api.tags(),
        api.series(),
      ]);

      if (cancelled) return;

      setCategories(normalizeList(categoriesPayload));
      setTags(normalizeList(tagsPayload));
      setSeries(normalizeList(seriesPayload));
    }

    loadReferences();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isCreate || !isEditableId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadArticle() {
      setLoading(true);

      try {
        const payload = await api.article(normalizedArticleId);
        if (cancelled) return;

        const currentArticle = payload?.data || payload;
        setArticle(currentArticle);
        setScheduleAt(toDateTimeLocalValue(currentArticle.scheduled_at));
        setForm({
          title: currentArticle.title || "",
          slug: currentArticle.slug || "",
          excerpt: currentArticle.excerpt || "",
          content: currentArticle.content || EMPTY_DOCUMENT,
          category_id: currentArticle.category_id || "",
          series_id: currentArticle.series_id || "",
          series_order: currentArticle.series_order || "",
          tag_ids: (currentArticle.tags || []).map((tag) => tag.id),
          cover_image: currentArticle.cover_image || "",
          cover_gallery: currentArticle.cover_gallery || [],
          cover_type: currentArticle.cover_type || "image",
          meta_title: currentArticle.meta_title || "",
          meta_description: currentArticle.meta_description || "",
          canonical_url: currentArticle.canonical_url || "",
        });
        setSlugTouched(true);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadArticle();

    return () => {
      cancelled = true;
    };
  }, [isCreate, isEditableId, normalizedArticleId]);

  const setField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleTitleChange = (value) => {
    setField("title", value);

    if (!slugTouched) {
      setField("slug", slugify(value));
    }
  };

  const toggleTag = (tagId) => {
    setForm((current) => ({
      ...current,
      tag_ids: current.tag_ids.includes(tagId)
        ? current.tag_ids.filter((currentId) => currentId !== tagId)
        : [...current.tag_ids, tagId],
    }));
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

    if (pickerMode === "cover") {
      setForm((current) => ({
        ...current,
        cover_type: "image",
        cover_image: asset.url,
      }));
    }

    if (pickerMode === "gallery") {
      setForm((current) => ({
        ...current,
        cover_type: "gallery",
        cover_gallery: Array.from(new Set([...(current.cover_gallery || []), asset.url])),
      }));
    }

    setPickerMode(null);
  };

  const saveArticle = async (mode = "draft") => {
    setSaving(mode);
    setError("");

    try {
      const payload = {
        ...form,
        category_id: form.category_id || null,
        series_id: form.series_id || null,
        series_order: form.series_order ? Number(form.series_order) : null,
        content: form.content || EMPTY_DOCUMENT,
        cover_gallery: form.cover_type === "gallery" ? form.cover_gallery : [],
        cover_image:
          form.cover_type === "gallery"
            ? form.cover_gallery[0] || form.cover_image || ""
            : form.cover_image || "",
        canonical_url: form.canonical_url || null,
      };

      const response = isCreate
        ? await api.createArticle(payload)
        : await api.updateArticle(normalizedArticleId, payload);

      const savedArticle = response?.data || response;
      const savedId = savedArticle?.id || normalizedArticleId;

      if (mode === "publish") {
        await api.publishArticle(savedId);
      }

      if (mode === "schedule") {
        if (!scheduleAt) {
          throw new Error("Choisis une date de programmation.");
        }
        await api.scheduleArticle(savedId, fromDateTimeLocalValue(scheduleAt));
      }

      if (isCreate) {
        router.replace(`/articles/${savedId}`);
        return;
      }

      const freshPayload = await api.article(savedId);
      const freshArticle = freshPayload?.data || freshPayload;
      setArticle(freshArticle);
      setScheduleAt(toDateTimeLocalValue(freshArticle.scheduled_at));
    } catch (currentError) {
      setError(currentError.message || "Impossible d'enregistrer l'article.");
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
        eyebrow={isCreate ? "Nouvel article" : "Edition"}
        title={isCreate ? "Composer un nouvel article" : form.title || "Article en cours"}
        description="Une vue d'edition concentree: contenu au centre, publication et taxonomies sur le cote, medias accessibles sans quitter la page."
        actions={
          <>
            <Link
              href="/articles"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-full border-[#0D2420]/8 bg-white px-4 text-[#0D2420]"
              )}
            >
              Retour
              <ArrowLeft className="size-4" />
            </Link>

            <Button
              onClick={() => saveArticle("draft")}
              className="rounded-full px-5"
              disabled={saving !== ""}
            >
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
                  placeholder="Ex: Construire un backoffice editorial solide"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
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
                    placeholder="mon-article"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                    Serie order
                  </label>
                  <Input
                    value={form.series_order}
                    onChange={(event) => setField("series_order", event.target.value)}
                    className="h-12 rounded-2xl border-[#0D2420]/8 bg-white"
                    placeholder="1"
                    type="number"
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                  Extrait
                </label>
                <Textarea
                  value={form.excerpt}
                  onChange={(event) => setField("excerpt", event.target.value)}
                  className="min-h-28 rounded-[1.4rem] border-[#0D2420]/8 bg-white"
                  placeholder="Resume rapide de l'article pour la liste et le SEO."
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
                <h2 className="mt-2 text-2xl font-black text-[#0D2420]">
                  Editeur TipTap
                </h2>
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
        </div>

        <div className="space-y-6">
          <ShellPanel className="p-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge
                  status={article?.status || "draft"}
                  label={article?.status_label || (isCreate ? "Brouillon" : undefined)}
                />
                {article?.published_at ? (
                  <span className="text-sm text-[#3D5350]/78">
                    Publie le {formatDate(article.published_at)}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-3">
                <Button
                  onClick={() => saveArticle("publish")}
                  disabled={saving !== ""}
                  className="h-11 rounded-full"
                >
                  {saving === "publish" ? "Publication..." : "Publier maintenant"}
                  <WandSparkles className="size-4" />
                </Button>

                <div className="rounded-[1.4rem] border border-[#0D2420]/8 bg-[#FBFFFE] p-4">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                    Programmer
                  </label>
                  <Input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(event) => setScheduleAt(event.target.value)}
                    className="mt-3 h-11 rounded-2xl border-[#0D2420]/8 bg-white"
                  />
                  <Button
                    onClick={() => saveArticle("schedule")}
                    disabled={saving !== ""}
                    variant="outline"
                    className="mt-3 h-11 w-full rounded-full border-[#0D2420]/8 bg-white text-[#0D2420]"
                  >
                    Programmer
                    <Clock3 className="size-4" />
                  </Button>
                </div>

                {publicArticleUrl ? (
                  <Link
                    href={publicArticleUrl}
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

                {previewUrl ? (
                  <Link
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-11 rounded-full border-[#0D2420]/8 bg-white text-[#0D2420]"
                    )}
                  >
                    Previsualiser
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
                  Taxonomies
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#0D2420]">
                  Classement editorial
                </h2>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                  Categorie
                </label>
                <select
                  value={form.category_id}
                  onChange={(event) => setField("category_id", event.target.value)}
                  className="h-12 w-full rounded-2xl border border-[#0D2420]/8 bg-white px-4 text-sm text-[#0D2420]"
                >
                  <option value="">Aucune categorie</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                  Serie
                </label>
                <select
                  value={form.series_id}
                  onChange={(event) => setField("series_id", event.target.value)}
                  className="h-12 w-full rounded-2xl border border-[#0D2420]/8 bg-white px-4 text-sm text-[#0D2420]"
                >
                  <option value="">Aucune serie</option>
                  {series.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const selected = form.tag_ids.includes(tag.id);

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          "rounded-full border px-3 py-2 text-sm font-medium transition",
                          selected
                            ? "border-[#2BE0B5] bg-[#E7FBF5] text-[#0D2420]"
                            : "border-[#0D2420]/8 bg-white text-[#3D5350]"
                        )}
                      >
                        #{tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </ShellPanel>

          <ShellPanel className="p-5">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                    Couverture
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#0D2420]">
                    Visuels
                  </h2>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setField("cover_type", "image")}
                    className={cn(
                      "rounded-full border px-3 py-2 text-sm font-semibold",
                      form.cover_type === "image"
                        ? "border-[#2BE0B5] bg-[#E7FBF5] text-[#0D2420]"
                        : "border-[#0D2420]/8 bg-white text-[#3D5350]"
                    )}
                  >
                    Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setField("cover_type", "gallery")}
                    className={cn(
                      "rounded-full border px-3 py-2 text-sm font-semibold",
                      form.cover_type === "gallery"
                        ? "border-[#2BE0B5] bg-[#E7FBF5] text-[#0D2420]"
                        : "border-[#0D2420]/8 bg-white text-[#3D5350]"
                    )}
                  >
                    Gallery
                  </button>
                </div>
              </div>

              {form.cover_type === "image" ? (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-[1.5rem] border border-dashed border-[#0D2420]/12 bg-[#FBFFFE]">
                    {form.cover_image ? (
                      <img
                        src={resolveAssetUrl(form.cover_image)}
                        alt="Cover"
                        className="h-56 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-56 flex-col items-center justify-center gap-3 text-center">
                        <div className="rounded-full bg-[#E7FBF5] p-4 text-[#0D2420]">
                          <ImagePlus className="size-6" />
                        </div>
                        <p className="text-sm text-[#3D5350]/78">
                          Aucune image de couverture selectionnee.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-full border-[#0D2420]/8 bg-white text-[#0D2420]"
                      onClick={() => setPickerMode("cover")}
                    >
                      Choisir une image
                    </Button>
                    {form.cover_image ? (
                      <Button
                        variant="destructive"
                        className="rounded-full"
                        onClick={() => setField("cover_image", "")}
                      >
                        Retirer
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {form.cover_gallery.length ? (
                      form.cover_gallery.map((image) => (
                        <div
                          key={image}
                          className="overflow-hidden rounded-[1.35rem] border border-[#0D2420]/8 bg-white"
                        >
                          <img
                            src={resolveAssetUrl(image)}
                            alt="Gallery cover"
                            className="h-36 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                cover_gallery: current.cover_gallery.filter(
                                  (currentImage) => currentImage !== image
                                ),
                              }))
                            }
                            className="w-full border-t border-[#0D2420]/8 px-3 py-3 text-sm font-semibold text-red-600"
                          >
                            Retirer
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full flex min-h-44 flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-[#0D2420]/12 bg-[#FBFFFE] px-6 text-center">
                        <div className="rounded-full bg-[#E7FBF5] p-4 text-[#0D2420]">
                          <Plus className="size-6" />
                        </div>
                        <p className="text-sm text-[#3D5350]/78">
                          La galerie de couverture est vide.
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full rounded-full border-[#0D2420]/8 bg-white text-[#0D2420]"
                    onClick={() => setPickerMode("gallery")}
                  >
                    Ajouter une image a la galerie
                  </Button>
                </div>
              )}
            </div>
          </ShellPanel>

          <ShellPanel className="p-5">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                  SEO
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#0D2420]">
                  Meta donnees
                </h2>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                  Meta title
                </label>
                <Input
                  value={form.meta_title}
                  onChange={(event) => setField("meta_title", event.target.value)}
                  className="h-12 rounded-2xl border-[#0D2420]/8 bg-white"
                  placeholder="Titre SEO"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                  Meta description
                </label>
                <Textarea
                  value={form.meta_description}
                  onChange={(event) => setField("meta_description", event.target.value)}
                  className="min-h-28 rounded-[1.4rem] border-[#0D2420]/8 bg-white"
                  placeholder="Description courte orientee clic."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                  Canonical URL
                </label>
                <Input
                  value={form.canonical_url}
                  onChange={(event) => setField("canonical_url", event.target.value)}
                  className="h-12 rounded-2xl border-[#0D2420]/8 bg-white"
                  placeholder="https://..."
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
              ? "Inserer une image dans l'editeur"
              : pickerMode === "gallery"
                ? "Alimenter la galerie de couverture"
                : "Choisir la couverture"
          }
        />
      ) : null}
    </div>
  );
}
