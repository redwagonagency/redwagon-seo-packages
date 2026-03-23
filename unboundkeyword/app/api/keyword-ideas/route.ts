/**
 * POST /api/keyword-ideas
 * Multi-source keyword ideas: Google (generic + Labs) and Amazon, with demographics.
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getKeywordIdeasGeneric,
  getKeywordIdeasLabs,
  getAmazonRelatedKeywords,
  getDFSTrendsDemography,
} from "@/lib/dataforseo/client";

export interface IdeaKeyword {
  keyword: string;
  volume: number;
  cpc: number | null;
  difficulty: number | null;
  intent: string | null;
  source: "google" | "amazon";
}

export interface DemographicsData {
  male: number | null;
  female: number | null;
  ageGroups: { label: string; index: number }[];
}

export interface KeywordIdeasResponse {
  keywords: IdeaKeyword[];
  demographics: DemographicsData | null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    keyword?: string;
    source?: "google" | "amazon" | "both";
    location?: number;
    language?: string;
    limit?: number;
  };

  const { keyword, source = "google", location = 2840, language = "en", limit = 100 } = body;

  if (!keyword?.trim()) {
    return Response.json({ error: "keyword required" }, { status: 400 });
  }

  const seed = keyword.trim();

  try {
    // Run data fetches in parallel based on source
    const [genericResults, labsResults, amazonResults, demoRaw] = await Promise.all([
      // Generic engine-agnostic endpoint (always run for google/both)
      source !== "amazon"
        ? getKeywordIdeasGeneric(seed, location, language, Math.ceil(limit / 2)).catch(() => [])
        : Promise.resolve([]),
      // Google Labs endpoint (always run for google/both)
      source !== "amazon"
        ? getKeywordIdeasLabs(seed, location, language, Math.ceil(limit / 2)).catch(() => [])
        : Promise.resolve([]),
      // Amazon related keywords
      source !== "google"
        ? getAmazonRelatedKeywords(seed, location, language, 1, limit).catch(() => [])
        : Promise.resolve([]),
      // Demographics (first keyword as seed)
      getDFSTrendsDemography([seed], location).catch(() => null),
    ]);

    // Merge Google results (generic + labs), deduplicate by keyword
    const googleMap = new Map<string, IdeaKeyword>();
    for (const item of genericResults) {
      if (!item.keyword) continue;
      googleMap.set(item.keyword.toLowerCase(), {
        keyword: item.keyword,
        volume: item.searchVolume,
        cpc: item.cpc,
        difficulty: item.difficulty,
        intent: item.intent,
        source: "google",
      });
    }
    // Labs results may fill in gaps or override (they include seasonality/intent)
    for (const item of labsResults) {
      if (!item.keyword) continue;
      const key = item.keyword.toLowerCase();
      if (!googleMap.has(key)) {
        googleMap.set(key, {
          keyword: item.keyword,
          volume: item.searchVolume,
          cpc: item.cpc,
          difficulty: null,
          intent: item.intent,
          source: "google",
        });
      }
    }

    const googleKeywords: IdeaKeyword[] = [...googleMap.values()]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);

    const amazonKeywords: IdeaKeyword[] = amazonResults.map((item) => ({
      keyword: item.keyword,
      volume: item.searchVolume,
      cpc: item.cpc,
      difficulty: null,
      intent: null,
      source: "amazon" as const,
    }));

    // Combine based on source selection
    let keywords: IdeaKeyword[];
    if (source === "google") {
      keywords = googleKeywords;
    } else if (source === "amazon") {
      keywords = amazonKeywords;
    } else {
      // "both" — interleave results so each source is represented
      const combined = new Map<string, IdeaKeyword>();
      for (const kw of googleKeywords) combined.set(kw.keyword.toLowerCase(), kw);
      for (const kw of amazonKeywords) {
        const key = kw.keyword.toLowerCase();
        if (!combined.has(key)) combined.set(key, kw);
      }
      keywords = [...combined.values()];
    }

    // Parse demographics
    const demoItems = (
      (demoRaw as Record<string, unknown> | null)?.tasks as Record<string, unknown>[] | undefined
    )?.[0];
    const demoResultItems = (
      (demoItems?.result as Record<string, unknown>[] | undefined)?.[0]?.items as
        | Record<string, unknown>[]
        | undefined
    ) ?? [];

    let demographics: DemographicsData | null = null;
    if (demoResultItems.length > 0) {
      const genderItem = demoResultItems.find((i) => i.type === "gender") as
        | Record<string, unknown>
        | undefined;
      const ageItem = demoResultItems.find((i) => i.type === "age") as
        | Record<string, unknown>
        | undefined;

      demographics = {
        male:
          typeof genderItem?.male_index === "number" ? Math.round(genderItem.male_index) : null,
        female:
          typeof genderItem?.female_index === "number"
            ? Math.round(genderItem.female_index)
            : null,
        ageGroups: Array.isArray(ageItem?.items)
          ? (ageItem!.items as Record<string, unknown>[]).map((a) => ({
              label: String(a.age_group ?? a.age ?? ""),
              index: typeof a.index === "number" ? Math.round(a.index) : 0,
            }))
          : [],
      };
    }

    return Response.json({ keywords, demographics } satisfies KeywordIdeasResponse);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
