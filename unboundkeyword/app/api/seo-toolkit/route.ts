/**
 * POST /api/seo-toolkit
 *
 * Unified single-query SEO toolkit. Accepts a keyword or domain and runs
 * the most useful DataForSEO lookups in parallel, returning a rich payload
 * that the dashboard toolkit UI consumes.
 *
 * mode "keyword"  → overview, SERP features, AI summary, autocomplete ideas
 * mode "domain"   → rank overview, backlink summary, keyword gap basics
 * mode "page"     → instant on-page audit
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getKeywordOverview,
  getSerpFeatures,
  getAiSummary,
  getDomainRankOverview,
  getBacklinkProfile,
  analyzePageInstant,
  getKeywordIdeas,
} from "@/lib/dataforseo/client";

export type ToolkitMode = "keyword" | "domain" | "page";

export type KeywordOverviewItem = {
  keyword: string;
  volume: number | null;
  cpc: number | null;
  competition: number | null;
  difficulty: number | null;
  intent: string | null;
};

export type AiInsight = {
  hasSummary: boolean;
  summaryText: string | null;
  brandMentioned: boolean;
  sources: string[];
};

export type SerpFeaturesMap = {
  hasFeaturedSnippet: boolean;
  hasMapPack: boolean;
  hasShopping: boolean;
  hasVideoCarousel: boolean;
  hasPeopleAlsoAsk: boolean;
  hasAiOverview: boolean;
};

export type ToolkitResult = {
  mode: ToolkitMode;
  query: string;
  timestamp: string;
  keyword?: {
    overview: KeywordOverviewItem | null;
    serpFeatures: SerpFeaturesMap | null;
    aiInsight: AiInsight | null;
    relatedIdeas: Array<{ keyword: string; volume: number; cpc: number | null }>;
  };
  domain?: {
    rankOverview: Awaited<ReturnType<typeof getDomainRankOverview>> | null;
    backlinkProfile: Awaited<ReturnType<typeof getBacklinkProfile>> | null;
  };
  page?: Awaited<ReturnType<typeof analyzePageInstant>> | null;
  error?: string;
};

function detectMode(query: string): ToolkitMode {
  if (/^https?:\/\//i.test(query) && query.includes("/")) return "page";
  if (/^[a-z0-9-]+\.[a-z]{2,}$/i.test(query.replace(/^www\./i, ""))) return "domain";
  return "keyword";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user && "id" in session.user ? (session.user.id as string | undefined) : undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    query?: string;
    mode?: ToolkitMode;
    locationCode?: number;
    languageCode?: string;
  };

  const query = body.query?.trim();
  if (!query) return NextResponse.json({ error: "query is required" }, { status: 400 });

  const mode: ToolkitMode = body.mode ?? detectMode(query);
  const locationCode = body.locationCode ?? 2840;
  const languageCode = body.languageCode ?? "en";

  const timestamp = new Date().toISOString();

  try {
    if (mode === "keyword") {
      const [overviewArr, serpFeatures, aiInsight, ideasArr] = await Promise.allSettled([
        getKeywordOverview([query], locationCode, languageCode),
        getSerpFeatures(query, "", locationCode),
        getAiSummary(query, "", locationCode),
        getKeywordIdeas([query], locationCode, languageCode, 20),
      ]);

      const overviewRaw = overviewArr.status === "fulfilled" ? (overviewArr.value[0] ?? null) : null;
      const aiRaw = aiInsight.status === "fulfilled" ? aiInsight.value : null;

      const result: ToolkitResult = {
        mode,
        query,
        timestamp,
        keyword: {
          overview: overviewRaw ? {
            keyword: overviewRaw.keyword,
            volume: overviewRaw.volume,
            cpc: overviewRaw.cpc,
            competition: overviewRaw.competition,
            difficulty: overviewRaw.difficulty,
            intent: overviewRaw.intent,
          } : null,
          serpFeatures: serpFeatures.status === "fulfilled" ? {
            hasFeaturedSnippet: serpFeatures.value.hasFeaturedSnippet,
            hasMapPack: serpFeatures.value.hasMapPack,
            hasShopping: serpFeatures.value.hasShopping,
            hasVideoCarousel: serpFeatures.value.hasVideoCarousel,
            hasPeopleAlsoAsk: serpFeatures.value.hasPeopleAlsoAsk,
            hasAiOverview: serpFeatures.value.hasAiOverview,
          } : null,
          aiInsight: aiRaw ? {
            hasSummary: aiRaw.hasSummary,
            summaryText: aiRaw.summaryText,
            brandMentioned: aiRaw.brandMentioned,
            sources: aiRaw.sources,
          } : null,
          relatedIdeas: ideasArr.status === "fulfilled"
            ? ideasArr.value.slice(0, 15).map((i) => ({ keyword: i.keyword, volume: i.volume ?? 0, cpc: i.cpc ?? null }))
            : [],
        },
      };
      return NextResponse.json(result);
    }

    if (mode === "domain") {
      const domain = query.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
      const [rankOverview, backlinkProfile] = await Promise.allSettled([
        getDomainRankOverview(domain, locationCode, languageCode),
        getBacklinkProfile(domain, 50),
      ]);

      const result: ToolkitResult = {
        mode,
        query,
        timestamp,
        domain: {
          rankOverview: rankOverview.status === "fulfilled" ? rankOverview.value : null,
          backlinkProfile: backlinkProfile.status === "fulfilled" ? backlinkProfile.value : null,
        },
      };
      return NextResponse.json(result);
    }

    if (mode === "page") {
      const pageAudit = await analyzePageInstant(query).catch(() => null);
      const result: ToolkitResult = {
        mode,
        query,
        timestamp,
        page: pageAudit,
      };
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
