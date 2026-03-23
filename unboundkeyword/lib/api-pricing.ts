export type EndpointPrice = {
  endpoint: string;
  estimatedUsdPerCall: number;
  matchedRule: string;
};

type JsonRecord = Record<string, unknown>;

const PRICING_RULES: Array<{ pattern: RegExp; usd: number; rule: string }> = [
  { pattern: /\/serp\/google\/organic\/live\/advanced/i, usd: 0.0025, rule: "SERP Google Organic Live" },
  { pattern: /\/serp\/google\/autocomplete\/live\/advanced/i, usd: 0.0005, rule: "SERP Google Autocomplete" },
  { pattern: /\/serp\/(google|bing|yahoo)\/organic\/live\/(advanced|regular)/i, usd: 0.0025, rule: "SERP Organic Live" },
  { pattern: /\/keywords_data\/google_ads\/search_volume\/live/i, usd: 0.002, rule: "Google Ads Search Volume" },
  { pattern: /\/keywords_data\/google_ads\/keywords_for_keywords\/live/i, usd: 0.002, rule: "Google Ads Keywords For Keywords" },
  { pattern: /\/keywords_data\/google_ads\/keywords_for_site\/live/i, usd: 0.002, rule: "Google Ads Keywords For Site" },
  { pattern: /\/keywords_data\/dataforseo_trends\/demography\/live/i, usd: 0.002, rule: "DataForSEO Trends Demography" },
  { pattern: /\/keywords_data\/dataforseo_trends\/subregion_interests\/live/i, usd: 0.002, rule: "DataForSEO Trends Subregion Interests" },
  { pattern: /\/keywords_data\/dataforseo_trends\/merged_data\/live/i, usd: 0.002, rule: "DataForSEO Trends Merged Data" },
  { pattern: /\/keywords_data\/clickstream_data\/global_search_volume\/live/i, usd: 0.002, rule: "Clickstream Global Search Volume" },
  { pattern: /\/dataforseo_labs\/google\/keyword_ideas\/live/i, usd: 0.0015, rule: "Labs Keyword Ideas" },
  { pattern: /\/dataforseo_labs\/google\/(related_keywords|keyword_suggestions)\/live/i, usd: 0.0015, rule: "Labs Related/Suggestions" },
  { pattern: /\/dataforseo_labs\/google\/ranked_keywords\/live/i, usd: 0.0015, rule: "Labs Ranked Keywords" },
  { pattern: /\/dataforseo_labs\/google\/domain_intersection\/live/i, usd: 0.0015, rule: "Labs Domain Intersection" },
  { pattern: /\/dataforseo_labs\/google\/bulk_traffic_estimation\/live/i, usd: 0.002, rule: "Labs Bulk Traffic" },
  { pattern: /\/dataforseo_labs\/google\/historical_bulk_traffic_estimation\/live/i, usd: 0.002, rule: "Labs Historical Bulk Traffic" },
  { pattern: /\/dataforseo_labs\/google\/bulk_keyword_difficulty\/live/i, usd: 0.001, rule: "Labs Bulk Keyword Difficulty" },
  { pattern: /\/dataforseo_labs\/google\/search_intent\/live/i, usd: 0.001, rule: "Labs Search Intent" },
  { pattern: /\/content_analysis\/(search|phrase_trends)\/live/i, usd: 0.01, rule: "Content Analysis" },
  { pattern: /\/backlinks\/(summary|backlinks|anchors|referring_domains|domain_intersection)\/live/i, usd: 0.003, rule: "Backlinks" },
  { pattern: /\/ai_optimization\//i, usd: 0.0035, rule: "AI Optimization" },
  { pattern: /\/on_page\//i, usd: 0.004, rule: "On-Page" },
];

export function estimateEndpointPrice(endpoint: string): EndpointPrice {
  const match = PRICING_RULES.find((entry) => entry.pattern.test(endpoint));
  if (!match) {
    return { endpoint, estimatedUsdPerCall: 0.001, matchedRule: "Default estimate" };
  }
  return { endpoint, estimatedUsdPerCall: match.usd, matchedRule: match.rule };
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/**
 * DataForSEO responses include cost fields at top-level and task-level.
 * This parser prefers task-level sum, then top-level cost if task-level is unavailable.
 */
export function extractDfsCostUsdFromResponse(response: unknown): number | null {
  if (!response || typeof response !== "object") return null;
  const root = response as JsonRecord;

  const tasks = Array.isArray(root.tasks) ? (root.tasks as JsonRecord[]) : [];
  let taskCostSum = 0;
  let taskCostCount = 0;
  for (const task of tasks) {
    const taskCost = asNumber(task.cost);
    if (taskCost !== null) {
      taskCostSum += taskCost;
      taskCostCount += 1;
    }
  }
  if (taskCostCount > 0) return taskCostSum;

  const rootCost = asNumber(root.cost);
  return rootCost;
}
