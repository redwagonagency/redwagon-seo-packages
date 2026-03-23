/**
 * POST /api/keyword-overview
 * Comprehensive keyword overview: SERP top results, PAA, A-Z autocomplete,
 * content citations, phrase trends, AI search volume, LLM mentions,
 * demographics, paid data, SERP features, monthly volumes, and optional
 * Lighthouse audit (requires domain param).
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getSerpLiveDataEnhanced,
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
  type SerpFeaturesResult,
  type MonthlyVolumeItem,
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
  competition: number | null;
  competitionLevel: "LOW" | "MEDIUM" | "HIGH" | null;
}

export interface RelatedKwItem {
  keyword: string;
  volume: number;
  cpc: number | null;
  competition: number | null;
  difficulty: number | null;
}

export interface ClickDistribution {
  organic: number;
  paid: number;
  aiOverview: number;
  featuredSnippet: number;
  noClick: number;
}

export interface KeywordOverviewResponse {
  keyword: string;
  domain: string | null;
  serp: SerpOrganicResult[];
  paa: PeopleAlsoAskItem[];
  autocomplete: AutocompleteLetterGroup[];
  citations: CitationItem[];
  phraseTrends: PhraseTrendItem[];
  monthlyVolumes: MonthlyVolumeItem[];
  aiVolume: AiKeywordVolumeItem[];
  llmMentions: LlmMentionLiveItem[];
  lighthouse: LighthouseLiveResult | null;
  paid: PaidSearchData | null;
  demographics: DemographicsData | null;
  relatedKeywords: RelatedKwItem[];
  questions: string[];
  prepositions: string[];
  comparisons: string[];
  keywordDifficulty: number | null;
  serpFeatures: SerpFeaturesResult | null;
  clickDistribution: ClickDistribution;
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
    getSerpLiveDataEnhanced(seed, location, language, 10),
    getGoogleAutocompleteAZ(seed, location, language),
    getContentAnalysisSearchLive(seed),
    getContentAnalysisPhraseTrendsLive(seed),
    getAiKeywordSearchVolume([seed], location, language),
    domain ? getLlmMentionsSearchLive(seed, domain, 20) : Promise.resolve([]),
    domain ? getLighthouseLiveJson(domain) : Promise.resolve(null),
    getKeywordData([seed]),
    getDFSTrendsDemography([seed], location),
    getRelatedKeywords(seed, location, language, 40),
    getKeywordSuggestions(seed, location, language, 30),
    getBulkKeywordDifficulty([seed], location, language),
  ]);

  function settle<T>(result: PromiseSettledResult<T>, key: string, fallback: T): T {
    if (result.status === "rejected") {
      errors[key] = result.reason instanceof Error ? result.reason.message : String(result.reason);
      return fallback;
    }
    return result.value;
  }

  const serpData = settle(serpResult, "serp", { organic: [], paa: [], features: null as unknown as SerpFeaturesResult });
  const serp = serpData.organic;
  const paa = serpData.paa;
  const serpFeatures: SerpFeaturesResult | null = serpData.features ?? null;

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

  // Parse paid search data + monthly volumes
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

  // Extract monthly volumes from Google Ads monthly_searches field
  const monthlyVolumes: MonthlyVolumeItem[] = [];
  if (paidItem && Array.isArray(paidItem.monthly_searches)) {
    for (const m of paidItem.monthly_searches as Record<string, unknown>[]) {
      if (typeof m.year === "number" && typeof m.month === "number" && typeof m.search_volume === "number") {
        monthlyVolumes.push({ year: m.year, month: m.month, volume: m.search_volume });
      }
    }
    monthlyVolumes.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  }

  const keywordDifficulty = difficultyRaw.find((d) => d.keyword.toLowerCase() === seed.toLowerCase())?.difficulty ?? null;

  // Merge related + suggestions
  const relatedMap = new Map<string, RelatedKwItem>();
  for (const item of relatedRaw) {
    if (!item.keyword) continue;
    const k = item.keyword.toLowerCase();
    if (k === seed.toLowerCase()) continue;
    relatedMap.set(k, { keyword: item.keyword, volume: item.searchVolume, cpc: item.cpc ?? null, competition: item.competition ?? null, difficulty: null });
  }
  for (const item of suggestionsRaw) {
    if (!item.keyword) continue;
    const k = item.keyword.toLowerCase();
    if (k === seed.toLowerCase()) continue;
    const existing = relatedMap.get(k);
    if (existing) {
      if (item.difficulty !== null) existing.difficulty = item.difficulty;
    } else {
      relatedMap.set(k, { keyword: item.keyword, volume: item.searchVolume, cpc: item.cpc ?? null, competition: null, difficulty: item.difficulty });
    }
  }
  const relatedKeywords = [...relatedMap.values()].sort((a, b) => b.volume - a.volume).slice(0, 60);

  // Extract questions / prepositions / comparisons from autocomplete
  const QUESTION_WORDS = ["how", "what", "why", "where", "when", "which", "who", "can", "does", "is", "are", "will", "should"];
  const PREPOSITION_WORDS = ["for", "with", "without", "near", "in", "on", "at", "by", "to", "vs", "versus", "like", "after", "before", "during"];
  const COMPARISON_WORDS = ["vs", "versus", "or", "alternative", "alternatives", "compare", "compared", "better", "difference"];

  const allAutocomplete: string[] = autocomplete.flatMap((g) => g.suggestions);
  const questions = allAutocomplete.filter((s) => QUESTION_WORDS.some((w) => s.toLowerCase().startsWith(w + " "))).slice(0, 50);
  const prepositions = allAutocomplete.filter((s) => {
    const words = s.toLowerCase().split(/\s+/);
    return PREPOSITION_WORDS.some((w) => words.includes(w));
  }).filter((s) => !questions.includes(s)).slice(0, 50);
  const comparisons = allAutocomplete.filter((s) => {
    const lower = s.toLowerCase();
    return COMPARISON_WORDS.some((w) => lower.includes(" " + w + " ") || lower.endsWith(" " + w));
  }).filter((s) => !questions.includes(s) && !prepositions.includes(s)).slice(0, 50);

  // Compute click distribution
  let paidPct = 0, aiOverviewPct = 0, featuredSnippetPct = 0;
  if (serpFeatures) {
    paidPct = Math.min(serpFeatures.topAdCount * 3 + serpFeatures.bottomAdCount * 1, 25);
    if (serpFeatures.hasAiOverview) aiOverviewPct = 18;
    if (serpFeatures.hasFeaturedSnippet && !serpFeatures.hasAiOverview) featuredSnippetPct = 8;
  } else {
    paidPct = Math.round((paidData?.competition ?? 0) * 22);
  }
  const comp = paidData?.competition ?? 0;
  const noClickPct = Math.max(Math.round(35 - comp * 10), 15);
  const organicPct = Math.max(100 - paidPct - aiOverviewPct - featuredSnippetPct - noClickPct, 5);
  const rawTotal = organicPct + paidPct + aiOverviewPct + featuredSnippetPct + noClickPct;
  const scale = 100 / rawTotal;
  const clickDistribution: ClickDistribution = {
    organic: Math.round(organicPct * scale),
    paid: Math.round(paidPct * scale),
    aiOverview: Math.round(aiOverviewPct * scale),
    featuredSnippet: Math.round(featuredSnippetPct * scale),
    noClick: Math.round(noClickPct * scale),
  };
  const distSum = clickDistribution.organic + clickDistribution.paid + clickDistribution.aiOverview + clickDistribution.featuredSnippet + clickDistribution.noClick;
  clickDistribution.organic += 100 - distSum;

  // Map citations
  const citations: CitationItem[] = ((citRaw as { items?: Record<string, unknown>[] })?.items ?? []).slice(0, 20).map((i) => ({
    url: typeof i.url === "string" ? i.url : null,
    title: typeof i.title === "string" ? i.title : null,
    domain: typeof i.domain === "string" ? i.domain : null,
    rating: typeof i.rating_distribution === "number" ? i.rating_distribution : null,
    contentDate: typeof i.content_date === "string" ? i.content_date : null,
    snippet: typeof i.snippet === "string" ? i.snippet : null,
  }));

  // Map phrase trends
  const phraseTrends: PhraseTrendItem[] = ((trendsRaw as { items?: Record<string, unknown>[] })?.items ?? [])
    .map((i) => ({ date: typeof i.date === "string" ? i.date : String(i.date ?? ""), impressions: typeof i.impressions === "number" ? i.impressions : 0 }))
    .filter((i) => i.date)
    .slice(0, 52);

  return Response.json({
    keyword: seed,
    domain: domain || null,
    serp,
    paa,
    autocomplete,
    citations,
    phraseTrends,
    monthlyVolumes,
    aiVolume,
    llmMentions,
    lighthouse,
    paid: paidData,
    demographics,
    relatedKeywords,
    questions,
    prepositions,
    comparisons,
    keywordDifficulty,
    serpFeatures,
    clickDistribution,
    errors,
  } satisfies KeywordOverviewResponse);
}
