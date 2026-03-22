const DFS_BASE = "https://api.dataforseo.com/v3";

function getAuthHeaders() {
  const login = process.env.DATAFORSEO_LOGIN ?? "";
  const password = process.env.DATAFORSEO_PASSWORD ?? "";
  const encoded = Buffer.from(`${login}:${password}`).toString("base64");
  return {
    Authorization: `Basic ${encoded}`,
    "Content-Type": "application/json",
  };
}

async function dfsPost(endpoint: string, body: unknown) {
  const res = await fetch(`${DFS_BASE}${endpoint}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`DataForSEO ${endpoint} failed: ${res.status}`);
  }
  return res.json();
}

// ─── On-Page / Site Audit ────────────────────────────────────────────────────

export async function createSiteAuditTask(domain: string) {
  return dfsPost("/on_page/task_post", [
    {
      target: domain,
      max_crawl_pages: 100,
      load_resources: true,
      enable_javascript: false,
      store_raw_html: false,
    },
  ]);
}

export async function getSiteAuditSummary(taskId: string) {
  return dfsPost("/on_page/summary", [{ id: taskId }]);
}

export async function getSiteAuditIssues(taskId: string) {
  return dfsPost("/on_page/pages", [
    {
      id: taskId,
      limit: 100,
      filters: [["checks.is_4xx_code", "=", true]],
    },
  ]);
}

// ─── Backlinks ────────────────────────────────────────────────────────────────

export async function getBacklinkSummary(target: string) {
  return dfsPost("/backlinks/summary/live", [
    {
      target,
      internal_list_limit: 10,
      external_list_limit: 10,
      include_subdomains: true,
    },
  ]);
}

export async function getBacklinks(target: string, limit = 100) {
  return dfsPost("/backlinks/backlinks/live", [
    {
      target,
      limit,
      mode: "as_is",
      include_spam_score: true,
    },
  ]);
}

export async function getReferringDomains(target: string, limit = 50) {
  return dfsPost("/backlinks/referring_domains/live", [
    { target, limit, include_subdomains: true },
  ]);
}

// ─── Rank Tracking (SERP) ────────────────────────────────────────────────────

export async function getSerpRanking(
  keyword: string,
  locationCode: number = 2840,
  languageCode: string = "en",
  device: string = "desktop"
) {
  return dfsPost("/serp/google/organic/live/advanced", [
    {
      keyword,
      location_code: locationCode,
      language_code: languageCode,
      device,
      calculate_rectangles: false,
    },
  ]);
}

export async function getKeywordData(keywords: string[]) {
  return dfsPost("/keywords_data/google_ads/search_volume/live", [
    {
      keywords,
      location_code: 2840,
      language_code: "en",
    },
  ]);
}

// ─── Backlinks with Spam Detection ───────────────────────────────────────────

export interface BacklinkEntry {
  domain: string;
  url: string;
  anchor: string;
  spamScore: number;     // 0-100: DataForSEO spam score. >60 = toxic
  domainRank: number;    // DataForSEO domain authority equivalent (0-100)
  dofollow: boolean;
  firstSeen: string | null;
  toxic: boolean;
}

export interface BacklinkSummaryResult {
  domainRank: number;       // DataForSEO domain_rank (0-100, like Moz DA)
  backlinksTotal: number;
  referringDomains: number;
  spamScore: number;        // Site-wide average spam score
  backlinks: BacklinkEntry[];
  toxicLinks: BacklinkEntry[];
}

export async function getBacklinkProfile(domain: string, limit = 200): Promise<BacklinkSummaryResult> {
  // Fetch summary (for domain rank + totals)
  const summaryData = await dfsPost("/backlinks/summary/live", [
    {
      target: domain,
      internal_list_limit: 10,
      external_list_limit: 10,
      include_subdomains: true,
    },
  ]);

  const summaryResult = summaryData?.tasks?.[0]?.result?.[0] as Record<string, unknown> | undefined;
  const domainRank = typeof summaryResult?.rank === "number" ? summaryResult.rank : 0;
  const backlinksTotal = typeof summaryResult?.backlinks === "number" ? summaryResult.backlinks : 0;
  const referringDomains = typeof summaryResult?.referring_domains === "number" ? summaryResult.referring_domains : 0;

  // Fetch individual backlinks with spam scores
  const linksData = await dfsPost("/backlinks/backlinks/live", [
    {
      target: domain,
      limit,
      mode: "as_is",
      include_spam_score: true,
      filters: [["dofollow", "=", true]],
    },
  ]);

  const items = (linksData?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];

  const backlinks: BacklinkEntry[] = items.map((item) => {
    const spam = typeof item.backlink_spam_score === "number" ? item.backlink_spam_score : 0;
    return {
      domain: typeof item.domain_from === "string" ? item.domain_from : "",
      url: typeof item.url_from === "string" ? item.url_from : "",
      anchor: typeof item.anchor === "string" ? item.anchor : "",
      spamScore: Math.round(spam),
      domainRank: typeof item.domain_from_rank === "number" ? item.domain_from_rank : 0,
      dofollow: item.dofollow === true,
      firstSeen: typeof item.first_seen === "string" ? item.first_seen : null,
      toxic: spam > 60,
    };
  });

  const toxicLinks = backlinks.filter((b) => b.toxic);
  const avgSpam = backlinks.length > 0
    ? Math.round(backlinks.reduce((s, b) => s + b.spamScore, 0) / backlinks.length)
    : 0;

  return {
    domainRank,
    backlinksTotal,
    referringDomains,
    spamScore: avgSpam,
    backlinks,
    toxicLinks,
  };
}

// ─── Multi-Page On-Page Analysis (sitemap-based) ──────────────────────────────
// Fetches the sitemap, extracts URLs, then runs instant analysis on each page
// up to the plan-based page limit.

export interface PageAuditResult {
  url: string;
  score: number;
  title: string | null;
  description: string | null;
  hasCanonical: boolean;
  hasSchema: boolean;
  loadTimeMs: number;
  responseCode: number;
  issues: SiteAuditIssue[];
}

export async function crawlSitePages(domain: string, maxPages: number): Promise<PageAuditResult[]> {
  // Fetch sitemap and extract URLs
  const urls = await extractSitemapUrls(domain, maxPages);

  if (urls.length === 0) {
    // Fallback: just analyse homepage
    const result = await analyzePageInstant(`https://${domain}`);
    return [{
      url: `https://${domain}`,
      score: result.score,
      title: result.title,
      description: result.description,
      hasCanonical: result.hasCanonical,
      hasSchema: result.hasSchema,
      loadTimeMs: result.loadTimeMs,
      responseCode: result.responseCode,
      issues: result.issues,
    }];
  }

  // Run in batches of 5 to avoid rate limits
  const results: PageAuditResult[] = [];
  for (let i = 0; i < urls.length; i += 5) {
    const batch = urls.slice(i, i + 5);
    const settled = await Promise.allSettled(
      batch.map(async (url) => {
        const r = await analyzePageInstant(url);
        return { url, score: r.score, title: r.title, description: r.description, hasCanonical: r.hasCanonical, hasSchema: r.hasSchema, loadTimeMs: r.loadTimeMs, responseCode: r.responseCode, issues: r.issues } as PageAuditResult;
      })
    );
    for (const r of settled) {
      if (r.status === "fulfilled") results.push(r.value);
    }
  }
  return results;
}

async function extractSitemapUrls(domain: string, maxUrls: number): Promise<string[]> {
  const sitemapCandidates = [
    `https://${domain}/sitemap.xml`,
    `https://${domain}/sitemap_index.xml`,
    `https://${domain}/sitemap/sitemap.xml`,
  ];

  for (const sitemapUrl of sitemapCandidates) {
    try {
      const res = await fetch(sitemapUrl, {
        headers: { "User-Agent": "SearchAuditPro/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const xml = await res.text();

      // Parse <loc> tags from sitemap
      const locs = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)]
        .map((m) => m[1].trim())
        .filter((u) => u.startsWith("http"))
        .slice(0, maxUrls);

      if (locs.length > 0) return locs;
    } catch { /* try next */ }
  }
  return [];
}

// ─── Local SEO / Business Data ───────────────────────────────────────────────

export async function getLocalBusinessInfo(
  keyword: string,
  locationCode: number = 2840
) {
  return dfsPost("/business_data/google/my_business_info/live", [
    { keyword, location_code: locationCode, language_code: "en" },
  ]);
}

export async function getLocalCitations(businessName: string, location: string) {
  return dfsPost("/business_data/business_listings/search/live", [
    {
      keyword: businessName,
      location_name: location,
      limit: 50,
    },
  ]);
}

// ─── On-Page Instant Analysis ─────────────────────────────────────────────────
// Analyzes a single URL synchronously — no task needed, results immediate.

export interface SiteAuditIssue {
  type: string;
  severity: "critical" | "warning" | "info";
  description: string;
  count: number;
}

export interface InstantAuditResult {
  score: number;
  crawledPages: number;
  issues: SiteAuditIssue[];
  title: string | null;
  description: string | null;
  hasCanonical: boolean;
  hasSchema: boolean;
  loadTimeMs: number;
  responseCode: number;
}

export async function analyzePageInstant(url: string): Promise<InstantAuditResult> {
  const data = await dfsPost("/on_page/instant_pages", [
    {
      url,
      load_resources: true,
      enable_javascript: false,
      custom_js: null,
      browser_preset: null,
    },
  ]);

  const item = data?.tasks?.[0]?.result?.[0]?.items?.[0] as Record<string, unknown> | undefined;

  if (!item) {
    return {
      score: 0, crawledPages: 0, issues: [{ type: "unreachable", severity: "critical", description: "Page could not be fetched", count: 1 }],
      title: null, description: null, hasCanonical: false, hasSchema: false, loadTimeMs: 0, responseCode: 0,
    };
  }

  const meta = (item.meta ?? {}) as Record<string, unknown>;
  const checks = (item.checks ?? {}) as Record<string, unknown>;
  const onPageScore = typeof item.onpage_score === "number" ? Math.round(item.onpage_score) : 50;
  const loadTime = typeof item.page_timing === "object" && item.page_timing
    ? (((item.page_timing as Record<string, unknown>).time_to_interactive as number) ?? 0)
    : 0;

  const issues: SiteAuditIssue[] = [];

  if (!meta.title) issues.push({ type: "missing_title", severity: "critical", description: "Missing <title> tag", count: 1 });
  else if (String(meta.title).length < 30) issues.push({ type: "short_title", severity: "warning", description: "Title tag is too short (<30 chars)", count: 1 });
  else if (String(meta.title).length > 70) issues.push({ type: "long_title", severity: "warning", description: "Title tag is too long (>70 chars)", count: 1 });

  if (!meta.description) issues.push({ type: "missing_description", severity: "warning", description: "Missing meta description", count: 1 });
  else if (String(meta.description).length < 70) issues.push({ type: "short_description", severity: "warning", description: "Meta description too short (<70 chars)", count: 1 });

  if (checks.is_4xx_code) issues.push({ type: "4xx_error", severity: "critical", description: "Page returns 4xx error code", count: 1 });
  if (checks.is_5xx_code) issues.push({ type: "5xx_error", severity: "critical", description: "Page returns 5xx server error", count: 1 });
  if (!checks.has_html_doctype) issues.push({ type: "missing_doctype", severity: "warning", description: "Missing HTML doctype declaration", count: 1 });
  if (checks.is_http) issues.push({ type: "no_https", severity: "critical", description: "Page served over HTTP (not HTTPS)", count: 1 });
  if (!checks.has_h1_tag) issues.push({ type: "missing_h1", severity: "warning", description: "Missing H1 heading tag", count: 1 });
  if (checks.duplicate_title) issues.push({ type: "duplicate_title", severity: "warning", description: "Duplicate title tag found", count: 1 });
  if (checks.no_image_alt) issues.push({ type: "missing_alt", severity: "info", description: "Images missing alt text", count: 1 });
  if (loadTime > 4000) issues.push({ type: "slow_load", severity: "warning", description: `Slow page load: ${(loadTime / 1000).toFixed(1)}s (>4s)`, count: 1 });

  return {
    score: onPageScore,
    crawledPages: 1,
    issues,
    title: typeof meta.title === "string" ? meta.title : null,
    description: typeof meta.description === "string" ? meta.description : null,
    hasCanonical: !!(meta.canonical),
    hasSchema: !!(checks.has_structured_data),
    loadTimeMs: loadTime,
    responseCode: typeof item.status_code === "number" ? item.status_code : 200,
  };
}

// ─── Keyword Research ─────────────────────────────────────────────────────────

export interface KeywordMetric {
  keyword: string;
  volume: number | null;
  cpc: number | null;
  competition: number | null; // 0-1
  difficulty: number | null;  // 0-100
  intent: "informational" | "transactional" | "navigational" | "commercial" | null;
  trend: number[];
}

function deriveIntent(keyword: string, cpc: number | null, comp: number | null): KeywordMetric["intent"] {
  const k = keyword.toLowerCase();
  if (/^(buy|purchase|order|shop|price|cheap|discount|deal|coupon|near me)/.test(k) || (cpc !== null && cpc > 3)) return "transactional";
  if (/^(how|why|what|when|where|who|guide|tutorial|tips|examples|vs\.)/.test(k)) return "informational";
  if (/^(best|top|review|compare|vs|alternative)/.test(k) || (comp !== null && comp > 0.8)) return "commercial";
  if (/\.(com|net|org|io)$/.test(k) || /^(login|sign in|account|download|app)/.test(k)) return "navigational";
  return "informational";
}

export async function getKeywordOverview(
  keywords: string[],
  locationCode = 2840,
  languageCode = "en"
): Promise<KeywordMetric[]> {
  const data = await dfsPost("/keywords_data/google_ads/search_volume/live", [
    { keywords, location_code: locationCode, language_code: languageCode },
  ]);
  const items = (data?.tasks?.[0]?.result ?? []) as Record<string, unknown>[];
  return items.map((item) => {
    const kw = String(item.keyword ?? "");
    const vol = typeof item.search_volume === "number" ? item.search_volume : null;
    const cpc = typeof item.cpc === "number" ? Math.round(item.cpc * 100) / 100 : null;
    const comp = typeof item.competition === "number" ? item.competition : null;
    const trend = Array.isArray(item.monthly_searches)
      ? (item.monthly_searches as Record<string, unknown>[]).map((m) => typeof m.search_volume === "number" ? m.search_volume : 0).reverse().slice(0, 12)
      : [];
    // difficulty approximated from competition + CPC
    const diff = comp !== null ? Math.round(comp * 100) : null;
    return { keyword: kw, volume: vol, cpc, competition: comp, difficulty: diff, intent: deriveIntent(kw, cpc, comp), trend };
  });
}

export async function getKeywordIdeas(
  seeds: string[],
  locationCode = 2840,
  languageCode = "en",
  limit = 100
): Promise<KeywordMetric[]> {
  const data = await dfsPost("/keywords_data/google_ads/keywords_for_keywords/live", [
    { keywords: seeds, location_code: locationCode, language_code: languageCode, limit },
  ]);
  const items = (data?.tasks?.[0]?.result ?? []) as Record<string, unknown>[];
  return items.map((item) => {
    const kw = String(item.keyword ?? "");
    const vol = typeof item.search_volume === "number" ? item.search_volume : null;
    const cpc = typeof item.cpc === "number" ? Math.round(item.cpc * 100) / 100 : null;
    const comp = typeof item.competition === "number" ? item.competition : null;
    const diff = comp !== null ? Math.round(comp * 100) : null;
    return { keyword: kw, volume: vol, cpc, competition: comp, difficulty: diff, intent: deriveIntent(kw, cpc, comp), trend: [] };
  });
}

// ─── Domain Analytics (DataForSEO Labs) ──────────────────────────────────────

export interface DomainOverviewResult {
  domain: string;
  organicKeywords: number;
  organicTraffic: number;
  paidKeywords: number;
  domainRank: number;
  etv: number; // estimated traffic value
  topKeywords: { keyword: string; position: number; traffic: number }[];
  competitorDomains: { domain: string; intersections: number; rank: number }[];
}

export async function getDomainRankOverview(
  domain: string,
  locationCode = 2840,
  languageCode = "en"
): Promise<DomainOverviewResult> {
  const [overviewData, keywordsData, competitorsData] = await Promise.all([
    dfsPost("/dataforseo_labs/google/domain_rank_overview/live", [
      { target: domain, location_code: locationCode, language_code: languageCode },
    ]),
    dfsPost("/dataforseo_labs/google/ranked_keywords/live", [
      { target: domain, location_code: locationCode, language_code: languageCode, limit: 10, order_by: ["keyword_data.keyword_info.search_volume,desc"] },
    ]),
    dfsPost("/dataforseo_labs/google/competitors_domain/live", [
      { target: domain, location_code: locationCode, language_code: languageCode, limit: 5 },
    ]),
  ]);

  const metrics = overviewData?.tasks?.[0]?.result?.[0]?.metrics?.organic as Record<string, unknown> | undefined;
  const kwItems = (keywordsData?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  const compItems = (competitorsData?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];

  const topKeywords = kwItems.map((i) => {
    const kd = (i.keyword_data as Record<string, unknown>) ?? {};
    const ki = (kd.keyword_info as Record<string, unknown>) ?? {};
    return {
      keyword: String(kd.keyword ?? ""),
      position: typeof i.ranked_serp_element === "object" && i.ranked_serp_element
        ? (((i.ranked_serp_element as Record<string, unknown>).serp_item as Record<string, unknown>)?.rank_absolute as number) ?? 0
        : 0,
      traffic: typeof ki.search_volume === "number" ? Math.round((ki.search_volume as number) * 0.3) : 0,
    };
  });

  const competitors = compItems.map((i) => ({
    domain: String(i.domain ?? ""),
    intersections: typeof i.intersections === "number" ? i.intersections : 0,
    rank: typeof i.avg_position === "number" ? Math.round(i.avg_position) : 0,
  }));

  return {
    domain,
    organicKeywords: typeof metrics?.count === "number" ? metrics.count : 0,
    organicTraffic: typeof metrics?.etv === "number" ? Math.round(metrics.etv) : 0,
    paidKeywords: 0,
    domainRank: typeof metrics?.pos_1 === "number" ? metrics.pos_1 : 0,
    etv: typeof metrics?.etv === "number" ? Math.round(metrics.etv) : 0,
    topKeywords,
    competitorDomains: competitors,
  };
}

// Keyword gap: keywords competitors rank for but you don't (or rank lower)
export interface KeywordGapItem {
  keyword: string;
  yourPosition: number | null;
  competitorPositions: { domain: string; position: number | null }[];
  volume: number | null;
  opportunity: "missing" | "weak" | "strong";
}

export async function getKeywordGap(
  yourDomain: string,
  competitorDomains: string[],
  locationCode = 2840,
  languageCode = "en",
  limit = 100
): Promise<KeywordGapItem[]> {
  const targets = [yourDomain, ...competitorDomains].map((url) => ({ url, type: "domain" }));
  const data = await dfsPost("/dataforseo_labs/google/keyword_gap/live", [
    { targets, location_code: locationCode, language_code: languageCode, limit, filters: [["keyword_data.keyword_info.search_volume", ">", 100]] },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((item) => {
    const kd = (item.keyword_data as Record<string, unknown>) ?? {};
    const ki = (kd.keyword_info as Record<string, unknown>) ?? {};
    const positions = (item.ranked_elements as Record<string, unknown>[]) ?? [];
    const yourPos = positions.find((p) => String(p.url ?? "").includes(yourDomain));
    const yourRank = typeof yourPos?.rank_absolute === "number" ? yourPos.rank_absolute : null;

    const compPositions = competitorDomains.map((d) => {
      const cp = positions.find((p) => String(p.url ?? "").includes(d));
      return { domain: d, position: typeof cp?.rank_absolute === "number" ? cp.rank_absolute : null };
    });

    const opportunity: KeywordGapItem["opportunity"] = yourRank === null ? "missing" : yourRank > 20 ? "weak" : "strong";
    return {
      keyword: String(kd.keyword ?? ""),
      yourPosition: yourRank,
      competitorPositions: compPositions,
      volume: typeof ki.search_volume === "number" ? ki.search_volume : null,
      opportunity,
    };
  });
}

// ─── Multi-Engine SERP ────────────────────────────────────────────────────────

export interface MultiEngineRankResult {
  engine: "google" | "bing" | "yahoo";
  position: number | null;
  url: string | null;
  title: string | null;
}

export async function getBingRanking(
  keyword: string,
  domain: string,
  locationCode = 2840
): Promise<MultiEngineRankResult> {
  const data = await dfsPost("/serp/bing/organic/live/regular", [
    { keyword, location_code: locationCode, language_code: "en" },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  const clean = domain.replace(/^https?:\/\//i, "").replace(/^www\./i, "").toLowerCase().split("/")[0];
  const match = items.find((i) => {
    const url = String(i.url ?? "").replace(/^https?:\/\//i, "").replace(/^www\./i, "").toLowerCase();
    return url.startsWith(clean) || url.includes(clean);
  });
  return {
    engine: "bing",
    position: match ? (typeof match.rank_absolute === "number" ? match.rank_absolute : null) : null,
    url: match ? (typeof match.url === "string" ? match.url : null) : null,
    title: match ? (typeof match.title === "string" ? match.title : null) : null,
  };
}

export async function getYahooRanking(
  keyword: string,
  domain: string,
  locationCode = 2840
): Promise<MultiEngineRankResult> {
  const data = await dfsPost("/serp/yahoo/organic/live/regular", [
    { keyword, location_code: locationCode, language_code: "en" },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  const clean = domain.replace(/^https?:\/\//i, "").replace(/^www\./i, "").toLowerCase().split("/")[0];
  const match = items.find((i) => {
    const url = String(i.url ?? "").replace(/^https?:\/\//i, "").replace(/^www\./i, "").toLowerCase();
    return url.startsWith(clean) || url.includes(clean);
  });
  return {
    engine: "yahoo",
    position: match ? (typeof match.rank_absolute === "number" ? match.rank_absolute : null) : null,
    url: match ? (typeof match.url === "string" ? match.url : null) : null,
    title: match ? (typeof match.title === "string" ? match.title : null) : null,
  };
}

// SERP Feature detection: featured snippet, map pack, shopping, AI overview, PAA
export interface SerpFeatures {
  hasFeaturedSnippet: boolean;
  hasMapPack: boolean;
  hasShopping: boolean;
  hasVideoCarousel: boolean;
  hasPeopleAlsoAsk: boolean;
  hasAiOverview: boolean;
  youInFeaturedSnippet: boolean;
  youInMapPack: boolean;
}

export async function getSerpFeatures(
  keyword: string,
  domain: string,
  locationCode = 2840
): Promise<SerpFeatures> {
  const data = await dfsPost("/serp/google/organic/live/advanced", [
    { keyword, location_code: locationCode, language_code: "en", device: "desktop", calculate_rectangles: false },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  const clean = domain.replace(/^https?:\/\//i, "").replace(/^www\./i, "").toLowerCase();
  const types = items.map((i) => String(i.type ?? ""));

  const featuredSnippet = items.find((i) => i.type === "featured_snippet");
  const mapPack = items.find((i) => i.type === "local_pack" || i.type === "maps");

  return {
    hasFeaturedSnippet: types.includes("featured_snippet"),
    hasMapPack: types.includes("local_pack") || types.includes("maps"),
    hasShopping: types.includes("shopping"),
    hasVideoCarousel: types.includes("video"),
    hasPeopleAlsoAsk: types.includes("people_also_ask"),
    hasAiOverview: types.includes("answer_box") || types.includes("ai_overview"),
    youInFeaturedSnippet: !!featuredSnippet && JSON.stringify(featuredSnippet).toLowerCase().includes(clean),
    youInMapPack: !!mapPack && JSON.stringify(mapPack).toLowerCase().includes(clean),
  };
}

// ─── AI Summary (Google AI Overview) ─────────────────────────────────────────

export interface AiSummaryResult {
  query: string;
  hasSummary: boolean;
  summaryText: string | null;
  brandMentioned: boolean;
  sources: string[];
}

export async function getAiSummary(
  query: string,
  domain: string,
  locationCode = 2840
): Promise<AiSummaryResult> {
  // Try AI summary endpoint first, fall back to organic SERP scanning
  try {
    const data = await dfsPost("/serp/google/ai_overview/live/advanced", [
      { keyword: query, location_code: locationCode, language_code: "en" },
    ]);
    const result = data?.tasks?.[0]?.result?.[0];
    const aiItem = (result?.items ?? []).find((i: Record<string, unknown>) => i.type === "ai_overview");
    if (aiItem) {
      const text = String(aiItem.text ?? aiItem.description ?? "");
      const sources = ((aiItem.references ?? []) as Record<string, unknown>[]).map((r) => String(r.url ?? r.domain ?? "")).filter(Boolean);
      const clean = domain.replace(/^https?:\/\//i, "").replace(/^www\./i, "").toLowerCase();
      return {
        query,
        hasSummary: true,
        summaryText: text || null,
        brandMentioned: text.toLowerCase().includes(clean) || sources.some((s) => s.toLowerCase().includes(clean)),
        sources,
      };
    }
  } catch { /* fall through to organic check */ }

  // Fallback: scan organic SERP for featured snippets / answer boxes
  const data = await dfsPost("/serp/google/organic/live/advanced", [
    { keyword: query, location_code: locationCode, language_code: "en", device: "desktop", calculate_rectangles: false },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  const answerItems = items.filter((i) => i.type === "featured_snippet" || i.type === "answer_box");
  const clean = domain.replace(/^https?:\/\//i, "").replace(/^www\./i, "").toLowerCase();
  const text = answerItems.map((i) => String(i.description ?? i.pre_snippet ?? "")).join(" ");

  return {
    query,
    hasSummary: answerItems.length > 0,
    summaryText: text || null,
    brandMentioned: text.toLowerCase().includes(clean),
    sources: [],
  };
}

// ─── Extended Backlinks ───────────────────────────────────────────────────────

export interface AnchorItem {
  anchor: string;
  backlinks: number;
  referringDomains: number;
  firstSeen: string | null;
  lastSeen: string | null;
}

export async function getBacklinkAnchors(
  domain: string,
  limit = 50
): Promise<AnchorItem[]> {
  const data = await dfsPost("/backlinks/anchors/live", [
    { target: domain, limit, mode: "as_is", order_by: ["backlinks,desc"] },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    anchor: String(i.anchor ?? ""),
    backlinks: typeof i.backlinks === "number" ? i.backlinks : 0,
    referringDomains: typeof i.referring_domains === "number" ? i.referring_domains : 0,
    firstSeen: typeof i.first_seen === "string" ? i.first_seen : null,
    lastSeen: typeof i.last_seen === "string" ? i.last_seen : null,
  }));
}

export interface BacklinkGapItem {
  domain: string;
  backlinks: number;
  domainRank: number;
  hasYours: boolean;
  hasCompetitor: boolean;
  url: string | null;
  anchor: string | null;
}

export async function getBacklinkGap(
  yourDomain: string,
  competitorDomains: string[],
  limit = 100
): Promise<BacklinkGapItem[]> {
  // Domains that link to competitors but not to you
  const data = await dfsPost("/backlinks/domain_intersection/live", [
    {
      targets: competitorDomains.map((d) => ({ url: d, type: "domain" })),
      exclude_targets: [{ url: yourDomain, type: "domain" }],
      limit,
      main_domain: true,
      include_subdomains: false,
      order_by: ["domain_from_rank,desc"],
    },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    domain: String(i.domain_from ?? ""),
    backlinks: typeof i.backlinks === "number" ? i.backlinks : 0,
    domainRank: typeof i.domain_from_rank === "number" ? i.domain_from_rank : 0,
    hasYours: false,
    hasCompetitor: true,
    url: typeof i.url_from === "string" ? i.url_from : null,
    anchor: typeof i.anchor === "string" ? i.anchor : null,
  }));
}

export interface ReferringDomainItem {
  domain: string;
  backlinks: number;
  domainRank: number;
  dofollow: boolean;
  firstSeen: string | null;
  country: string | null;
  spamScore: number;
}

export async function getReferringDomainsDetailed(
  domain: string,
  limit = 100
): Promise<ReferringDomainItem[]> {
  const data = await dfsPost("/backlinks/referring_domains/live", [
    { target: domain, limit, include_subdomains: true, order_by: ["domain_from_rank,desc"] },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    domain: String(i.domain ?? i.referring_domain ?? ""),
    backlinks: typeof i.backlinks === "number" ? i.backlinks : 0,
    domainRank: typeof i.domain_from_rank === "number" ? i.domain_from_rank : 0,
    dofollow: i.dofollow !== false,
    firstSeen: typeof i.first_seen === "string" ? i.first_seen : null,
    country: typeof i.country === "string" ? i.country : null,
    spamScore: typeof i.backlink_spam_score === "number" ? i.backlink_spam_score : 0,
  }));
}

// ─── Merchant / Google Shopping ───────────────────────────────────────────────

export interface MerchantResult {
  position: number | null;
  title: string | null;
  price: string | null;
  seller: string | null;
  rating: number | null;
  reviews: number | null;
  url: string | null;
  imageUrl: string | null;
}

export async function getGoogleShoppingRankings(
  keyword: string,
  domain: string,
  locationCode = 2840
): Promise<{ items: MerchantResult[]; yourItems: MerchantResult[] }> {
  const data = await dfsPost("/serp/google/shopping/live/advanced", [
    { keyword, location_code: locationCode, language_code: "en" },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  const clean = domain.replace(/^https?:\/\//i, "").replace(/^www\./i, "").toLowerCase();

  const parsed: MerchantResult[] = items
    .filter((i) => i.type === "shopping" || i.type === "paid")
    .map((i) => ({
      position: typeof i.rank_absolute === "number" ? i.rank_absolute : null,
      title: typeof i.title === "string" ? i.title : null,
      price: typeof i.price === "string" ? i.price : typeof i.price === "number" ? String(i.price) : null,
      seller: typeof i.seller === "string" ? i.seller : null,
      rating: null,
      reviews: null,
      url: typeof i.url === "string" ? i.url : null,
      imageUrl: typeof i.image_url === "string" ? i.image_url : null,
    }));

  const yourItems = parsed.filter((i) => (i.url ?? "").toLowerCase().includes(clean));
  return { items: parsed.slice(0, 20), yourItems };
}

// ─── Business Data / GMB / Reviews ───────────────────────────────────────────

export interface BusinessReview {
  author: string;
  rating: number;
  text: string | null;
  date: string | null;
  response: string | null;
}

export interface BusinessInfoFull {
  name: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  categories: string[];
  hoursJson: string | null;
  placeId: string | null;
  latitude: number | null;
  longitude: number | null;
}

export async function getGmbDetails(
  businessName: string,
  locationCode = 2840
): Promise<{ info: BusinessInfoFull; reviews: BusinessReview[] }> {
  const [infoData, reviewData] = await Promise.all([
    dfsPost("/business_data/google/my_business_info/live", [
      { keyword: businessName, location_code: locationCode, language_code: "en" },
    ]),
    dfsPost("/business_data/google/reviews/live", [
      { keyword: businessName, location_code: locationCode, language_code: "en", depth: 10 },
    ]),
  ]);

  const infoItem = (infoData?.tasks?.[0]?.result ?? []) as Record<string, unknown>[];
  const first = infoItem[0] ?? {};
  const info: BusinessInfoFull = {
    name: typeof first.title === "string" ? first.title : null,
    address: typeof first.address === "string" ? first.address : null,
    phone: typeof first.phone === "string" ? first.phone : null,
    website: typeof first.domain === "string" ? first.domain : null,
    rating: typeof first.rating === "number" ? first.rating : null,
    reviewCount: typeof first.reviews_count === "number" ? first.reviews_count : null,
    categories: Array.isArray(first.category) ? (first.category as string[]) : [],
    hoursJson: first.work_hours ? JSON.stringify(first.work_hours) : null,
    placeId: typeof first.place_id === "string" ? first.place_id : null,
    latitude: typeof (first.coordinates as Record<string, unknown>)?.latitude === "number" ? (first.coordinates as Record<string, unknown>).latitude as number : null,
    longitude: typeof (first.coordinates as Record<string, unknown>)?.longitude === "number" ? (first.coordinates as Record<string, unknown>).longitude as number : null,
  };

  const reviewItems = (reviewData?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  const reviews: BusinessReview[] = reviewItems.map((r) => ({
    author: String(r.author_title ?? r.profile_name ?? "Anonymous"),
    rating: typeof (r.rating as Record<string, unknown>)?.value === "number"
      ? ((r.rating as Record<string, unknown>).value as number)
      : typeof r.rating === "number"
      ? (r.rating as number)
      : 0,
    text: typeof r.review_text === "string" ? (r.review_text as string) : null,
    date: typeof r.timestamp === "string" ? (r.timestamp as string) : null,
    response: typeof r.owner_answer === "string" ? (r.owner_answer as string) : null,
  }));

  return { info, reviews };
}

// ─── Local Citation Directories / NAP Checking ───────────────────────────────

export interface CitationDirectoryResult {
  directory: string;
  url: string;
  found: boolean;
  nameMatch: boolean;
  addressMatch: boolean;
  phoneMatch: boolean;
  status: "consistent" | "inconsistent" | "missing";
  listingUrl: string | null;
}

// Key citation directories to check NAP consistency
const CITATION_DIRECTORIES = [
  { name: "Google Business Profile", searchBase: "https://www.google.com/search?q=" },
  { name: "Yelp", searchBase: "https://www.yelp.com/search?find_desc=" },
  { name: "Yellow Pages", searchBase: "https://www.yellowpages.com/search?search_terms=" },
  { name: "Bing Places", searchBase: "https://www.bingplaces.com/SearchForms?q=" },
  { name: "Facebook", searchBase: "https://www.facebook.com/search/pages/?q=" },
  { name: "Apple Maps", searchBase: "https://maps.apple.com/?q=" },
  { name: "Foursquare", searchBase: "https://foursquare.com/explore?q=" },
  { name: "TripAdvisor", searchBase: "https://www.tripadvisor.com/Search?q=" },
  { name: "Angi (Angie's List)", searchBase: "https://www.angi.com/search?what=" },
  { name: "Better Business Bureau", searchBase: "https://www.bbb.org/search?find_text=" },
  { name: "Houzz", searchBase: "https://www.houzz.com/professionals/search?q=" },
  { name: "Nextdoor", searchBase: "https://nextdoor.com/find-neighborhood/?query=" },
];

export async function checkBusinessListings(
  businessName: string,
  address: string,
  phone: string,
  locationName: string,
  limit = 50
): Promise<CitationDirectoryResult[]> {
  // Query DataForSEO business listings API to find mentions
  let listings: Record<string, unknown>[] = [];
  try {
    const data = await dfsPost("/business_data/business_listings/search/live", [
      { keyword: businessName, location_name: locationName, limit },
    ]);
    listings = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  } catch { /* offline – return directory list with missing status */ }

  const normalizePhone = (p: string) => p.replace(/\D/g, "").slice(-10);
  const phoneNorm = normalizePhone(phone);
  const addrLower = address.toLowerCase().split(",")[0].trim(); // street address for comparison

  return CITATION_DIRECTORIES.slice(0, 12).map((dir) => {
    const match = listings.find((l) => {
      const title = String(l.title ?? l.name ?? "").toLowerCase();
      return title.includes(businessName.split(" ")[0].toLowerCase());
    });

    if (!match) {
      return {
        directory: dir.name,
        url: `${dir.searchBase}${encodeURIComponent(businessName)}`,
        found: false,
        nameMatch: false,
        addressMatch: false,
        phoneMatch: false,
        status: "missing" as const,
        listingUrl: null,
      };
    }

    const listingPhone = normalizePhone(String(match.phone ?? ""));
    const listingAddr = String((match.address_info as Record<string, unknown>)?.borough ?? match.address ?? "").toLowerCase();
    const nameMatch = String(match.title ?? "").toLowerCase().includes(businessName.toLowerCase().split(" ")[0]);
    const phoneMatch = listingPhone.length > 0 && phoneNorm.length > 0 && (listingPhone === phoneNorm || listingPhone.endsWith(phoneNorm.slice(-7)));
    const addressMatch = listingAddr.length > 0 && (listingAddr.includes(addrLower.split(" ")[0].toLowerCase()) || addrLower.includes(listingAddr.split(" ")[0].toLowerCase()));

    const consistent = nameMatch && (phoneMatch || phoneNorm.length === 0) && (addressMatch || addrLower.length === 0);
    return {
      directory: dir.name,
      url: `${dir.searchBase}${encodeURIComponent(businessName)}`,
      found: true,
      nameMatch,
      addressMatch,
      phoneMatch,
      status: consistent ? ("consistent" as const) : ("inconsistent" as const),
      listingUrl: typeof match.url === "string" ? match.url : null,
    };
  });
}

// ─── Domain Technologies (domain_analytics) ──────────────────────────────────

export interface TechItem {
  name: string;
  category: string;
  version: string | null;
}

export async function getDomainTechnologies(domain: string): Promise<TechItem[]> {
  const data = await dfsPost("/domain_analytics/technologies/domain_technologies/live", [
    { targets: [domain] },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  const techList: TechItem[] = [];
  for (const item of items) {
    const technologies = (item.technologies ?? []) as Record<string, unknown>[];
    for (const tech of technologies) {
      const categories = tech.categories as unknown[]; // Cast to unknown array
      techList.push({
        name: String(tech.name ?? ""),
        category: String((Array.isArray(categories) ? categories[0] : null) ?? "Other"),
        version: typeof tech.version === "string" ? tech.version : null,
      });
    }
  }
  return techList;
}

// ─── SERP Competitors (Labs) ──────────────────────────────────────────────────

export interface SerpCompetitorItem {
  domain: string;
  avgPosition: number;
  sumPosition: number;
  intersections: number;
  relevance: number;
  visibilityScore: number;
}

export async function getSerpCompetitors(
  keywords: string[],
  locationCode = 2840,
  languageCode = "en"
): Promise<SerpCompetitorItem[]> {
  const data = await dfsPost("/dataforseo_labs/google/serp_competitors/live", [
    { keywords, location_code: locationCode, language_code: languageCode },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.slice(0, 20).map((i) => ({
    domain: String(i.domain ?? ""),
    avgPosition: typeof i.avg_position === "number" ? Math.round(i.avg_position * 10) / 10 : 0,
    sumPosition: typeof i.sum_position === "number" ? i.sum_position : 0,
    intersections: typeof i.intersections === "number" ? i.intersections : 0,
    relevance: typeof i.relevance === "number" ? Math.round(i.relevance * 100) : 0,
    visibilityScore: typeof i.se_type === "string" ? 0 : Math.round(
      ((typeof i.intersections === "number" ? i.intersections : 0) / (keywords.length || 1)) * 100
    ),
  }));
}

