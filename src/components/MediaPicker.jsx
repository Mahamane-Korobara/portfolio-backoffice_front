/* eslint-disable @next/next/no-img-element */
"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import { ImagePlus, Search, Trash2, Upload, X } from "lucide-react";

import { api, resolveAssetUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function formatBytes(bytes) {
  if (!bytes) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function normalizeMediaItem(item) {
  return {
    ...item,
    url: resolveAssetUrl(item.url),
  };
}

function MediaImage({ src, alt, className, fallbackClassName }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = !src || failedSrc === src;

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-[#eaf9f5] text-center text-sm font-medium text-[#3D5350]",
          fallbackClassName
        )}
      >
        Visuel indisponible
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}

export default function MediaPicker({
  inline = false,
  title = "Bibliotheque media",
  description = "Images de couverture, illustrations d'articles et assets du portfolio.",
  onSelect,
  onClose,
}) {
  const [media, setMedia] = useState([]);
  const [meta, setMeta] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);
  const fileRef = useRef(null);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch]);

  useEffect(() => {
    let cancelled = false;

    async function loadLibrary() {
      setLoading(true);

      try {
        const payload = await api.media({ search: deferredSearch, page });
        if (cancelled) return;

        const items = (payload?.data || []).map(normalizeMediaItem);
        setMedia(items);
        setMeta(payload?.meta || null);

        setSelected((current) => {
          if (!current) return current;
          return items.find((item) => item.id === current.id) || null;
        });
      } catch {
        if (!cancelled) {
          setMedia([]);
          setMeta(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadLibrary();

    return () => {
      cancelled = true;
    };
  }, [deferredSearch, page]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);

    try {
      const created = normalizeMediaItem(await api.uploadMedia(formData));
      setMedia((current) => [created, ...current]);
      setSelected(created);
      setMeta((current) =>
        current ? { ...current, total: (current.total || 0) + 1 } : current
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id, event) => {
    event.stopPropagation();

    if (!window.confirm("Supprimer ce media ?")) {
      return;
    }

    await api.deleteMedia(id);
    setMedia((current) => current.filter((item) => item.id !== id));
    setSelected((current) => (current?.id === id ? null : current));
  };

  const commitSelection = () => {
    if (!selected || !onSelect) return;
    onSelect(selected);
  };

  const frameClassName = inline
    ? "relative overflow-hidden rounded-[1.9rem] border border-[#0D2420]/8 bg-white/88 shadow-[var(--mk-shadow)]"
    : "animate-in relative flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/96 shadow-[0_28px_80px_rgba(13,36,32,0.22)]";

  const content = (
    <div className={frameClassName}>
      <div className="flex flex-col gap-4 border-b border-[#0D2420]/8 bg-[#F8FFFD] px-5 py-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="eyebrow">Media</div>
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-[#0D2420]">
              {title}
            </h3>
            <p className="max-w-2xl text-sm text-[#3D5350]/80">{description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selected && onSelect ? (
            <Button onClick={commitSelection} className="rounded-full px-5">
              Inserer l&apos;image
            </Button>
          ) : null}
          {!inline && onClose ? (
            <Button variant="outline" size="icon" className="rounded-full" onClick={onClose}>
              <X />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-b border-[#0D2420]/8 px-5 py-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#3D5350]/55" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 rounded-full border-[#0D2420]/8 bg-white pl-10"
            placeholder="Rechercher un media..."
          />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />

        <Button
          onClick={() => fileRef.current?.click()}
          className="h-11 rounded-full px-5"
          disabled={uploading}
        >
          <Upload />
          {uploading ? "Upload en cours..." : "Ajouter un media"}
        </Button>
      </div>

      <div className="grid flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-h-[28rem] border-b border-[#0D2420]/8 p-5 lg:border-r lg:border-b-0">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square animate-pulse rounded-[1.4rem] bg-[#E7FBF5]"
                />
              ))}
            </div>
          ) : media.length === 0 ? (
            <div className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-4 rounded-[1.6rem] border border-dashed border-[#0D2420]/12 bg-[#FBFFFE] px-6 text-center">
              <div className="rounded-full bg-[#E7FBF5] p-4 text-[#0D2420]">
                <ImagePlus className="size-7" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-[#0D2420]">
                  Aucun media pour le moment
                </h4>
                <p className="max-w-md text-sm text-[#3D5350]/75">
                  Ajoute une premiere image pour alimenter les couvertures, l&apos;editeur
                  TipTap et tes sections du portfolio.
                </p>
              </div>
              <Button onClick={() => fileRef.current?.click()} className="rounded-full px-5">
                Televerser une image
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {media.map((item) => {
                const isActive = selected?.id === item.id;

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setSelected((current) => (current?.id === item.id ? null : item))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelected((current) =>
                          current?.id === item.id ? null : item
                        );
                      }
                    }}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-[1.4rem] border bg-[#EEF9F5] text-left shadow-[var(--mk-shadow-soft)] transition",
                      isActive
                        ? "border-[var(--mk-cta)] ring-4 ring-[var(--mk-cta)]/18"
                        : "border-[#0D2420]/8 hover:-translate-y-1 hover:border-[var(--mk-cta)]/55"
                    )}
                  >
                    <MediaImage
                      src={item.url}
                      alt={item.alt || item.original_name || "Media"}
                      className="h-full w-full object-cover"
                      fallbackClassName="h-full w-full px-5"
                    />

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0D2420]/78 to-transparent px-3 pb-3 pt-8">
                      <div className="truncate text-sm font-semibold text-white">
                        {item.original_name}
                      </div>
                      <div className="mt-1 text-xs text-white/75">
                        {item.width && item.height ? `${item.width} x ${item.height}` : "Image"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => handleDelete(item.id, event)}
                      className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside className="flex flex-col bg-[#FBFFFE]">
          <div className="border-b border-[#0D2420]/8 px-5 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3D5350]/65">
              Details
            </div>
          </div>

          <div className="flex-1 space-y-4 px-5 py-5">
            {selected ? (
              <>
                <MediaImage
                  src={selected.url}
                  alt={selected.alt || selected.original_name || "Media selectionne"}
                  className="h-44 w-full rounded-[1.4rem] object-cover shadow-[var(--mk-shadow-soft)]"
                  fallbackClassName="h-44 w-full rounded-[1.4rem] px-5 shadow-[var(--mk-shadow-soft)]"
                />

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3D5350]/65">
                      Nom
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#0D2420]">
                      {selected.original_name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-[1.1rem] bg-[#E7FBF5] p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#3D5350]/65">
                        Taille
                      </p>
                      <p className="mt-1 font-medium text-[#0D2420]">
                        {formatBytes(selected.size)}
                      </p>
                    </div>
                    <div className="rounded-[1.1rem] bg-white p-3 ring-1 ring-[#0D2420]/8">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#3D5350]/65">
                        Dimensions
                      </p>
                      <p className="mt-1 font-medium text-[#0D2420]">
                        {selected.width && selected.height
                          ? `${selected.width} x ${selected.height}`
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3D5350]/65">
                      URL
                    </p>
                    <p className="mt-1 break-all rounded-[1rem] bg-white px-3 py-2 font-mono text-xs text-[#3D5350] ring-1 ring-[#0D2420]/8">
                      {selected.url}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[16rem] flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-[#0D2420]/12 bg-white/80 px-5 text-center">
                <p className="text-sm font-semibold text-[#0D2420]">
                  Selectionne un media
                </p>
                <p className="mt-2 text-sm text-[#3D5350]/75">
                  Tu pourras ensuite l&apos;inserer dans l&apos;editeur ou le reutiliser comme
                  couverture.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[#0D2420]/8 px-5 py-4">
            <div className="text-sm text-[#3D5350]/75">
              {meta?.total ? `${meta.total} medias` : "Bibliotheque media"}
            </div>

            {meta?.last_page > 1 ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Prec.
                </Button>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3D5350]/65">
                  {meta.current_page || page}/{meta.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={page >= meta.last_page}
                  onClick={() =>
                    setPage((current) => Math.min(meta.last_page, current + 1))
                  }
                >
                  Suiv.
                </Button>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0D2420]/45 px-4 py-6 backdrop-blur-sm">
      {content}
    </div>
  );
}
