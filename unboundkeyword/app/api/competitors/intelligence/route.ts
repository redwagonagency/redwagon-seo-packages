import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getDomainRankOverview,
  getDomainCompetitors,
  getBulkTrafficEstimation,
  getHistoricalBulkTraffic,
  getBacklinkTotalSummary,
  getRankedKeywords,
} from "@/lib/dataforseo/client";
import { getSelectedSiteForUser } from "@/lib/site-context";
import { prisma } from "@/lib/prisma";
import { runWithApiUsageUserContext } from "@/lib/api-usage-context";
import { captureKeywordsToUncategorized } from "@/lib/keyword-capture";
import { logUserSearch } from "@/lib/search-logger";

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
        void logUserSearch(userId, domain, "competitor", {
          fromCache: true,
          competitors: parsed.competitors.length,
        }, {
          siteId: selectedSite?.id ?? null,
          source: "competitor",
          keywords: parsed.competitors.flatMap((row) => row.rankedKeywords.map((kw) => ({ keyword: kw.keyword, volume: kw.searchVolume ?? 0, cpc: kw.cpc ?? null }))),
        });
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
    const [yourOverviewResult, suggestedResult, yourRankedResult] = await runWithApiUsageUserContext(userId, () =>
      Promise.allSettled([
        getDomainRankOverview(domain, location, language),
        needSuggested ? getDomainCompetitors(domain, location, language, 10) : Promise.resolve([]),
        getRankedKeywords(domain, location, language, 300),
      ])
    , { siteId: selectedSite?.id ?? null, useCase: "competitor_intelligence" });

    const yourOverview = yourOverviewResult.status === "fulfilled" ? yourOverviewResult.value : null;
    const suggested = suggestedResult.status === "fulfilled" ? suggestedResult.value : [];
    const yourRankedKeywords: RankedKwItem[] = yourRankedResult.status === "fulfilled" ? yourRankedResult.value : [];
    const suggestedDomains = suggested.map((s) => normalizeDomain(s.domain)).filter(Boolean);

    const chosenCompetitors = Array.from(new Set(
      customCompetitors.length > 0
        ? customCompetitors
        : savedCompetitors.length > 0
          ? savedCompetitors
          : suggestedDomains.slice(0, 8)
    ))
      .filter((candidate) => candidate !== domain)
      .slice(0, 10);

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
    const [bulkTrafficResult, histBulkResult] = await runWithApiUsageUserContext(userId, () =>
      Promise.allSettled([
        getBulkTrafficEstimation(allTargets.map((t) => ({ target: t })), location, language),
        getHistoricalBulkTraffic(allTargets, location, language),
      ])
    , { siteId: selectedSite?.id ?? null, useCase: "competitor_intelligence_traffic" });
    // Pre-fetch ranked keywords for all competitors in parallel
    const competitorRankedResults = await runWithApiUsageUserContext(userId, () =>
      Promise.allSettled(
        chosenCompetitors.map((cd) => getRankedKeywords(cd, location, language, 300))
      )
    , { siteId: selectedSite?.id ?? null, useCase: "competitor_intelligence_ranked" });

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
    const yourRankedMap = new Map<string, RankedKwItem>();
    for (const kw of yourRankedKeywords) {
      yourRankedMap.set(kw.keyword.toLowerCase(), kw);
    }

    const competitorRows: CompetitorRow[] = await Promise.all(
      chosenCompetitors.map(async (compDomain, idx): Promise<CompetitorRow> => {
        const backlinkResult = await runWithApiUsageUserContext(userId, () => getBacklinkTotalSummary(compDomain).catch(() => ({ backlinksTotal: 0, referringDomains: 0, domainRank: 0 })), { siteId: selectedSite?.id ?? null, useCase: "competitor_intelligence_backlinks" });

        const rankedKws: RankedKwItem[] =
          competitorRankedResults[idx]?.status === "fulfilled"
            ? (competitorRankedResults[idx] as PromiseFulfilledResult<RankedKwItem[]>).value
            : [];

        const commonKeywords: CompetitorRow["commonKeywords"] = [];
        const keywordGap: CompetitorRow["keywordGap"] = [];

        for (const kw of rankedKws) {
          const your = yourRankedMap.get(kw.keyword.toLowerCase());
          const yourPosition = your?.position ?? null;
          const competitorPosition = kw.position ?? null;
          const volume = kw.searchVolume ?? null;

          if (your) {
            commonKeywords.push({
              keyword: kw.keyword,
              volume,
              yourPosition,
              competitorPosition,
            });
          }

          const opportunity = yourPosition === null
            ? "missing"
            : competitorPosition !== null && yourPosition > competitorPosition
            ? "weak"
            : yourPosition > 20
            ? "weak"
            : "strong";

          if (opportunity !== "strong") {
            keywordGap.push({
              keyword: kw.keyword,
              volume,
              yourPosition,
              competitorPosition,
              opportunity,
            });
          }
        }

        commonKeywords.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
        keywordGap.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));

        const traffic = bulkTrafficMap.get(compDomain);

        return {
          domain: compDomain,
          commonKeywordsCount: commonKeywords.length,
          commonKeywords: commonKeywords.slice(0, 500),
          keywordGapCount: keywordGap.length,
          keywordGap: keywordGap.slice(0, 500),
          rankedKeywords: rankedKws,
          estimatedTraffic: traffic?.traffic ?? 0,
          backlinks: backlinkResult.backlinksTotal,
          referringDomains: backlinkResult.referringDomains,
          domainRank: backlinkResult.domainRank,
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

    void captureKeywordsToUncategorized({
      userId,
      siteId: selectedSite?.id ?? null,
      source: "competitor",
      rows: [
        { keyword: domain },
        ...yourRankedKeywords.map((kw) => ({ keyword: kw.keyword, volume: kw.searchVolume ?? 0, cpc: kw.cpc ?? null })),
        ...competitorRows.flatMap((row) => [
          { keyword: row.domain },
          ...row.rankedKeywords.map((kw) => ({ keyword: kw.keyword, volume: kw.searchVolume ?? 0, cpc: kw.cpc ?? null })),
          ...row.commonKeywords.map((kw) => ({ keyword: kw.keyword, volume: kw.volume ?? 0 })),
          ...row.keywordGap.map((kw) => ({ keyword: kw.keyword, volume: kw.volume ?? 0 })),
        ]),
      ],
    }).catch(() => {});

    void logUserSearch(userId, domain, "competitor", {
      competitors: competitorRows.length,
      commonKeywords: competitorRows.reduce((sum, row) => sum + row.commonKeywordsCount, 0),
      keywordGap: competitorRows.reduce((sum, row) => sum + row.keywordGapCount, 0),
    }, {
      siteId: selectedSite?.id ?? null,
      source: "competitor",
      keywords: competitorRows.flatMap((row) => row.rankedKeywords.map((kw) => ({ keyword: kw.keyword, volume: kw.searchVolume ?? 0, cpc: kw.cpc ?? null }))),
    });

    return Response.json({ ...responseData, fromCache: false, cachedAt: null });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Competitor analysis failed" },
      { status: 500 }
    );
  }
}
