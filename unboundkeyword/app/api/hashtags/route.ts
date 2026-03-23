/**
 * POST /api/hashtags
 * Hashtag keyword research — finds trending hashtags and keyword ideas
 * using Google Trends, keyword suggestions, and search volume data.
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getGoogleTrendsExplore,
  getKeywordIdeasLabs,
  getKeywordData,
  getBingKeywordsForKeywords,
} from "@/lib/dataforseo/client";

export interface HashtagResult {
  hashtag: string;
  keyword: string;
  volume: number | null;
  cpc: number | null;
  trendsValue: number | null;
  platform: string;
  platformUrl: string;
  difficulty: number | null;
}

export interface HashtagResponse {
  seed: string;
  hashtags: HashtagResult[];
}

// Convert a keyword to hashtag form
function toHashtag(kw: string): string {
  return "#" + kw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const PLATFORMS = ["Google", "Instagram", "TikTok", "Twitter/X", "LinkedIn", "YouTube", "Pinterest", "Facebook"];

const PLATFORM_URLS: Record<string, (tag: string) => string> = {
  "Google": (t) => `https://www.google.com/search?q=%23${encodeURIComponent(t)}`,
  "Instagram": (t) => `https://www.instagram.com/explore/tags/${encodeURIComponent(t)}/`,
  "TikTok": (t) => `https://www.tiktok.com/tag/${encodeURIComponent(t)}`,
  "Twitter/X": (t) => `https://twitter.com/hashtag/${encodeURIComponent(t)}`,
  "LinkedIn": (t) => `https://www.linkedin.com/feed/hashtag/?keywords=${encodeURIComponent(t)}`,
  "YouTube": (t) => `https://www.youtube.com/results?search_query=%23${encodeURIComponent(t)}`,
  "Pinterest": (t) => `https://www.pinterest.com/search/pins/?q=%23${encodeURIComponent(t)}`,
  "Facebook": (t) => `https://www.facebook.com/hashtag/${encodeURIComponent(t)}`,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { keyword?: string; location?: number; language?: string };
  const { keyword, location = 2840, language = "en" } = body;
  if (!keyword?.trim()) return Response.json({ error: "keyword required" }, { status: 400 });

  const seed = keyword.trim();

  const [ideasResult, trendsResult, bingResult] = await Promise.allSettled([
    getKeywordIdeasLabs(seed, location, language, 50),
    getGoogleTrendsExplore([seed], location, language),
    getBingKeywordsForKeywords([seed], location, language),
  ]);

  const ideas = ideasResult.status === "fulfilled" ? ideasResult.value : [];
  const trends = trendsResult.status === "fulfilled" ? trendsResult.value : [];
  const bingKws = bingResult.status === "fulfilled" ? bingResult.value : [];

  // Collect unique keywords from all sources
  const kwSet = new Set<string>();
  for (const i of ideas) if (i.keyword) kwSet.add(i.keyword.toLowerCase().trim());
  for (const b of bingKws) if (b.keyword) kwSet.add(b.keyword.toLowerCase().trim());
  kwSet.add(seed.toLowerCase().trim());

  const allKeywords = [...kwSet].slice(0, 60);

  // Fetch volume/difficulty data
  const volRaw = await getKeywordData(allKeywords.slice(0, 50)).catch(() => null);
  type KwRaw = { tasks?: Array<{ result?: Array<{ items?: Array<Record<string, unknown>> }> }> };
  const volItems = (volRaw as KwRaw)?.tasks?.[0]?.result?.[0]?.items ?? [];
  const volMap = new Map<string, { volume: number | null; cpc: number | null; difficulty: number | null }>();
  for (const item of volItems as Record<string, unknown>[]) {
    const kw = String(item.keyword ?? "").toLowerCase();
    const ki = (item.keyword_info ?? {}) as Record<string, unknown>;
    const kp = (item.keyword_properties ?? {}) as Record<string, unknown>;
    volMap.set(kw, {
      volume: typeof ki.search_volume === "number" ? ki.search_volume : null,
      cpc: typeof ki.cpc === "number" ? ki.cpc : null,
      difficulty: typeof kp.keyword_difficulty === "number" ? kp.keyword_difficulty as number : null,
    });
  }

  const trendsMap = new Map(trends.map((t) => [t.keyword.toLowerCase(), t.value]));

  // Generate hashtag results — one per platform for meaningful keywords
  const hashtags: HashtagResult[] = [];

  // Each hashtag appears once per platform so platform-filter views are always populated
  for (const kw of allKeywords.slice(0, 50)) {
    const vol = volMap.get(kw);
    const trendsValue = trendsMap.get(kw) ?? null;
    for (const platform of PLATFORMS) {
      hashtags.push({
        hashtag: toHashtag(kw),
        keyword: kw,
        volume: vol?.volume ?? null,
        cpc: vol?.cpc ?? null,
        trendsValue,
        platform,
        platformUrl: PLATFORM_URLS[platform]?.(kw.replace(/[^a-z0-9]/g, "")) ?? "",
        difficulty: vol?.difficulty ?? null,
      });
    }
  }

  // Sort by volume desc
  hashtags.sort((a, b) => (b.volume ?? -1) - (a.volume ?? -1));

  return Response.json({ seed, hashtags } satisfies HashtagResponse);
}
