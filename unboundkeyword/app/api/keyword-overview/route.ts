/**
 * POST /api/keyword-overview
 * Comprehensive keyword overview: SERP top results, PAA, A-Z autocomplete,
 * content citations, phrase trends, AI search volume, LLM mentions,
 * demographics, paid data, SERP features, monthly volumes.
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logUserSearch } from "@/lib/search-logger";
import {
  getSerpLiveDataEnhanced,
  getGoogleAutocompleteAZ,
  getAutocompleteBatch,
  getContentAnalysisSearchLive,
  getContentAnalysisPhraseTrendsLive,
  getAiKeywordSearchVolume,
  getLlmMentionsSearchLive,
  getKeywordData,
  getDFSTrendsDemography,
  getRelatedKeywords,
  getKeywordSuggestions,
  getBulkKeywordDifficulty,
  getKeywordOverviewLabs,
  getPeopleAlsoAskQuestions,
  type SerpOrganicResult,
  type AutocompleteLetterGroup,
  type LocalPackItem,
  type SerpAdsItem,
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
  locationData: { label: string; index: number }[];
}

export interface PaidSearchData {
  searchVolume: number | null;
  cpc: number | null;
  competition: number | null;
  competitionLevel: "LOW" | "MEDIUM" | "HIGH" | null;
  /** Which data source provided the volume/cpc figures */
  volumeSource: "google_ads" | "dataforseo_labs" | null;
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

export interface LocalPackResult {
  title: string;
  address: string | null;
  phone: string | null;
  rating: number | null;
  reviewCount: number | null;
  website: string | null;
  category: string | null;
}

export interface SerpAdResult {
  position: number;
  title: string;
  description: string | null;
  domain: string;
  url: string;
  displayUrl: string | null;
  isTopAd: boolean;
}

export interface KeywordOverviewResponse {
  keyword: string;
  domain: string | null;
  serp: SerpOrganicResult[];
  ads: SerpAdResult[];
  localPack: LocalPackResult[];
  paa: PeopleAlsoAskItem[];
  autocomplete: AutocompleteLetterGroup[];
  citations: CitationItem[];
  phraseTrends: PhraseTrendItem[];
  monthlyVolumes: MonthlyVolumeItem[];
  aiVolume: AiKeywordVolumeItem[];
  llmMentions: LlmMentionLiveItem[];
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

  // Build question-prefix and preposition-prefix batches for richer autocomplete
  const QUESTION_PREFIXES_KW = ["what", "how", "why", "where", "when", "who", "which", "can", "is", "are", "will", "should", "does", "do", "how to", "how do", "what is", "what are"];
  const PREPOSITION_PREFIXES_KW = ["for", "with", "without", "vs", "near", "in", "alternatives to", "like", "instead of", "compared to", "after", "before", "during", "for beginners", "for business"];
  const questionQueries = QUESTION_PREFIXES_KW.map((p) => `${p} ${seed}`);
  const prepositionQueries = PREPOSITION_PREFIXES_KW.map((p) => `${seed} ${p}`);

  const [
    serpResult,
    autocompleteResult,
    citationsResult,
    phraseTrendsResult,
    aiVolumeResult,
    llmResult,
    paidResult,
    demoResult,
    relatedKwResult,
    suggestionsResult,
    difficultyResult,
    labsResult,
    questionAutocompleteResult,
    prepositionAutocompleteResult,
    deepPaaResult,
  ] = await Promise.allSettled([
    getSerpLiveDataEnhanced(seed, location, language, 10),
    getGoogleAutocompleteAZ(seed, location, language),
    getContentAnalysisSearchLive(seed),
    getContentAnalysisPhraseTrendsLive(seed),
    getAiKeywordSearchVolume([seed], location, language),
    domain ? getLlmMentionsSearchLive(seed, domain, 20) : Promise.resolve([]),
    getKeywordData([seed]),
    getDFSTrendsDemography([seed], location),
    getRelatedKeywords(seed, location, language, 40),
    getKeywordSuggestions(seed, location, language, 30),
    getBulkKeywordDifficulty([seed], location, language),
    getKeywordOverviewLabs([seed], location, language),
    getAutocompleteBatch(questionQueries, location, language),
    getAutocompleteBatch(prepositionQueries, location, language),
    getPeopleAlsoAskQuestions(seed, location, language, 60),
  ]);

  function settle<T>(result: PromiseSettledResult<T>, key: string, fallback: T): T {
    if (result.status === "rejected") {
      errors[key] = result.reason instanceof Error ? result.reason.message : String(result.reason);
      return fallback;
    }
    return result.value;
  }

  const serpData = settle(serpResult, "serp", { organic: [], paa: [], features: null as unknown as SerpFeaturesResult, localPack: [] as LocalPackItem[], ads: [] as SerpAdsItem[] });
  const serp = serpData.organic;
  const paa = serpData.paa;
  const serpFeatures: SerpFeaturesResult | null = serpData.features ?? null;
  const localPack = serpData.localPack ?? [];
  const serpAds = serpData.ads ?? [];

  const autocomplete = settle(autocompleteResult, "autocomplete", []);
  const citRaw = settle(citationsResult, "citations", { items: [], result: null, raw: null });
  const trendsRaw = settle(phraseTrendsResult, "phraseTrends", { items: [], result: null, raw: null });
  const aiVolume = settle(aiVolumeResult, "aiVolume", []);
  const llmMentions = settle(llmResult, "llmMentions", []);
  const paidRaw = settle(paidResult, "paid", null);
  const demoRaw = settle(demoResult, "demographics", null);
  const relatedRaw = relatedKwResult.status === "fulfilled" ? relatedKwResult.value : [];
  const suggestionsRaw = suggestionsResult.status === "fulfilled" ? suggestionsResult.value : [];
  const difficultyRaw = difficultyResult.status === "fulfilled" ? difficultyResult.value : [];
  const labsRaw = labsResult.status === "fulfilled" ? labsResult.value : [];
  const labsItem = labsRaw.find((d) => d.keyword.toLowerCase() === seed.toLowerCase()) ?? null;
  const questionAutocomplete = questionAutocompleteResult.status === "fulfilled" ? questionAutocompleteResult.value : [];
  const prepositionAutocomplete = prepositionAutocompleteResult.status === "fulfilled" ? prepositionAutocompleteResult.value : [];
  const deepPaaItems = deepPaaResult.status === "fulfilled" ? deepPaaResult.value : [];

  // Parse demographics — DFS Trends Demography uses sub_type="gender"|"age_group"
  // and stores data in comparisons[*].data[*].breakdown_data[*].{category,value}
  type DemoRaw = { tasks?: Array<{ result?: Array<{ items?: Array<Record<string, unknown>> }> }> };
  const demoItems = (demoRaw as DemoRaw)?.tasks?.[0]?.result?.[0]?.items ?? [];
  let demographics: DemographicsData | null = null;
  if (demoItems.length > 0) {
    // DFS Trends Demography uses sub_type, not type, for gender/age
    const genderItem = demoItems.find((i) =>
      i.sub_type === "gender" || i.type === "gender"
    ) as Record<string, unknown> | undefined;
    const ageItem = demoItems.find((i) =>
      i.sub_type === "age_group" || i.sub_type === "age" || i.type === "age"
    ) as Record<string, unknown> | undefined;

    // Helper: extract avg value across time periods from DFS Trends breakdown_data
    function extractBreakdown(item: Record<string, unknown>): Map<string, number> {
      const result = new Map<string, number>();
      // New DFS Trends structure: item.comparisons[0].data[*].breakdown_data[*]
      const comparisons = (item.comparisons ?? []) as Record<string, unknown>[];
      const dataArr = (comparisons[0]?.data ?? []) as Record<string, unknown>[];
      const sums = new Map<string, number[]>();
      for (const d of dataArr) {
        for (const bd of ((d.breakdown_data ?? []) as Record<string, unknown>[])) {
          const cat = String(bd.category ?? bd.gender ?? bd.age_group ?? "").toLowerCase().trim();
          const val = typeof bd.value === "number" ? bd.value : 0;
          if (cat) { if (!sums.has(cat)) sums.set(cat, []); sums.get(cat)!.push(val); }
        }
      }
      for (const [k, vals] of sums) {
        result.set(k, Math.round(vals.reduce((s, v) => s + v, 0) / vals.length));
      }
      // Legacy structure: direct male_index/female_index or items[]
      if (result.size === 0) {
        if (typeof item.male_index === "number") result.set("male", Math.round(item.male_index as number));
        if (typeof item.female_index === "number") result.set("female", Math.round(item.female_index as number));
      }
      return result;
    }

    let maleVal: number | null = null;
    let femaleVal: number | null = null;
    if (genderItem) {
      const genderMap = extractBreakdown(genderItem);
      maleVal = genderMap.get("male") ?? genderMap.get("m") ?? null;
      femaleVal = genderMap.get("female") ?? genderMap.get("f") ?? null;
    }

    const ageGroups: { label: string; index: number }[] = [];
    if (ageItem) {
      const ageMap = extractBreakdown(ageItem);
      if (ageMap.size > 0) {
        // Sort canonical age ranges
        const ageOrder = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
        for (const label of ageOrder) {
          const idx = ageMap.get(label);
          if (idx !== undefined) ageGroups.push({ label, index: idx });
        }
        // Fallback: add any remaining labels we didn't find in ageOrder
        if (ageGroups.length === 0) {
          for (const [label, index] of ageMap) ageGroups.push({ label, index });
        }
      } else if (Array.isArray(ageItem.items)) {
        // Very old legacy structure
        for (const a of (ageItem.items as Record<string, unknown>[])) {
          ageGroups.push({ label: String(a.age_group ?? a.age ?? ""), index: typeof a.index === "number" ? Math.round(a.index) : 0 });
        }
      }
    }

    if (maleVal !== null || ageGroups.length > 0) {
      demographics = { male: maleVal, female: femaleVal, ageGroups, locationData: [] };
    }
  }

  // Parse paid search data + monthly volumes
  // Google Ads API returns tasks[0].result as a direct array of keyword items
  type PaidRaw = { tasks?: Array<{ result?: Array<Record<string, unknown>> }> };
  const paidItems = (paidRaw as PaidRaw)?.tasks?.[0]?.result ?? [];
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
    volumeSource: "google_ads",
  } : (labsItem ? {
    searchVolume: labsItem.searchVolume,
    cpc: labsItem.cpc,
    competition: labsItem.competition,
    competitionLevel: labsItem.competitionLevel as "LOW" | "MEDIUM" | "HIGH" | null,
    volumeSource: "dataforseo_labs",
  } : null);

  // Extract monthly volumes from Google Ads monthly_searches field (fall back to Labs)
  const monthlyVolumes: MonthlyVolumeItem[] = [];
  if (paidItem && Array.isArray(paidItem.monthly_searches)) {
    for (const m of paidItem.monthly_searches as Record<string, unknown>[]) {
      if (typeof m.year === "number" && typeof m.month === "number" && typeof m.search_volume === "number") {
        monthlyVolumes.push({ year: m.year, month: m.month, volume: m.search_volume });
      }
    }
    monthlyVolumes.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  }
  if (!monthlyVolumes.length && labsItem?.monthlySearches?.length) {
    for (const m of labsItem.monthlySearches) {
      monthlyVolumes.push({ year: m.year, month: m.month, volume: m.volume });
    }
  }

  const keywordDifficulty = difficultyRaw.find((d) => d.keyword.toLowerCase() === seed.toLowerCase())?.difficulty ?? labsItem?.difficulty ?? null;

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

  // Extract questions / prepositions / comparisons — mine autocomplete + dedicated question/preposition batches
  const QUESTION_WORDS = ["how", "what", "why", "where", "when", "which", "who", "can", "does", "is", "are", "will", "should", "do"];
  const PREPOSITION_WORDS = ["for", "with", "without", "near", "in", "on", "at", "by", "to", "vs", "versus", "like", "after", "before", "during", "alternatives", "instead", "compared"];
  const COMPARISON_WORDS = ["vs", "versus", "or", "alternative", "alternatives", "compare", "compared", "better", "difference"];

  const allAutocomplete: string[] = autocomplete.flatMap((g) => g.suggestions);
  // Combine all keyword sources including dedicated question/preposition autocomplete
  const allKeywordPool = [...new Set([
    ...allAutocomplete,
    ...questionAutocomplete,
    ...prepositionAutocomplete,
    ...suggestionsRaw.map((s) => s.keyword).filter(Boolean),
    ...relatedRaw.map((s) => s.keyword).filter(Boolean),
  ])].filter((s) => s.toLowerCase() !== seed.toLowerCase());

  // Questions: prioritize dedicated question-prefix autocomplete results, then filter remainder
  const questionSet = new Set<string>();
  for (const s of questionAutocomplete) {
    if (QUESTION_WORDS.some((w) => s.toLowerCase().startsWith(w + " "))) questionSet.add(s);
  }
  for (const s of allAutocomplete) {
    if (QUESTION_WORDS.some((w) => s.toLowerCase().startsWith(w + " "))) questionSet.add(s);
  }
  const questions = [...questionSet].slice(0, 80);

  // Prepositions: prioritize dedicated preposition autocomplete
  const prepositionSet = new Set<string>();
  for (const s of prepositionAutocomplete) prepositionSet.add(s);
  for (const s of allKeywordPool) {
    const words = s.toLowerCase().split(/\s+/);
    if (PREPOSITION_WORDS.some((w) => words.includes(w))) prepositionSet.add(s);
  }
  const prepositions = [...prepositionSet].filter((s) => !questionSet.has(s)).slice(0, 80);

  const comparisons = allKeywordPool.filter((s) => {
    const lower = s.toLowerCase();
    return COMPARISON_WORDS.some((w) => lower.includes(" " + w + " ") || lower.endsWith(" " + w));
  }).filter((s) => !questionSet.has(s) && !prepositionSet.has(s)).slice(0, 60);

  // Merge deep PAA with SERP PAA, deduplicate by question text
  const paaMap = new Map<string, PeopleAlsoAskItem>();
  for (const item of paa) paaMap.set(item.question.toLowerCase(), item);
  for (const item of deepPaaItems) {
    const key = item.keyword.toLowerCase();
    if (!paaMap.has(key)) paaMap.set(key, { question: item.keyword, answer: null, url: null, domain: null } as unknown as PeopleAlsoAskItem);
  }
  const mergedPaa = [...paaMap.values()].slice(0, 50);

  // Compute click distribution using actual SERP signals (research-backed CTR model)
  // Top ads absorb ~10% each, bottom ads ~3% each, AI Overview ~20%, Featured Snippet ~8%
  let paidPct = 0, aiOverviewPct = 0, featuredSnippetPct = 0, localPackPct = 0;
  const comp = paidData?.competition ?? 0;
  if (serpFeatures) {
    // Use actual ad count from SERP as primary signal; fall back to competition index
    const topAdCtr = serpFeatures.topAdCount > 0 ? Math.min(serpFeatures.topAdCount * 10, 35) : Math.round(comp * 30);
    const bottomAdCtr = Math.min(serpFeatures.bottomAdCount * 3, 8);
    paidPct = Math.min(topAdCtr + bottomAdCtr, 40);
    if (serpFeatures.hasAiOverview) aiOverviewPct = 20;
    if (serpFeatures.hasFeaturedSnippet && !serpFeatures.hasAiOverview) featuredSnippetPct = 8;
    if (serpFeatures.hasLocalPack) localPackPct = 15;
  } else {
    paidPct = Math.round(comp * 30);
  }
  // No-click rate: higher for informational queries, AI Overview, featured snippets
  const noClickBase = 25;
  const noClickExtra = (aiOverviewPct > 0 ? 8 : 0) + (featuredSnippetPct > 0 ? 5 : 0);
  const noClickPct = Math.max(noClickBase + noClickExtra, 15);
  const organicPct = Math.max(100 - paidPct - aiOverviewPct - featuredSnippetPct - localPackPct - noClickPct, 5);
  const rawTotal = organicPct + paidPct + aiOverviewPct + featuredSnippetPct + localPackPct + noClickPct;
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

  // Auto-save keyword intelligence (fire-and-forget)
  void prisma.keywordIntelligence.upsert({
    where: { userId_keyword_locationCode_languageCode: { userId: session.user.id, keyword: seed, locationCode: location, languageCode: language } },
    update: {
      searchVolume: paidData?.searchVolume ?? undefined,
      cpc: paidData?.cpc ?? undefined,
      competition: paidData?.competition ?? undefined,
      competitionLevel: paidData?.competitionLevel ?? undefined,
      difficulty: keywordDifficulty ?? undefined,
      organicClickPct: clickDistribution.organic,
      paidClickPct: clickDistribution.paid,
      aiOverviewPct: clickDistribution.aiOverview,
      featuredSnippetPct: clickDistribution.featuredSnippet,
      noClickPct: clickDistribution.noClick,
      hasAiOverview: serpFeatures?.hasAiOverview ?? false,
      hasFeaturedSnippet: serpFeatures?.hasFeaturedSnippet ?? false,
      hasLocalPack: serpFeatures?.hasLocalPack ?? false,
      topAdCount: serpFeatures?.topAdCount ?? 0,
      hasShopping: serpFeatures?.hasShopping ?? false,
      analyzedCount: { increment: 1 },
    },
    create: {
      userId: session.user.id,
      keyword: seed,
      locationCode: location,
      languageCode: language,
      searchVolume: paidData?.searchVolume ?? undefined,
      cpc: paidData?.cpc ?? undefined,
      competition: paidData?.competition ?? undefined,
      competitionLevel: paidData?.competitionLevel ?? undefined,
      difficulty: keywordDifficulty ?? undefined,
      organicClickPct: clickDistribution.organic,
      paidClickPct: clickDistribution.paid,
      aiOverviewPct: clickDistribution.aiOverview,
      featuredSnippetPct: clickDistribution.featuredSnippet,
      noClickPct: clickDistribution.noClick,
      hasAiOverview: serpFeatures?.hasAiOverview ?? false,
      hasFeaturedSnippet: serpFeatures?.hasFeaturedSnippet ?? false,
      hasLocalPack: serpFeatures?.hasLocalPack ?? false,
      topAdCount: serpFeatures?.topAdCount ?? 0,
      hasShopping: serpFeatures?.hasShopping ?? false,
    },
  }).catch(() => { /* non-critical */ });

  void logUserSearch(session.user.id, seed, "keyword", { volume: labsItem?.searchVolume ?? null, domain: domain || null });

  return Response.json({
    keyword: seed,
    domain: domain || null,
    serp,
    ads: serpAds,
    localPack,
    paa: mergedPaa,
    autocomplete,
    citations,
    phraseTrends,
    monthlyVolumes,
    aiVolume,
    llmMentions,
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
