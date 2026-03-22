"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/discover", label: "Discover", icon: "🔍" },
  { href: "/dashboard/lists", label: "My Lists", icon: "📋" },
  { href: "/dashboard/competitor", label: "Competitors", icon: "⚔️" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_#e0f2fe,_transparent_30%),radial-gradient(circle_at_bottom_right,_#fde68a,_transparent_35%),linear-gradient(180deg,_#f8fafc,_#eef2ff)]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white/80 backdrop-blur border-r border-white/70 flex flex-col shadow-[0_0_40px_rgba(15,23,42,0.06)]">
        <div className="px-6 py-5 border-b border-slate-100/80">
          <Link href="/" className="text-xl font-black">
            <span className="text-cyan-600">Unbound</span>
            <span className="text-slate-900">Keyword</span>
          </Link>
          <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">Keyword Intelligence OS</div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? path === "/dashboard"
                : path.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition",
                  active
                    ? "bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border border-cyan-100"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
          >
            <span>🚪</span> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-full bg-white/55 backdrop-blur-[1px]">{children}</div>
      </main>
    </div>
  );
}
