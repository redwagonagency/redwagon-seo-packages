import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isJoeSuperAdmin } from "@/lib/superadmin";
import SuperadminIndustryStatsManager from "@/components/dashboard/SuperadminIndustryStatsManager";

type SuperadminCompat = {
  user: {
    findMany: (args: unknown) => Promise<Array<{ id: string; name: string | null; email: string | null; createdAt: Date }>>;
    count: (args?: unknown) => Promise<number>;
  };
  siteProject: {
    count: (args?: unknown) => Promise<number>;
  };
  discoveryKeyword: {
    count: (args?: unknown) => Promise<number>;
  };
  industryStat: {
    count: (args?: unknown) => Promise<number>;
    findMany: (args: unknown) => Promise<Array<{ industry: string; metricKey: string; metricValue: number; unit: string | null; note: string | null }>>;
  };
};

export const dynamic = "force-dynamic";

export default async function SuperadminPage() {
  const session = await auth();
  if (!isJoeSuperAdmin(session?.user?.email)) {
    return (
      <div className="p-10">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          You do not have permission to access this page.
        </div>
      </div>
    );
  }

  const db = prisma as unknown as SuperadminCompat;
  const [users, userCount, projectCount, keywordCount, statCount, stats] = await Promise.all([
    db.user.findMany({
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.user.count(),
    db.siteProject.count(),
    db.discoveryKeyword.count(),
    db.industryStat.count(),
    db.industryStat.findMany({
      orderBy: [{ industry: "asc" }, { metricKey: "asc" }],
      take: 50,
    }),
  ]);

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-[#f15b27] font-black">Superadmin</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Joe Control Center</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage users, projects, and platform-level SEO intelligence settings.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Users</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{userCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Projects</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{projectCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Tracked Keywords</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{keywordCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Industry Stats</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{statCount}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-black text-slate-900 mb-4">Users</h2>
          <div className="space-y-2 max-h-[460px] overflow-auto pr-1">
            {users.map((user) => (
              <div key={user.id} className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-sm font-semibold text-slate-900">{user.name || "Unnamed user"}</p>
                <p className="text-xs text-slate-600">{user.email || "No email"}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-black text-slate-900 mb-4">Website Management</h2>
          <div className="space-y-3 text-sm">
            <Link href="/blog" className="block rounded-lg border border-slate-200 px-3 py-2 hover:border-[#f15b27]">
              Open Blog
            </Link>
            <Link href="/dashboard/decision-engine" className="block rounded-lg border border-slate-200 px-3 py-2 hover:border-[#f15b27]">
              Open Decision Engine
            </Link>
            <Link href="/dashboard/discover" className="block rounded-lg border border-slate-200 px-3 py-2 hover:border-[#f15b27]">
              Open Keyword Discovery
            </Link>
          </div>

          <h3 className="mt-6 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Industry Stats</h3>
          <div className="mt-2">
            <SuperadminIndustryStatsManager initialStats={stats} />
          </div>
        </section>
      </div>
    </div>
  );
}
