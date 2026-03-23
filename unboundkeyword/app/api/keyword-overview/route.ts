/**
 * POST /api/keyword-overview
 * Comprehensive keyword overview: SERP top results, A-Z autocomplete,
 * content citations, phrase trends, AI search volume, LLM mentions,
 * and optional Lighthouse audit (requires domain param).
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getTopOrganicResults,
  getGoogleAutocompleteAZ,
  getContentAnalysisSearchLive,
  getContentAnalysisPhraseTrendsLive,
  getAiKeywordSearchVolume,
  getLlmMentionsSearchLive,
  getLighthouseLiveJson,
  type SerpOrganicResult,
  type AutocompleteLetterGroup,
  type LighthouseLiveResult,
  type AiKeywordVolumeItem,
  type LlmMentionLiveItem,
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

export interface KeywordOverviewResponse {
  keyword: string;
  domain: string | null;
  serp: SerpOrganicResult[];
  autocomplete: AutocompleteLetterGroup[];
  citations: CitationItem[];
  phraseTrends: PhraseTrendItem[];
  aiVolume: AiKeywordVolumeItem[];
  llmMentions: LlmMentionLiveItem[];
  lighthouse: LighthouseLiveResult | null;
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
  ] = await Promise.allSettled([
    // 1. Top organic SERP results
    getTopOrganicResults(seed, location, language, 10),

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
  ]);

  function settle<T>(result: PromiseSettledResult<T>, key: string, fallback: T): T {
    if (result.status === "rejected") {
      errors[key] = result.reason instanceof Error ? result.reason.message : String(result.reason);
      return fallback;
    }
    return result.value;
  }

  const serp = settle(serpResult, "serp", []);
  const autocomplete = settle(autocompleteResult, "autocomplete", []);
  const citRaw = settle(citationsResult, "citations", { items: [], result: null, raw: null });
  const trendsRaw = settle(phraseTrendsResult, "phraseTrends", { items: [], result: null, raw: null });
  const aiVolume = settle(aiVolumeResult, "aiVolume", []);
  const llmMentions = settle(llmResult, "llmMentions", []);
  const lighthouse = settle(lighthouseResult, "lighthouse", null);

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
    autocomplete,
    citations,
    phraseTrends,
    aiVolume,
    llmMentions,
    lighthouse,
    errors,
  };

  return Response.json(response);
}
