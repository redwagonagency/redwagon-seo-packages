"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    group: "KEYWORD RESEARCH",
    items: [
      { href: "/dashboard", label: "Overview", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
      ) },
      { href: "/dashboard/discover", label: "Keyword Discovery", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      ) },
      { href: "/dashboard/lists", label: "Keyword Lists", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
      ) },
    ],
  },
  {
    group: "COMPETITIVE INTEL",
    items: [
      { href: "/dashboard/competitor", label: "Competitors", icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      ) },
    ],
  },
];

function NavIcon({ children }: { children: React.ReactNode }) {
  return <span className="opacity-70">{children}</span>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "";

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
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
                const active = item.href === "/dashboard"
                  ? path === "/dashboard"
                  : path.startsWith(item.href);
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
          <div className="flex items-center gap-3">
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
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff3ee] px-3 py-1 text-[11px] font-semibold text-[#f15b27]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f15b27] animate-pulse" />
              Pro
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
