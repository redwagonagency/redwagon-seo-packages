import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getDomainRankOverview,
  getDomainCompetitors,
  getKeywordGap,
  getBulkTrafficEstimation,
  getHistoricalBulkTraffic,
  getBacklinkTotalSummary,
  getCommonKeywords,
} from "@/lib/dataforseo/client";
import { getSelectedSiteForUser } from "@/lib/site-context";

function normalizeDomain(value: string | undefined): string {
  return (value ?? "")
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .trim()
    .toLowerCase();
}

export type CompetitorRow = {
  domain: string;
  commonKeywordsCount: number;
  commonKeywords: { keyword: string; volume: number | null; yourPosition: number | null; competitorPosition: number | null }[];
  keywordGapCount: number;
  keywordGap: { keyword: string; volume: number | null; yourPosition: number | null; competitorPosition: number | null; opportunity: string }[];
  estimatedTraffic: number;
  backlinks: number;
  referringDomains: number;
  domainRank: number;
};

export type TrafficHistoryPoint = {
  date: string;
  [domain: string]: string | number;
};

export type CompetitorAnalysisResponse = {
  domain: string;
  yourOverview: { organicTraffic: number; organicKeywords: number; domainRank: number; etv: number } | null;
  competitors: CompetitorRow[];
  monthlyTraffic: TrafficHistoryPoint[];
  suggestedCompetitors: string[];
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  try {
    type RequestBody = { domain?: string; competitorDomains?: string[]; location?: number; language?: string };
    const body = (await req.json()) as RequestBody;

    const selectedSite = await getSelectedSiteForUser(userId);
    const domain = normalizeDomain(body.domain || selectedSite?.domain);
    const location = body.location ?? 2840;
    const language = body.language ?? "en";

    if (!domain) {
      return Response.json({
        domain: "",
        yourOverview: null,
        competitors: [],
        monthlyTraffic: [],
        suggestedCompetitors: [],
        requiresDomain: true,
      });
    }

    const customCompetitors = Array.isArray(body.competitorDomains)
      ? body.competitorDomains.map(normalizeDomain).filter(Boolean)
      : [];

    // Get your domain overview + suggested competitors simultaneously
    const [yourOverviewResult, suggestedResult] = await Promise.allSettled([
      getDomainRankOverview(domain, location, language),
      customCompetitors.length === 0 ? getDomainCompetitors(domain, location, language, 10) : Promise.resolve([]),
    ]);

    const yourOverview = yourOverviewResult.status === "fulfilled" ? yourOverviewResult.value : null;
    const suggested = suggestedResult.status === "fulfilled" ? suggestedResult.value : [];
    const suggestedDomains = suggested.map((s) => normalizeDomain(s.domain)).filter(Boolean);

    const chosenCompetitors = (
      customCompetitors.length > 0 ? customCompetitors : suggestedDomains.slice(0, 8)
    ).slice(0, 10);

    if (chosenCompetitors.length === 0) {
      return Response.json({
        domain,
        yourOverview,
        competitors: [],
        monthlyTraffic: [],
        suggestedCompetitors: suggestedDomains.slice(0, 15),
      });
    }

    // Bulk traffic estimation + historical for all domains at once (efficient)
    const allTargets = [domain, ...chosenCompetitors];
    const [bulkTrafficResult, histBulkResult] = await Promise.allSettled([
      getBulkTrafficEstimation(allTargets.map((t) => ({ target: t })), location, language),
      getHistoricalBulkTraffic(allTargets, location, language),
    ]);

    const bulkTraffic = bulkTrafficResult.status === "fulfilled" ? bulkTrafficResult.value : [];
    const bulkTrafficMap = new Map(bulkTraffic.map((b) => [b.target, b]));

    const histBulk = histBulkResult.status === "fulfilled" ? histBulkResult.value : [];
    const histMap = new Map(histBulk.map((h) => [h.target, h.history]));

    // Build monthly traffic chart — merge all domains into common date points
    const dateSet = new Set<string>();
    for (const [, hist] of histMap) {
      for (const point of hist) dateSet.add(point.date);
    }
    const sortedDates = [...dateSet].sort();
    const monthlyTraffic: TrafficHistoryPoint[] = sortedDates.map((date) => {
      const point: TrafficHistoryPoint = { date };
      for (const d of allTargets) {
        const hist = histMap.get(d) ?? [];
        const match = hist.find((h) => h.date === date);
        point[d] = match?.traffic ?? 0;
      }
      return point;
    });

    // Per-competitor data: common keywords, keyword gap, backlinks
    const competitorRows: CompetitorRow[] = await Promise.all(
      chosenCompetitors.map(async (compDomain): Promise<CompetitorRow> => {
        const [commonResult, gapResult, backlinkResult] = await Promise.allSettled([
          getCommonKeywords(domain, compDomain, location, language, 200),
          getKeywordGap(domain, [compDomain], location, language, 200),
          getBacklinkTotalSummary(compDomain),
        ]);

        const common = commonResult.status === "fulfilled" ? commonResult.value : { count: 0, items: [] };
        const gap = gapResult.status === "fulfilled" ? gapResult.value : [];
        const backlink = backlinkResult.status === "fulfilled" ? backlinkResult.value : { backlinksTotal: 0, referringDomains: 0, domainRank: 0 };
        const traffic = bulkTrafficMap.get(compDomain);

        return {
          domain: compDomain,
          commonKeywordsCount: common.count,
          commonKeywords: common.items,
          keywordGapCount: gap.length,
          keywordGap: gap.map((g) => ({
            keyword: g.keyword,
            volume: g.volume,
            yourPosition: g.yourPosition,
            competitorPosition: g.competitorPositions[0]?.position ?? null,
            opportunity: g.opportunity,
          })),
          estimatedTraffic: traffic?.traffic ?? 0,
          backlinks: backlink.backlinksTotal,
          referringDomains: backlink.referringDomains,
          domainRank: backlink.domainRank,
        };
      })
    );

    return Response.json({
      domain,
      yourOverview,
      competitors: competitorRows,
      monthlyTraffic,
      suggestedCompetitors: suggestedDomains.slice(0, 15),
    } satisfies CompetitorAnalysisResponse);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Competitor analysis failed" },
      { status: 500 }
    );
  }
}
