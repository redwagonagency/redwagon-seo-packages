import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getDomainRankOverview,
  getDomainCompetitors,
  getHistoricalRankOverview,
  getKeywordGap,
  getKeywordsForSite,
  getRelevantPages,
  getRankedKeywords,
  getBulkTrafficEstimation,
  getPageIntersection,
  getHistoricalBulkTraffic,
} from "@/lib/dataforseo/client";
import { getSelectedSiteForUser } from "@/lib/site-context";

function normalizeDomain(value: string | undefined) {
  return (value ?? "")
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .trim()
    .toLowerCase();
}

type RequestBody = {
  domain?: string;
  location?: number;
  language?: string;
  competitorDomain?: string;
  competitorDomains?: string[];
  useDefaultCompetitors?: boolean;
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = (await req.json()) as RequestBody;

  const selected = await getSelectedSiteForUser(userId);
  const domain = normalizeDomain(body.domain || selected?.domain);
  const location = body.location ?? 2840;
  const language = body.language ?? "en";
  const competitorDomain = normalizeDomain(body.competitorDomain);
  const customCompetitors = Array.isArray(body.competitorDomains)
    ? body.competitorDomains.map((d) => normalizeDomain(d)).filter(Boolean)
    : [];
  const useDefaultCompetitors = Boolean(body.useDefaultCompetitors);

  if (!domain) {
    return Response.json({
      domain: "",
      competitorDomain: null,
      overview: null,
      competitors: [],
      history: [],
      keywords: [],
      pages: [],
      competitorOverview: null,
      gapKeywords: [],
      requiresDomain: true,
      message: "Add a domain or select a site to run traffic analysis.",
    });
  }

  const [overviewResult, defaultCompetitorsResult, historyResult, keywordsResult, pagesResult, rankedKwResult, bulkTrafficResult, historicalBulkResult] = await Promise.allSettled([
    getDomainRankOverview(domain, location, language),
    getDomainCompetitors(domain, location, language, 8),
    getHistoricalRankOverview(domain, location, language),
    getKeywordsForSite(domain, location, language, 120),
    getRelevantPages(domain, location, language, 25),
    getRankedKeywords(domain, location, language, 50),
    getBulkTrafficEstimation([{ target: domain }], location, language),
    getHistoricalBulkTraffic([domain], location, language),
  ]);

  const defaultCompetitors = defaultCompetitorsResult.status === "fulfilled" ? defaultCompetitorsResult.value : [];
  const chosenCompetitors = Array.from(
    new Set([
      ...customCompetitors,
      ...(competitorDomain ? [competitorDomain] : []),
      ...(useDefaultCompetitors ? defaultCompetitors.map((c) => normalizeDomain(c.domain)).filter(Boolean) : []),
    ])
  ).slice(0, 5);

  const pageIntersectionResult = chosenCompetitors.length > 0
    ? await getPageIntersection(domain, chosenCompetitors[0]!, location, language, 30).catch(() => [])
    : [];

  const competitorsData = await Promise.all(
    chosenCompetitors.map(async (compDomain) => {
      const [compOverviewResult, gapResult, compKeywordsResult] = await Promise.allSettled([
        getDomainRankOverview(compDomain, location, language),
        getKeywordGap(domain, [compDomain], location, language, 80),
        getKeywordsForSite(compDomain, location, language, 50),
      ]);

      const competitorOverview = compOverviewResult.status === "fulfilled" ? compOverviewResult.value : null;
      const gapKeywords = gapResult.status === "fulfilled"
        ? gapResult.value.map((item) => ({
            keyword: item.keyword,
            volume: item.volume,
            yourPosition: item.yourPosition,
            competitorPosition: item.competitorPositions[0]?.position ?? null,
            opportunity: item.opportunity,
          }))
        : [];
      const competitorTargetKeywords = compKeywordsResult.status === "fulfilled" ? compKeywordsResult.value : [];

      return {
        domain: compDomain,
        competitorOverview,
        gapKeywords,
        competitorTargetKeywords,
      };
    })
  );

  const competitorOverview = competitorsData[0]?.competitorOverview ?? null;
  const gapKeywords = competitorsData[0]?.gapKeywords ?? [];

  return Response.json({
    domain,
    competitorDomain: chosenCompetitors[0] ?? null,
    competitorDomains: chosenCompetitors,
    yourOverview: overviewResult.status === "fulfilled" ? overviewResult.value : null,
    suggestedCompetitors: useDefaultCompetitors ? defaultCompetitors : [],
    competitorsData,
    overview: overviewResult.status === "fulfilled" ? overviewResult.value : null,
    competitors: useDefaultCompetitors ? defaultCompetitors : [],
    history: historyResult.status === "fulfilled" ? historyResult.value : [],
    keywords: keywordsResult.status === "fulfilled" ? keywordsResult.value : [],
    pages: pagesResult.status === "fulfilled" ? pagesResult.value : [],
    competitorOverview,
    gapKeywords,
    rankedKeywords: rankedKwResult.status === "fulfilled" ? rankedKwResult.value : [],
    bulkTraffic: bulkTrafficResult.status === "fulfilled" ? bulkTrafficResult.value.map((b) => ({
      target: b.target,
      organicTraffic: b.traffic,
      paidTraffic: 0,
      etv: b.organicEtv,
    })) : [],
    historicalBulkTraffic: historicalBulkResult.status === "fulfilled"
      ? (historicalBulkResult.value[0]?.history ?? []).map((h) => ({ date: h.date, organicTraffic: h.traffic }))
      : [],
    pageIntersection: pageIntersectionResult,
  });
}
