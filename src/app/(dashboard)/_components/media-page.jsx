"use client";

import MediaPicker from "@/components/MediaPicker";

import { PageHero } from "./dashboard-ui";

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Assets"
        title="Bibliotheque medias"
        description="Toutes les images utiles pour tes couvertures, tes blocs TipTap et les futurs modules du portfolio."
      />

      <MediaPicker
        inline
        title="Explorer et alimenter la bibliotheque"
        description="Upload, recherche et nettoie tes assets sans quitter le dashboard."
      />
    </div>
  );
}
