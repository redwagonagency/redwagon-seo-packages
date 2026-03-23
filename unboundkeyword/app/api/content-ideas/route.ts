/**
 * POST /api/content-ideas
 * Real content ideas using Google keyword_ideas, phrase_trends, and SERP data
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSelectedSiteIdForUser } from "@/lib/site-context";
import { runWithApiUsageUserContext } from "@/lib/api-usage-context";
import { logUserSearch } from "@/lib/search-logger";
import {
  getKeywordIdeasLabs,
  getContentAnalysisPhraseTrendsLive,
  getSerpLiveData,
  getSearchIntent,
} from "@/lib/dataforseo/client";

export interface ContentIdea {
  keyword: string;
  volume: number;
  cpc: number | null;
  intent: string | null;
  trending: boolean;
  trendDirection: "up" | "down" | "flat";
  topUrl: string | null;
  topDomain: string | null;
  contentType: string | null;
}

export interface ContentIdeasResponse {
  keyword: string;
  ideas: ContentIdea[];
  topPages: { url: string; domain: string; title: string }[];
}

function detectContentType(url: string | null, title: string | null): string | null {
  if (!url && !title) return null;
  const t = (title ?? url ?? "").toLowerCase();
  if (t.includes("how to") || t.includes("guide") || t.includes("tutorial")) return "How-To Guide";
  if (t.includes("review") || t.includes("vs ") || t.includes("compare")) return "Review / Comparison";
  if (t.includes("best ") || t.includes("top ") || t.includes("list of")) return "Listicle / Best Of";
  if (t.includes("what is") || t.includes("definition") || t.includes("meaning")) return "Definition / What Is";
  if (t.includes("checklist") || t.includes("template") || t.includes("tool")) return "Tool / Template";
  if (t.includes("case study") || t.includes("example")) return "Case Study";
  return "Article";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = (await req.json()) as {
    keyword?: string;
    location?: number;
    language?: string;
    limit?: number;
  };

  const { keyword, location = 2840, language = "en", limit = 60 } = body;
  if (!keyword?.trim()) return Response.json({ error: "keyword required" }, { status: 400 });

  const seed = keyword.trim();
  const selectedSiteId = await getSelectedSiteIdForUser(userId).catch(() => null);

  const [ideasResult, trendsResult, serpResult] = await runWithApiUsageUserContext(userId, () =>
    Promise.allSettled([
      getKeywordIdeasLabs(seed, location, language, limit),
      getContentAnalysisPhraseTrendsLive(seed),
      getSerpLiveData(seed, location, language, 10),
    ])
  , { siteId: selectedSiteId, useCase: "content_ideas" });

  const ideas = ideasResult.status === "fulfilled" ? ideasResult.value : [];
  const trendsRaw = trendsResult.status === "fulfilled" ? trendsResult.value : { items: [] };
  const serpData = serpResult.status === "fulfilled" ? serpResult.value : { organic: [], paa: [] };
  const topIdeaKeywords = ideas.slice(0, 50).map((idea) => idea.keyword).filter(Boolean);
  const intentData = topIdeaKeywords.length > 0
    ? await runWithApiUsageUserContext(userId, () => getSearchIntent(topIdeaKeywords, location, language).catch(() => []), { siteId: selectedSiteId, useCase: "content_ideas_intent" })
    : [];

  // Build trend direction map from phrase trends (last 4 periods)
  const trendItems = ((trendsRaw as { items?: { date: string; impressions: number }[] }).items ?? []).slice(-8);
  const half = Math.floor(trendItems.length / 2);
  const earlyAvg = half > 0 ? trendItems.slice(0, half).reduce((s, i) => s + i.impressions, 0) / half : 0;
  const lateAvg = half > 0 ? trendItems.slice(half).reduce((s, i) => s + i.impressions, 0) / half : 0;
  const trendDirection: "up" | "down" | "flat" =
    lateAvg > earlyAvg * 1.1 ? "up" : lateAvg < earlyAvg * 0.9 ? "down" : "flat";

  // SERP top pages
  const topPages = serpData.organic.slice(0, 10).map((r) => ({
    url: r.url,
    domain: r.domain ?? r.url.split("/")[2] ?? "",
    title: r.title ?? r.url,
  }));

  // Build intent map
  const intentMap = new Map<string, string>();
  for (const i of intentData) {
    if (i.keyword) intentMap.set(i.keyword.toLowerCase(), i.intent ?? "");
  }

  // Map SERP top URL for each idea keyword (first 10 keywords get SERP top URL heuristic)
  const serpTopByKw = new Map<string, { url: string; domain: string }>();
  for (const r of serpData.organic) {
    const kw = seed.toLowerCase();
    if (!serpTopByKw.has(kw)) serpTopByKw.set(kw, { url: r.url, domain: r.domain ?? "" });
  }

  const contentIdeas: ContentIdea[] = ideas.map((item) => {
    const top = serpTopByKw.get(seed.toLowerCase()) ?? null;
    const title = top ? top.url.split("/").pop()?.replace(/-/g, " ") ?? null : null;
    return {
      keyword: item.keyword,
      volume: item.searchVolume,
      cpc: item.cpc,
      intent: intentMap.get(item.keyword.toLowerCase()) ?? item.intent,
      trending: trendDirection === "up",
      trendDirection,
      topUrl: top?.url ?? null,
      topDomain: top?.domain ?? null,
      contentType: detectContentType(top?.url ?? null, title),
    };
  }).sort((a, b) => b.volume - a.volume);

  void logUserSearch(userId, seed, "content", {
    results: contentIdeas.length,
    pages: topPages.length,
  }, {
    siteId: selectedSiteId,
    source: "content",
    keywords: contentIdeas.map((item) => ({ keyword: item.keyword, volume: item.volume, cpc: item.cpc })),
  });

  return Response.json({ keyword: seed, ideas: contentIdeas, topPages } satisfies ContentIdeasResponse);
}
