"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Eye,
  FileText,
  Globe2,
  Monitor,
  MessageSquare,
  Smartphone,
  Tablet,
  TrendingUp,
  Users,
} from "lucide-react";

import { SITE_URL, api, getPublicArticleUrl } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  EmptyState,
  MetricCard,
  PageHero,
  ShellPanel,
  StatusBadge,
  formatCompactNumber,
} from "./dashboard-ui";

const deviceIcons = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [stats, setStats] = useState(null);
  const [sources, setSources] = useState([]);
  const [devices, setDevices] = useState([]);
  const [browsers, setBrowsers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);

      try {
        const [statsPayload, sourcesPayload, devicesPayload, timelinePayload] =
          await Promise.all([
            api.stats(),
            api.statsSources(),
            api.statsDevices(),
            api.statsTimeline(period),
          ]);

        if (cancelled) return;

        setStats(statsPayload);
        setSources(sourcesPayload?.sources || []);
        setDevices(devicesPayload?.devices || []);
        setBrowsers(devicesPayload?.browsers || []);
        setCountries(devicesPayload?.countries || []);
        setTimeline(timelinePayload?.timeline || []);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [period]);

  const maxTimelineValue = useMemo(
    () => Math.max(...timeline.map((item) => item.total || 0), 1),
    [timeline]
  );

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Vue globale"
        title="Ton backoffice editorial"
        description="Un point d'entree clair pour suivre l'activite du blog, publier de nouveaux contenus et garder un oeil sur la moderation."
        actions={
          <>
            <Link
              href="/articles/new"
              className={cn(buttonVariants(), "rounded-full px-5")}
            >
              Nouvel article
            </Link>
            {SITE_URL ? (
              <Link
                href={SITE_URL}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "rounded-full border-[#0D2420]/8 bg-white px-5 text-[#0D2420]"
                )}
              >
                Ouvrir le portfolio
                <Globe2 className="size-4" />
              </Link>
            ) : null}
          </>
        }
      />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-[1.8rem] bg-white/70 shadow-[var(--mk-shadow-soft)]"
            />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-4 xl:grid-cols-4">
            <MetricCard
              icon={<TrendingUp className="size-5" />}
              label="Vues ce mois"
              value={formatCompactNumber(stats.views.month)}
              helper={`${formatCompactNumber(stats.views.total)} vues au total`}
              tone="mint"
            />
            <MetricCard
              icon={<FileText className="size-5" />}
              label="Articles publies"
              value={formatCompactNumber(stats.articles.published)}
              helper={`${formatCompactNumber(stats.articles.total)} articles en tout`}
              tone="dark"
            />
            <MetricCard
              icon={<MessageSquare className="size-5" />}
              label="Commentaires a moderer"
              value={formatCompactNumber(stats.comments.pending)}
              helper={`${formatCompactNumber(stats.comments.total)} commentaires recenses`}
              tone="warm"
            />
            <MetricCard
              icon={<Users className="size-5" />}
              label="Abonnes actifs"
              value={formatCompactNumber(stats.subscribers)}
              helper="Newsletter du portfolio"
              tone="blue"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
            <ShellPanel className="p-5">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3D5350]/66">
                    Audience
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#0D2420]">
                    Evolution des vues
                  </h2>
                </div>
                <div className="flex gap-2">
                  {[7, 30, 90].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPeriod(value)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-semibold transition",
                        period === value
                          ? "border-[#2BE0B5] bg-[#E7FBF5] text-[#0D2420]"
                          : "border-[#0D2420]/8 bg-white text-[#3D5350] hover:border-[#2BE0B5]/55"
                      )}
                    >
                      {value} jours
                    </button>
                  ))}
                </div>
              </div>

              {timeline.length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="Pas encore de donnees"
                  description="Des que les visites commencent a remonter, la courbe du trafic apparait ici."
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex h-64 items-end gap-2 rounded-[1.5rem] bg-[#F8FFFD] px-4 pb-4 pt-10">
                    {timeline.map((point) => {
                      const height = Math.max(
                        8,
                        Math.round(((point.total || 0) / maxTimelineValue) * 100)
                      );

                      return (
                        <div key={point.date} className="group relative flex flex-1 flex-col items-center">
                          <div
                            className="w-full rounded-t-[1rem] bg-gradient-to-t from-[#0D2420] to-[#2BE0B5]"
                            style={{ height: `${height}%` }}
                            title={`${point.date}: ${point.total} vues`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-[#3D5350]/65">
                    <span>{timeline[0]?.date}</span>
                    <span>{timeline[timeline.length - 1]?.date}</span>
                  </div>
                </div>
              )}
            </ShellPanel>

            <ShellPanel className="p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3D5350]/66">
                  Top contenus
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#0D2420]">
                  Articles performants
                </h2>
              </div>

              <div className="mt-6 space-y-3">
                {stats.top_articles?.length ? (
                  stats.top_articles.map((article, index) => {
                    const publicUrl = getPublicArticleUrl(article.slug);

                    return (
                      <div
                        key={article.id}
                        className="rounded-[1.3rem] border border-[#0D2420]/8 bg-[#FBFFFE] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
                              Top {index + 1}
                            </p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-[#0D2420]">
                              {article.title}
                            </p>
                          </div>
                          <StatusBadge status="published" />
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-[#3D5350]/80">
                          <div className="rounded-[1rem] bg-[#E7FBF5] px-3 py-2">
                            <p className="font-semibold text-[#0D2420]">
                              {formatCompactNumber(article.views_count)}
                            </p>
                            <p>Vues</p>
                          </div>
                          <div className="rounded-[1rem] bg-white px-3 py-2 ring-1 ring-[#0D2420]/8">
                            <p className="font-semibold text-[#0D2420]">
                              {formatCompactNumber(article.likes_count)}
                            </p>
                            <p>Likes</p>
                          </div>
                          <div className="rounded-[1rem] bg-white px-3 py-2 ring-1 ring-[#0D2420]/8">
                            <p className="font-semibold text-[#0D2420]">
                              {formatCompactNumber(article.comments_count)}
                            </p>
                            <p>Com.</p>
                          </div>
                        </div>

                        {publicUrl ? (
                          <Link
                            href={publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex text-sm font-semibold text-[#0D2420] underline underline-offset-4"
                          >
                            Voir l&apos;article
                          </Link>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="Aucun article en avant"
                    description="Publie quelques contenus pour commencer a faire remonter les statistiques."
                  />
                )}
              </div>
            </ShellPanel>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.2fr]">
            <ShellPanel className="p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3D5350]/66">
                  Acquisition
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#0D2420]">
                  Sources de trafic
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                {sources.length ? (
                  sources.map((source) => {
                    const strongest = sources[0]?.total || 1;
                    const width = Math.max(
                      8,
                      Math.round(((source.total || 0) / strongest) * 100)
                    );

                    return (
                      <div key={`${source.source}-${source.total}`} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-medium text-[#0D2420]">
                            {source.source || "Direct"}
                          </span>
                          <span className="font-mono text-[#3D5350]">{source.total}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#E7FBF5]">
                          <div
                            className="h-full rounded-full bg-[#2BE0B5]"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState
                    icon={TrendingUp}
                    title="Pas de referrers"
                    description="Les domaines referents apparaitront ici quand les visiteurs arriveront depuis d'autres plateformes."
                  />
                )}
              </div>
            </ShellPanel>

            <ShellPanel className="p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3D5350]/66">
                  Devices
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#0D2420]">
                  Appareils et navigateurs
                </h2>
              </div>

              <div className="mt-6 grid gap-3">
                <div className="grid grid-cols-3 gap-3">
                  {devices.map((device) => {
                    const Icon = deviceIcons[device.device] || Monitor;

                    return (
                      <div
                        key={device.device}
                        className="rounded-[1.35rem] bg-[#F8FFFD] px-3 py-4 text-center"
                      >
                        <div className="mx-auto inline-flex rounded-full bg-white p-3 shadow-[var(--mk-shadow-soft)]">
                          <Icon className="size-4 text-[#0D2420]" />
                        </div>
                        <p className="mt-3 text-xl font-black text-[#0D2420]">
                          {device.total}
                        </p>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#3D5350]/66">
                          {device.device}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-[1.35rem] border border-[#0D2420]/8 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3D5350]/66">
                    Navigateurs
                  </p>
                  <div className="mt-4 space-y-3">
                    {browsers.map((browser) => (
                      <div
                        key={`${browser.browser}-${browser.total}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-medium text-[#0D2420]">
                          {browser.browser || "Inconnu"}
                        </span>
                        <span className="font-mono text-[#3D5350]">{browser.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ShellPanel>

            <ShellPanel className="p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3D5350]/66">
                  Geo
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#0D2420]">
                  Pays les plus actifs
                </h2>
              </div>

              <div className="mt-6 space-y-3">
                {countries.length ? (
                  countries.map((country, index) => (
                    <div
                      key={`${country.country}-${country.total}`}
                      className="flex items-center justify-between rounded-[1.25rem] border border-[#0D2420]/8 bg-[#FBFFFE] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#E7FBF5] text-sm font-black text-[#0D2420]">
                          {index + 1}
                        </div>
                        <span className="font-medium text-[#0D2420]">
                          {country.country || "—"}
                        </span>
                      </div>
                      <span className="font-mono text-sm text-[#3D5350]">
                        {country.total}
                      </span>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={Eye}
                    title="Pas encore de donnees geo"
                    description="Les pays visiteurs seront listes ici des qu'un peu de trafic est capte."
                  />
                )}
              </div>
            </ShellPanel>
          </div>
        </>
      ) : (
        <EmptyState
          icon={BarChart3}
          title="Impossible de charger le dashboard"
          description="Verifie la connexion au backend Laravel puis relance la page."
        />
      )}
    </div>
  );
}
