"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Users,
  X,
} from "lucide-react";

import { SITE_URL, api } from "@/lib/api";
import { useAuthHydrated, useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/articles", label: "Articles", icon: FileText },
  { href: "/comments", label: "Commentaires", icon: MessageSquare },
  { href: "/media", label: "Medias", icon: ImageIcon },
  { href: "/subscribers", label: "Abonnes", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

function getPageLabel(pathname) {
  const match = navigation.find((item) =>
    pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return match?.label || "Backoffice";
}

function SplashScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="space-y-4 rounded-[2rem] border border-white/80 bg-white/90 px-8 py-8 text-center shadow-[var(--mk-shadow)]">
        <div className="mx-auto size-12 animate-spin rounded-full border-4 border-[#2BE0B5]/20 border-t-[#2BE0B5]" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#3D5350]/65">
            Backoffice
          </p>
          <p className="mt-2 text-lg font-semibold text-[#0D2420]">
            Verification de la session...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const pageLabel = useMemo(() => getPageLabel(pathname), [pathname]);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/login");
    }
  }, [hydrated, token, router]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Le store local reste la source de verite pour couper la session.
    }

    clearSession();
    router.replace("/login");
  };

  if (!hydrated || !token) {
    return <SplashScreen />;
  }

  return (
    <div className="dashboard-shell md:grid md:grid-cols-[var(--mk-sidebar-width)_minmax(0,1fr)]">
      <div
        className={cn(
          "fixed inset-0 z-40 bg-[#0D2420]/35 backdrop-blur-sm transition md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={cn(
          "glass-panel fixed inset-y-0 left-0 z-50 flex w-[var(--mk-sidebar-width)] flex-col border-r border-white/70 px-4 py-5 transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-[110%]"
        )}
      >
        <div className="flex items-center justify-between rounded-[1.6rem] border border-white/70 bg-white/70 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
              Mahamane Korobara
            </p>
            <p className="mt-1 text-lg font-black tracking-tight text-[#0D2420]">
              Backoffice
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#0D2420]/8 bg-white text-[#0D2420] md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-2">
          {navigation.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn("sidebar-link", active && "sidebar-link-active")}
              >
                <div className="sidebar-link-icon">
                  <Icon className="size-4" />
                </div>
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 rounded-[1.6rem] border border-white/70 bg-white/78 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3D5350]/66">
              Connecte
            </p>
            <p className="mt-2 text-sm font-semibold text-[#0D2420]">
              {user?.name || user?.email || "Admin"}
            </p>
            <p className="text-sm text-[#3D5350]/78">{user?.email}</p>
          </div>

          {SITE_URL ? (
            <Link
              href={SITE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#0D2420]/8 bg-white px-4 py-3 text-sm font-semibold text-[#0D2420]"
            >
              Voir le portfolio
              <ExternalLink className="size-4" />
            </Link>
          ) : null}

          <Button
            variant="outline"
            className="h-11 w-full rounded-full border-[#0D2420]/8 bg-white text-[#0D2420]"
            onClick={handleLogout}
          >
            Deconnexion
            <LogOut />
          </Button>
        </div>
      </aside>

      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-white/70 bg-white/72 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#0D2420]/8 bg-white text-[#0D2420] md:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-5" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3D5350]/66">
                  Navigation
                </p>
                <p className="mt-1 text-lg font-bold text-[#0D2420]">{pageLabel}</p>
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="rounded-full border border-[#0D2420]/8 bg-white px-4 py-2 text-sm text-[#3D5350]">
                Session admin active
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
