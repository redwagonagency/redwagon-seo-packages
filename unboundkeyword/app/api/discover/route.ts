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
  // Core question words
  "how", "what", "why", "where", "when", "which", "who",
  // Auxiliary / modal
  "can", "could", "will", "would", "should", "shall", "may", "might",
  "is", "are", "was", "were", "has", "have", "had", "does", "do", "did",
  "need", "dare", "used",
  // Negations
  "isn't", "aren't", "wasn't", "weren't", "can't", "cannot", "won't",
  "wouldn't", "shouldn't", "doesn't", "don't", "didn't", "hasn't", "haven't",
  // Two-word openings (common ATP-style question phrases)
  "how do", "how to", "how can", "how much", "how many", "how long",
  "how often", "how far", "how fast", "how big", "how old", "how else",
  "what is", "what are", "what does", "what can", "what if", "what happens",
  "what makes", "what causes", "what should", "what will", "what was",
  "why is", "why are", "why does", "why do", "why would", "why should",
  "when is", "when are", "when does", "when do", "when to", "when will",
  "where is", "where are", "where can", "where to", "where do", "where does",
  "which is", "which are", "which one", "which way",
  "who is", "who are", "who can", "who does", "who makes", "who uses",
];

const PREPOSITIONS = [
  // Core prepositions
  "for", "with", "without", "near", "to", "into", "onto", "from",
  "in", "on", "at", "by", "of", "off", "up", "down", "out",
  // Relational
  "about", "across", "after", "against", "along", "among", "around",
  "before", "behind", "below", "beneath", "beside", "between", "beyond",
  "despite", "during", "except", "inside", "like", "outside", "over",
  "past", "since", "through", "throughout", "under", "underneath", "until",
  "upon", "via", "within", "worth",
  // Compound / comparative
  "vs", "or", "and", "plus", "not",
  "than", "per", "as",
  // Action phrases used in keyword modifiers
  "using", "using a", "with a", "without a", "instead of", "rather than",
  "compared to", "next to", "due to", "according to",
];

const COMPARISON_TERMS = [
  "vs", "versus", "or", "alternative", "alternatives", "alternative to",
  "compared to", "compared with", "better than", "worse than", "instead of",
  "similar to", "like", "review", "reviews", "difference between", "pros and cons",
  "pros cons", "worth it", "is it worth", "pricing", "price", "cost", "cheap",
  "affordable", "free", "best", "top", "best alternative",
];

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

function uniqueByKeyword<T extends { keyword: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const item of items) {
    const normalized = item.keyword.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(item);
  }
  return unique;
}

function isQuestionKeyword(keyword: string): boolean {
  const kw = keyword.toLowerCase();
  return QUESTION_PREFIXES.some((prefix) => kw.startsWith(`${prefix} `));
}

function isPrepositionKeyword(keyword: string): boolean {
  const kw = keyword.toLowerCase();
  return PREPOSITIONS.some((prep) => kw.includes(` ${prep} `));
}

function isComparisonKeyword(keyword: string): boolean {
  const kw = keyword.toLowerCase();
  return COMPARISON_TERMS.some((term) => kw.includes(term));
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

    const suggestionsRaw: KeywordSuggestionItem[] =
      suggestionsResult.status === "fulfilled" ? suggestionsResult.value : [];
    const relatedRaw: RelatedKeywordItem[] =
      relatedResult.status === "fulfilled" ? relatedResult.value : [];
    const ideasRaw = ideasResult.status === "fulfilled" ? ideasResult.value : [];

    const suggestions = suggestionsRaw.filter((item) => item.keyword?.trim().length > 0);
    const related = relatedRaw.filter((item) => item.keyword?.trim().length > 0);

    // Use ideas as additional fallback supply so broad keywords still return usable results.
    const ideaFallback = ideasRaw
      .filter((item) => item.keyword?.trim().length > 0)
      .map((item) => ({
        keyword: item.keyword,
        searchVolume: item.searchVolume ?? 0,
        cpc: item.cpc ?? null,
        competition: null,
      })) as RelatedKeywordItem[];

    // Collect keywords for intent enrichment
    const allKeywords = [
      ...suggestions.map((s) => s.keyword),
      ...related.map((r) => r.keyword),
      ...ideaFallback.map((i) => i.keyword),
    ].filter(Boolean).slice(0, 50);

    const intentMap: Record<string, string> = {};
    if (allKeywords.length > 0) {
      const intentData = await getSearchIntent(allKeywords, location, language).catch(() => []);
      for (const item of intentData) {
        if (item.keyword) intentMap[item.keyword.toLowerCase()] = item.intent;
      }
    }

    const relatedPool = uniqueByKeyword([...related, ...ideaFallback]);

    // 1. Questions (suggestions-first, with related/ideas fallback)
    const questionKeywords = uniqueByKeyword([
      ...suggestions.filter((s) => isQuestionKeyword(s.keyword)).map((s) => toDiscovery(s, intentMap)),
      ...relatedPool.filter((r) => isQuestionKeyword(r.keyword)).map((r) => relToDiscovery(r, intentMap)),
    ]).slice(0, 60);

    // 2. Prepositions (not questions; suggestions-first, with fallback)
    const prepKeywords = uniqueByKeyword([
      ...suggestions
        .filter((s) => !isQuestionKeyword(s.keyword) && isPrepositionKeyword(s.keyword))
        .map((s) => toDiscovery(s, intentMap)),
      ...relatedPool
        .filter((r) => !isQuestionKeyword(r.keyword) && isPrepositionKeyword(r.keyword))
        .map((r) => relToDiscovery(r, intentMap)),
    ]).slice(0, 40);

    // 3. Comparisons (suggestions-first, with fallback)
    const compKeywords = uniqueByKeyword([
      ...suggestions.filter((s) => isComparisonKeyword(s.keyword)).map((s) => toDiscovery(s, intentMap)),
      ...relatedPool.filter((r) => isComparisonKeyword(r.keyword)).map((r) => relToDiscovery(r, intentMap)),
    ]).slice(0, 30);

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
    const relatedKeywords = relatedPool
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
