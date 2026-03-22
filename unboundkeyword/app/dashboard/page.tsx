import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="p-6 md:p-8 max-w-6xl text-white">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">
          Welcome back, <span className="ubk-orange-accent">{firstName}</span>
        </h1>
        <p className="text-white/40 mt-1 text-sm">Here&apos;s an overview of your keyword workspace.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Keyword Lists",
            value: listCount,
            icon: "📋",
            href: "/dashboard/keyword-research",
            color: "from-violet-500/15",
            accent: "#a855f7",
          },
          {
            label: "Total Keywords",
            value: keywordCount,
            icon: "🔍",
            href: "/dashboard/keyword-research",
            color: "from-blue-500/15",
            accent: "#3b82f6",
          },
          {
            label: "Discovery Sessions",
            value: discoveryCount,
            icon: "✨",
            href: "/dashboard/keyword-research",
            color: "from-orange-500/15",
            accent: "#f97316",
          },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`ubk-feature-card rounded-2xl p-6 bg-gradient-to-br ${s.color} to-transparent hover:border-white/20 transition group`}
          >
            <div className="text-2xl mb-3">{s.icon}</div>
            <div
              className="text-4xl font-black tabular-nums"
              style={{ color: s.accent }}
            >
              {s.value.toLocaleString()}
            </div>
            <div className="text-white/45 text-sm mt-1 group-hover:text-white/65 transition">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="text-base font-bold text-white/55 uppercase tracking-widest mb-4">Quick start</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {[
          {
            href: "/dashboard/keyword-research",
            icon: "🔍",
            title: "Discover Keywords",
            desc: "AnswerThePublic-style — questions, prepositions, comparisons, A–Z",
            accent: "from-violet-600 to-purple-600",
            btn: "Open discover",
          },
          {
            href: "/dashboard/competitors",
            icon: "⚔️",
            title: "Competitor Gap",
            desc: "Find keywords your competitors rank for that you don't yet",
            accent: "from-orange-600 to-amber-500",
            btn: "Run gap analysis",
          },
          {
            href: "/dashboard/site-audit",
            icon: "🛡️",
            title: "Site Audit",
            desc: "Full on-page crawl — issues, Lighthouse scores, broken links",
            accent: "from-emerald-600 to-teal-500",
            btn: "Start audit",
          },
          {
            href: "/dashboard/llm-visibility",
            icon: "🤖",
            title: "LLM Visibility",
            desc: "Check if ChatGPT, Perplexity and Gemini mention your brand",
            accent: "from-cyan-600 to-blue-500",
            btn: "Check visibility",
          },
          {
            href: "/dashboard/rank-tracking",
            icon: "📈",
            title: "Rank Tracking",
            desc: "Monitor keyword positions across Google every day",
            accent: "from-pink-600 to-rose-500",
            btn: "Track rankings",
          },
          {
            href: "/dashboard/backlinks",
            icon: "🔗",
            title: "Backlink Audit",
            desc: "Full backlink profile — spam score, domain rank, toxic links",
            accent: "from-indigo-600 to-blue-600",
            btn: "View backlinks",
          },
        ].map((a) => (
          <Link
            key={a.title}
            href={a.href}
            className="ubk-feature-card rounded-2xl p-6 flex gap-4 items-start hover:border-white/25 transition group"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-gradient-to-br ${a.accent} shadow-lg`}
            >
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm mb-1">{a.title}</div>
              <p className="text-white/40 text-xs leading-relaxed">{a.desc}</p>
            </div>
            <div
              className={`text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r ${a.accent} text-white shrink-0 self-start opacity-0 group-hover:opacity-100 transition`}
            >
              →
            </div>
          </Link>
        ))}
      </div>

      {/* Recent lists */}
      {recentLists.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-white/55 uppercase tracking-widest mb-4">Recent lists</h2>
          <div className="ubk-feature-card rounded-2xl overflow-hidden divide-y divide-white/[0.05]">
            {recentLists.map((list: { id: string; name: string; color: string | null; _count: { keywords: number } }) => (
              <Link
                key={list.id}
                href={`/dashboard/keyword-research`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] transition"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: list.color || "#a855f7" }}
                  />
                  <span className="font-medium text-sm text-white/80">{list.name}</span>
                </div>
                <span className="text-white/30 text-xs tabular-nums">{list._count.keywords} keywords</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {listCount === 0 && discoveryCount === 0 && (
        <div className="ubk-cta-banner rounded-2xl p-10 text-center mt-6">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-xl font-black mb-2">Start your first discovery</h3>
          <p className="text-white/45 text-sm mb-6 max-w-sm mx-auto">
            Enter any keyword to instantly see questions, prepositions, comparisons and A–Z suggestions with search volumes.
          </p>
          <Link
            href="/dashboard/keyword-research"
            className="ubk-btn-primary px-8 py-3 rounded-full font-bold text-sm inline-block"
          >
            Discover keywords
          </Link>
        </div>
      )}
    </div>
  );
}
