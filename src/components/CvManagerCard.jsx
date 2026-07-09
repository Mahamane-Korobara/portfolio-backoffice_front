"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Upload, ExternalLink, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { api, resolveAssetUrl } from "@/lib/api";
import { ShellPanel } from "@/app/(dashboard)/_components/dashboard-ui";
import { Button } from "@/components/ui/button";

function formatDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export default function CvManagerCard() {
  const [cv, setCv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const payload = await api.cv();
        if (!cancelled) setCv(payload?.data || payload || null);
      } catch {
        if (!cancelled) setCv(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Le CV doit être un fichier PDF.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const response = await api.uploadCv(formData);
      setCv(response?.cv || response?.data || response);
      setShowPreview(true); // montre tout de suite le CV qui vient d'être posé
      toast.success("CV mis à jour — visible sur le portfolio.");
    } catch (error) {
      toast.error(error.message || "Téléversement impossible (PDF, max 10 Mo).");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const url = cv?.url ? resolveAssetUrl(cv.url) : null;
  const updated = formatDate(cv?.updated_at);

  return (
    <ShellPanel className="p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E7FBF5] text-[#0D2420]">
            <FileText className="size-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
              Portfolio
            </p>
            <h2 className="text-xl font-black text-[#0D2420]">CV téléchargeable</h2>
            {loading ? (
              <p className="mt-1 text-sm text-[#3D5350]/70">Chargement...</p>
            ) : url ? (
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#3D5350]/80">
                <span className="font-medium text-[#0D2420]">{cv.name || "CV.pdf"}</span>
                {updated ? <span>· mis à jour le {updated}</span> : null}
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#0D9b7e] hover:underline"
                >
                  Voir <ExternalLink className="size-3.5" />
                </a>
              </p>
            ) : (
              <p className="mt-1 text-sm text-[#3D5350]/70">
                Aucun CV téléversé — le portfolio utilise le PDF historique par défaut.
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {url ? (
            <Button
              variant="outline"
              onClick={() => setShowPreview((value) => !value)}
              className="rounded-full border-[#0D2420]/8 bg-white px-4 text-[#0D2420]"
            >
              {showPreview ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {showPreview ? "Masquer" : "Aperçu"}
            </Button>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-full px-5"
          >
            <Upload className="size-4" />
            {uploading ? "Téléversement..." : "Remplacer le CV"}
          </Button>
        </div>
      </div>

      {/* Aperçu inline du PDF : savoir quel CV est en ligne sans le télécharger. */}
      {url && showPreview ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-[#0D2420]/10 bg-[#F8FFFD]">
          <iframe
            key={url}
            src={`${url}#toolbar=0&view=FitH`}
            title="Aperçu du CV"
            className="h-[600px] w-full"
          />
        </div>
      ) : null}
    </ShellPanel>
  );
}
