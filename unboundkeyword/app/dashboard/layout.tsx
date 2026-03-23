"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import SiteSwitcher from "@/components/dashboard/SiteSwitcher";
import ProjectRequiredGate from "@/components/dashboard/ProjectRequiredGate";
import { isJoeSuperAdmin } from "@/lib/superadmin";

const NAV_GROUPS = [
  {
    group: "KEYWORD ANALYZER",
    items: [
      { href: "/dashboard", label: "Overview", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
      ) },
      { href: "/dashboard/keyword-overview", label: "Keyword Overview", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h6" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h6v6" /></svg>
      ) },
      { href: "/dashboard/discover", label: "Keyword Discovery", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      ) },
      { href: "/dashboard/keyword-ideas", label: "Keyword Ideas", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 7h14M5 12h14M5 17h14" /></svg>
      ) },
      { href: "/dashboard/product-keywords", label: "Product Keywords", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10" /></svg>
      ) },
      { href: "/dashboard/content-ideas", label: "Content Ideas", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h8" /></svg>
      ) },
      { href: "/dashboard/local-keywords", label: "Local Keywords", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      ) },
      { href: "/dashboard/keyword-intent", label: "Keyword Intent", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ) },
    ],
  },
  {
    group: "COMPETITOR REPORTS",
    items: [
      { href: "/dashboard/traffic", label: "Traffic Overview", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17l6-6 4 4 8-8" /></svg>
      ) },
      { href: "/dashboard/competitor", label: "Competing Domains", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      ) },
      { href: "/dashboard/competitor?view=keywords", label: "Keywords by Traffic", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20V10m5 10V4m5 16v-6" /></svg>
      ) },
      { href: "/dashboard/competitor?view=pages", label: "Top Pages by Traffic", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h12" /></svg>
      ) },
    ],
  },
  {
    group: "AI DECISION ENGINE",
    items: [
      { href: "/dashboard/decision-engine", label: "Decision Center", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v18m6-12v12M3 9h18M5 5l14 14" /></svg>
      ) },
    ],
  },
  {
    group: "TRAFFIC",
    items: [
      { href: "/dashboard/traffic", label: "Website Traffic Checker", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 14l4-4 3 3 4-5" /></svg>
      ) },
      { href: "/dashboard/lists", label: "Keyword Lists", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
      ) },
      { href: "/dashboard/site-audit", label: "Site Audit", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 4h10l2 2v14H5V6l2-2z" /></svg>
      ) },
    ],
  },
];

function NavIcon({ children }: { children: React.ReactNode }) {
  return <span className="opacity-70">{children}</span>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [currentView, setCurrentView] = useState("");
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "";
  const userEmail = session?.user?.email ?? "";
  const canAccessSuperadmin = isJoeSuperAdmin(userEmail);
  const [projectCheckLoading, setProjectCheckLoading] = useState(true);
  const [hasProject, setHasProject] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProjectState() {
      try {
        const res = await fetch("/api/sites", { cache: "no-store" });
        const data = (await res.json()) as { sites?: unknown[] };
        if (!mounted) return;
        setHasProject(Array.isArray(data.sites) && data.sites.length > 0);
      } catch {
        if (!mounted) return;
        setHasProject(false);
      } finally {
        if (mounted) setProjectCheckLoading(false);
      }
    }

    void loadProjectState();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setCurrentView(params.get("view") ?? "");
  }, [path]);

  return (
    <div className="flex min-h-screen bg-[#f4f6f8] text-slate-900">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r border-slate-100 flex flex-col">
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f15b27] text-white font-black text-sm">U</span>
            <span className="font-black text-[15px] text-slate-900">Unbound<span className="text-[#f15b27]">Keyword</span></span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.group} className="mb-4">
              <div className="px-3 mb-1 text-[10px] font-bold tracking-[0.14em] text-[#f15b27] uppercase">
                {group.group}
              </div>
              {group.items.map((item) => {
                const normalizedHref = item.href.split("#")[0].split("?")[0];
                const query = item.href.includes("?") ? item.href.split("?")[1] : "";
                const itemView = query.startsWith("view=") ? query.slice(5) : "";
                const isCompetitorBase = normalizedHref === "/dashboard/competitor" && !itemView;
                const active = itemView
                  ? path === normalizedHref && currentView === itemView
                  : isCompetitorBase
                  ? path === "/dashboard/competitor" && (currentView === "" || currentView === "overview")
                  : normalizedHref === "/dashboard"
                  ? path === "/dashboard"
                  : path.startsWith(normalizedHref);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors",
                      active
                        ? "bg-[#fff3ee] text-[#f15b27] border-l-[3px] border-[#f15b27] rounded-l-none pl-[9px]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <NavIcon>{item.icon}</NavIcon>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-slate-100">
          {canAccessSuperadmin ? (
            <Link
              href="/superadmin"
              className="mb-2 w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium bg-[#fff3ee] text-[#f15b27] hover:bg-[#ffe8de] transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.2 0-4 1.8-4 4m4-4c2.2 0 4 1.8 4 4m-4-4v-2m0 10v2m8-6h-2M6 12H4m12.95 4.95-1.4-1.4M8.45 8.45l-1.4-1.4m9.9 0-1.4 1.4m-7.1 7.1-1.4 1.4" /></svg>
              Superadmin
            </Link>
          ) : null}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-8 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Image
              src="/joe-headshot.png"
              alt={userName || "User"}
              width={40}
              height={40}
              className="rounded-full object-cover ring-2 ring-[#f15b27]/30"
            />
            <div>
              <div className="text-[13px] font-bold text-slate-800">{userName || "Welcome back"}</div>
              <div className="text-[11px] text-slate-400">Keyword Intelligence Dashboard</div>
            </div>
            <SiteSwitcher />
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff3ee] px-3 py-1 text-[11px] font-semibold text-[#f15b27]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f15b27] animate-pulse" />
              Pro
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <ProjectRequiredGate
            loading={projectCheckLoading}
            hasProject={hasProject}
            onProjectCreated={() => {
              setHasProject(true);
              window.location.reload();
            }}
          />
          {hasProject ? children : null}
        </div>
      </main>
    </div>
  );
}
