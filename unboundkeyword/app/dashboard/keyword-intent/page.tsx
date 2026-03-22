import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSelectedSiteIdForUser } from "@/lib/site-context";
import { formatNumber } from "@/lib/utils";

export const metadata = { title: "Keyword Intent - UnBoundKeyword" };

type IntentType = "informational" | "transactional" | "navigational" | "commercial";

type IntentRow = {
  keyword: string;
  intent: IntentType;
  volume: number;
  difficulty: number | null;
  cpc: number | null;
  platform: string;
  sourceIntent: string | null;
};

const INTENT_META: Record<IntentType, { label: string; description: string; color: string; border: string }> = {
  informational: {
    label: "Informational",
    description: "Learning intent: guides, definitions, and explanations.",
    color: "bg-blue-50 text-blue-700",
    border: "border-blue-200",
  },
  transactional: {
    label: "Transactional",
    description: "Action intent: ready to buy, sign up, or convert.",
    color: "bg-emerald-50 text-emerald-700",
    border: "border-emerald-200",
  },
  navigational: {
    label: "Navigational",
    description: "Brand intent: trying to reach a specific site/page.",
    color: "bg-violet-50 text-violet-700",
    border: "border-violet-200",
  },
  commercial: {
    label: "Commercial",
    description: "Research intent: comparison and evaluation before purchase.",
    color: "bg-amber-50 text-amber-700",
    border: "border-amber-200",
  },
};

function inferIntent(keyword: string, sourceIntent: string | null): IntentType {
  const normalized = keyword.toLowerCase();
  const source = (sourceIntent || "").toLowerCase();

  if (["informational", "transactional", "navigational", "commercial"].includes(source)) {
    return source as IntentType;
  }

  const informationalSignals = ["how", "what", "why", "when", "guide", "examples", "tutorial", "tips"];
  const transactionalSignals = ["buy", "price", "pricing", "cost", "order", "coupon", "near me", "book", "hire"];
  const navigationalSignals = ["login", "official", "website", "dashboard", "app", "brand", "company"];
  const commercialSignals = ["best", "top", "review", "vs", "versus", "comparison", "alternatives", "software"];

  if (transactionalSignals.some((token) => normalized.includes(token))) return "transactional";
  if (navigationalSignals.some((token) => normalized.includes(token))) return "navigational";
  if (commercialSignals.some((token) => normalized.includes(token))) return "commercial";
  if (informationalSignals.some((token) => normalized.includes(token))) return "informational";

  return "informational";
}

export default async function KeywordIntentPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const siteId = await getSelectedSiteIdForUser(userId);

  const sourceRows = await prisma.discoveryKeyword.findMany({
    where: {
      userId,
      ...(siteId ? { siteId } : { siteId: null }),
    },
    select: {
      keyword: true,
      intent: true,
      volume: true,
      difficulty: true,
      cpc: true,
      platform: true,
    },
    orderBy: [{ volume: "desc" }, { createdAt: "desc" }],
    take: 600,
  });

  const rows: IntentRow[] = sourceRows.map((row) => ({
    keyword: row.keyword,
    sourceIntent: row.intent,
    intent: inferIntent(row.keyword, row.intent),
    volume: row.volume ?? 0,
    difficulty: row.difficulty,
    cpc: row.cpc,
    platform: row.platform,
  }));

  const grouped = rows.reduce<Record<IntentType, IntentRow[]>>(
    (acc, row) => {
      acc[row.intent].push(row);
      return acc;
    },
    { informational: [], transactional: [], navigational: [], commercial: [] }
  );

  const totalKeywords = rows.length;

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900">Keyword Intent</h1>
        <p className="text-sm text-slate-500 mt-1">Full intent classification across informational, transactional, navigational, and commercial terms.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-7">
        {(["informational", "transactional", "navigational", "commercial"] as IntentType[]).map((intent) => {
          const intentRows = grouped[intent];
          const volumeSum = intentRows.reduce((sum, row) => sum + row.volume, 0);
          const pct = totalKeywords ? Math.round((intentRows.length / totalKeywords) * 100) : 0;
          const meta = INTENT_META[intent];

          return (
            <div key={intent} className={`rounded-xl border ${meta.border} bg-white p-5`}>
              <div className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.color}`}>{meta.label}</div>
              <div className="mt-3 text-4xl font-black text-slate-900">{intentRows.length}</div>
              <div className="text-xs text-slate-400 mt-1">{pct}% of all tracked terms</div>
              <div className="mt-3 text-sm text-slate-600">{formatNumber(volumeSum)} total monthly volume</div>
              <p className="mt-2 text-xs text-slate-500">{meta.description}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Intent Breakdown Table</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Keyword</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Intent</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Volume</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">CPC</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">KD</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Platform</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400">No keywords found for this project yet.</td>
                </tr>
              ) : rows.slice(0, 200).map((row) => (
                <tr key={`${row.keyword}-${row.platform}`} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{row.keyword}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${INTENT_META[row.intent].color}`}>
                      {INTENT_META[row.intent].label}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums text-slate-700">{formatNumber(row.volume)}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-slate-700">{row.cpc != null ? `$${row.cpc.toFixed(2)}` : "-"}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-slate-700">{row.difficulty ?? "-"}</td>
                  <td className="px-6 py-3 text-right text-slate-500">{row.platform}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
