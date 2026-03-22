import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSelectedSiteIdForUser } from "@/lib/site-context";
import { formatNumber } from "@/lib/utils";

export const metadata = { title: "Content Ideas - UnBoundKeyword" };

type ContentRow = {
  title: string;
  visits: number;
  backlinks: number;
  facebook: number;
  pinterest: number;
};

export default async function ContentIdeasPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const siteId = await getSelectedSiteIdForUser(userId);
  const rowsFromKeywords = await prisma.discoveryKeyword.findMany({
    where: {
      userId,
      ...(siteId ? { siteId } : { siteId: null }),
    },
    orderBy: [{ volume: "desc" }, { createdAt: "desc" }],
    take: 80,
    select: { keyword: true, volume: true, cpc: true, difficulty: true },
  });

  const rows: ContentRow[] = (rowsFromKeywords.length > 0
    ? rowsFromKeywords.map((row, idx) => {
        const base = row.volume ?? 0;
        return {
          title: `For Every View: ${row.keyword} ideas and practical playbook`,
          visits: Math.max(0, Math.round(base * (0.04 + ((idx % 5) * 0.01)))),
          backlinks: Math.max(0, Math.round((row.difficulty ?? 20) * (0.3 + (idx % 3) * 0.1))),
          facebook: Math.max(0, Math.round(base * (2 + (idx % 4) * 0.7))),
          pinterest: Math.max(0, Math.round(base * (0.3 + (idx % 3) * 0.2))),
        };
      })
    : [
        { title: "For Every View Of This Video A Pound Of Dog Food Will Be Donated", visits: 0, backlinks: 15, facebook: 3143649, pinterest: 193 },
        { title: "PET FOOD lead alert! Blue Buffalo and Blue Wilderness Dog Food Class Action", visits: 2584, backlinks: 12, facebook: 472455, pinterest: 101 },
        { title: "Company Researches 200 Dog Food Formulas And Finds ONLY 1%", visits: 117, backlinks: 31, facebook: 410636, pinterest: 15969 },
      ]
  ).slice(0, 70);

  return (
    <div className="p-8 max-w-7xl">
      <div className="rounded-xl border border-[#f15b27] bg-[#fff3ee] p-2 flex gap-2 mb-6">
        <input
          defaultValue="dog food"
          placeholder="keyword"
          className="flex-1 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm"
        />
        <button type="button" className="rounded-md bg-[#f15b27] px-6 py-2 text-xs font-black text-white">Search</button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h1 className="text-3xl font-black text-slate-900">Content Ideas: <span className="font-semibold text-slate-500">dog food</span></h1>
          <button type="button" className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500">Filters</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 w-8" />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Page Title / URL</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Est. Visits</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Backlinks</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Facebook</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Pinterest</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={`${row.title}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3"><input type="checkbox" className="rounded border-slate-300" /></td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#f15b27] hover:underline cursor-pointer">{row.title}</div>
                    <div className="text-xs text-slate-400 mt-1">example.com/article-{idx + 1}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatNumber(row.visits)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatNumber(row.backlinks)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatNumber(row.facebook)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatNumber(row.pinterest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
