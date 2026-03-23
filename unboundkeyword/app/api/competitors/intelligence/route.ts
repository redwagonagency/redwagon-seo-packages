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
  getRankedKeywords,
} from "@/lib/dataforseo/client";
import { getSelectedSiteForUser } from "@/lib/site-context";
import { prisma } from "@/lib/prisma";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function normalizeDomain(value: string | undefined): string {
  return (value ?? "")
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .trim()
    .toLowerCase();
}

export type RankedKwItem = {
  keyword: string;
  position: number;
  searchVolume: number;
  cpc: number | null;
  url: string | null;
};

export type CompetitorRow = {
  domain: string;
  commonKeywordsCount: number;
  commonKeywords: { keyword: string; volume: number | null; yourPosition: number | null; competitorPosition: number | null }[];
  keywordGapCount: number;
  keywordGap: { keyword: string; volume: number | null; yourPosition: number | null; competitorPosition: number | null; opportunity: string }[];
  rankedKeywords: RankedKwItem[]; // full set of competitor's ranked keywords
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
  yourRankedKeywords: RankedKwItem[];
  competitors: CompetitorRow[];
  monthlyTraffic: TrafficHistoryPoint[];
  suggestedCompetitors: string[];
  fromCache?: boolean;
  cachedAt?: string | null;
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  try {
    type RequestBody = { domain?: string; competitorDomains?: string[]; location?: number; language?: string; forceRefresh?: boolean };
    const body = (await req.json()) as RequestBody;
    const forceRefresh = body.forceRefresh === true;

    const selectedSite = await getSelectedSiteForUser(userId);
    const domain = normalizeDomain(body.domain || selectedSite?.domain);
    const location = body.location ?? 2840;
    const language = body.language ?? "en";

    if (!domain) {
      return Response.json({
        domain: "",
        yourOverview: null,
        yourRankedKeywords: [],
        competitors: [],
        monthlyTraffic: [],
        suggestedCompetitors: [],
        requiresDomain: true,
      });
    }

    // Serve from cache if available and fresh
    if (!forceRefresh) {
      const cached = await prisma.competitorAnalysisCache.findUnique({
        where: { userId_domain: { userId, domain } },
      });
      if (cached && Date.now() - new Date(cached.updatedAt).getTime() < CACHE_TTL_MS) {
        const parsed = JSON.parse(cached.data) as CompetitorAnalysisResponse;
        return Response.json({ ...parsed, fromCache: true, cachedAt: cached.updatedAt.toISOString() });
      }
    }

    const customCompetitors = Array.isArray(body.competitorDomains)
      ? body.competitorDomains.map(normalizeDomain).filter(Boolean)
      : [];

    // Load saved competitors from the project if none provided
    let savedCompetitors: string[] = [];
    if (customCompetitors.length === 0 && selectedSite) {
      try {
        savedCompetitors = (JSON.parse(selectedSite.competitors ?? "[]") as string[])
          .map(normalizeDomain)
          .filter(Boolean);
      } catch {
        savedCompetitors = [];
      }
    }

    // Get your domain overview + suggested competitors + your ranked keywords simultaneously
    const needSuggested = customCompetitors.length === 0 && savedCompetitors.length === 0;
    const [yourOverviewResult, suggestedResult, yourRankedResult] = await Promise.allSettled([
      getDomainRankOverview(domain, location, language),
      needSuggested ? getDomainCompetitors(domain, location, language, 10) : Promise.resolve([]),
      getRankedKeywords(domain, location, language, 300),
    ]);

    const yourOverview = yourOverviewResult.status === "fulfilled" ? yourOverviewResult.value : null;
    const suggested = suggestedResult.status === "fulfilled" ? suggestedResult.value : [];
    const yourRankedKeywords: RankedKwItem[] = yourRankedResult.status === "fulfilled" ? yourRankedResult.value : [];
    const suggestedDomains = suggested.map((s) => normalizeDomain(s.domain)).filter(Boolean);

    const chosenCompetitors = (
      customCompetitors.length > 0
        ? customCompetitors
        : savedCompetitors.length > 0
          ? savedCompetitors
          : suggestedDomains.slice(0, 8)
    ).slice(0, 10);

    if (chosenCompetitors.length === 0) {
      return Response.json({
        domain,
        yourOverview,
        yourRankedKeywords,
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
    // Pre-fetch ranked keywords for all competitors in parallel
    const competitorRankedResults = await Promise.allSettled(
      chosenCompetitors.map((cd) => getRankedKeywords(cd, location, language, 300))
    );

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
      chosenCompetitors.map(async (compDomain, idx): Promise<CompetitorRow> => {
        const [commonResult, gapResult, backlinkResult] = await Promise.allSettled([
          getCommonKeywords(domain, compDomain, location, language, 500),
          getKeywordGap(domain, [compDomain], location, language, 500),
          getBacklinkTotalSummary(compDomain),
        ]);
        const rankedKws: RankedKwItem[] =
          competitorRankedResults[idx]?.status === "fulfilled"
            ? (competitorRankedResults[idx] as PromiseFulfilledResult<RankedKwItem[]>).value
            : [];

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
          rankedKeywords: rankedKws,
          estimatedTraffic: traffic?.traffic ?? 0,
          backlinks: backlink.backlinksTotal,
          referringDomains: backlink.referringDomains,
          domainRank: backlink.domainRank,
        };
      })
    );

    const responseData = {
      domain,
      yourOverview,
      yourRankedKeywords,
      competitors: competitorRows,
      monthlyTraffic,
      suggestedCompetitors: suggestedDomains.slice(0, 15),
    } satisfies CompetitorAnalysisResponse;

    // Save to cache (fire and forget — don't block the response)
    prisma.competitorAnalysisCache.upsert({
      where: { userId_domain: { userId, domain } },
      update: { data: JSON.stringify(responseData) },
      create: { userId, domain, data: JSON.stringify(responseData) },
    }).catch((err: unknown) => console.error("[competitor cache] save failed:", err));

    return Response.json({ ...responseData, fromCache: false, cachedAt: null });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Competitor analysis failed" },
      { status: 500 }
    );
  }
}
