import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import { getSelectedSiteIdForUser } from "@/lib/site-context";

export const metadata = { title: "Keyword Ideas - UnBoundKeyword" };

type IdeaRow = {
  keyword: string;
  volume: number;
  cpc: number | null;
  paidDifficulty: number;
  seoDifficulty: number;
};

function difficultyCell(value: number) {
  if (value >= 70) return "bg-red-100 text-red-700";
  if (value >= 40) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default async function KeywordIdeasPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const siteId = await getSelectedSiteIdForUser(userId);
  const sourceRows = await prisma.discoveryKeyword.findMany({
    where: {
      userId,
      ...(siteId ? { siteId } : { siteId: null }),
    },
    orderBy: [{ volume: "desc" }, { createdAt: "desc" }],
    take: 140,
    select: {
      keyword: true,
      volume: true,
      cpc: true,
      difficulty: true,
    },
  });

  const rows: IdeaRow[] = (sourceRows.length > 0
    ? sourceRows.map((row) => ({
        keyword: row.keyword,
        volume: row.volume ?? 0,
        cpc: row.cpc,
        paidDifficulty: Math.max(1, Math.round(((row.difficulty ?? 45) / 100) * 80)),
        seoDifficulty: row.difficulty ?? 45,
      }))
    : [
        { keyword: "digital marketing", volume: 40500, cpc: 13.08, paidDifficulty: 60, seoDifficulty: 49 },
        { keyword: "affiliate marketing", volume: 49500, cpc: 11.01, paidDifficulty: 65, seoDifficulty: 52 },
        { keyword: "social media marketing", volume: 40500, cpc: 10.88, paidDifficulty: 77, seoDifficulty: 49 },
        { keyword: "free market", volume: 22200, cpc: 4.6, paidDifficulty: 5, seoDifficulty: 26 },
        { keyword: "human resource management", volume: 22200, cpc: 21.27, paidDifficulty: 46, seoDifficulty: 33 },
      ]
  ).slice(0, 120);

  const totalIdeas = rows.length;

  return (
    <div className="p-8 max-w-7xl">
      <div className="rounded-xl border border-[#f15b27] bg-[#fff3ee] p-2 flex gap-2 mb-6">
        <input
          defaultValue="digital marketing"
          placeholder="keyword"
          className="flex-1 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm"
        />
        <button type="button" className="rounded-md bg-[#f15b27] px-4 py-2 text-xs font-black text-white">Search</button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-900">{formatNumber(totalIdeas)} Keyword Ideas</h1>
            <button type="button" className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500">Filters</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 w-8" />
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Keyword</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Vol</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">CPC</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">PD</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">SD</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.keyword} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5"><input type="checkbox" className="rounded border-slate-300" /></td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{row.keyword}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatNumber(row.volume)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{row.cpc != null ? `$${row.cpc.toFixed(2)}` : "-"}</td>
                    <td className="px-4 py-2.5 text-center tabular-nums text-slate-700">{row.paidDifficulty}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex rounded px-2 py-0.5 text-xs font-black ${difficultyCell(row.seoDifficulty)}`}>{row.seoDifficulty}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-2">
            <button type="button" className="rounded-md bg-[#f15b27] px-4 py-2 text-xs font-black text-white">Export to CSV</button>
            <button type="button" className="rounded-md bg-[#f15b27] px-4 py-2 text-xs font-black text-white">Copy to Clipboard</button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-3xl leading-tight font-black text-slate-900">Keyword Overview</h2>
            <p className="text-slate-500">digital marketing</p>
          </div>
          <div className="px-5 py-4 border-b border-slate-100 text-sm text-slate-600">
            <span className="font-semibold text-red-500">This keyword is competitive.</span> There is a 51% chance you will be able to rank for it.
          </div>
          <div className="p-5">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider">
                  <th className="text-left py-2">Google SERP</th>
                  <th className="text-right py-2">Est Visits</th>
                  <th className="text-right py-2">Shares</th>
                  <th className="text-right py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["marketo.com", 12312, 1051, 58],
                  ["blog.hubspot.com", 6561, 2971, 56],
                  ["neilpatel.com", 3940, 1465, 64],
                  ["forbes.com", 2668, 362, 88],
                  ["wikipedia.org", 1899, 1558, 92],
                ].map((row) => (
                  <tr key={String(row[0])} className="border-t border-slate-100">
                    <td className="py-2 text-slate-700">{row[0]}</td>
                    <td className="py-2 text-right tabular-nums text-slate-700">{formatNumber(Number(row[1]))}</td>
                    <td className="py-2 text-right tabular-nums text-slate-700">{formatNumber(Number(row[2]))}</td>
                    <td className="py-2 text-right tabular-nums text-slate-700">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="mt-4 w-full rounded-md bg-[#f15b27] px-4 py-2 text-xs font-black text-white">SERP Analysis</button>
          </div>
        </div>
      </div>
    </div>
  );
}
