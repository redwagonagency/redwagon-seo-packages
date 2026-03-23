/**
 * POST /api/keyword-overview
 * Comprehensive keyword overview: SERP top results, A-Z autocomplete,
 * content citations, phrase trends, AI search volume, LLM mentions,
 * and optional Lighthouse audit (requires domain param).
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getSerpLiveData,
  getGoogleAutocompleteAZ,
  getContentAnalysisSearchLive,
  getContentAnalysisPhraseTrendsLive,
  getAiKeywordSearchVolume,
  getLlmMentionsSearchLive,
  getLighthouseLiveJson,
  getKeywordData,
  getDFSTrendsDemography,
  getRelatedKeywords,
  getKeywordSuggestions,
  getBulkKeywordDifficulty,
  type SerpOrganicResult,
  type AutocompleteLetterGroup,
  type LighthouseLiveResult,
  type AiKeywordVolumeItem,
  type LlmMentionLiveItem,
  type PeopleAlsoAskItem,
} from "@/lib/dataforseo/client";

export interface CitationItem {
  url: string | null;
  title: string | null;
  domain: string | null;
  rating: number | null;
  contentDate: string | null;
  snippet: string | null;
}

export interface PhraseTrendItem {
  date: string;
  impressions: number;
}

export interface DemographicsData {
  male: number | null;
  female: number | null;
  ageGroups: { label: string; index: number }[];
}

export interface PaidSearchData {
  searchVolume: number | null;
  cpc: number | null;
  competition: number | null; // 0–1 float → multiply by 100 for %
  competitionLevel: "LOW" | "MEDIUM" | "HIGH" | null;
}

export interface RelatedKwItem {
  keyword: string;
  volume: number;
  cpc: number | null;
  competition: number | null;
  difficulty: number | null;
}

export interface KeywordOverviewResponse {
  keyword: string;
  domain: string | null;
  serp: SerpOrganicResult[];
  paa: PeopleAlsoAskItem[];
  autocomplete: AutocompleteLetterGroup[];
  citations: CitationItem[];
  phraseTrends: PhraseTrendItem[];
  aiVolume: AiKeywordVolumeItem[];
  llmMentions: LlmMentionLiveItem[];
  lighthouse: LighthouseLiveResult | null;
  paid: PaidSearchData | null;
  demographics: DemographicsData | null;
  relatedKeywords: RelatedKwItem[];
  keywordDifficulty: number | null;
  errors: Record<string, string>;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    keyword?: string;
    domain?: string;
    location?: number;
    language?: string;
  };

  const { keyword, domain = "", location = 2840, language = "en" } = body;

  if (!keyword?.trim()) {
    return Response.json({ error: "keyword required" }, { status: 400 });
  }

  const seed = keyword.trim();
  const errors: Record<string, string> = {};

  // Run all tasks in parallel; each is independently safe to fail
  const [
    serpResult,
    autocompleteResult,
    citationsResult,
    phraseTrendsResult,
    aiVolumeResult,
    llmResult,
    lighthouseResult,
    paidResult,
    demoResult,
    relatedKwResult,
    suggestionsResult,
    difficultyResult,
  ] = await Promise.allSettled([
    // 1. Top organic SERP results + People Also Ask (single call)
    getSerpLiveData(seed, location, language, 10),

    // 2. A-Z autocomplete (all 26 letters in one batched request)
    getGoogleAutocompleteAZ(seed, location, language),

    // 3. Content citations
    getContentAnalysisSearchLive(seed),

    // 4. Phrase trends
    getContentAnalysisPhraseTrendsLive(seed),

    // 5. AI keyword search volume
    getAiKeywordSearchVolume([seed], location, language),

    // 6. LLM mentions (domain can be empty string — function handles it)
    domain ? getLlmMentionsSearchLive(seed, domain, 20) : Promise.resolve([]),

    // 7. Lighthouse audit (only if domain provided)
    domain ? getLighthouseLiveJson(domain) : Promise.resolve(null),

    // 8. Google Ads paid search data (CPC, competition, volume)
    getKeywordData([seed]),
    // 9. Demographics
    getDFSTrendsDemography([seed], location),
    // 10. Related keywords
    getRelatedKeywords(seed, location, language, 40),
    // 11. Keyword suggestions with difficulty
    getKeywordSuggestions(seed, location, language, 30),
    // 12. Bulk keyword difficulty for the seed
    getBulkKeywordDifficulty([seed], location, language),
  ]);

  function settle<T>(result: PromiseSettledResult<T>, key: string, fallback: T): T {
    if (result.status === "rejected") {
      errors[key] = result.reason instanceof Error ? result.reason.message : String(result.reason);
      return fallback;
    }
    return result.value;
  }

  const serpData = settle(serpResult, "serp", { organic: [], paa: [] });
  const serp = serpData.organic;
  const paa = serpData.paa;
  const autocomplete = settle(autocompleteResult, "autocomplete", []);
  const citRaw = settle(citationsResult, "citations", { items: [], result: null, raw: null });
  const trendsRaw = settle(phraseTrendsResult, "phraseTrends", { items: [], result: null, raw: null });
  const aiVolume = settle(aiVolumeResult, "aiVolume", []);
  const llmMentions = settle(llmResult, "llmMentions", []);
  const lighthouse = settle(lighthouseResult, "lighthouse", null);
  const paidRaw = settle(paidResult, "paid", null);
  const demoRaw = settle(demoResult, "demographics", null);
  const relatedRaw = relatedKwResult.status === "fulfilled" ? relatedKwResult.value : [];
  const suggestionsRaw = suggestionsResult.status === "fulfilled" ? suggestionsResult.value : [];
  const difficultyRaw = difficultyResult.status === "fulfilled" ? difficultyResult.value : [];

  // Parse demographics
  type DemoRaw = { tasks?: Array<{ result?: Array<{ items?: Array<Record<string, unknown>> }> }> };
  const demoItems = (demoRaw as DemoRaw)?.tasks?.[0]?.result?.[0]?.items ?? [];
  let demographics: DemographicsData | null = null;
  if (demoItems.length > 0) {
    const genderItem = demoItems.find((i) => i.type === "gender") as Record<string, unknown> | undefined;
    const ageItem = demoItems.find((i) => i.type === "age") as Record<string, unknown> | undefined;
    demographics = {
      male: typeof genderItem?.male_index === "number" ? Math.round(genderItem.male_index) : null,
      female: typeof genderItem?.female_index === "number" ? Math.round(genderItem.female_index) : null,
      ageGroups: Array.isArray(ageItem?.items)
        ? (ageItem!.items as Record<string, unknown>[]).map((a) => ({
            label: String(a.age_group ?? a.age ?? ""),
            index: typeof a.index === "number" ? Math.round(a.index) : 0,
          }))
        : [],
    };
  }

  // Parse paid search data from Google Ads API response
  type PaidRaw = { tasks?: Array<{ result?: Array<{ items?: Array<Record<string, unknown>> }> }> };
  const paidItems = (paidRaw as PaidRaw)?.tasks?.[0]?.result?.[0]?.items ?? [];
  const paidItem = (paidItems[0] ?? null) as Record<string, unknown> | null;
  const paidData: PaidSearchData | null = paidItem ? {
    searchVolume: typeof paidItem.search_volume === "number" ? paidItem.search_volume : null,
    cpc: typeof paidItem.cpc === "number" ? paidItem.cpc :
         typeof paidItem.low_top_of_page_bid === "number" ? paidItem.low_top_of_page_bid : null,
    competition: typeof paidItem.competition_index === "number" ? paidItem.competition_index / 100 :
                 typeof paidItem.competition === "number" ? paidItem.competition : null,
    competitionLevel: (["LOW", "MEDIUM", "HIGH"].includes(String(paidItem.competition_level ?? "")))
      ? (paidItem.competition_level as "LOW" | "MEDIUM" | "HIGH")
      : null,
  } : null;


  // Extract keyword difficulty for the seed keyword
  const keywordDifficulty = difficultyRaw.find((d) => d.keyword.toLowerCase() === seed.toLowerCase())?.difficulty ?? null;

  // Merge related keywords and suggestions into one deduplicated list
  const relatedMap = new Map<string, RelatedKwItem>();
  for (const item of relatedRaw) {
    if (!item.keyword) continue;
    const k = item.keyword.toLowerCase();
    if (k === seed.toLowerCase()) continue; // skip the seed itself
    relatedMap.set(k, {
      keyword: item.keyword,
      volume: item.searchVolume,
      cpc: item.cpc ?? null,
      competition: item.competition ?? null,
      difficulty: null,
    });
  }
  for (const item of suggestionsRaw) {
    if (!item.keyword) continue;
    const k = item.keyword.toLowerCase();
    if (k === seed.toLowerCase()) continue;
    const existing = relatedMap.get(k);
    if (existing) {
      if (item.difficulty !== null) existing.difficulty = item.difficulty;
    } else {
      relatedMap.set(k, {
        keyword: item.keyword,
        volume: item.searchVolume,
        cpc: item.cpc ?? null,
        competition: null,
        difficulty: item.difficulty,
      });
    }
  }
  const relatedKeywords = [...relatedMap.values()]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 60);

  // Map citation items
  const citations: CitationItem[] = (
    (citRaw as { items?: Record<string, unknown>[] })?.items ?? []
  )
    .slice(0, 20)
    .map((i) => ({
      url: typeof i.url === "string" ? i.url : null,
      title: typeof i.title === "string" ? i.title : null,
      domain: typeof i.domain === "string" ? i.domain : null,
      rating: typeof i.rating_distribution === "number" ? i.rating_distribution : null,
      contentDate: typeof i.content_date === "string" ? i.content_date : null,
      snippet: typeof i.snippet === "string" ? i.snippet : null,
    }));

  // Map phrase trends: result.items is an array of { date, impressions }
  const phraseTrends: PhraseTrendItem[] = (
    (trendsRaw as { items?: Record<string, unknown>[] })?.items ?? []
  )
    .map((i) => ({
      date: typeof i.date === "string" ? i.date : String(i.date ?? ""),
      impressions: typeof i.impressions === "number" ? i.impressions : 0,
    }))
    .filter((i) => i.date)
    .slice(0, 52); // up to 1 year of weekly data

  const response: KeywordOverviewResponse = {
    keyword: seed,
    domain: domain || null,
    serp,
    paa,
    autocomplete,
    citations,
    phraseTrends,
    aiVolume,
    llmMentions,
    lighthouse,
    paid: paidData,
    demographics,
    relatedKeywords,
    keywordDifficulty,
    errors,
  };

  return Response.json(response);
}
