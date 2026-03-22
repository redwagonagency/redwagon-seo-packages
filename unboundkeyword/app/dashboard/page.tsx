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

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="text-slate-500 mt-1">Keyword-first workspace: discover, organize, and close competitor gaps.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Keyword Lists", value: listCount, icon: "📋", href: "/dashboard/lists" },
          { label: "Total Keywords", value: keywordCount, icon: "🔑", href: "/dashboard/lists" },
          { label: "Discovery Sessions", value: discoveryCount, icon: "🔍", href: "/dashboard/discover" },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition"
          >
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-3xl font-bold text-slate-900">{s.value}</div>
            <div className="text-sm text-slate-500 mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick start</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/dashboard/discover"
            className="bg-indigo-600 text-white rounded-2xl p-5 hover:bg-indigo-700 transition"
          >
            <div className="text-2xl mb-2">🔍</div>
            <div className="font-bold">Discover Keywords</div>
            <p className="text-indigo-200 text-sm mt-1">
              Main tool: one circle plus one master keyword results table
            </p>
          </Link>
          <Link
            href="/dashboard/lists"
            className="bg-purple-600 text-white rounded-2xl p-5 hover:bg-purple-700 transition"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-bold">Manage Lists</div>
            <p className="text-purple-200 text-sm mt-1">
              Build, organise and export your keyword lists
            </p>
          </Link>
          <Link
            href="/dashboard/competitor"
            className="bg-orange-500 text-white rounded-2xl p-5 hover:bg-orange-600 transition"
          >
            <div className="text-2xl mb-2">⚔️</div>
            <div className="font-bold">Competitor Intelligence</div>
            <p className="text-orange-100 text-sm mt-1">
              Find keywords your competitors rank for that you don&apos;t
            </p>
          </Link>
          <Link
            href="/dashboard/discover"
            className="bg-emerald-600 text-white rounded-2xl p-5 hover:bg-emerald-700 transition"
          >
            <div className="text-2xl mb-2">🔤</div>
            <div className="font-bold">A-Z + Questions</div>
            <p className="text-emerald-100 text-sm mt-1">
              Pull every question and modifier into one deduplicated keyword table
            </p>
          </Link>
        </div>
      </div>

      {/* Recent Lists */}
      {recentLists.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent lists</h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
            {recentLists.map((list) => (
              <Link
                key={list.id}
                href={`/dashboard/lists/${list.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: list.color || "#6366f1" }}
                  />
                  <span className="font-medium text-slate-800 text-sm">{list.name}</span>
                </div>
                <span className="text-slate-400 text-xs">{list._count.keywords} keywords</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
