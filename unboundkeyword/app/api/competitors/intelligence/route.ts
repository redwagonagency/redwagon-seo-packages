import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getDomainRankOverview,
  getDomainCompetitors,
  getKeywordGap,
  getKeywordsForSite,
  getBulkSpamScore,
  getBacklinkCompetitors,
  getSerpCompetitors,
} from "@/lib/dataforseo/client";
import { getSelectedSiteForUser } from "@/lib/site-context";

type RequestBody = {
  domain?: string;
  competitorDomain?: string;
  competitorDomains?: string[];
  location?: number;
  language?: string;
  useDefaultCompetitors?: boolean;
};

function normalizeDomain(value: string | undefined): string {
  return (value ?? "")
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .trim()
    .toLowerCase();
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const userId = (session.user as { id: string }).id;
    const selectedSite = await getSelectedSiteForUser(userId);
    const domain = normalizeDomain(body.domain || selectedSite?.domain);
    const competitorDomain = normalizeDomain(body.competitorDomain);
    const customCompetitors = Array.isArray(body.competitorDomains)
      ? body.competitorDomains.map((d) => normalizeDomain(d)).filter(Boolean)
      : [];
    const location = body.location ?? 2840;
    const language = body.language ?? "en";
    const useDefaultCompetitors = Boolean(body.useDefaultCompetitors);

    if (!domain) {
      return Response.json({ error: "domain is required" }, { status: 400 });
    }

    const chosenCompetitors = Array.from(new Set([
      ...customCompetitors,
      ...(competitorDomain ? [competitorDomain] : []),
    ])).slice(0, 5);

    const [yourOverviewResult, suggestedCompetitorsResult, spamScoreResult, backlinkCompetitorsResult, siteKeywordsResult] = await Promise.allSettled([
      getDomainRankOverview(domain, location, language),
      useDefaultCompetitors ? getDomainCompetitors(domain, location, language, 8) : Promise.resolve([]),
      chosenCompetitors.length > 0 ? getBulkSpamScore(chosenCompetitors) : Promise.resolve([]),
      getBacklinkCompetitors(domain, 10),
      getKeywordsForSite(domain, location, language, 20),
    ]);

    const yourOverview = yourOverviewResult.status === "fulfilled" ? yourOverviewResult.value : null;
    const suggestedCompetitors = suggestedCompetitorsResult.status === "fulfilled" ? suggestedCompetitorsResult.value : [];
    const spamScores = spamScoreResult.status === "fulfilled" ? spamScoreResult.value : [];
    const backlinkCompetitors = backlinkCompetitorsResult.status === "fulfilled" ? backlinkCompetitorsResult.value : [];
    const siteKeywords = siteKeywordsResult.status === "fulfilled" ? siteKeywordsResult.value.slice(0, 5).map((k) => k.keyword).filter(Boolean) : [];

    const serpCompetitorsList = siteKeywords.length > 0
      ? await getSerpCompetitors(siteKeywords, location, language).catch(() => [])
      : [];

    const competitorsData = await Promise.all(
      chosenCompetitors.map(async (compDomain) => {
        const [competitorOverviewResult, gapKeywordsResult, competitorKeywordsResult] = await Promise.allSettled([
          getDomainRankOverview(compDomain, location, language),
          getKeywordGap(domain, [compDomain], location, language, 80),
          getKeywordsForSite(compDomain, location, language, 50),
        ]);

        const competitorOverview = competitorOverviewResult.status === "fulfilled" ? competitorOverviewResult.value : null;
        const gapKeywords = gapKeywordsResult.status === "fulfilled"
          ? gapKeywordsResult.value.map((item) => ({
              keyword: item.keyword,
              volume: item.volume,
              yourPosition: item.yourPosition,
              competitorPosition: item.competitorPositions[0]?.position ?? null,
              opportunity: item.opportunity,
            }))
          : [];
        const competitorTargetKeywords = competitorKeywordsResult.status === "fulfilled" ? competitorKeywordsResult.value : [];

        return {
          domain: compDomain,
          competitorOverview,
          gapKeywords,
          competitorTargetKeywords,
        };
      })
    );

    return Response.json({
      domain,
      competitorDomains: chosenCompetitors,
      yourOverview,
      suggestedCompetitors,
      spamScores,
      backlinkCompetitors,
      serpCompetitors: serpCompetitorsList,
      competitorsData,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Competitor intelligence failed" },
      { status: 500 }
    );
  }
}