/**
 * POST /api/discover
 * AnswerThePublic-style keyword discovery.
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getKeywordSuggestions,
  getRelatedKeywords,
  getKeywordIdeasLabs,
  getSearchIntent,
  type KeywordSuggestionItem,
  type RelatedKeywordItem,
} from "@/lib/dataforseo/client";
import { prisma } from "@/lib/prisma";

const QUESTION_PREFIXES = [
  "how", "what", "why", "where", "when", "which", "who", "can", "is", "are",
  "will", "would", "should", "does", "do", "was", "were",
];
const PREPOSITIONS = ["for", "with", "without", "near", "to", "vs", "like", "and", "or"];
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

export interface DiscoveryKeyword {
  keyword: string;
  volume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: string;
}

export interface DiscoveryGroup {
  type: "questions" | "prepositions" | "comparisons" | "alphabetical" | "related";
  label: string;
  keywords: DiscoveryKeyword[];
  letter?: string;
}

function toDiscovery(item: KeywordSuggestionItem, intentMap: Record<string, string>): DiscoveryKeyword {
  return {
    keyword: item.keyword,
    volume: item.searchVolume || undefined,
    difficulty: item.difficulty ?? undefined,
    cpc: item.cpc ?? undefined,
    intent: intentMap[item.keyword.toLowerCase()],
  };
}

function relToDiscovery(item: RelatedKeywordItem, intentMap: Record<string, string>): DiscoveryKeyword {
  return {
    keyword: item.keyword,
    volume: item.searchVolume || undefined,
    cpc: item.cpc ?? undefined,
    intent: intentMap[item.keyword.toLowerCase()],
  };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { seed, location = 2840, language = "en", save = false } = await req.json();
  if (!seed || typeof seed !== "string") {
    return Response.json({ error: "seed keyword required" }, { status: 400 });
  }

  const seedClean = seed.trim().toLowerCase();

  try {
    const [suggestionsResult, relatedResult, ideasResult] = await Promise.allSettled([
      getKeywordSuggestions(seedClean, location, language, 200),
      getRelatedKeywords(seedClean, location, language, 100),
      getKeywordIdeasLabs(seedClean, location, language, 200),
    ]);

    const suggestions: KeywordSuggestionItem[] =
      suggestionsResult.status === "fulfilled" ? suggestionsResult.value : [];
    const related: RelatedKeywordItem[] =
      relatedResult.status === "fulfilled" ? relatedResult.value : [];
    // Ideas used only for A-Z fallback; not directly used right now
    void ideasResult;

    // Collect keywords for intent enrichment
    const allKeywords = [
      ...suggestions.map((s) => s.keyword),
      ...related.map((r) => r.keyword),
    ].filter(Boolean).slice(0, 50);

    let intentMap: Record<string, string> = {};
    if (allKeywords.length > 0) {
      const intentData = await getSearchIntent(allKeywords, location, language).catch(() => []);
      for (const item of intentData) {
        if (item.keyword) intentMap[item.keyword.toLowerCase()] = item.intent;
      }
    }

    // 1. Questions
    const questionKeywords = suggestions
      .filter((s) => QUESTION_PREFIXES.some((p) => s.keyword.toLowerCase().startsWith(p + " ")))
      .map((s) => toDiscovery(s, intentMap))
      .slice(0, 60);

    // 2. Prepositions (not questions)
    const prepKeywords = suggestions
      .filter((s) => {
        const kw = s.keyword.toLowerCase();
        return (
          !QUESTION_PREFIXES.some((p) => kw.startsWith(p + " ")) &&
          PREPOSITIONS.some((p) => kw.includes(` ${p} `))
        );
      })
      .map((s) => toDiscovery(s, intentMap))
      .slice(0, 40);

    // 3. Comparisons
    const compKeywords = suggestions
      .filter((s) => {
        const kw = s.keyword.toLowerCase();
        return kw.includes(" vs ") || kw.includes(" versus ") || kw.includes("alternative") || kw.includes("compared");
      })
      .map((s) => toDiscovery(s, intentMap))
      .slice(0, 20);

    const alphaGroups: DiscoveryGroup[] = [];
    for (const letter of ALPHABET) {
      const matches = suggestions
        .filter((s) => {
          const kw = s.keyword.toLowerCase();
          return kw.startsWith(`${seedClean} ${letter}`) || (kw !== seedClean && kw.includes(` ${letter}`));
        })
        .slice(0, 8)
        .map((s) => toDiscovery(s, intentMap));
      if (matches.length > 0) {
        alphaGroups.push({ type: "alphabetical" as const, label: `${letter.toUpperCase()}`, letter: letter.toUpperCase(), keywords: matches });
      }
    }

    // 5. Related
    const relatedKeywords = related
      .slice(0, 50)
      .map((r) => relToDiscovery(r, intentMap));

    const groups: DiscoveryGroup[] = ([
      { type: "questions" as const, label: "Questions", keywords: questionKeywords },
      { type: "prepositions" as const, label: "Prepositions", keywords: prepKeywords },
      { type: "comparisons" as const, label: "Comparisons", keywords: compKeywords },
      ...alphaGroups,
      { type: "related" as const, label: "Related", keywords: relatedKeywords },
    ] as DiscoveryGroup[]).filter((g) => g.keywords.length > 0);

    if (save) {
      await prisma.discoverySession.create({
        data: {
          userId: (session.user as { id: string }).id,
          seedKeyword: seedClean,
          location: String(location),
          language,
          resultsJson: JSON.stringify(groups),
        },
      });
    }

    return Response.json({
      seed: seedClean,
      groups,
      totalKeywords: groups.reduce((acc, g) => acc + g.keywords.length, 0),
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Discovery failed" },
      { status: 500 }
    );
  }
}
