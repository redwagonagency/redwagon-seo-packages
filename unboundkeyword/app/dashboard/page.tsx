import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import DashboardSearch from "@/components/dashboard/DashboardSearch";
import OverviewWithVolume from "@/components/dashboard/OverviewWithVolume";

export default async function DashboardPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;

  const [listCount, keywordCount, discoveryCount] = await Promise.all([
    prisma.keywordList.count({ where: { userId: userId! } }),
    prisma.keywordInList.count({ where: { list: { userId: userId! } } }),
    prisma.discoverySession.count({ where: { userId: userId! } }),
  ]);

  const recentLists = await prisma.keywordList.findMany({
    where: { userId: userId! },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: { _count: { select: { keywords: true } } },
  });

  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  return (
    <div className="p-8 max-w-6xl">

      {/* ─── Insight Banner (Ubersuggest-style hero) ─── */}
      <div className="mb-8 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-5 px-7 py-5">
        <div className="shrink-0">
          <Image
            src="/joe-headshot.png"
            alt={firstName || "User"}
            width={64}
            height={64}
            className="rounded-full object-cover ring-4 ring-[#f15b27]/20"
          />
        </div>
        <div>
          <p className="text-[15px] text-slate-700 leading-relaxed">
            {firstName && <span className="font-semibold text-[#f15b27]">{firstName},</span>}
            {" "}the average page that ranks in the top&nbsp;10 has{" "}
            <span className="font-bold text-slate-900">78+ keywords</span> in its topic cluster and{" "}
            <span className="font-bold text-[#f15b27]">a clear question-answer structure</span>.
            Use Keyword Discovery daily to build that depth.
          </p>
        </div>
        <div className="ml-auto shrink-0">
          <Link
            href="/dashboard/discover"
            className="inline-flex items-center gap-2 rounded-full bg-[#f15b27] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#d94e1f] transition shadow-md shadow-orange-200"
          >
            Start discovery →
          </Link>
        </div>
      </div>

      {/* ─── Cross-platform Search Box ─── */}
      <DashboardSearch />

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Keyword Lists",
            value: listCount,
            href: "/dashboard/lists",
            bg: "bg-white",
            accent: "text-[#f15b27]",
            bar: "bg-[#f15b27]",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            ),
          },
          {
            label: "Total Keywords",
            value: keywordCount,
            href: "/dashboard/lists",
            bg: "bg-white",
            accent: "text-indigo-600",
            bar: "bg-indigo-500",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
            ),
          },
          {
            label: "Discovery Sessions",
            value: discoveryCount,
            href: "/dashboard/discover",
            bg: "bg-white",
            accent: "text-emerald-600",
            bar: "bg-emerald-500",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            ),
          },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition group"
          >
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-orange-50 transition mb-3 ${s.accent}`}>
              {s.icon}
            </div>
            <div className={`text-4xl font-black mb-1 ${s.accent}`}>{s.value}</div>
            <div className="text-[13px] text-slate-500 font-medium">{s.label}</div>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${s.bar} transition-all`}
                style={{ width: `${Math.min(100, (s.value / Math.max(s.value + 5, 10)) * 100)}%` }}
              />
            </div>
          </Link>
        ))}
      </div>

      {/* ─── Quick Actions ─── */}
      <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#f15b27] mb-3">QUICK ACTIONS</h2>
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          {
            href: "/dashboard/discover",
            label: "Keyword Discovery",
            sub: "Questions, modifiers, A-Z and related in one session",
            bg: "bg-[#f15b27]",
            hover: "hover:bg-[#d94e1f]",
            icon: "🔍",
          },
          {
            href: "/dashboard/lists",
            label: "Manage Lists",
            sub: "Build and export curated keyword sets",
            bg: "bg-indigo-600",
            hover: "hover:bg-indigo-700",
            icon: "📋",
          },
          {
            href: "/dashboard/competitor",
            label: "Competitors",
            sub: "Keyword gaps and competitor overlap",
            bg: "bg-slate-800",
            hover: "hover:bg-slate-900",
            icon: "⚡",
          },
          {
            href: "/dashboard/discover",
            label: "A-Z Explorer",
            sub: "One click for every letter and question type",
            bg: "bg-teal-600",
            hover: "hover:bg-teal-700",
            icon: "🔤",
          },
        ].map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className={`${a.bg} ${a.hover} text-white rounded-2xl p-5 transition shadow-sm flex flex-col`}
          >
            <div className="text-2xl mb-3">{a.icon}</div>
            <div className="font-bold text-[14px] leading-tight mb-1">{a.label}</div>
            <p className="text-white/70 text-xs leading-relaxed mt-auto">{a.sub}</p>
          </Link>
        ))}
      </div>

      {/* ─── Recent Lists ─── */}
      {recentLists.length > 0 && (
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#f15b27] mb-3">RECENT LISTS</h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">List name</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Keywords</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLists.map((list) => (
                  <tr key={list.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: list.color || "#f15b27" }}
                        />
                        <span className="font-medium text-slate-800">{list.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        {list._count.keywords}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        href={`/dashboard/lists/${list.id}`}
                        className="text-[#f15b27] text-xs font-semibold hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Volume Analytics Section ─── */}
      <div className="mt-12">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#f15b27] mb-4">KEYWORD INSIGHTS</h2>
        <OverviewWithVolume />
      </div>
    </div>
  );
}
