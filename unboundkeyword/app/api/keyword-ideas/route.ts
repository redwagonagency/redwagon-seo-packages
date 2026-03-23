/**
 * POST /api/keyword-ideas
 * Multi-source keyword ideas: Google Labs, Bing, Google Ads, Google Trends, Amazon
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { logUserSearch } from "@/lib/search-logger";
import { runWithApiUsageUserContext } from "@/lib/api-usage-context";
import {
  getKeywordIdeasLabs,
  getRelatedKeywords,
  getKeywordSuggestions,
  getAmazonRelatedKeywords,
  getBingKeywordsForKeywords,
  getBingKeywordsForSite,
  getGoogleAdsKeywordsForSite,
  getGoogleTrendsExplore,
  getBingKeywordPerformanceBatch,
} from "@/lib/dataforseo/client";
import { getSelectedSiteForUser } from "@/lib/site-context";

export interface IdeaKeyword {
  keyword: string;
  volume: number;
  bingVolume?: number | null;
  cpc: number | null;
  difficulty: number | null;
  intent: string | null;
  trendsValue?: number | null;
  source: "google" | "bing" | "amazon" | "google_ads" | "google_trends" | "related";
}

export interface KeywordIdeasResponse {
  keywords: IdeaKeyword[];
  trendsData: { keyword: string; value: number }[];
  siteName: string | null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    keyword?: string;
    source?: "google" | "bing" | "amazon" | "all";
    location?: number;
    language?: string;
    limit?: number;
  };

  const { keyword, source = "all", location = 2840, language = "en", limit = 100 } = body;
  if (!keyword?.trim()) {
    return Response.json({ error: "keyword required" }, { status: 400 });
  }

  const seed = keyword.trim();
  const userId = (session.user as { id: string }).id;
  const selectedSite = await getSelectedSiteForUser(userId).catch(() => null);
  const siteDomain = selectedSite?.domain ?? "";

  try {
    const [
      labsResult,
      bingKFKResult,
      bingKFSResult,
      googleAdsSiteResult,
      trendsResult,
      amazonResult,
      bingPerfResult,
      relatedResult,
      suggestionsResult,
    ] = await runWithApiUsageUserContext(userId, () =>
      Promise.allSettled([
        // Google Labs keyword ideas
        getKeywordIdeasLabs(seed, location, language, Math.ceil(limit / 2)).catch(() => []),
        // Bing keywords for keywords
        getBingKeywordsForKeywords([seed], location, language).catch(() => []),
        // Bing keywords for site (only if we have a domain)
        siteDomain
          ? getBingKeywordsForSite(siteDomain, location, language, 30).catch(() => [])
          : Promise.resolve([]),
        // Google Ads keywords for site
        siteDomain
          ? getGoogleAdsKeywordsForSite(siteDomain, location, language, 30).catch(() => [])
          : Promise.resolve([]),
        // Google Trends explore
        getGoogleTrendsExplore([seed], location, language).catch(() => []),
        // Amazon
        getAmazonRelatedKeywords(seed, location, language, 1, 30).catch(() => []),
        // Placeholder — Bing performance will run after collecting unique keywords
        Promise.resolve([] as { keyword: string; searchVolume: number; cpc: number | null; competition: number | null }[]),
        // Related keywords (DataForSEO Labs)
        getRelatedKeywords(seed, location, language, 50).catch(() => []),
        // Keyword suggestions (DataForSEO Labs)
        getKeywordSuggestions(seed, location, language, 30).catch(() => []),
      ])
    , { siteId: selectedSite?.id ?? null, useCase: "keyword_ideas" });

    const labsItems = labsResult.status === "fulfilled" ? labsResult.value : [];
    const bingKFK = bingKFKResult.status === "fulfilled" ? bingKFKResult.value : [];
    const bingKFS = bingKFSResult.status === "fulfilled" ? bingKFSResult.value : [];
    const googleAdsSite = googleAdsSiteResult.status === "fulfilled" ? googleAdsSiteResult.value : [];
    const trends = trendsResult.status === "fulfilled" ? trendsResult.value : [];
    const amazonItems = amazonResult.status === "fulfilled" ? amazonResult.value : [];
    const relatedItems = relatedResult.status === "fulfilled" ? relatedResult.value : [];
    const suggestionItems = suggestionsResult.status === "fulfilled" ? suggestionsResult.value : [];

    // Build merged keyword map — Google as primary source
    const kwMap = new Map<string, IdeaKeyword>();

    for (const item of labsItems) {
      if (!item.keyword) continue;
      kwMap.set(item.keyword.toLowerCase(), {
        keyword: item.keyword,
        volume: item.searchVolume,
        cpc: item.cpc,
        difficulty: null,
        intent: item.intent,
        source: "google",
      });
    }

    // Bing keywords for keywords — add if not already present, else enrich bingVolume
    for (const item of bingKFK) {
      const k = String(item.keyword ?? "").toLowerCase();
      if (!k) continue;
      const existing = kwMap.get(k);
      if (existing) {
        existing.bingVolume = item.searchVolume ?? 0;
      } else {
        kwMap.set(k, {
          keyword: item.keyword,
          volume: item.searchVolume,
          bingVolume: item.searchVolume,
          cpc: item.cpc ?? null,
          difficulty: null,
          intent: null,
          source: "bing",
        });
      }
    }

    // Bing keywords for site
    for (const item of bingKFS) {
      const k = String(item.keyword ?? "").toLowerCase();
      if (!k) continue;
      if (!kwMap.has(k)) {
        kwMap.set(k, {
          keyword: item.keyword,
          volume: item.searchVolume,
          bingVolume: item.searchVolume,
          cpc: item.cpc ?? null,
          difficulty: null,
          intent: null,
          source: "bing",
        });
      }
    }

    // Google Ads site keywords
    for (const item of googleAdsSite) {
      const k = item.keyword.toLowerCase();
      if (!kwMap.has(k)) {
        kwMap.set(k, {
          keyword: item.keyword,
          volume: item.searchVolume,
          cpc: item.cpc,
          difficulty: null,
          intent: null,
          source: "google_ads",
        });
      }
    }

    // Google Trends
    const trendsMap = new Map(trends.map((t) => [t.keyword.toLowerCase(), t.value]));
    for (const item of trends) {
      const k = item.keyword.toLowerCase();
      const existing = kwMap.get(k);
      if (existing) {
        existing.trendsValue = item.value;
      } else {
        kwMap.set(k, {
          keyword: item.keyword,
          volume: 0,
          cpc: null,
          difficulty: null,
          intent: null,
          trendsValue: item.value,
          source: "google_trends",
        });
      }
    }

    // Amazon
    for (const item of amazonItems) {
      const k = item.keyword.toLowerCase();
      if (!kwMap.has(k)) {
        kwMap.set(k, {
          keyword: item.keyword,
          volume: item.searchVolume,
          cpc: item.cpc ?? null,
          difficulty: null,
          intent: null,
          source: "amazon",
        });
      }
    }

    // Related keywords from DataForSEO Labs
    for (const item of relatedItems) {
      const k = item.keyword.toLowerCase();
      if (!k) continue;
      const existing = kwMap.get(k);
      if (existing) {
        // Enrich volume if we only had a rough estimate
        if (existing.volume === 0 && item.searchVolume > 0) existing.volume = item.searchVolume;
      } else {
        kwMap.set(k, {
          keyword: item.keyword,
          volume: item.searchVolume,
          cpc: item.cpc ?? null,
          difficulty: null,
          intent: null,
          source: "related",
        });
      }
    }

    // Keyword suggestions (may include difficulty scores)
    for (const item of suggestionItems) {
      const k = item.keyword.toLowerCase();
      if (!k) continue;
      const existing = kwMap.get(k);
      if (existing) {
        if (item.difficulty !== null) existing.difficulty = item.difficulty;
      } else {
        kwMap.set(k, {
          keyword: item.keyword,
          volume: item.searchVolume,
          cpc: item.cpc ?? null,
          difficulty: item.difficulty,
          intent: null,
          source: "related",
        });
      }
    }

    // Fetch Bing performance for top Google keywords that don't have bingVolume yet
    const topKeywords = [...kwMap.values()]
      .filter((k) => k.source === "google" && !k.bingVolume)
      .slice(0, 20)
      .map((k) => k.keyword);

    if (topKeywords.length > 0) {
      const bingPerf = await runWithApiUsageUserContext(userId, () => getBingKeywordPerformanceBatch(topKeywords, location, language).catch(() => []), { siteId: selectedSite?.id ?? null, useCase: "keyword_ideas_bing_performance" });
      for (const bp of bingPerf) {
        const k = bp.keyword.toLowerCase();
        const existing = kwMap.get(k);
        if (existing) existing.bingVolume = bp.searchVolume;
      }
    }

    let keywords = [...kwMap.values()].sort((a, b) => b.volume - a.volume);

    if (source === "google") keywords = keywords.filter((k) => k.source === "google" || k.source === "google_ads" || k.source === "google_trends");
    else if (source === "bing") keywords = keywords.filter((k) => k.source === "bing");
    else if (source === "amazon") keywords = keywords.filter((k) => k.source === "amazon");

    keywords = keywords.slice(0, limit);

    void logUserSearch(session.user.id, keyword as string, "keyword", { results: keywords.length }, {
      siteId: selectedSite?.id ?? null,
      source: "keyword",
      keywords: keywords.map((item) => ({
        keyword: item.keyword,
        volume: item.volume,
        cpc: item.cpc,
        difficulty: item.difficulty,
      })),
    });

    return Response.json({
      keywords,
      trendsData: trends,
      siteName: siteDomain || null,
    } satisfies KeywordIdeasResponse);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
