/**
 * POST /api/keywords/research
 * Keyword research — overview, magic tool, competitor gap
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getKeywordOverview,
  getKeywordIdeasLabs,
  getKeywordGap,
  getSearchIntent,
  type KeywordMetric,
  type KeywordIdeaItem,
} from "@/lib/dataforseo/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    keyword?: string;
    mode: "overview" | "magic" | "gap";
    domain1?: string;
    domain2?: string;
    location?: number;
    language?: string;
  };

  const { keyword, mode, domain1, domain2, location = 2840, language = "en" } = body;

  try {
    if (mode === "gap") {
      if (!domain1 || !domain2) {
        return Response.json({ error: "domain1 and domain2 required for gap mode" }, { status: 400 });
      }
      const results = await getKeywordGap(domain1, [domain2], location, language, 100);
      const keywords = results.map((r) => ({
        keyword: r.keyword,
        volume: r.volume,
        difficulty: null as null,
        cpc: null as null,
      }));
      return Response.json({ keywords });
    }

    if (!keyword || typeof keyword !== "string") {
      return Response.json({ error: "keyword required" }, { status: 400 });
    }

    let rawResults: KeywordMetric[] | KeywordIdeaItem[];
    if (mode === "magic") {
      rawResults = await getKeywordIdeasLabs(keyword, location, language, 100);
    } else {
      rawResults = await getKeywordOverview([keyword], location, language);
    }

    // Enrich with search intent for magic/overview
    const kwStrings = rawResults.map((r) => r.keyword).filter(Boolean).slice(0, 50);
    const intentData = await getSearchIntent(kwStrings, location, language).catch(() => []);
    const intentMap: Record<string, string> = {};
    for (const item of intentData) {
      if (item.keyword) intentMap[item.keyword.toLowerCase()] = item.intent;
    }

    const keywords = rawResults.map((r) => {
      const base = {
        keyword: r.keyword,
        volume: "volume" in r ? r.volume : ("searchVolume" in r ? (r as { searchVolume: number }).searchVolume : null),
        difficulty: "difficulty" in r ? r.difficulty : null,
        cpc: "cpc" in r ? r.cpc : null,
        intent: intentMap[r.keyword.toLowerCase()] ?? ("intent" in r ? r.intent : null),
      };
      return base;
    });

    return Response.json({ keywords });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Research failed" },
      { status: 500 }
    );
  }
}
