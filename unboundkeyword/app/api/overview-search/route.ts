import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getAmazonBulkSearchVolume,
  getAmazonRelatedKeywords,
  getBingKeywordsForKeywords,
  getBingSearchVolume,
  getGoogleAutocompleteLiveAdvanced,
  getKeywordIdeasLabs,
  getKeywordOverview,
  getKeywordSuggestions,
  getRelatedKeywords,
  getYoutubeOrganicSerpLive,
} from "@/lib/dataforseo/client";

type OverviewRow = {
  keyword: string;
  volume: number | null;
  cpc: number | null;
  difficulty: number | null;
  intent: string | null;
  source: string;
};

const AI_PHRASE_PREFIXES = [
  "is",
  "tell me",
  "give me",
  "better than",
  "i am",
  "looking for",
  "show me",
  "compare",
  "which is better",
  "why should i",
  "what's best",
  "how to",
];

function dedupeRows(rows: OverviewRow[]): OverviewRow[] {
  const seen = new Set<string>();
  const unique: OverviewRow[] = [];
  for (const row of rows) {
    const key = row.keyword.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }
  return unique;
}

function deriveIntent(keyword: string): string {
  const k = keyword.toLowerCase();
  if (/\b(buy|price|pricing|cost|cheap|deal|order)\b/.test(k)) return "transactional";
  if (/\b(vs|versus|alternative|compare|better than|best)\b/.test(k)) return "commercial";
  if (/\b(how|what|why|is|tell me|give me|show me)\b/.test(k)) return "informational";
  return "informational";
}

function collectAutocompleteKeywords(items: unknown): string[] {
  const out = new Set<string>();
  const visit = (value: unknown) => {
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized.length >= 3) out.add(normalized);
      return;
    }
    if (Array.isArray(value)) {
      for (const child of value) visit(child);
      return;
    }
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      for (const key of ["keyword", "value", "text", "title", "suggestion", "suggestions", "items", "results"]) {
        visit(record[key]);
      }
    }
  };

  visit(items);
  return Array.from(out);
}

async function buildGoogleRows(keyword: string, location: number, language: string): Promise<OverviewRow[]> {
  const [suggestions, related, ideas] = await Promise.all([
    getKeywordSuggestions(keyword, location, language, 120),
    getRelatedKeywords(keyword, location, language, 120),
    getKeywordIdeasLabs(keyword, location, language, 120),
  ]);

  return dedupeRows([
    ...suggestions.map((row) => ({
      keyword: row.keyword,
      volume: row.searchVolume || null,
      cpc: row.cpc ?? null,
      difficulty: row.difficulty ?? null,
      intent: deriveIntent(row.keyword),
      source: "google_suggestions",
    })),
    ...related.map((row) => ({
      keyword: row.keyword,
      volume: row.searchVolume || null,
      cpc: row.cpc ?? null,
      difficulty: null,
      intent: deriveIntent(row.keyword),
      source: "google_related",
    })),
    ...ideas.map((row) => ({
      keyword: row.keyword,
      volume: row.searchVolume || null,
      cpc: row.cpc ?? null,
      difficulty: null,
      intent: row.intent,
      source: "google_ideas",
    })),
  ]);
}

async function buildBingRows(keyword: string, location: number, language: string): Promise<OverviewRow[]> {
  const [bingSuggestions, bingVolumes] = await Promise.all([
    getBingKeywordsForKeywords([keyword], location, language),
    getBingSearchVolume([keyword], location, language),
  ]);

  return dedupeRows([
    ...bingSuggestions.map((row) => ({
      keyword: row.keyword,
      volume: row.searchVolume || null,
      cpc: row.cpc ?? null,
      difficulty: row.competition != null ? Math.round(row.competition * 100) : null,
      intent: deriveIntent(row.keyword),
      source: "bing_keywords",
    })),
    ...bingVolumes.map((row) => ({
      keyword: row.keyword,
      volume: row.searchVolume || null,
      cpc: row.cpc ?? null,
      difficulty: row.competition != null ? Math.round(row.competition * 100) : null,
      intent: deriveIntent(row.keyword),
      source: "bing_volume",
    })),
  ]);
}

async function buildAmazonRows(keyword: string, location: number, language: string): Promise<OverviewRow[]> {
  const related = await getAmazonRelatedKeywords(keyword, location, language, 1, 120);
  const candidateKeywords = dedupeRows(
    related.map((row) => ({
      keyword: row.keyword,
      volume: row.searchVolume || null,
      cpc: row.cpc ?? null,
      difficulty: null,
      intent: deriveIntent(row.keyword),
      source: "amazon_related",
    }))
  ).slice(0, 80);

  const bulkVolumes = await getAmazonBulkSearchVolume(candidateKeywords.map((row) => row.keyword), location, language);
  const volumeMap = new Map(bulkVolumes.map((row) => [row.keyword.toLowerCase(), row.searchVolume]));

  return candidateKeywords.map((row) => ({
    ...row,
    volume: volumeMap.get(row.keyword.toLowerCase()) ?? row.volume,
  }));
}

async function buildYoutubeRows(keyword: string, location: number, language: string): Promise<OverviewRow[]> {
  const [serpRows, autocomplete] = await Promise.all([
    getYoutubeOrganicSerpLive(keyword, location, language),
    getGoogleAutocompleteLiveAdvanced(`${keyword} youtube`, {
      locationCode: location,
      languageCode: language,
      limit: 100,
    }),
  ]);

  const fromSerp = serpRows
    .filter((row) => row.title)
    .map((row) => ({
      keyword: String(row.title),
      volume: row.viewsCount ?? null,
      cpc: null,
      difficulty: null,
      intent: "informational",
      source: "youtube_serp",
    }));

  const fromAutocomplete = collectAutocompleteKeywords(autocomplete.items).map((term) => ({
    keyword: term,
    volume: null,
    cpc: null,
    difficulty: null,
    intent: deriveIntent(term),
    source: "youtube_autocomplete",
  }));

  return dedupeRows([...fromSerp, ...fromAutocomplete]);
}

async function buildAutocompleteRows(seed: string, platform: string, location: number, language: string): Promise<OverviewRow[]> {
  const autocomplete = await getGoogleAutocompleteLiveAdvanced(`${seed} ${platform}`, {
    locationCode: location,
    languageCode: language,
    limit: 140,
  });

  const ideas = await getKeywordIdeasLabs(`${seed} ${platform}`, location, language, 90).catch(() => []);

  return dedupeRows([
    ...collectAutocompleteKeywords(autocomplete.items).map((term) => ({
      keyword: term,
      volume: null,
      cpc: null,
      difficulty: null,
      intent: deriveIntent(term),
      source: `${platform}_autocomplete`,
    })),
    ...ideas.map((row) => ({
      keyword: row.keyword,
      volume: row.searchVolume || null,
      cpc: row.cpc ?? null,
      difficulty: null,
      intent: row.intent,
      source: `${platform}_ideas`,
    })),
  ]);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    keyword?: string;
    platform?: string;
    location?: number;
    language?: string;
  };

  const keyword = String(body.keyword ?? "").trim().toLowerCase();
  const platform = String(body.platform ?? "google").toLowerCase();
  const location = Number(body.location ?? 2840);
  const language = String(body.language ?? "en");

  if (!keyword) {
    return Response.json({ error: "keyword is required" }, { status: 400 });
  }

  try {
    let rows: OverviewRow[] = [];
    if (platform === "google") {
      rows = await buildGoogleRows(keyword, location, language);
    } else if (platform === "bing") {
      rows = await buildBingRows(keyword, location, language);
    } else if (platform === "amazon") {
      rows = await buildAmazonRows(keyword, location, language);
    } else if (platform === "youtube") {
      rows = await buildYoutubeRows(keyword, location, language);
    } else {
      rows = await buildAutocompleteRows(keyword, platform, location, language);
    }

    const aiQueries = AI_PHRASE_PREFIXES.map((prefix) => `${prefix} ${keyword}`).slice(0, 12);
    const aiPhraseMetrics = await getKeywordOverview(aiQueries, location, language).catch(() => []);

    return Response.json({
      keyword,
      platform,
      results: dedupeRows(rows)
        .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
        .slice(0, 120),
      aiPhraseAnalysis: aiPhraseMetrics
        .map((row) => ({
          keyword: row.keyword,
          volume: row.volume,
          cpc: row.cpc,
          difficulty: row.difficulty,
          intent: row.intent,
        }))
        .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Overview search failed" },
      { status: 500 }
    );
  }
}
