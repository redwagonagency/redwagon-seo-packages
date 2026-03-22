import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getDomainRankOverview,
  getDomainCompetitors,
  getHistoricalRankOverview,
  getKeywordsForSite,
  getRelevantPages,
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

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = (await req.json()) as {
    domain?: string;
    location?: number;
    language?: string;
    competitorDomain?: string;
  };

  const selected = await getSelectedSiteForUser(userId);
  const domain = normalizeDomain(body.domain || selected?.domain);
  const location = body.location ?? 2840;
  const language = body.language ?? "en";
  const competitorDomain = normalizeDomain(body.competitorDomain);

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

  const [overviewResult, competitorsResult, historyResult, keywordsResult, pagesResult] = await Promise.allSettled([
    getDomainRankOverview(domain, location, language),
    getDomainCompetitors(domain, location, language, 8),
    getHistoricalRankOverview(domain, location, language),
    getKeywordsForSite(domain, location, language, 120),
    getRelevantPages(domain, location, language, 25),
  ]);

  let competitorOverview = null;
  let gapKeywords: unknown[] = [];

  if (competitorDomain) {
    const [co] = await Promise.allSettled([
      getDomainRankOverview(competitorDomain, location, language),
    ]);
    competitorOverview = co.status === "fulfilled" ? co.value : null;
    gapKeywords = [];
  }

  return Response.json({
    domain,
    competitorDomain: competitorDomain || null,
    overview: overviewResult.status === "fulfilled" ? overviewResult.value : null,
    competitors: competitorsResult.status === "fulfilled" ? competitorsResult.value : [],
    history: historyResult.status === "fulfilled" ? historyResult.value : [],
    keywords: keywordsResult.status === "fulfilled" ? keywordsResult.value : [],
    pages: pagesResult.status === "fulfilled" ? pagesResult.value : [],
    competitorOverview,
    gapKeywords,
  });
}
