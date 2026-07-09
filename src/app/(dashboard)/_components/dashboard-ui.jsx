"use client";

import { cn } from "@/lib/utils";

export function PageHero({ eyebrow = "Backoffice", title, description, actions, className }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 p-6 shadow-[var(--mk-shadow)] backdrop-blur-xl",
        className
      )}
    >
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <div className="eyebrow">{eyebrow}</div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black tracking-tight text-[#0D2420] sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-3xl text-sm leading-7 text-[#3D5350]/80 sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

export function ShellPanel({ className, children }) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1.8rem] border border-[#0D2420]/8 bg-white/88 shadow-[var(--mk-shadow-soft)]",
        className
      )}
    >
      {children}
    </section>
  );
}

const metricToneMap = {
  mint: "from-[#2BE0B5]/22 via-[#E7FBF5] to-white text-[#0D2420]",
  dark: "from-[#0D2420] via-[#1A2E2A] to-[#213A35] text-white",
  warm: "from-[#FFE8C7] via-[#FFF3E1] to-white text-[#7A4B00]",
  blue: "from-[#DBEAFE] via-[#EFF6FF] to-white text-[#1D4ED8]",
  violet: "from-[#EDE9FE] via-[#F5F3FF] to-white text-[#6D28D9]",
};

export function MetricCard({ icon, label, value, helper, tone = "mint" }) {
  return (
    <div
      className={cn(
        "metric-card relative overflow-hidden rounded-[1.8rem] border border-white/80 bg-gradient-to-br p-5 shadow-[var(--mk-shadow-soft)]",
        metricToneMap[tone] || metricToneMap.mint
      )}
    >
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">
            {label}
          </div>
          <div className="text-3xl font-black tracking-tight">{value}</div>
          {helper ? <p className="text-sm opacity-75">{helper}</p> : null}
        </div>
        <div className="rounded-2xl bg-white/65 p-3 shadow-[0_10px_24px_rgba(13,36,32,0.08)]">
          {icon}
        </div>
      </div>
    </div>
  );
}

const statusMap = {
  published: { label: "Publie", className: "status-published" },
  approved: { label: "Approuve", className: "status-approved" },
  active: { label: "Actif", className: "status-active" },
  draft: { label: "Brouillon", className: "status-draft" },
  scheduled: { label: "Programme", className: "status-scheduled" },
  pending: { label: "En attente", className: "status-pending" },
  spam: { label: "Spam", className: "status-spam" },
};

export function StatusBadge({ status, label }) {
  const tone = statusMap[status] || statusMap.draft;

  return (
    <span className={cn("status-badge", tone.className)}>
      {label || tone.label}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-[1.6rem] border border-dashed border-[#0D2420]/12 bg-[#FBFFFE] px-6 py-10 text-center">
      <div className="rounded-full bg-[#E7FBF5] p-4 text-[#0D2420]">
        <Icon className="size-7" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[#0D2420]">{title}</h3>
        <p className="max-w-xl text-sm leading-7 text-[#3D5350]/78">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function formatDate(value, options = {}) {
  if (!value) return "—";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    ...options,
  }).format(date);
}

export function formatCompactNumber(value) {
  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

export function toDateTimeLocalValue(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

export function fromDateTimeLocalValue(value) {
  if (!value) return "";
  return new Date(value).toISOString();
}

export function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
