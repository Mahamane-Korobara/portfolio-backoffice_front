"use client";

import { useEffect, useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { BRAND_NAME } from "@/lib/brand";
import { useAuthHydrated, useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginView() {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const setSession = useAuthStore((state) => state.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hydrated && token) {
      router.replace("/dashboard");
    }
  }, [hydrated, token, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = await api.login(email, password);
      setSession({
        token: payload.token,
        user: payload.user,
      });
      router.replace("/dashboard");
    } catch (currentError) {
      setError(currentError.message || "Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="auth-orb absolute left-[-8rem] top-[-6rem] size-[20rem] rounded-full" />
      <div className="auth-orb absolute bottom-[-8rem] right-[-6rem] size-[22rem] rounded-full" />

      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2.2rem] border border-white/80 bg-white/88 shadow-[0_32px_90px_rgba(13,36,32,0.12)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="dashboard-grid relative hidden border-r border-[#0D2420]/8 bg-[#F8FFFD] px-10 py-12 lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6">
            <div className="eyebrow">{BRAND_NAME} · Backoffice</div>
            <div className="space-y-4">
              <p className="font-serif text-2xl italic text-[#3D5350]">
                Ton espace d&apos;administration
              </p>
              <h1 className="dashboard-title max-w-xl font-black text-[#0D2420]">
                Gere ton portfolio : articles, projets, medias et audience au meme endroit.
              </h1>
              <p className="max-w-lg text-base leading-8 text-[#3D5350]/82">
                Redige et publie tes articles et tes projets, gere les collections, les
                medias, les commentaires et tes abonnes — le tout depuis une interface
                nette, aussi bien sur mobile que sur ordinateur.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="glass-panel rounded-[1.6rem] border border-white/70 p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-[#E7FBF5] p-3 text-[#0D2420]">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0D2420]">
                    Publication rapide
                  </p>
                  <p className="mt-1 text-sm leading-7 text-[#3D5350]/78">
                    Cree, programme et publie articles et projets sans passer d&apos;un
                    outil a l&apos;autre.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[1.6rem] border border-white/70 p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-[#0D2420] p-3 text-white">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0D2420]">
                    Reserve a ton usage
                  </p>
                  <p className="mt-1 text-sm leading-7 text-[#3D5350]/78">
                    Auth admin, moderation, media et taxonomies centralises pour ton
                    workflow perso.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex flex-col justify-center px-6 py-10 sm:px-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 space-y-4 text-center lg:text-left">
              <div className="inline-flex rounded-full bg-[#E7FBF5] p-4 text-[#0D2420] shadow-[0_18px_40px_rgba(43,224,181,0.22)]">
                <LockKeyhole className="size-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#3D5350]/68">
                  Connexion admin
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-[#0D2420]">
                  Acceder au dashboard
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#3D5350]/80">
                  Entre tes identifiants pour piloter les articles, les projets et les
                  contenus de ton portfolio.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-[2rem] border border-[#0D2420]/8 bg-white/92 p-6 shadow-[var(--mk-shadow)]"
            >
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/68">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="toi@portfolio.dev"
                  className="h-12 rounded-2xl border-[#0D2420]/8 bg-[#FBFFFE]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/68">
                  Mot de passe
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="h-12 rounded-2xl border-[#0D2420]/8 bg-[#FBFFFE]"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-full text-sm font-semibold"
              >
                {loading ? "Connexion..." : "Entrer dans le backoffice"}
                <ArrowRight />
              </Button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
