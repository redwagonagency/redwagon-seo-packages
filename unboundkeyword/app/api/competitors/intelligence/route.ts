import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getDomainCompetitors,
  getDomainRankOverview,
  getKeywordGap,
  getKeywordsForSite,
} from "@/lib/dataforseo/client";

type RequestBody = {
  domain?: string;
  competitorDomain?: string;
  location?: number;
  language?: string;
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
    const domain = normalizeDomain(body.domain);
    const competitorDomain = normalizeDomain(body.competitorDomain);
    const location = body.location ?? 2840;
    const language = body.language ?? "en";

    if (!domain) {
      return Response.json({ error: "domain is required" }, { status: 400 });
    }

    const [yourOverviewResult, suggestedCompetitorsResult] = await Promise.allSettled([
      getDomainRankOverview(domain, location, language),
      getDomainCompetitors(domain, location, language, 8),
    ]);

    const yourOverview = yourOverviewResult.status === "fulfilled" ? yourOverviewResult.value : null;
    const suggestedCompetitors = suggestedCompetitorsResult.status === "fulfilled" ? suggestedCompetitorsResult.value : [];

    const chosenCompetitor = competitorDomain || suggestedCompetitors[0]?.domain || "";

    let competitorOverview = null;
    let gapKeywords: Array<{
      keyword: string;
      volume: number | null;
      yourPosition: number | null;
      competitorPosition: number | null;
      opportunity: string;
    }> = [];
    let competitorTargetKeywords: Array<{
      keyword: string;
      url: string | null;
      position: number;
      searchVolume: number;
      traffic: number;
    }> = [];

    if (chosenCompetitor) {
      const [competitorOverviewResult, gapKeywordsResult, competitorKeywordsResult] = await Promise.allSettled([
        getDomainRankOverview(chosenCompetitor, location, language),
        getKeywordGap(domain, [chosenCompetitor], location, language, 60),
        getKeywordsForSite(chosenCompetitor, location, language, 40),
      ]);

      competitorOverview = competitorOverviewResult.status === "fulfilled" ? competitorOverviewResult.value : null;
      gapKeywords = gapKeywordsResult.status === "fulfilled"
        ? gapKeywordsResult.value.map((item) => ({
            keyword: item.keyword,
            volume: item.volume,
            yourPosition: item.yourPosition,
            competitorPosition: item.competitorPositions[0]?.position ?? null,
            opportunity: item.opportunity,
          }))
        : [];
      competitorTargetKeywords = competitorKeywordsResult.status === "fulfilled" ? competitorKeywordsResult.value : [];
    }

    return Response.json({
      domain,
      competitorDomain: chosenCompetitor || null,
      yourOverview,
      suggestedCompetitors,
      competitorOverview,
      gapKeywords,
      competitorTargetKeywords,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Competitor intelligence failed" },
      { status: 500 }
    );
  }
}