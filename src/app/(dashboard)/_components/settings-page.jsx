/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { Palette, Plus, Save, Settings2, Tags, Trash2 } from "lucide-react";

import { API_BASE_URL, SITE_URL, api, resolveAssetUrl } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  EmptyState,
  PageHero,
  ShellPanel,
  StatusBadge,
} from "./dashboard-ui";

function normalizeList(payload) {
  return Array.isArray(payload) ? payload : payload?.data || [];
}

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newCategory, setNewCategory] = useState({ name: "", color: "#2BE0B5" });
  const [newTag, setNewTag] = useState({ name: "" });
  const [newSeries, setNewSeries] = useState({
    title: "",
    description: "",
    cover_image: "",
    is_complete: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setError("");

      try {
        const [categoriesPayload, tagsPayload, seriesPayload] = await Promise.all([
          api.categories(),
          api.tags(),
          api.series(),
        ]);

        if (cancelled) return;

        setCategories(normalizeList(categoriesPayload));
        setTags(normalizeList(tagsPayload));
        setSeries(normalizeList(seriesPayload));
      } catch (currentError) {
        if (!cancelled) {
          setError(currentError.message || "Impossible de charger les taxonomies.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const createCategory = async () => {
    const created = await api.createCategory(newCategory);
    setCategories((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
    setNewCategory({ name: "", color: "#2BE0B5" });
  };

  const updateCategory = async (category) => {
    const updated = await api.updateCategory(category.id, {
      name: category.name,
      color: category.color,
    });
    setCategories((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Supprimer cette categorie ?")) return;
    await api.deleteCategory(id);
    setCategories((current) => current.filter((item) => item.id !== id));
  };

  const createTag = async () => {
    const created = await api.createTag(newTag);
    setTags((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
    setNewTag({ name: "" });
  };

  const updateTag = async (tag) => {
    const updated = await api.updateTag(tag.id, { name: tag.name });
    setTags((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  };

  const deleteTag = async (id) => {
    if (!window.confirm("Supprimer ce tag ?")) return;
    await api.deleteTag(id);
    setTags((current) => current.filter((item) => item.id !== id));
  };

  const createSeries = async () => {
    const created = await api.createSeries(newSeries);
    setSeries((current) =>
      [...current, created].sort((a, b) => a.title.localeCompare(b.title))
    );
    setNewSeries({
      title: "",
      description: "",
      cover_image: "",
      is_complete: false,
    });
  };

  const updateSeries = async (entry) => {
    const updated = await api.updateSeries(entry.id, {
      title: entry.title,
      description: entry.description,
      cover_image: entry.cover_image,
      is_complete: entry.is_complete,
    });
    setSeries((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const deleteSeries = async (id) => {
    if (!window.confirm("Supprimer cette serie ?")) return;
    await api.deleteSeries(id);
    setSeries((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Parametres"
        title="Taxonomies et configuration"
        description="Tout ce qui structure ton contenu: categories, tags, series et rappel des URLs cles du projet."
      />

      {error ? (
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
        <div className="space-y-6">
          <ShellPanel className="p-5">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3D5350]/66">
                    Categories
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#0D2420]">
                    Palette editoriale
                  </h2>
                </div>
                <Palette className="size-5 text-[#3D5350]/70" />
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_auto]">
                <Input
                  value={newCategory.name}
                  onChange={(event) =>
                    setNewCategory((current) => ({ ...current, name: event.target.value }))
                  }
                  className="h-11 rounded-2xl border-[#0D2420]/8 bg-white"
                  placeholder="Nouvelle categorie"
                />
                <Input
                  value={newCategory.color}
                  onChange={(event) =>
                    setNewCategory((current) => ({ ...current, color: event.target.value }))
                  }
                  className="h-11 rounded-2xl border-[#0D2420]/8 bg-white"
                  placeholder="#2BE0B5"
                />
                <Button
                  onClick={createCategory}
                  className="h-11 rounded-full"
                  disabled={!newCategory.name.trim()}
                >
                  Ajouter
                  <Plus className="size-4" />
                </Button>
              </div>

              {loading ? (
                <div className="h-32 animate-pulse rounded-[1.5rem] bg-[#F8FFFD]" />
              ) : categories.length === 0 ? (
                <EmptyState
                  icon={Palette}
                  title="Aucune categorie"
                  description="Ajoute des categories pour structurer les articles du portfolio."
                />
              ) : (
                <div className="grid gap-3">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="grid gap-3 rounded-[1.35rem] border border-[#0D2420]/8 bg-[#FBFFFE] p-4 md:grid-cols-[auto_minmax(0,1fr)_150px_auto_auto]"
                    >
                      <div
                        className="mt-2 h-6 w-6 rounded-full border border-white shadow-[var(--mk-shadow-soft)]"
                        style={{ backgroundColor: category.color || "#E7FBF5" }}
                      />
                      <Input
                        value={category.name}
                        onChange={(event) =>
                          setCategories((current) =>
                            current.map((item) =>
                              item.id === category.id
                                ? { ...item, name: event.target.value }
                                : item
                            )
                          )
                        }
                        className="h-11 rounded-2xl border-[#0D2420]/8 bg-white"
                      />
                      <Input
                        value={category.color || ""}
                        onChange={(event) =>
                          setCategories((current) =>
                            current.map((item) =>
                              item.id === category.id
                                ? { ...item, color: event.target.value }
                                : item
                            )
                          )
                        }
                        className="h-11 rounded-2xl border-[#0D2420]/8 bg-white"
                      />
                      <Button
                        variant="outline"
                        className="h-11 rounded-full border-[#0D2420]/8 bg-white text-[#0D2420]"
                        onClick={() => updateCategory(category)}
                      >
                        Sauver
                        <Save className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        className="h-11 rounded-full"
                        onClick={() => deleteCategory(category.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ShellPanel>

          <ShellPanel className="p-5">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3D5350]/66">
                    Tags
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#0D2420]">
                    Marqueurs rapides
                  </h2>
                </div>
                <Tags className="size-5 text-[#3D5350]/70" />
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <Input
                  value={newTag.name}
                  onChange={(event) => setNewTag({ name: event.target.value })}
                  className="h-11 rounded-2xl border-[#0D2420]/8 bg-white"
                  placeholder="Nouveau tag"
                />
                <Button
                  onClick={createTag}
                  className="h-11 rounded-full"
                  disabled={!newTag.name.trim()}
                >
                  Ajouter
                  <Plus className="size-4" />
                </Button>
              </div>

              {loading ? (
                <div className="h-24 animate-pulse rounded-[1.5rem] bg-[#F8FFFD]" />
              ) : tags.length === 0 ? (
                <EmptyState
                  icon={Tags}
                  title="Aucun tag"
                  description="Ajoute des tags pour enrichir la navigation sur les articles."
                />
              ) : (
                <div className="grid gap-3">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="grid gap-3 rounded-[1.35rem] border border-[#0D2420]/8 bg-[#FBFFFE] p-4 md:grid-cols-[minmax(0,1fr)_auto_auto]"
                    >
                      <Input
                        value={tag.name}
                        onChange={(event) =>
                          setTags((current) =>
                            current.map((item) =>
                              item.id === tag.id ? { ...item, name: event.target.value } : item
                            )
                          )
                        }
                        className="h-11 rounded-2xl border-[#0D2420]/8 bg-white"
                      />
                      <Button
                        variant="outline"
                        className="h-11 rounded-full border-[#0D2420]/8 bg-white text-[#0D2420]"
                        onClick={() => updateTag(tag)}
                      >
                        Sauver
                        <Save className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        className="h-11 rounded-full"
                        onClick={() => deleteTag(tag.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ShellPanel>

          <ShellPanel className="p-5">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3D5350]/66">
                    Series
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#0D2420]">
                    Collections d&apos;articles
                  </h2>
                </div>
                <Settings2 className="size-5 text-[#3D5350]/70" />
              </div>

              <div className="grid gap-3">
                <Input
                  value={newSeries.title}
                  onChange={(event) =>
                    setNewSeries((current) => ({ ...current, title: event.target.value }))
                  }
                  className="h-11 rounded-2xl border-[#0D2420]/8 bg-white"
                  placeholder="Titre de la serie"
                />
                <Textarea
                  value={newSeries.description}
                  onChange={(event) =>
                    setNewSeries((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="min-h-24 rounded-[1.4rem] border-[#0D2420]/8 bg-white"
                  placeholder="Description courte de la serie"
                />
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_auto]">
                  <Input
                    value={newSeries.cover_image}
                    onChange={(event) =>
                      setNewSeries((current) => ({
                        ...current,
                        cover_image: event.target.value,
                      }))
                    }
                    className="h-11 rounded-2xl border-[#0D2420]/8 bg-white"
                    placeholder="URL de cover"
                  />
                  <label className="flex items-center gap-2 rounded-2xl border border-[#0D2420]/8 bg-white px-4 text-sm font-medium text-[#0D2420]">
                    <input
                      type="checkbox"
                      checked={newSeries.is_complete}
                      onChange={(event) =>
                        setNewSeries((current) => ({
                          ...current,
                          is_complete: event.target.checked,
                        }))
                      }
                    />
                    Serie complete
                  </label>
                  <Button
                    onClick={createSeries}
                    className="h-11 rounded-full"
                    disabled={!newSeries.title.trim()}
                  >
                    Ajouter
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="h-36 animate-pulse rounded-[1.5rem] bg-[#F8FFFD]" />
              ) : series.length === 0 ? (
                <EmptyState
                  icon={Settings2}
                  title="Aucune serie"
                  description="Cree des series pour relier plusieurs billets autour d'un meme sujet."
                />
              ) : (
                <div className="grid gap-4">
                  {series.map((entry) => (
                    <div
                      key={entry.id}
                      className="grid gap-4 rounded-[1.5rem] border border-[#0D2420]/8 bg-[#FBFFFE] p-4"
                    >
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                        <Input
                          value={entry.title}
                          onChange={(event) =>
                            setSeries((current) =>
                              current.map((item) =>
                                item.id === entry.id
                                  ? { ...item, title: event.target.value }
                                  : item
                              )
                            )
                          }
                          className="h-11 rounded-2xl border-[#0D2420]/8 bg-white"
                        />
                        <StatusBadge
                          status={entry.is_complete ? "active" : "draft"}
                          label={entry.is_complete ? "Complete" : "En cours"}
                        />
                      </div>

                      <Textarea
                        value={entry.description || ""}
                        onChange={(event) =>
                          setSeries((current) =>
                            current.map((item) =>
                              item.id === entry.id
                                ? { ...item, description: event.target.value }
                                : item
                            )
                          )
                        }
                        className="min-h-24 rounded-[1.4rem] border-[#0D2420]/8 bg-white"
                      />

                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto_auto]">
                        <Input
                          value={entry.cover_image || ""}
                          onChange={(event) =>
                            setSeries((current) =>
                              current.map((item) =>
                                item.id === entry.id
                                  ? { ...item, cover_image: event.target.value }
                                  : item
                              )
                            )
                          }
                          className="h-11 rounded-2xl border-[#0D2420]/8 bg-white"
                          placeholder="URL de cover"
                        />
                        <label className="flex items-center gap-2 rounded-2xl border border-[#0D2420]/8 bg-white px-4 text-sm font-medium text-[#0D2420]">
                          <input
                            type="checkbox"
                            checked={Boolean(entry.is_complete)}
                            onChange={(event) =>
                              setSeries((current) =>
                                current.map((item) =>
                                  item.id === entry.id
                                    ? { ...item, is_complete: event.target.checked }
                                    : item
                                )
                              )
                            }
                          />
                          Complete
                        </label>
                        <Button
                          variant="outline"
                          className="h-11 rounded-full border-[#0D2420]/8 bg-white text-[#0D2420]"
                          onClick={() => updateSeries(entry)}
                        >
                          Sauver
                          <Save className="size-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          className="h-11 rounded-full"
                          onClick={() => deleteSeries(entry.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      {entry.cover_image ? (
                        <img
                          src={resolveAssetUrl(entry.cover_image)}
                          alt={entry.title}
                          className="h-40 w-full rounded-[1.3rem] object-cover"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ShellPanel>
        </div>

        <div className="space-y-6">
          <ShellPanel className="p-5">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3D5350]/66">
                  Session
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#0D2420]">
                  Contexte du projet
                </h2>
              </div>

              <div className="rounded-[1.35rem] bg-[#F8FFFD] p-4">
                <p className="text-sm font-semibold text-[#0D2420]">
                  {user?.name || "Admin"}
                </p>
                <p className="mt-1 text-sm text-[#3D5350]/78">{user?.email}</p>
              </div>

              <div className="space-y-3 rounded-[1.35rem] border border-[#0D2420]/8 bg-white p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                    API base
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-[#0D2420]">
                    {API_BASE_URL}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                    Site public
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-[#0D2420]">
                    {SITE_URL || "NEXT_PUBLIC_SITE_URL non defini"}
                  </p>
                </div>
              </div>
            </div>
          </ShellPanel>
        </div>
      </div>
    </div>
  );
}
