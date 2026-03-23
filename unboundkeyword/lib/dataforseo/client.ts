const DFS_BASE = "https://api.dataforseo.com/v3";

type DfsRecord = Record<string, unknown>;

function getAuthHeaders() {
  const login = process.env.DATAFORSEO_LOGIN ?? "";
  const password = process.env.DATAFORSEO_PASSWORD ?? "";
  const encoded = Buffer.from(`${login}:${password}`).toString("base64");
  return {
    Authorization: `Basic ${encoded}`,
    "Content-Type": "application/json",
  };
}

async function dfsRequest(method: "GET" | "POST", endpoint: string, body?: unknown) {
  const res = await fetch(`${DFS_BASE}${endpoint}`, {
    method,
    headers: getAuthHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`DataForSEO ${endpoint} failed: ${res.status}${errorText ? ` ${errorText}` : ""}`);
  }
  return res.json();
}

async function dfsPost(endpoint: string, body: unknown) {
  return dfsRequest("POST", endpoint, body);
}

async function dfsGet(endpoint: string) {
  return dfsRequest("GET", endpoint);
}

function getDfsTasks(response: unknown): DfsRecord[] {
  return Array.isArray((response as { tasks?: unknown })?.tasks)
    ? ((response as { tasks: DfsRecord[] }).tasks ?? [])
    : [];
}

function getDfsTaskIds(response: unknown): string[] {
  return getDfsTasks(response)
    .map((task) => (typeof task.id === "string" ? task.id : null))
    .filter((taskId): taskId is string => Boolean(taskId));
}

function getFirstTaskResult(response: unknown): DfsRecord | null {
  const firstTask = getDfsTasks(response)[0];
  if (!firstTask || !Array.isArray(firstTask.result)) return null;
  const firstResult = firstTask.result[0];
  return firstResult && typeof firstResult === "object" ? (firstResult as DfsRecord) : null;
}

function getFirstTaskItems(response: unknown): DfsRecord[] {
  const firstResult = getFirstTaskResult(response);
  return Array.isArray(firstResult?.items) ? (firstResult.items as DfsRecord[]) : [];
}

// ─── On-Page / Site Audit ────────────────────────────────────────────────────

export async function createSiteAuditTask(domain: string) {
  return dfsPost("/on_page/task_post", [
    {
      target: domain,
      max_crawl_pages: 5000,
      load_resources: true,
      enable_javascript: true,
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
  lighthousePerformance?: number | null;
  lighthouseAccessibility?: number | null;
  lighthouseBestPractices?: number | null;
  lighthouseSeo?: number | null;
  issues: SiteAuditIssue[];
}

export interface CrawlProgressUpdate {
  phase: "task" | "fallback";
  crawledPages: number;
  targetPages: number;
  pages: PageAuditResult[];
}

// ─── On-Page Audit Extras (errors, duplicate tags, broken links) ──────────────

export interface OnPageErrorItem {
  errorType: string;
  count: number;
  description: string;
  severity: "critical" | "warning" | "info";
}

export interface DuplicateTagItem {
  tagType: "title" | "description";
  value: string;
  pages: string[];
  count: number;
}

export interface OnPageLinkItem {
  urlFrom: string;
  urlTo: string;
  anchor: string | null;
  statusCode: number | null;
  linkType: "internal" | "external";
  doFollow: boolean;
}

export interface OnPageCrawlResult {
  pages: PageAuditResult[];
  taskId: string | null;
  errors: OnPageErrorItem[];
  duplicateTags: DuplicateTagItem[];
  brokenLinks: OnPageLinkItem[];
}

// Severity map for known DataForSEO error_type values
const ERROR_SEVERITY_MAP: Record<string, "critical" | "warning" | "info"> = {
  "4xx_page": "critical",
  "5xx_page": "critical",
  "broken_link": "critical",
  "redirect_loop": "critical",
  "http_page": "critical",
  "missing_title": "critical",
  "no_content_encoding": "critical",
  "duplicate_title_tag": "warning",
  "duplicate_description_tag": "warning",
  "missing_description": "warning",
  "missing_h1_tag": "warning",
  "missing_canonical": "warning",
  "broken_resources": "warning",
  "high_loading_time": "warning",
  "large_page_size": "warning",
  "redirect_chain": "warning",
  "no_image_alt": "info",
  "orphan_page": "info",
  "small_page_size": "info",
  "no_structured_data": "info",
};

function mapErrorSeverity(errType: string): "critical" | "warning" | "info" {
  return ERROR_SEVERITY_MAP[errType] ?? "info";
}

export async function getOnPageErrors(taskId: string, limit = 200): Promise<OnPageErrorItem[]> {
  const data = await dfsPost("/on_page/errors", [{ id: taskId, limit }]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items
    .map((item) => ({
      errorType: String(item.error_type ?? ""),
      count: typeof item.total_count === "number" ? item.total_count
           : typeof item.pages_count === "number" ? item.pages_count : 0,
      description: String(item.description ?? item.error_type ?? ""),
      severity: mapErrorSeverity(String(item.error_type ?? "")),
    }))
    .filter((e) => e.errorType && e.count > 0)
    .sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity] || b.count - a.count;
    });
}

export async function getOnPageDuplicateTags(taskId: string, limit = 200): Promise<DuplicateTagItem[]> {
  const data = await dfsPost("/on_page/duplicate_tags", [{ id: taskId, limit }]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items
    .map((item) => ({
      tagType: (item.tag_type === "meta_description" ? "description" : "title") as "title" | "description",
      value: String(item.tag ?? item.value ?? ""),
      pages: Array.isArray(item.urls) ? (item.urls as string[])
           : Array.isArray(item.pages) ? (item.pages as string[]) : [],
      count: typeof item.total_count === "number" ? item.total_count : 0,
    }))
    .filter((d) => d.count > 1);
}

export async function getOnPageBrokenLinks(taskId: string, limit = 200): Promise<OnPageLinkItem[]> {
  const data = await dfsPost("/on_page/links", [
    { id: taskId, limit, filters: [["url_to_http_code", ">", 399]] },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items
    .map((item) => ({
      urlFrom: String(item.link_from ?? item.url_from ?? ""),
      urlTo: String(item.link_to ?? item.url_to ?? ""),
      anchor: typeof item.anchor === "string" ? item.anchor : null,
      statusCode: typeof item.url_to_http_code === "number" ? item.url_to_http_code
                : typeof item.status_code === "number" ? item.status_code : null,
      linkType: (item.type === "external" ? "external" : "internal") as "internal" | "external",
      doFollow: item.dofollow !== false,
    }))
    .filter((l) => l.urlTo && (!l.statusCode || l.statusCode >= 400));
}

export async function crawlSitePages(
  domain: string,
  maxPages: number,
  onProgress?: (update: CrawlProgressUpdate) => Promise<void> | void
): Promise<OnPageCrawlResult> {
  try {
    const taskResult = await crawlSitePagesWithOnPageTask(domain, maxPages, onProgress);
    if (taskResult.pages.length > 0) return taskResult;
  } catch {
    // Fall back to instant analysis crawl if async on-page task path fails.
  }

  return crawlSitePagesFallback(domain, maxPages, onProgress);
}

async function crawlSitePagesWithOnPageTask(
  domain: string,
  maxPages: number,
  onProgress?: (update: CrawlProgressUpdate) => Promise<void> | void
): Promise<OnPageCrawlResult> {
  const normalizedDomain = normalizeDomainHost(domain);
  const taskData = await dfsPost("/on_page/task_post", [
    {
      target: normalizedDomain,
      max_crawl_pages: maxPages,
      load_resources: true,
      enable_javascript: true,
      custom_js: null,
      browser_preset: null,
    },
  ]);

  const task = (taskData?.tasks?.[0] ?? {}) as Record<string, unknown>;
  const taskId = typeof task.id === "string" ? task.id : null;
  if (!taskId) throw new Error("On-page task ID missing");

  const started = Date.now();
  const maxWaitMs = 12 * 60 * 1000;

  while (Date.now() - started < maxWaitMs) {
    const summaryData = await dfsPost("/on_page/summary", [{ id: taskId }]);
    const summaryTask = (summaryData?.tasks?.[0] ?? {}) as Record<string, unknown>;
    const summaryResults = Array.isArray(summaryTask.result)
      ? (summaryTask.result as Record<string, unknown>[])
      : [];
    const result = (summaryResults[0] ?? {}) as Record<string, unknown>;

    const crawlStatus = String(result.crawl_status ?? result.status ?? "").toLowerCase();
    const progress = typeof result.crawl_progress === "number"
      ? result.crawl_progress
      : typeof result.progress === "number"
      ? result.progress
      : null;

    const completeByStatus = crawlStatus.includes("finished") || crawlStatus.includes("completed");
    const completeByProgress = progress !== null && progress >= 100;

    if (completeByStatus || completeByProgress) break;

    await new Promise((resolve) => setTimeout(resolve, 8000));
  }

  const pages: PageAuditResult[] = [];
  const pageSize = 100;
  for (let offset = 0; offset < maxPages; offset += pageSize) {
    const pageData = await dfsPost("/on_page/pages", [{ id: taskId, limit: Math.min(pageSize, maxPages - offset), offset }]);
    const items = (pageData?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
    if (items.length === 0) break;

    for (const item of items) {
      const parsed = mapOnPagePageItem(item);
      if (parsed) pages.push(parsed);
      if (pages.length >= maxPages) break;
    }

    if (onProgress) {
      await onProgress({
        phase: "task",
        crawledPages: pages.length,
        targetPages: maxPages,
        pages: [...pages],
      });
    }

    if (items.length < pageSize || pages.length >= maxPages) break;
  }

  await enrichPagesWithLighthouse(pages, Math.min(maxPages, 120));
  if (onProgress) {
    await onProgress({
      phase: "task",
      crawledPages: pages.length,
      targetPages: maxPages,
      pages: [...pages],
    });
  }

  // Fetch site-wide error summary, duplicate tags, and broken links now that crawl is complete.
  const [errorsResult, dupTagsResult, brokenLinksResult] = await Promise.allSettled([
    getOnPageErrors(taskId),
    getOnPageDuplicateTags(taskId),
    getOnPageBrokenLinks(taskId),
  ]);

  return {
    pages,
    taskId,
    errors: errorsResult.status === "fulfilled" ? errorsResult.value : [],
    duplicateTags: dupTagsResult.status === "fulfilled" ? dupTagsResult.value : [],
    brokenLinks: brokenLinksResult.status === "fulfilled" ? brokenLinksResult.value : [],
  };
}

function mapOnPagePageItem(item: Record<string, unknown>): PageAuditResult | null {
  const url = typeof item.url === "string"
    ? item.url
    : typeof item.page_url === "string"
    ? item.page_url
    : null;
  if (!url) return null;

  const meta = (item.meta ?? {}) as Record<string, unknown>;
  const checks = (item.checks ?? {}) as Record<string, unknown>;
  const loadTime = typeof item.page_timing === "object" && item.page_timing
    ? (((item.page_timing as Record<string, unknown>).time_to_interactive as number) ?? 0)
    : 0;
  const score = typeof item.onpage_score === "number" ? Math.round(item.onpage_score) : 0;
  const lighthouse = (item.lighthouse as Record<string, unknown> | undefined) ?? undefined;

  const issues: SiteAuditIssue[] = [];
  if (!meta.title) issues.push({ type: "missing_title", severity: "critical", description: "Missing <title> tag", count: 1 });
  if (!meta.description) issues.push({ type: "missing_description", severity: "warning", description: "Missing meta description", count: 1 });
  if (checks.is_4xx_code) issues.push({ type: "4xx_error", severity: "critical", description: "Page returns 4xx error code", count: 1 });
  if (checks.is_5xx_code) issues.push({ type: "5xx_error", severity: "critical", description: "Page returns 5xx server error", count: 1 });
  if (!checks.has_h1_tag) issues.push({ type: "missing_h1", severity: "warning", description: "Missing H1 heading tag", count: 1 });
  if (!meta.canonical) issues.push({ type: "missing_canonical", severity: "warning", description: "Missing canonical URL tag", count: 1 });
  if (!checks.has_structured_data) issues.push({ type: "missing_schema", severity: "info", description: "No structured data/schema detected", count: 1 });
  if (loadTime > 4000) issues.push({ type: "slow_load", severity: "warning", description: `Slow page load: ${(loadTime / 1000).toFixed(1)}s (>4s)`, count: 1 });

  return {
    url,
    score,
    title: typeof meta.title === "string" ? meta.title : null,
    description: typeof meta.description === "string" ? meta.description : null,
    hasCanonical: !!meta.canonical,
    hasSchema: !!checks.has_structured_data,
    loadTimeMs: loadTime,
    responseCode: typeof item.status_code === "number" ? item.status_code : 200,
    lighthousePerformance: normalizeLighthouseScore(lighthouse?.performance),
    lighthouseAccessibility: normalizeLighthouseScore(lighthouse?.accessibility),
    lighthouseBestPractices: normalizeLighthouseScore(lighthouse?.best_practices),
    lighthouseSeo: normalizeLighthouseScore(lighthouse?.seo),
    issues,
  };
}

async function crawlSitePagesFallback(
  domain: string,
  maxPages: number,
  onProgress?: (update: CrawlProgressUpdate) => Promise<void> | void
): Promise<OnPageCrawlResult> {
  const normalizedDomain = normalizeDomainHost(domain);

  // Seed from sitemap, then expand via internal link discovery to improve coverage.
  const sitemapUrls = await extractSitemapUrls(normalizedDomain, maxPages);
  const urls = await discoverInternalUrls(normalizedDomain, sitemapUrls, maxPages);

  if (urls.length === 0) {
    // Fallback: just analyse homepage
    const result = await analyzePageInstant(`https://${domain}`);
    const singlePage = [{
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
    if (onProgress) {
      await onProgress({
        phase: "fallback",
        crawledPages: singlePage.length,
        targetPages: maxPages,
        pages: [...singlePage],
      });
    }
    return { pages: singlePage, taskId: null, errors: [], duplicateTags: [], brokenLinks: [] };
  }

  // Run in small batches to balance throughput and API rate limits.
  const results: PageAuditResult[] = [];
  const batchSize = maxPages >= 200 ? 10 : 5;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const settled = await Promise.allSettled(
      batch.map(async (url) => {
        const r = await analyzePageInstant(url);
        return { url, score: r.score, title: r.title, description: r.description, hasCanonical: r.hasCanonical, hasSchema: r.hasSchema, loadTimeMs: r.loadTimeMs, responseCode: r.responseCode, issues: r.issues } as PageAuditResult;
      })
    );
    for (const r of settled) {
      if (r.status === "fulfilled") results.push(r.value);
    }
    if (onProgress) {
      await onProgress({
        phase: "fallback",
        crawledPages: results.length,
        targetPages: maxPages,
        pages: [...results],
      });
    }
  }
  await enrichPagesWithLighthouse(results, Math.min(maxPages, 120));
  if (onProgress) {
    await onProgress({
      phase: "fallback",
      crawledPages: results.length,
      targetPages: maxPages,
      pages: [...results],
    });
  }
  return { pages: results, taskId: null, errors: [], duplicateTags: [], brokenLinks: [] };
}

function normalizeLighthouseScore(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  if (value <= 1) return Math.round(value * 100);
  if (value <= 100) return Math.round(value);
  return null;
}

async function getLighthouseAuditScores(url: string): Promise<{
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
} | null> {
  const data = await dfsPost("/on_page/lighthouse/audits", [
    {
      url,
      enable_javascript: true,
      load_resources: true,
    },
  ]);

  const item = (data?.tasks?.[0]?.result?.[0]?.items?.[0] ?? data?.tasks?.[0]?.result?.[0] ?? null) as Record<string, unknown> | null;
  if (!item) return null;

  const lighthouse = (item.lighthouse as Record<string, unknown> | undefined) ?? item;
  return {
    performance: normalizeLighthouseScore(lighthouse.performance),
    accessibility: normalizeLighthouseScore(lighthouse.accessibility),
    bestPractices: normalizeLighthouseScore(lighthouse.best_practices),
    seo: normalizeLighthouseScore(lighthouse.seo),
  };
}

async function enrichPagesWithLighthouse(pages: PageAuditResult[], maxToAudit: number): Promise<void> {
  if (pages.length === 0 || maxToAudit <= 0) return;

  const targets = pages.filter((p) =>
    p.lighthousePerformance == null ||
    p.lighthouseAccessibility == null ||
    p.lighthouseBestPractices == null ||
    p.lighthouseSeo == null
  ).slice(0, maxToAudit);

  const batchSize = 4;
  for (let i = 0; i < targets.length; i += batchSize) {
    const batch = targets.slice(i, i + batchSize);
    const settled = await Promise.allSettled(
      batch.map(async (page) => ({
        page,
        scores: await getLighthouseAuditScores(page.url),
      }))
    );

    for (const result of settled) {
      if (result.status !== "fulfilled") continue;
      const { page, scores } = result.value;
      if (!scores) continue;
      page.lighthousePerformance = scores.performance;
      page.lighthouseAccessibility = scores.accessibility;
      page.lighthouseBestPractices = scores.bestPractices;
      page.lighthouseSeo = scores.seo;
    }
  }
}

async function discoverInternalUrls(domain: string, seedUrls: string[], maxUrls: number): Promise<string[]> {
  const startUrl = `https://${domain}`;
  const discovered = new Set<string>([startUrl, ...seedUrls]);
  const queue: string[] = [startUrl, ...seedUrls].slice(0, maxUrls);
  const crawled = new Set<string>();

  const maxFetches = Math.max(200, Math.min(maxUrls * 3, 2000));
  while (queue.length > 0 && discovered.size < maxUrls && crawled.size < maxFetches) {
    const current = queue.shift();
    if (!current || crawled.has(current)) continue;
    crawled.add(current);

    let html = "";
    try {
      const res = await fetch(current, {
        headers: { "User-Agent": "SearchAuditPro/1.0" },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) continue;

      const type = res.headers.get("content-type") ?? "";
      if (!type.includes("text/html")) continue;
      html = await res.text();
    } catch {
      continue;
    }

    const links = extractInternalLinksFromHtml(html, current, domain);
    for (const link of links) {
      if (discovered.has(link)) continue;
      discovered.add(link);
      queue.push(link);
      if (discovered.size >= maxUrls) break;
    }
  }

  return [...discovered].slice(0, maxUrls);
}

async function extractSitemapUrls(domain: string, maxUrls: number): Promise<string[]> {
  const normalizedDomain = normalizeDomainHost(domain);
  const pageUrls = new Set<string>();
  const seenSitemaps = new Set<string>();
  const sitemapQueue: string[] = [
    `https://${normalizedDomain}/sitemap.xml`,
    `https://${normalizedDomain}/sitemap_index.xml`,
    `https://${normalizedDomain}/sitemap/sitemap.xml`,
  ];

  // Pull additional sitemap hints from robots.txt when available.
  try {
    const robotsRes = await fetch(`https://${normalizedDomain}/robots.txt`, {
      headers: { "User-Agent": "SearchAuditPro/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (robotsRes.ok) {
      const robotsTxt = await robotsRes.text();
      for (const line of robotsTxt.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed.toLowerCase().startsWith("sitemap:")) continue;
        const hinted = trimmed.slice(8).trim();
        if (hinted.startsWith("http")) sitemapQueue.push(hinted);
      }
    }
  } catch {
    // Ignore robots fetch failures and rely on default sitemap locations.
  }

  const maxSitemapFetches = 30;
  while (sitemapQueue.length > 0 && pageUrls.size < maxUrls && seenSitemaps.size < maxSitemapFetches) {
    const sitemapUrl = sitemapQueue.shift();
    if (!sitemapUrl || seenSitemaps.has(sitemapUrl)) continue;
    seenSitemaps.add(sitemapUrl);

    let xml = "";
    try {
      const res = await fetch(sitemapUrl, {
        headers: { "User-Agent": "SearchAuditPro/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;
      xml = await res.text();
    } catch {
      continue;
    }

    const locs = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)]
      .map((m) => m[1].trim())
      .filter(Boolean);

    for (const loc of locs) {
      if (!loc.startsWith("http")) continue;

      const parsed = safeParseUrl(loc);
      if (!parsed) continue;

      const host = normalizeDomainHost(parsed.hostname);
      const sameSite = host === normalizedDomain || host.endsWith(`.${normalizedDomain}`);
      if (!sameSite) continue;

      const maybeXml = parsed.pathname.toLowerCase().endsWith(".xml");
      if (maybeXml) {
        if (!seenSitemaps.has(loc)) sitemapQueue.push(loc);
        continue;
      }

      pageUrls.add(loc);
      if (pageUrls.size >= maxUrls) break;
    }
  }

  return [...pageUrls].slice(0, maxUrls);
}

function normalizeDomainHost(value: string): string {
  return value
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .trim()
    .toLowerCase();
}

function safeParseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function extractInternalLinksFromHtml(html: string, baseUrl: string, domain: string): string[] {
  const hrefMatches = [...html.matchAll(/<a\s+[^>]*href=["']([^"'#]+)["']/gi)]
    .map((match) => match[1].trim())
    .filter(Boolean);

  const links: string[] = [];
  const binaryExtensionPattern = /\.(pdf|jpg|jpeg|png|gif|webp|svg|zip|rar|mp4|mp3|woff2?|ttf|eot|ico|xml)(\?|$)/i;

  for (const href of hrefMatches) {
    const absolute = safeParseUrl(href.startsWith("http") ? href : new URL(href, baseUrl).toString());
    if (!absolute) continue;

    const host = normalizeDomainHost(absolute.hostname);
    const sameSite = host === domain || host.endsWith(`.${domain}`);
    if (!sameSite) continue;
    if (binaryExtensionPattern.test(absolute.pathname)) continue;

    absolute.hash = "";
    if (absolute.searchParams.toString().length > 0) {
      // Avoid query-variant URL explosion for crawl discovery.
      absolute.search = "";
    }

    links.push(absolute.toString().replace(/\/$/, "") || absolute.toString());
  }

  return links;
}

// ─── Local SEO / Business Data ───────────────────────────────────────────────

export interface LocalBusinessInfo {
  businessName: string | null;
  located: boolean;
  verified: boolean;
  rating: number | null;
  reviewCount: number | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  cid: string | null;
}

export async function getLocalBusinessInfo(
  keyword: string,
  locationCode: number = 2840
) {
  const data = await dfsPost("/business_data/google/my_business_info/live", [
    { keyword, location_code: locationCode, language_code: "en" },
  ]);

  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as any[];
  const item = items[0] ?? null;

  if (!item) {
    return {
      businessName: null,
      located: false,
      verified: false,
      rating: null,
      reviewCount: null,
      phone: null,
      website: null,
      address: null,
      cid: null,
    } as LocalBusinessInfo;
  }

  return {
    businessName: typeof item.business_name === "string" ? item.business_name : null,
    located: !!item.latitude && !!item.longitude,
    verified: item.review_status === "verified",
    rating: typeof item.rating?.value === "number" ? Math.round(item.rating.value * 10) / 10 : null,
    reviewCount: typeof item.review_count === "number" ? item.review_count : null,
    phone: typeof item.phone === "string" ? item.phone : null,
    website: typeof item.website === "string" ? item.website : null,
    address: typeof item.address === "string" ? item.address : null,
    cid: typeof item.cid === "string" ? item.cid : null,
  } as LocalBusinessInfo;
}

export interface QaItem {
  question: string;
  answerCount: number;
  topAnswer: string | null;
  topAnswerAuthor: string | null;
}

export async function getQuestionsAndAnswers(
  businessName: string,
  locationCode: number = 2840
): Promise<QaItem[]> {
  const data = await dfsPost("/business_data/google/questions_and_answers/live", [
    { keyword: businessName, location_code: locationCode, language_code: "en", limit: 50 },
  ]);

  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as any[];
  return items.slice(0, 20).map((item: any) => ({
    question: typeof item.question === "string" ? item.question : "",
    answerCount: typeof item.answers_count === "number" ? item.answers_count : 0,
    topAnswer: typeof item.top_answer?.answer_text === "string" ? item.top_answer.answer_text : null,
    topAnswerAuthor: typeof item.top_answer?.author === "string" ? item.top_answer.author : null,
  }));
}

export interface LocalRankingItem {
  keyword: string;
  location: string;
  position: number | null;
  title: string | null;
  url: string | null;
}

export async function getLocalKeywordRanking(
  keyword: string,
  businessName: string,
  locationCode: number = 2840
): Promise<LocalRankingItem> {
  const data = await dfsPost("/serp/google/organic/live/advanced", [
    {
      keyword,
      location_code: locationCode,
      language_code: "en",
      device: "mobile",
      calculate_rectangles: false,
    },
  ]);

  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as any[];
  const cleanBusiness = businessName.toLowerCase().replace(/[^\w\s]/g, "");
  
  const match = items.find((item: any) => {
    const itemText = `${item.title ?? ""} ${item.description ?? ""} ${item.url ?? ""}`.toLowerCase();
    return itemText.includes(cleanBusiness) || (typeof item.cid === "string" && item.cid.length > 0);
  });

  return {
    keyword,
    location: "Local Pack",
    position: match ? (typeof match.rank_absolute === "number" ? match.rank_absolute : null) : null,
    title: match ? (typeof match.title === "string" ? match.title : null) : null,
    url: match ? (typeof match.url === "string" ? match.url : null) : null,
  };
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
  if (checks.is_broken) issues.push({ type: "broken_page", severity: "critical", description: "Page appears broken to crawler", count: 1 });
  if (!checks.has_html_doctype) issues.push({ type: "missing_doctype", severity: "warning", description: "Missing HTML doctype declaration", count: 1 });
  if (checks.is_http) issues.push({ type: "no_https", severity: "critical", description: "Page served over HTTP (not HTTPS)", count: 1 });
  if (checks.has_mixed_content) issues.push({ type: "mixed_content", severity: "warning", description: "HTTPS page loads HTTP resources (mixed content)", count: 1 });
  if (!checks.has_h1_tag) issues.push({ type: "missing_h1", severity: "warning", description: "Missing H1 heading tag", count: 1 });
  if (!meta.canonical) issues.push({ type: "missing_canonical", severity: "warning", description: "Missing canonical URL tag", count: 1 });
  if (!checks.has_structured_data) issues.push({ type: "missing_schema", severity: "info", description: "No structured data/schema detected", count: 1 });
  if (checks.duplicate_title) issues.push({ type: "duplicate_title", severity: "warning", description: "Duplicate title tag found", count: 1 });
  if (checks.duplicate_description) issues.push({ type: "duplicate_description", severity: "warning", description: "Duplicate meta description found", count: 1 });
  if (checks.duplicate_content) issues.push({ type: "duplicate_content", severity: "warning", description: "Potential duplicate page content detected", count: 1 });
  if (checks.is_redirect || checks.has_meta_refresh_redirect) issues.push({ type: "redirect_page", severity: "info", description: "Page redirects and may dilute crawl focus", count: 1 });
  if (checks.has_render_blocking_resources) issues.push({ type: "render_blocking", severity: "warning", description: "Render-blocking resources may hurt performance", count: 1 });
  if (checks.low_content_rate) issues.push({ type: "thin_content", severity: "warning", description: "Page appears to have thin content", count: 1 });
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

  const metrics = overviewData?.tasks?.[0]?.result?.[0]?.items?.[0]?.metrics?.organic as Record<string, unknown> | undefined;
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

  // Compute a rough "domain strength" score from ranked keyword positions (0–100)
  const pos1  = typeof metrics?.pos_1   === "number" ? (metrics.pos_1  as number) : 0;
  const pos23 = typeof metrics?.pos_2_3 === "number" ? (metrics.pos_2_3 as number) : 0;
  const pos410 = typeof metrics?.pos_4_10 === "number" ? (metrics.pos_4_10 as number) : 0;
  const totalKeywords = typeof metrics?.count === "number" ? (metrics.count as number) : 0;
  const weightedScore = pos1 * 3 + pos23 * 2 + pos410 * 1;
  const domainStrength = totalKeywords > 0 ? Math.min(100, Math.round(Math.log10(weightedScore + 1) * 25 + (totalKeywords > 100 ? 20 : totalKeywords > 10 ? 10 : 0))) : 0;

  return {
    domain,
    organicKeywords: totalKeywords,
    organicTraffic: typeof metrics?.etv === "number" ? Math.round(metrics.etv as number) : 0,
    paidKeywords: 0,
    domainRank: domainStrength,
    etv: typeof metrics?.etv === "number" ? Math.round(metrics.etv as number) : 0,
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
  const normalizeDomain = (value: string) =>
    value
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      .toLowerCase();

  const cleanYou = normalizeDomain(yourDomain);
  const cleanCompetitors = competitorDomains.map(normalizeDomain).filter(Boolean);
  const perCompetitorLimit = Math.max(50, Math.ceil(limit / Math.max(cleanCompetitors.length, 1)));

  const byKeyword = new Map<string, KeywordGapItem>();

  for (const competitor of cleanCompetitors) {
    const data = await dfsPost("/dataforseo_labs/google/domain_intersection/live", [
      {
        targets: [
          { target: cleanYou, type: "domain" },
          { target: competitor, type: "domain" },
        ],
        location_code: locationCode,
        language_code: languageCode,
        limit: perCompetitorLimit,
        order_by: ["keyword_data.keyword_info.search_volume,desc"],
      },
    ]);

    const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
    for (const item of items) {
      const kd = (item.keyword_data as Record<string, unknown>) ?? {};
      const ki = (kd.keyword_info as Record<string, unknown>) ?? {};
      const keyword = String(kd.keyword ?? "");
      if (!keyword) continue;

      const ranked = (item.ranked_elements as Record<string, unknown>[]) ?? [];
      const yourElement = ranked.find((r) => {
        const raw = String(r.target ?? r.domain ?? r.url ?? "").toLowerCase();
        return raw.includes(cleanYou);
      });
      const compElement = ranked.find((r) => {
        const raw = String(r.target ?? r.domain ?? r.url ?? "").toLowerCase();
        return raw.includes(competitor);
      });

      const yourPosition = typeof yourElement?.rank_absolute === "number" ? yourElement.rank_absolute : null;
      const competitorPosition = typeof compElement?.rank_absolute === "number" ? compElement.rank_absolute : null;
      const volume = typeof ki.search_volume === "number" ? ki.search_volume : null;

      const existing = byKeyword.get(keyword);
      if (!existing) {
        byKeyword.set(keyword, {
          keyword,
          yourPosition,
          competitorPositions: [{ domain: competitor, position: competitorPosition }],
          volume,
          opportunity: yourPosition === null ? "missing" : yourPosition > 20 ? "weak" : "strong",
        });
        continue;
      }

      existing.competitorPositions.push({ domain: competitor, position: competitorPosition });
      if (existing.yourPosition === null && yourPosition !== null) {
        existing.yourPosition = yourPosition;
      }
      if (existing.volume === null && volume !== null) {
        existing.volume = volume;
      }
    }
  }

  const merged = [...byKeyword.values()].map((item) => {
    const bestCompetitor = item.competitorPositions
      .filter((c) => c.position !== null)
      .sort((a, b) => (a.position as number) - (b.position as number))[0];

    const opportunity: KeywordGapItem["opportunity"] = item.yourPosition === null
      ? "missing"
      : bestCompetitor && bestCompetitor.position !== null && item.yourPosition > bestCompetitor.position
      ? "weak"
      : item.yourPosition > 20
      ? "weak"
      : "strong";

    return {
      ...item,
      opportunity,
    };
  });

  return merged
    .filter((item) => item.opportunity === "missing" || item.opportunity === "weak")
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
    .slice(0, limit);
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

// ─── DataForSEO Labs: Advanced Competitive Research APIs ───────────────────

export interface RankedKeywordItem {
  keyword: string;
  position: number;
  searchVolume: number;
  cpc: number | null;
  url: string | null;
}

export async function getRankedKeywords(
  domain: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 100
): Promise<RankedKeywordItem[]> {
  const data = await dfsPost("/dataforseo_labs/google/ranked_keywords/live", [
    { target: domain, location_code: locationCode, language_code: languageCode, limit, order_by: ["keyword_data.keyword_info.search_volume,desc"] },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((item) => {
    const kd = (item.keyword_data as Record<string, unknown>) ?? {};
    const ki = (kd.keyword_info as Record<string, unknown>) ?? {};
    const rse = (item.ranked_serp_element as Record<string, unknown>) ?? {};
    const si = (rse.serp_item as Record<string, unknown>) ?? {};
    return {
      keyword: String(kd.keyword ?? ""),
      position: typeof si.rank_absolute === "number" ? si.rank_absolute : 0,
      searchVolume: typeof ki.search_volume === "number" ? ki.search_volume : 0,
      cpc: typeof ki.cpc === "number" ? ki.cpc : null,
      url: typeof si.url === "string" ? si.url : null,
    };
  });
}

export interface DomainIntersectionItem {
  keyword: string;
  yourPosition: number | null;
  theirPosition: number | null;
  searchVolume: number;
  opportunity: "you_rank_higher" | "they_rank_higher" | "both_rank";
}

export async function getDomainIntersection(
  yourDomain: string,
  theirDomain: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 100
): Promise<DomainIntersectionItem[]> {
  const data = await dfsPost("/dataforseo_labs/google/domain_intersection/live", [
    {
      targets: [
        { target: yourDomain, type: "domain" },
        { target: theirDomain, type: "domain" },
      ],
      location_code: locationCode,
      language_code: languageCode,
      limit,
      order_by: ["keyword_data.keyword_info.search_volume,desc"],
    },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((item) => {
    const kd = (item.keyword_data as Record<string, unknown>) ?? {};
    const ki = (kd.keyword_info as Record<string, unknown>) ?? {};
    const ranked = (item.ranked_elements as Record<string, unknown>[]) ?? [];
    
    const yourRank = ranked.find((r) => String(r.url ?? "").includes(yourDomain));
    const theirRank = ranked.find((r) => String(r.url ?? "").includes(theirDomain));
    
    const yourPos = typeof yourRank?.rank_absolute === "number" ? yourRank.rank_absolute : null;
    const theirPos = typeof theirRank?.rank_absolute === "number" ? theirRank.rank_absolute : null;
    
    let opportunity: DomainIntersectionItem["opportunity"] = "both_rank";
    if (yourPos !== null && theirPos !== null) {
      opportunity = yourPos < theirPos ? "you_rank_higher" : "they_rank_higher";
    }
    
    return {
      keyword: String(kd.keyword ?? ""),
      yourPosition: yourPos,
      theirPosition: theirPos,
      searchVolume: typeof ki.search_volume === "number" ? ki.search_volume : 0,
      opportunity,
    };
  });
}

export interface RelevantPageItem {
  url: string;
  title: string | null;
  traffic: number;
  keywordCount: number;
}

export async function getRelevantPages(
  domain: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 50
): Promise<RelevantPageItem[]> {
  const data = await dfsPost("/dataforseo_labs/google/relevant_pages/live", [
    { target: domain, location_code: locationCode, language_code: languageCode, limit, order_by: ["etv,desc"] },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((item) => ({
    url: String(item.url ?? ""),
    title: typeof item.title === "string" ? item.title : null,
    traffic: typeof item.etv === "number" ? Math.round(item.etv) : 0,
    keywordCount: typeof item.keyword_count === "number" ? item.keyword_count : 0,
  }));
}

export interface HistoricalSerpItem {
  keyword: string;
  position: number;
  date: string;
  searchVolume: number;
}

export async function getHistoricalSerps(
  domain: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 50
): Promise<HistoricalSerpItem[]> {
  const data = await dfsPost("/dataforseo_labs/google/historical_serps/live", [
    { target: domain, location_code: locationCode, language_code: languageCode, limit, order_by: ["keyword_data.keyword_info.search_volume,desc"] },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((item) => {
    const kd = (item.keyword_data as Record<string, unknown>) ?? {};
    const ki = (kd.keyword_info as Record<string, unknown>) ?? {};
    const historicalRanks = (item.historical_serp_ranks as Record<string, unknown>[]) ?? [];
    const latest = historicalRanks[historicalRanks.length - 1];
    
    return {
      keyword: String(kd.keyword ?? ""),
      position: typeof latest?.rank_absolute === "number" ? latest.rank_absolute : 0,
      date: typeof latest?.date === "string" ? latest.date : new Date().toISOString().split("T")[0],
      searchVolume: typeof ki.search_volume === "number" ? ki.search_volume : 0,
    };
  });
}

export interface HistoricalRankMetrics {
  date: string;
  avgPosition: number;
  keywordCount: number;
  organicTraffic: number;
}

export async function getHistoricalRankOverview(
  domain: string,
  locationCode = 2840,
  languageCode = "en"
): Promise<HistoricalRankMetrics[]> {
  const data = await dfsPost("/dataforseo_labs/google/historical_rank_overview/live", [
    { target: domain, location_code: locationCode, language_code: languageCode },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((item) => ({
    date: typeof item.date === "string" ? item.date : new Date().toISOString().split("T")[0],
    avgPosition: typeof item.avg_position === "number" ? Math.round(item.avg_position * 10) / 10 : 0,
    keywordCount: typeof item.keyword_count === "number" ? item.keyword_count : 0,
    organicTraffic: typeof item.etv === "number" ? Math.round(item.etv) : 0,
  }));
}

export interface PageIntersectionItem {
  url: string;
  domain: string;
  title: string | null;
  matchingPages: number;
}

export async function getPageIntersection(
  yourDomain: string,
  theirDomain: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 50
): Promise<PageIntersectionItem[]> {
  const data = await dfsPost("/dataforseo_labs/google/page_intersection/live", [
    {
      targets: [
        { target: yourDomain, type: "domain" },
        { target: theirDomain, type: "domain" },
      ],
      location_code: locationCode,
      language_code: languageCode,
      limit,
    },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((item) => ({
    url: String(item.url ?? ""),
    domain: String(item.domain ?? ""),
    title: typeof item.title === "string" ? item.title : null,
    matchingPages: typeof item.common_pages_count === "number" ? item.common_pages_count : 0,
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

export interface ProductKeywordResult {
  keyword: string;
  productCount: number;
  avgPrice: string | null;
  products: MerchantResult[];
}

export async function getProductKeywords(
  seed: string,
  locationCode = 2840
): Promise<ProductKeywordResult[]> {
  const variants = [
    `${seed}`,
    `${seed} price`,
    `${seed} review`,
    `best ${seed}`,
    `${seed} near me`,
    `${seed} online`,
  ];

  const results: ProductKeywordResult[] = [];
  const deduped = new Set<string>();

  for (const variant of variants) {
    try {
      const data = await dfsPost("/serp/google/shopping/live/advanced", [
        { keyword: variant, location_code: locationCode, language_code: "en" },
      ]);
      const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
      const products = items
        .filter((i) => i.type === "shopping" || i.type === "paid")
        .map((i) => ({
          position: typeof i.rank_absolute === "number" ? i.rank_absolute : null,
          title: typeof i.title === "string" ? i.title : null,
          price: typeof i.price === "string" ? i.price : typeof i.price === "number" ? String(i.price) : null,
          seller: typeof i.seller === "string" ? i.seller : null,
          rating: typeof i.rating === "number" ? i.rating : null,
          reviews: typeof i.review_count === "number" ? i.review_count : null,
          url: typeof i.url === "string" ? i.url : null,
          imageUrl: typeof i.image_url === "string" ? i.image_url : null,
        }))
        .slice(0, 15);

      if (products.length > 0) {
        const keyStr = variant.toLowerCase();
        if (!deduped.has(keyStr)) {
          deduped.add(keyStr);
          const prices = products
            .map((p) => (p.price ? parseFloat(p.price.replace(/[^0-9.]/g, "")) : null))
            .filter((p): p is number => p !== null);
          const avgPrice = prices.length > 0
            ? `$${(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)}`
            : null;

          results.push({
            keyword: variant,
            productCount: products.length,
            avgPrice,
            products,
          });
        }
      }
    } catch {
      // Continue to next variant if one fails
    }
  }

  return results;
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
    rating: (() => {
      const ratingObj = (r.rating as Record<string, unknown> | undefined) ?? undefined;
      if (ratingObj && typeof ratingObj.value === "number") return ratingObj.value;
      return typeof r.rating === "number" ? r.rating : 0;
    })(),
    text: typeof r.review_text === "string" ? r.review_text : null,
    date: typeof r.timestamp === "string" ? r.timestamp : null,
    response: typeof r.owner_answer === "string" ? r.owner_answer : null,
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
  { name: "Google Business Profile", searchBase: "https://www.google.com/search?q=", domainHints: ["google.com", "maps.google.com"] },
  { name: "Bing Places", searchBase: "https://www.bing.com/maps?q=", domainHints: ["bing.com", "bingplaces.com"] },
  { name: "Apple Maps", searchBase: "https://maps.apple.com/?q=", domainHints: ["maps.apple.com"] },
  { name: "Yelp", searchBase: "https://www.yelp.com/search?find_desc=", domainHints: ["yelp.com"] },
  { name: "Yellow Pages", searchBase: "https://www.yellowpages.com/search?search_terms=", domainHints: ["yellowpages.com"] },
  { name: "Facebook", searchBase: "https://www.facebook.com/search/pages/?q=", domainHints: ["facebook.com"] },
  { name: "Foursquare", searchBase: "https://foursquare.com/explore?q=", domainHints: ["foursquare.com"] },
  { name: "Tripadvisor", searchBase: "https://www.tripadvisor.com/Search?q=", domainHints: ["tripadvisor.com"] },
  { name: "BBB", searchBase: "https://www.bbb.org/search?find_text=", domainHints: ["bbb.org"] },
  { name: "Manta", searchBase: "https://www.manta.com/search?search_source=nav&search=", domainHints: ["manta.com"] },
  { name: "MapQuest", searchBase: "https://www.mapquest.com/search/results?query=", domainHints: ["mapquest.com"] },
  { name: "Superpages", searchBase: "https://www.superpages.com/search?search_terms=", domainHints: ["superpages.com"] },
  { name: "CitySquares", searchBase: "https://citysquares.com/search?what=", domainHints: ["citysquares.com"] },
  { name: "Local.com", searchBase: "https://www.local.com/search?keyword=", domainHints: ["local.com"] },
  { name: "Chamber of Commerce", searchBase: "https://www.chamberofcommerce.com/search?what=", domainHints: ["chamberofcommerce.com"] },
  { name: "Brownbook", searchBase: "https://www.brownbook.net/search/", domainHints: ["brownbook.net"] },
  { name: "Hotfrog", searchBase: "https://www.hotfrog.com/search/", domainHints: ["hotfrog.com"] },
  { name: "MerchantCircle", searchBase: "https://www.merchantcircle.com/search?query=", domainHints: ["merchantcircle.com"] },
  { name: "Cylex", searchBase: "https://www.cylex.us.com/s?query=", domainHints: ["cylex.us.com"] },
  { name: "Alignable", searchBase: "https://www.alignable.com/search?query=", domainHints: ["alignable.com"] },
  { name: "Angi", searchBase: "https://www.angi.com/search?what=", domainHints: ["angi.com"] },
  { name: "Houzz", searchBase: "https://www.houzz.com/professionals/query/", domainHints: ["houzz.com"] },
  { name: "Thumbtack", searchBase: "https://www.thumbtack.com/k/", domainHints: ["thumbtack.com"] },
  { name: "Nextdoor", searchBase: "https://nextdoor.com/search/?query=", domainHints: ["nextdoor.com"] },
  { name: "Trustpilot", searchBase: "https://www.trustpilot.com/search?query=", domainHints: ["trustpilot.com"] },
  { name: "Sitejabber", searchBase: "https://www.sitejabber.com/search?query=", domainHints: ["sitejabber.com"] },
  { name: "Birdeye", searchBase: "https://birdeye.com/search/?q=", domainHints: ["birdeye.com"] },
  { name: "Demandforce", searchBase: "https://www.demandforce.com/search/?q=", domainHints: ["demandforce.com"] },
  { name: "Insider Pages", searchBase: "https://www.insiderpages.com/search?query=", domainHints: ["insiderpages.com"] },
  { name: "Judy's Book", searchBase: "https://www.judysbook.com/search?query=", domainHints: ["judysbook.com"] },
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
  } catch {
    // Continue to database endpoint fallback below.
  }

  if (listings.length === 0) {
    try {
      const dbData = await dfsPost("/databases/business_listings/search/live", [
        { keyword: businessName, location_name: locationName, limit },
      ]);
      listings = (dbData?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
    } catch {
      // Keep empty listings and return missing rows.
    }
  }

  const normalizePhone = (p: string) => p.replace(/\D/g, "").slice(-10);
  const normalizeText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const normalizeHost = (value: string) => value.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].toLowerCase();

  const businessTokens = new Set(normalizeText(businessName).split(" ").filter((token) => token.length >= 3));
  const phoneNorm = normalizePhone(phone);
  const addrNorm = normalizeText(address);

  return CITATION_DIRECTORIES.map((dir) => {
    let bestMatch: Record<string, unknown> | null = null;
    let bestScore = -1;

    for (const listing of listings) {
      const title = normalizeText(String(listing.title ?? listing.name ?? ""));
      const listingAddress = normalizeText(String((listing.address_info as Record<string, unknown>)?.address ?? listing.address ?? ""));
      const listingPhone = normalizePhone(String(listing.phone ?? ""));
      const listingUrl = String(listing.url ?? listing.domain ?? "");
      const listingHost = normalizeHost(listingUrl);

      const tokenHits = [...businessTokens].filter((token) => title.includes(token)).length;
      const tokenScore = businessTokens.size > 0 ? tokenHits / businessTokens.size : 0;
      const directoryScore = dir.domainHints.some((hint) => listingHost.includes(hint)) ? 1 : 0;
      const phoneScore = listingPhone.length > 0 && phoneNorm.length > 0 && listingPhone === phoneNorm ? 1 : 0;
      const addressScore = listingAddress.length > 0 && addrNorm.length > 0 && (listingAddress.includes(addrNorm) || addrNorm.includes(listingAddress)) ? 1 : 0;

      const totalScore = tokenScore * 0.5 + directoryScore * 0.2 + phoneScore * 0.2 + addressScore * 0.1;
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMatch = listing;
      }
    }

    if (!bestMatch || bestScore < 0.35) {
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

    const listingPhone = normalizePhone(String(bestMatch.phone ?? ""));
    const listingAddress = normalizeText(String((bestMatch.address_info as Record<string, unknown>)?.address ?? bestMatch.address ?? ""));
    const listingTitle = normalizeText(String(bestMatch.title ?? bestMatch.name ?? ""));

    const tokenHits = [...businessTokens].filter((token) => listingTitle.includes(token)).length;
    const nameMatch = businessTokens.size > 0 ? tokenHits / businessTokens.size >= 0.5 : false;
    const phoneMatch = listingPhone.length > 0 && phoneNorm.length > 0 && (listingPhone === phoneNorm || listingPhone.endsWith(phoneNorm.slice(-7)));
    const addressMatch = listingAddress.length > 0 && addrNorm.length > 0 && (listingAddress.includes(addrNorm) || addrNorm.includes(listingAddress));
    const consistent = nameMatch && (phoneMatch || phoneNorm.length === 0) && (addressMatch || addrNorm.length === 0);

    return {
      directory: dir.name,
      url: `${dir.searchBase}${encodeURIComponent(businessName)}`,
      found: true,
      nameMatch,
      addressMatch,
      phoneMatch,
      status: consistent ? ("consistent" as const) : ("inconsistent" as const),
      listingUrl: typeof bestMatch.url === "string" ? bestMatch.url : null,
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
      const categories = Array.isArray(tech.categories) ? (tech.categories as unknown[]) : [];
      techList.push({
        name: String(tech.name ?? ""),
        category: String(categories[0] ?? "Other"),
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

// ─── Advanced Keyword Research Labs APIs ──────────────────────────────────────

export interface TopSearchItem {
  query: string;
  searchVolume: number;
  lastUpdated: string | null;
  trend: number | null;
}

export async function getTopSearches(
  locationCode = 2840,
  languageCode = "en",
  limit = 50
): Promise<TopSearchItem[]> {
  const data = await dfsPost("/dataforseo_labs/google/top_searches/live", [
    { location_code: locationCode, language_code: languageCode, limit },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    query: String(i.keyword ?? ""),
    searchVolume: typeof i.search_volume === "number" ? i.search_volume : 0,
    lastUpdated: typeof i.last_updated === "string" ? i.last_updated : null,
    trend: typeof i.trend === "number" ? i.trend : null,
  }));
}

export interface RelatedKeywordItem {
  keyword: string;
  searchVolume: number;
  cpc: number | null;
  competition: number | null;
}

export async function getRelatedKeywords(
  keyword: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 50
): Promise<RelatedKeywordItem[]> {
  const data = await dfsPost("/dataforseo_labs/google/related_keywords/live", [
    { keyword, location_code: locationCode, language_code: languageCode, limit },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Array<Record<string, unknown>>;
  return items
    .map((item) => {
      const keywordData = (item.keyword_data ?? {}) as Record<string, unknown>;
      const keywordInfo = (keywordData.keyword_info ?? {}) as Record<string, unknown>;

      return {
        keyword: String(keywordData.keyword ?? item.keyword ?? "").trim(),
        searchVolume:
          typeof keywordInfo.search_volume === "number"
            ? keywordInfo.search_volume
            : typeof item.search_volume === "number"
              ? item.search_volume
              : 0,
        cpc:
          typeof keywordInfo.cpc === "number"
            ? keywordInfo.cpc
            : typeof item.cpc === "number"
              ? item.cpc
              : null,
        competition:
          typeof keywordInfo.competition === "number"
            ? keywordInfo.competition
            : typeof item.competition === "number"
              ? item.competition
              : null,
      };
    })
    .filter((item) => item.keyword.length > 0);
}

export interface KeywordSuggestionItem {
  keyword: string;
  searchVolume: number;
  cpc: number | null;
  difficulty: number | null;
}

export async function getKeywordSuggestions(
  keyword: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 50
): Promise<KeywordSuggestionItem[]> {
  const data = await dfsPost("/dataforseo_labs/google/keyword_suggestions/live", [
    { keyword, location_code: locationCode, language_code: languageCode, limit },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as any[];
  return items.map((i: any) => ({
    keyword: String(i.keyword_data?.keyword ?? ""),
    searchVolume: typeof i.keyword_data?.keyword_info?.search_volume === "number" ? i.keyword_data.keyword_info.search_volume : 0,
    cpc: typeof i.keyword_data?.keyword_info?.cpc === "number" ? i.keyword_data.keyword_info.cpc : null,
    difficulty: typeof i.keyword_difficulty === "number" ? i.keyword_difficulty : null,
  }));
}

export interface KeywordIdeaItem {
  keyword: string;
  searchVolume: number;
  cpc: number | null;
  seasonality: string | null;
  intent: "commercial" | "transactional" | "informational" | "navigational" | null;
}

export interface KeywordIdeaGenericItem {
  keyword: string;
  searchVolume: number;
  cpc: number | null;
  difficulty: number | null;
  intent: string | null;
}

/** Generic (engine-agnostic) keyword ideas using DataForSEO Labs proprietary dataset */
export async function getKeywordIdeasGeneric(
  seed: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 100
): Promise<KeywordIdeaGenericItem[]> {
  const data = await dfsPost("/dataforseo_labs/keyword_ideas/live", [
    { keyword: seed, location_code: locationCode, language_code: languageCode, limit },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => {
    const ki = (i.keyword_info ?? {}) as Record<string, unknown>;
    const kp = (i.keyword_properties ?? {}) as Record<string, unknown>;
    const si = (i.search_intent_info ?? {}) as Record<string, unknown>;
    return {
      keyword: String(i.keyword ?? ""),
      searchVolume: typeof ki.search_volume === "number" ? ki.search_volume : 0,
      cpc: typeof ki.cpc === "number" ? Math.round(ki.cpc * 100) / 100 : null,
      difficulty: typeof kp.keyword_difficulty === "number" ? kp.keyword_difficulty : null,
      intent: String(si.main_intent ?? "") || null,
    };
  });
}

export async function getKeywordIdeasLabs(
  seed: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 50
): Promise<KeywordIdeaItem[]> {
  const data = await dfsPost("/dataforseo_labs/google/keyword_ideas/live", [
    { keyword: seed, location_code: locationCode, language_code: languageCode, limit },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as any[];
  return items.map((i: any) => ({
    keyword: String(i.keyword_data?.keyword ?? ""),
    searchVolume: typeof i.keyword_data?.keyword_info?.search_volume === "number" ? i.keyword_data.keyword_info.search_volume : 0,
    cpc: typeof i.keyword_data?.keyword_info?.cpc === "number" ? i.keyword_data.keyword_info.cpc : null,
    seasonality: String((i.keyword_data?.keyword_info?.seasonality ?? [])?.[0] ?? null),
    intent: null,
  }));
}

function extractPaaQuestionsFromNode(value: unknown, out: Set<string>) {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized.length >= 5) out.add(normalized);
    return;
  }

  if (Array.isArray(value)) {
    for (const child of value) extractPaaQuestionsFromNode(child, out);
    return;
  }

  if (!value || typeof value !== "object") return;

  const record = value as Record<string, unknown>;
  for (const key of ["question", "title", "keyword", "text", "description"]) {
    extractPaaQuestionsFromNode(record[key], out);
  }

  for (const key of ["items", "expanded_element", "related_searches", "faq", "answer_box"]) {
    extractPaaQuestionsFromNode(record[key], out);
  }
}

export async function getPeopleAlsoAskQuestions(
  keyword: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 100
): Promise<RelatedKeywordItem[]> {
  const data = await dfsPost("/serp/google/organic/live/advanced", [
    {
      keyword,
      location_code: locationCode,
      language_code: languageCode,
      device: "desktop",
      depth: 40,
      calculate_rectangles: false,
    },
  ]);

  const serpItems = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Array<Record<string, unknown>>;
  const questions = new Set<string>();

  for (const item of serpItems) {
    if (String(item.type ?? "") !== "people_also_ask") continue;
    extractPaaQuestionsFromNode(item, questions);
  }

  const cleanedQuestions = [...questions]
    .filter((q) => q.length >= 6)
    .filter((q) => q.includes(" "))
    .slice(0, Math.max(20, Math.min(limit, 500)));

  if (cleanedQuestions.length === 0) return [];

  try {
    const volumeData = await getKeywordData(cleanedQuestions.slice(0, 700));
    const volumeItems =
      (volumeData as { tasks?: Array<{ result?: Array<{ items?: Array<Record<string, unknown>> }> }> })
        ?.tasks?.[0]?.result?.[0]?.items ?? [];

    const byKeyword = new Map<string, RelatedKeywordItem>();
    for (const item of volumeItems) {
      if (typeof item.keyword !== "string") continue;
      const normalized = item.keyword.trim().toLowerCase();
      byKeyword.set(normalized, {
        keyword: normalized,
        searchVolume:
          typeof item.search_volume === "number"
            ? item.search_volume
            : typeof item.searchVolume === "number"
            ? item.searchVolume
            : 0,
        cpc:
          typeof item.cpc === "number"
            ? item.cpc
            : typeof item.low_top_of_page_bid === "number"
            ? item.low_top_of_page_bid
            : null,
        competition: null,
      });
    }

    return cleanedQuestions.slice(0, limit).map((q) => {
      const normalized = q.trim().toLowerCase();
      return (
        byKeyword.get(normalized) ?? {
          keyword: normalized,
          searchVolume: 0,
          cpc: null,
          competition: null,
        }
      );
    });
  } catch {
    return cleanedQuestions.slice(0, limit).map((q) => ({
      keyword: q.trim().toLowerCase(),
      searchVolume: 0,
      cpc: null,
      competition: null,
    }));
  }
}

export interface KeywordOverviewItem {
  keyword: string;
  searchVolume: number;
  cpc: number | null;
  competition: number | null;
  competitionLevel: string | null;
  seResults: number | null;
  domainRank: number | null;
  difficulty: number | null;
  monthlySearches: { year: number; month: number; volume: number }[];
}

export async function getKeywordOverviewLabs(
  keywords: string[],
  locationCode = 2840,
  languageCode = "en"
): Promise<KeywordOverviewItem[]> {
  const data = await dfsPost("/dataforseo_labs/google/keyword_overview/live", [
    { keywords, location_code: locationCode, language_code: languageCode },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => {
    // Labs API nests metrics under keyword_info; fall back to flat fields
    const ki = (i.keyword_info ?? {}) as Record<string, unknown>;
    const kp = (i.keyword_properties ?? {}) as Record<string, unknown>;
    const vol = typeof ki.search_volume === "number" ? ki.search_volume
              : typeof i.search_volume === "number" ? i.search_volume : 0;
    const cpc = typeof ki.cpc === "number" ? ki.cpc
              : typeof i.cpc === "number" ? i.cpc : null;
    const comp = typeof ki.competition === "number" ? ki.competition
               : typeof i.competition === "number" ? i.competition : null;
    const compLevel = String(ki.competition_level ?? i.competition_level ?? "") || null;
    const diff = typeof kp.keyword_difficulty === "number" ? kp.keyword_difficulty
               : typeof i.keyword_difficulty === "number" ? i.keyword_difficulty : null;
    const rawMonthly = Array.isArray(ki.monthly_searches) ? ki.monthly_searches
                     : Array.isArray(i.monthly_searches) ? i.monthly_searches : [];
    const monthlySearches = (rawMonthly as Record<string, unknown>[])
      .filter((m) => typeof m.year === "number" && typeof m.month === "number")
      .map((m) => ({
        year: m.year as number,
        month: m.month as number,
        volume: typeof m.search_volume === "number" ? m.search_volume : 0,
      }))
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
    return {
      keyword: String(i.keyword ?? ""),
      searchVolume: vol,
      cpc,
      competition: comp,
      competitionLevel: compLevel,
      seResults: typeof i.se_results_count === "number" ? i.se_results_count : null,
      domainRank: typeof i.rank === "number" ? i.rank : null,
      difficulty: diff,
      monthlySearches,
    };
  });
}

export interface BulkKeywordDifficultyItem {
  keyword: string;
  difficulty: number | null;
  difficultyLevel: "easy" | "medium" | "hard" | null;
}

export async function getBulkKeywordDifficulty(
  keywords: string[],
  locationCode = 2840,
  languageCode = "en"
): Promise<BulkKeywordDifficultyItem[]> {
  const data = await dfsPost("/dataforseo_labs/google/bulk_keyword_difficulty/live", [
    { keywords, location_code: locationCode, language_code: languageCode },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => {
    const diff = typeof i.keyword_difficulty === "number" ? i.keyword_difficulty : null;
    let level: "easy" | "medium" | "hard" | null = null;
    if (diff !== null) {
      if (diff < 30) level = "easy";
      else if (diff < 70) level = "medium";
      else level = "hard";
    }
    return { keyword: String(i.keyword ?? ""), difficulty: diff, difficultyLevel: level };
  });
}

export interface SearchIntentItem {
  keyword: string;
  intent: "commercial" | "transactional" | "informational" | "navigational";
  confidence: number;
}

export async function getSearchIntent(
  keywords: string[],
  locationCode = 2840,
  languageCode = "en"
): Promise<SearchIntentItem[]> {
  const data = await dfsPost("/dataforseo_labs/google/search_intent/live", [
    { keywords, location_code: locationCode, language_code: languageCode },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => {
    const intentStr = String(i.search_intent ?? "informational").toLowerCase();
    let intent: SearchIntentItem["intent"] = "informational";
    if (intentStr.includes("commercial")) intent = "commercial";
    else if (intentStr.includes("transactional")) intent = "transactional";
    else if (intentStr.includes("navigational")) intent = "navigational";
    return {
      keyword: String(i.keyword ?? ""),
      intent,
      confidence: typeof i.confidence === "number" ? Math.round(i.confidence * 100) : 0,
    };
  });
}

// ─── Category-Based Keyword Research APIs ─────────────────────────────────────

export interface CategoryItem {
  id: string;
  name: string;
  title: string | null;
}

export async function getCategoriesForKeywords(
  keywords: string[],
  locationCode = 2840,
  languageCode = "en"
): Promise<CategoryItem[]> {
  const data = await dfsPost("/dataforseo_labs/google/categories_for_keywords/live", [
    { keywords, location_code: locationCode, language_code: languageCode },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  const categories = new Map<string, CategoryItem>();
  
  for (const item of items) {
    const cats = (item.categories ?? []) as Record<string, unknown>[];
    for (const cat of cats) {
      const id = String(cat.id ?? cat.category_id ?? "");
      if (id && !categories.has(id)) {
        categories.set(id, {
          id,
          name: String(cat.name ?? cat.title ?? ""),
          title: typeof cat.title === "string" ? cat.title : null,
        });
      }
    }
  }
  
  return Array.from(categories.values()).slice(0, 50);
}

export interface KeywordForCategoryItem {
  keyword: string;
  searchVolume: number;
  difficulty: number | null;
}

export async function getKeywordsForCategories(
  categoryIds: string[],
  locationCode = 2840,
  languageCode = "en",
  limit = 50
): Promise<KeywordForCategoryItem[]> {
  const data = await dfsPost("/dataforseo_labs/google/keywords_for_categories/live", [
    { categories: categoryIds, location_code: locationCode, language_code: languageCode, limit },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    keyword: String(i.keyword ?? ""),
    searchVolume: typeof i.search_volume === "number" ? i.search_volume : 0,
    difficulty: typeof i.difficulty === "number" ? i.difficulty : null,
  }));
}

export interface DomainCategoryItem {
  categoryId: string;
  categoryName: string;
  relevance: number;
  matchingKeywords: number;
}

export async function getCategoriesForDomain(
  domain: string,
  locationCode = 2840,
  languageCode = "en"
): Promise<DomainCategoryItem[]> {
  const data = await dfsPost("/dataforseo_labs/google/categories_for_domain/live", [
    { target: domain, location_code: locationCode, language_code: languageCode },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    categoryId: String(i.id ?? i.category_id ?? ""),
    categoryName: String(i.name ?? i.category_name ?? ""),
    relevance: typeof i.relevance === "number" ? Math.round(i.relevance * 100) : 0,
    matchingKeywords: typeof i.keyword_count === "number" ? i.keyword_count : 0,
  }));
}

export interface DomainMetricsByCategoryItem {
  categoryId: string;
  categoryName: string;
  organicKeywords: number;
  organicTraffic: number;
  domainRank: number;
}

export async function getDomainMetricsByCategories(
  domain: string,
  locationCode = 2840,
  languageCode = "en"
): Promise<DomainMetricsByCategoryItem[]> {
  const data = await dfsPost("/dataforseo_labs/google/domain_metrics_by_categories/live", [
    { target: domain, location_code: locationCode, language_code: languageCode },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    categoryId: String(i.id ?? i.category_id ?? ""),
    categoryName: String(i.name ?? i.category_name ?? ""),
    organicKeywords: typeof i.keyword_count === "number" ? i.keyword_count : 0,
    organicTraffic: typeof i.etv === "number" ? Math.round(i.etv) : 0,
    domainRank: typeof i.rank === "number" ? i.rank : 0,
  }));
}

// ─── Site-Specific Keyword Research APIs ──────────────────────────────────────

export interface KeywordForSiteItem {
  keyword: string;
  url: string | null;
  position: number;
  searchVolume: number;
  traffic: number;
}

export async function getKeywordsForSite(
  domain: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 100
): Promise<KeywordForSiteItem[]> {
  const data = await dfsPost("/dataforseo_labs/google/keywords_for_site/live", [
    { target: domain, location_code: locationCode, language_code: languageCode, limit },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    keyword: String(i.keyword ?? ""),
    url: typeof i.url === "string" ? i.url : null,
    position: typeof i.position === "number" ? i.position : 0,
    searchVolume: typeof i.search_volume === "number" ? i.search_volume : 0,
    traffic: typeof i.traffic === "number" ? Math.round(i.traffic) : 0,
  }));
}

// ─── AI Optimization / LLM Mentions (LIVE) ───────────────────────────────────

export interface LlmMentionLiveItem {
  query: string;
  llm: string;
  source: string;
  url: string | null;
  title: string | null;
  snippet: string | null;
  mentioned: boolean;
}

export interface LlmTopPageItem {
  page: string;
  mentions: number;
  share: number | null;
}

export interface LlmTopDomainItem {
  domain: string;
  mentions: number;
  share: number | null;
}

export interface LlmAggregatedMetricItem {
  llm: string;
  mentions: number;
  mentionRate: number | null;
}

export interface LlmCrossAggregatedMetricItem {
  query: string;
  llm: string;
  mentions: number;
}

function normalizeHost(input: string): string {
  return input
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase();
}

function matchesDomain(value: string | null, targetDomain: string): boolean {
  if (!value) return false;
  const h = normalizeHost(value);
  return h === targetDomain || h.endsWith(`.${targetDomain}`);
}

export async function getLlmMentionsSearchLive(
  keyword: string,
  domain: string,
  limit = 30
): Promise<LlmMentionLiveItem[]> {
  const targetDomain = normalizeHost(domain);
  const data = await dfsPost("/ai_optimization/llm_mentions/search/live", [
    {
      keyword,
      target: targetDomain,
      limit,
    },
  ]);

  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => {
    const url = typeof i.url === "string" ? i.url : null;
    const sourceDomain = typeof i.domain === "string" ? i.domain : null;
    const title = typeof i.title === "string" ? i.title : null;
    const snippet = typeof i.snippet === "string"
      ? i.snippet
      : typeof i.description === "string"
      ? i.description
      : null;
    const llm = typeof i.llm === "string"
      ? i.llm
      : typeof i.llm_name === "string"
      ? i.llm_name
      : "unknown";

    const mentionedByFlag = typeof i.mentioned === "boolean" ? i.mentioned : false;
    const mentionedByUrl = matchesDomain(url, targetDomain);
    const mentionedBySourceDomain = matchesDomain(sourceDomain, targetDomain);

    return {
      query: keyword,
      llm,
      source: llm,
      url,
      title,
      snippet,
      mentioned: mentionedByFlag || mentionedByUrl || mentionedBySourceDomain,
    };
  });
}

export async function getLlmTopPagesLive(
  domain: string,
  limit = 20
): Promise<LlmTopPageItem[]> {
  const targetDomain = normalizeHost(domain);
  const data = await dfsPost("/ai_optimization/llm_mentions/top_pages/live", [
    {
      target: targetDomain,
      limit,
    },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    page: String(i.page ?? i.url ?? ""),
    mentions: typeof i.mentions === "number" ? i.mentions : 0,
    share: typeof i.share === "number" ? i.share : null,
  }));
}

export async function getLlmTopDomainsLive(
  keyword: string,
  limit = 20
): Promise<LlmTopDomainItem[]> {
  const data = await dfsPost("/ai_optimization/llm_mentions/top_domains/live", [
    {
      keyword,
      limit,
    },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    domain: String(i.domain ?? ""),
    mentions: typeof i.mentions === "number" ? i.mentions : 0,
    share: typeof i.share === "number" ? i.share : null,
  }));
}

export async function getLlmAggregatedMetricsLive(
  domain: string
): Promise<LlmAggregatedMetricItem[]> {
  const targetDomain = normalizeHost(domain);
  const data = await dfsPost("/ai_optimization/llm_mentions/aggregated_metrics/live", [
    {
      target: targetDomain,
    },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    llm: String(i.llm ?? i.llm_name ?? "unknown"),
    mentions: typeof i.mentions === "number" ? i.mentions : 0,
    mentionRate: typeof i.mention_rate === "number" ? i.mention_rate : null,
  }));
}

export async function getLlmCrossAggregatedMetricsLive(
  domain: string
): Promise<LlmCrossAggregatedMetricItem[]> {
  const targetDomain = normalizeHost(domain);
  const data = await dfsPost("/ai_optimization/llm_mentions/cross_aggregated_metrics/live", [
    {
      target: targetDomain,
    },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    query: String(i.keyword ?? i.query ?? ""),
    llm: String(i.llm ?? i.llm_name ?? "unknown"),
    mentions: typeof i.mentions === "number" ? i.mentions : 0,
  }));
}

export async function getPerplexityLlmResponsesLive(
  keyword: string,
  domain: string,
  limit = 10
): Promise<LlmMentionLiveItem[]> {
  const targetDomain = normalizeHost(domain);
  const data = await dfsPost("/ai_optimization/perplexity/llm_responses/live", [
    {
      keyword,
      target: targetDomain,
      limit,
    },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => {
    const url = typeof i.url === "string" ? i.url : null;
    const snippet = typeof i.response === "string"
      ? i.response
      : typeof i.snippet === "string"
      ? i.snippet
      : null;

    return {
      query: keyword,
      llm: "perplexity",
      source: "perplexity",
      url,
      title: typeof i.title === "string" ? i.title : null,
      snippet,
      mentioned: matchesDomain(url, targetDomain),
    };
  });
}

// ─── NEW: Keyword Research extras ────────────────────────────────────────────

/**
 * Get top organic competitor domains for a given domain.
 */
export async function getDomainCompetitors(
  domain: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 20
) {
  const data = await dfsPost("/dataforseo_labs/google/competitors_domain/live", [
    {
      target: domain.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      location_code: locationCode,
      language_code: languageCode,
      limit,
    },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    domain: String(i.domain ?? ""),
    intersections: typeof i.intersections === "number" ? i.intersections : 0,
    avgPosition: typeof i.avg_position === "number" ? i.avg_position : null,
    etv: typeof i.etv === "number" ? i.etv : null,
  }));
}

/**
 * Bulk keyword difficulty (convenience alias using the /keyword_difficulty endpoint).
 */
export async function getKeywordDifficulty(
  keywords: string[],
  locationCode = 2840,
  languageCode = "en"
) {
  const data = await dfsPost("/dataforseo_labs/google/keyword_difficulty/live", [
    {
      keywords: keywords.slice(0, 1000),
      location_code: locationCode,
      language_code: languageCode,
    },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    keyword: String(i.keyword ?? ""),
    difficulty: typeof i.keyword_difficulty === "number" ? i.keyword_difficulty : null,
  }));
}

/**
 * Google Ads: keywords for a seed domain (keyword planner data).
 */
export async function getKeywordsForSiteGoogleAds(
  domain: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 100
) {
  const data = await dfsPost("/keywords_data/google_ads/keywords_for_site/live", [
    {
      target: domain.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      location_code: locationCode,
      language_code: languageCode,
      limit,
    },
  ]);
  const items = (data?.tasks?.[0]?.result ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    keyword: String(i.keyword ?? ""),
    volume: typeof i.search_volume === "number" ? i.search_volume : 0,
    competition: String(i.competition ?? ""),
    cpc: typeof i.cpc === "number" ? i.cpc : null,
  }));
}

/**
 * Google Ads: related keywords for seed keywords (keyword planner).
 */
export async function getKeywordsForKeywords(
  keywords: string[],
  locationCode = 2840,
  languageCode = "en"
) {
  const data = await dfsPost("/keywords_data/google_ads/keywords_for_keywords/live", [
    {
      keywords: keywords.slice(0, 20),
      location_code: locationCode,
      language_code: languageCode,
    },
  ]);
  const items = (data?.tasks?.[0]?.result ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    keyword: String(i.keyword ?? ""),
    volume: typeof i.search_volume === "number" ? i.search_volume : 0,
    competition: String(i.competition ?? ""),
    cpc: typeof i.cpc === "number" ? i.cpc : null,
  }));
}

// ─── Amazon DataForSEO Labs ───────────────────────────────────────────────────

/** Bulk search volume for up to 1000 Amazon keywords */
export async function getAmazonBulkSearchVolume(
  keywords: string[],
  locationCode = 2840,
  languageCode = "en"
) {
  const data = await dfsPost("/dataforseo_labs/amazon/bulk_search_volume/live", [
    { keywords: keywords.slice(0, 1000), location_code: locationCode, language_code: languageCode },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    keyword: String(i.keyword ?? ""),
    searchVolume: typeof i.search_volume === "number" ? i.search_volume : 0,
  }));
}

/** Related keywords for a seed keyword on Amazon */
export async function getAmazonRelatedKeywords(
  keyword: string,
  locationCode = 2840,
  languageCode = "en",
  depth = 1,
  limit = 100
) {
  const data = await dfsPost("/dataforseo_labs/amazon/related_keywords/live", [
    { keyword, location_code: locationCode, language_code: languageCode, depth, limit },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => {
    const kd = (i.keyword_data ?? {}) as Record<string, unknown>;
    const ki = (kd.keyword_info ?? {}) as Record<string, unknown>;
    return {
      keyword: String(kd.keyword ?? i.keyword ?? ""),
      searchVolume: typeof ki.search_volume === "number" ? ki.search_volume : 0,
      cpc: typeof ki.cpc === "number" ? ki.cpc : null,
      depth: typeof i.depth === "number" ? i.depth : 0,
    };
  });
}

/** Keywords that an Amazon product (by ASIN) ranks for */
export async function getAmazonRankedKeywords(
  asin: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 100
) {
  const data = await dfsPost("/dataforseo_labs/amazon/ranked_keywords/live", [
    { asin, location_code: locationCode, language_code: languageCode, limit },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => {
    const kd = (i.keyword_data ?? {}) as Record<string, unknown>;
    const ki = (kd.keyword_info ?? {}) as Record<string, unknown>;
    const se = (i.ranked_serp_element ?? {}) as Record<string, unknown>;
    const si = (se.serp_item ?? {}) as Record<string, unknown>;
    return {
      keyword: String(kd.keyword ?? ""),
      searchVolume: typeof ki.search_volume === "number" ? ki.search_volume : 0,
      rankAbsolute: typeof si.rank_absolute === "number" ? si.rank_absolute : null,
    };
  });
}

/** Competitor ASINs for a product on Amazon */
export async function getAmazonProductCompetitors(
  asin: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 50
) {
  const data = await dfsPost("/dataforseo_labs/amazon/product_competitors/live", [
    { asin, location_code: locationCode, language_code: languageCode, limit },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    asin: String(i.asin ?? ""),
    avgPosition: typeof i.avg_position === "number" ? i.avg_position : null,
    intersections: typeof i.intersections === "number" ? i.intersections : 0,
    metrics: (i.competitor_metrics ?? null) as Record<string, unknown> | null,
  }));
}

/** Rank overview metrics for an Amazon product (by ASIN) */
export async function getAmazonProductRankOverview(
  asin: string,
  locationCode = 2840,
  languageCode = "en"
) {
  return dfsPost("/dataforseo_labs/amazon/product_rank_overview/live", [
    { asin, location_code: locationCode, language_code: languageCode },
  ]);
}

/** Shared keywords between multiple Amazon products */
export async function getAmazonProductKeywordIntersections(
  asins: string[],
  locationCode = 2840,
  languageCode = "en",
  limit = 100
) {
  return dfsPost("/dataforseo_labs/amazon/product_keyword_intersections/live", [
    { asins, location_code: locationCode, language_code: languageCode, limit },
  ]);
}

// ─── Bing Keywords Data ───────────────────────────────────────────────────────

/** Bing search volume for up to 1000 keywords */
export async function getBingSearchVolume(
  keywords: string[],
  locationCode = 2840,
  languageCode = "en"
) {
  const data = await dfsPost("/keywords_data/bing/search_volume/live", [
    { keywords: keywords.slice(0, 1000), location_code: locationCode, language_code: languageCode },
  ]);
  const items = (data?.tasks?.[0]?.result ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    keyword: String(i.keyword ?? ""),
    searchVolume: typeof i.search_volume === "number" ? i.search_volume : 0,
    cpc: typeof i.cpc === "number" ? i.cpc : null,
    competition: typeof i.competition === "number" ? i.competition : null,
  }));
}

/** Bing keywords suggestions for seed keywords (up to 200) */
export async function getBingKeywordsForKeywords(
  keywords: string[],
  locationCode = 2840,
  languageCode = "en"
) {
  const data = await dfsPost("/keywords_data/bing/keywords_for_keywords/live", [
    { keywords: keywords.slice(0, 200), location_code: locationCode, language_code: languageCode },
  ]);
  const items = (data?.tasks?.[0]?.result ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    keyword: String(i.keyword ?? ""),
    searchVolume: typeof i.search_volume === "number" ? i.search_volume : 0,
    cpc: typeof i.cpc === "number" ? i.cpc : null,
    competition: typeof i.competition === "number" ? i.competition : null,
  }));
}

/** Bing keywords for a website URL */
export async function getBingKeywordsForSite(
  target: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 100
): Promise<{ keyword: string; searchVolume: number; cpc: number | null }[]> {
  const data = await dfsPost("/keywords_data/bing/keywords_for_site/live", [
    { target, location_code: locationCode, language_code: languageCode, limit },
  ]);
  const items = (data?.tasks?.[0]?.result ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    keyword: String(i.keyword ?? ""),
    searchVolume: typeof i.search_volume === "number" ? i.search_volume : 0,
    cpc: typeof i.cpc === "number" ? i.cpc : null,
  }));
}

/** Bing keyword performance metrics */
export async function getBingKeywordPerformance(
  keywords: string[],
  locationCode = 2840,
  languageCode = "en"
) {
  return dfsPost("/keywords_data/bing/keyword_performance/live", [
    { keywords: keywords.slice(0, 1000), location_code: locationCode, language_code: languageCode },
  ]);
}

/** Bing audience estimation for targeting parameters */
export async function getBingAudienceEstimation(
  keywords: string[],
  locationCode = 2840,
  languageCode = "en"
) {
  return dfsPost("/keywords_data/bing/audience_estimation/live", [
    { keywords: keywords.slice(0, 200), location_code: locationCode, language_code: languageCode },
  ]);
}

// ─── Clickstream Data ─────────────────────────────────────────────────────────

/** Clickstream-based bulk search volume for up to 1000 keywords */
export async function getClickstreamBulkSearchVolume(
  keywords: string[],
  locationCode = 2840
) {
  const data = await dfsPost("/keywords_data/clickstream_data/bulk_search_volume/live", [
    { keywords: keywords.slice(0, 1000), location_code: locationCode },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    keyword: String(i.keyword ?? ""),
    searchVolume: typeof i.search_volume === "number" ? i.search_volume : 0,
    monthlySearches: Array.isArray(i.monthly_searches) ? i.monthly_searches : [],
  }));
}

/** Global (all-country) clickstream search volume */
export async function getClickstreamGlobalSearchVolume(keywords: string[]) {
  return dfsPost("/keywords_data/clickstream_data/global_search_volume/live", [
    { keywords: keywords.slice(0, 1000) },
  ]);
}

/** DataForSEO clickstream search volume (proprietary panel) */
export async function getClickstreamDataForSEOSearchVolume(
  keywords: string[],
  locationCode = 2840
) {
  return dfsPost("/keywords_data/clickstream_data/dataforseo_search_volume/live", [
    { keywords: keywords.slice(0, 1000), location_code: locationCode },
  ]);
}

// ─── SERP Toolkit Endpoints ──────────────────────────────────────────────────

export interface DfsTaskSubmissionResult {
  taskIds: string[];
  raw: unknown;
}

export interface DfsTaskFetchResult {
  taskId: string;
  items: DfsRecord[];
  result: DfsRecord | null;
  raw: unknown;
}

export interface SerpToolkitRequestOptions {
  locationCode?: number;
  languageCode?: string;
  seDomain?: string;
  device?: string;
  os?: string;
  depth?: number;
  limit?: number;
  priority?: number;
  postbackUrl?: string;
  pingbackUrl?: string;
  advancedOptions?: Record<string, unknown>;
}

function buildSerpRequestPayload(
  keyword: string | undefined,
  options: SerpToolkitRequestOptions = {}
): DfsRecord {
  const payload: DfsRecord = {
    location_code: options.locationCode ?? 2840,
    language_code: options.languageCode ?? "en",
  };

  if (keyword) payload.keyword = keyword;
  if (options.seDomain) payload.se_domain = options.seDomain;
  if (options.device) payload.device = options.device;
  if (options.os) payload.os = options.os;
  if (typeof options.depth === "number") payload.depth = options.depth;
  if (typeof options.limit === "number") payload.limit = options.limit;
  if (typeof options.priority === "number") payload.priority = options.priority;
  if (options.postbackUrl) payload.postback_url = options.postbackUrl;
  if (options.pingbackUrl) payload.pingback_url = options.pingbackUrl;

  return {
    ...payload,
    ...(options.advancedOptions ?? {}),
  };
}

function buildImageSearchPayload(
  imageUrl: string | undefined,
  imageBase64: string | undefined,
  options: SerpToolkitRequestOptions = {}
): DfsRecord {
  if (!imageUrl && !imageBase64) {
    throw new Error("An image URL or base64 image payload is required.");
  }

  const payload = buildSerpRequestPayload(undefined, options);
  if (imageUrl) payload.image_url = imageUrl;
  if (imageBase64) payload.image_base64 = imageBase64;
  return payload;
}

function toTaskSubmissionResult(response: unknown): DfsTaskSubmissionResult {
  return {
    taskIds: getDfsTaskIds(response),
    raw: response,
  };
}

function toTaskFetchResult(taskId: string, response: unknown): DfsTaskFetchResult {
  return {
    taskId,
    items: getFirstTaskItems(response),
    result: getFirstTaskResult(response),
    raw: response,
  };
}

export async function createGoogleAutocompleteTask(
  keyword: string,
  options: SerpToolkitRequestOptions = {}
): Promise<DfsTaskSubmissionResult> {
  const response = await dfsPost("/serp/google/autocomplete/task_post", [
    buildSerpRequestPayload(keyword, options),
  ]);
  return toTaskSubmissionResult(response);
}

export async function getGoogleAutocompleteLiveAdvanced(
  keyword: string,
  options: SerpToolkitRequestOptions = {}
) {
  const response = await dfsPost("/serp/google/autocomplete/live/advanced", [
    buildSerpRequestPayload(keyword, options),
  ]);
  return {
    items: getFirstTaskItems(response),
    result: getFirstTaskResult(response),
    raw: response,
  };
}

export async function getGoogleAutocompleteTaskAdvanced(taskId: string): Promise<DfsTaskFetchResult> {
  const response = await dfsGet(`/serp/google/autocomplete/task_get/advanced/${taskId}`);
  return toTaskFetchResult(taskId, response);
}

export async function createGoogleAiModeTask(
  keyword: string,
  options: SerpToolkitRequestOptions = {}
): Promise<DfsTaskSubmissionResult> {
  const response = await dfsPost("/serp/google/ai_mode/task_post", [
    buildSerpRequestPayload(keyword, options),
  ]);
  return toTaskSubmissionResult(response);
}

export async function getGoogleAiModeLiveAdvanced(
  keyword: string,
  options: SerpToolkitRequestOptions = {}
) {
  const response = await dfsPost("/serp/google/ai_mode/live/advanced", [
    buildSerpRequestPayload(keyword, options),
  ]);
  return {
    items: getFirstTaskItems(response),
    result: getFirstTaskResult(response),
    raw: response,
  };
}

export async function getGoogleLocalFinderLiveAdvanced(
  keyword: string,
  options: SerpToolkitRequestOptions = {}
) {
  const response = await dfsPost("/serp/google/local_finder/live/advanced", [
    buildSerpRequestPayload(keyword, options),
  ]);
  return {
    items: getFirstTaskItems(response),
    result: getFirstTaskResult(response),
    raw: response,
  };
}

export async function getGoogleDatasetSearchLiveAdvanced(
  keyword: string,
  options: SerpToolkitRequestOptions = {}
) {
  const response = await dfsPost("/serp/google/dataset_search/live/advanced", [
    buildSerpRequestPayload(keyword, options),
  ]);
  return {
    items: getFirstTaskItems(response),
    result: getFirstTaskResult(response),
    raw: response,
  };
}

export async function getGoogleAdsSearchLiveAdvanced(
  keyword: string,
  options: SerpToolkitRequestOptions = {}
) {
  const response = await dfsPost("/serp/google/ads_search/live/advanced", [
    buildSerpRequestPayload(keyword, options),
  ]);
  return {
    items: getFirstTaskItems(response),
    result: getFirstTaskResult(response),
    raw: response,
  };
}

export async function createGoogleSearchByImageTask(
  imageUrl: string | undefined,
  imageBase64: string | undefined,
  options: SerpToolkitRequestOptions = {}
): Promise<DfsTaskSubmissionResult> {
  const response = await dfsPost("/serp/google/search_by_image/task_post", [
    buildImageSearchPayload(imageUrl, imageBase64, options),
  ]);
  return toTaskSubmissionResult(response);
}

export async function getYahooOrganicTaskAdvanced(taskId: string): Promise<DfsTaskFetchResult> {
  const response = await dfsGet(`/serp/yahoo/organic/task_get/advanced/${taskId}`);
  return toTaskFetchResult(taskId, response);
}

export interface ClickstreamSearchVolumeItem {
  keyword: string;
  searchVolume: number;
  monthlySearches: unknown[];
}

function mapClickstreamVolumeItems(response: unknown): ClickstreamSearchVolumeItem[] {
  return getFirstTaskItems(response).map((item) => ({
    keyword: String(item.keyword ?? ""),
    searchVolume: typeof item.search_volume === "number" ? item.search_volume : 0,
    monthlySearches: Array.isArray(item.monthly_searches) ? item.monthly_searches : [],
  }));
}

export async function getClickstreamGlobalSearchVolumeAdvanced(keywords: string[]) {
  const response = await dfsPost("/keywords_data/clickstream_data/global_search_volume/live", [
    { keywords: keywords.slice(0, 1000) },
  ]);
  return {
    items: mapClickstreamVolumeItems(response),
    result: getFirstTaskResult(response),
    raw: response,
  };
}

export async function getClickstreamBulkSearchVolumeAdvanced(
  keywords: string[],
  locationCode = 2840
) {
  const response = await dfsPost("/keywords_data/clickstream_data/bulk_search_volume/live", [
    { keywords: keywords.slice(0, 1000), location_code: locationCode },
  ]);
  return {
    items: mapClickstreamVolumeItems(response),
    result: getFirstTaskResult(response),
    raw: response,
  };
}

export async function getContentAnalysisSearchLive(
  keyword: string,
  options: SerpToolkitRequestOptions = {}
) {
  const response = await dfsPost("/content_analysis/search/live", [
    buildSerpRequestPayload(keyword, options),
  ]);
  return {
    items: getFirstTaskItems(response),
    result: getFirstTaskResult(response),
    raw: response,
  };
}

export async function getContentAnalysisPhraseTrendsLive(
  keyword: string,
  options: SerpToolkitRequestOptions = {}
) {
  const response = await dfsPost("/content_analysis/phrase_trends/live", [
    buildSerpRequestPayload(keyword, options),
  ]);
  return {
    items: getFirstTaskItems(response),
    result: getFirstTaskResult(response),
    raw: response,
  };
}

export async function getContentAnalysisCategoryTrendsLive(
  keyword: string,
  options: SerpToolkitRequestOptions = {}
) {
  const response = await dfsPost("/content_analysis/category_trends/live", [
    buildSerpRequestPayload(keyword, options),
  ]);
  return {
    items: getFirstTaskItems(response),
    result: getFirstTaskResult(response),
    raw: response,
  };
}

// ─── DataForSEO Trends ────────────────────────────────────────────────────────

/** Trend data for up to 5 keywords (popularity over time) */
export async function getDFSTrendsExplore(
  keywords: string[],
  locationCode = 2840,
  type: "web" | "news" | "ecommerce" = "web",
  timeRange?: string,
  dateFrom?: string,
  dateTo?: string
) {
  const body: Record<string, unknown> = {
    keywords: keywords.slice(0, 5),
    location_code: locationCode,
    type,
  };
  if (timeRange) body.time_range = timeRange;
  if (dateFrom) body.date_from = dateFrom;
  if (dateTo) body.date_to = dateTo;
  const data = await dfsPost("/keywords_data/dataforseo_trends/explore/live", [body]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items;
}

/** Subregion popularity breakdown for keywords */
export async function getDFSTrendsSubregionInterests(
  keywords: string[],
  locationCode = 2840,
  type: "web" | "news" | "ecommerce" = "web"
) {
  return dfsPost("/keywords_data/dataforseo_trends/subregion_interests/live", [
    { keywords: keywords.slice(0, 5), location_code: locationCode, type },
  ]);
}

/** Demographic breakdown of searchers for keywords */
export async function getDFSTrendsDemography(
  keywords: string[],
  locationCode = 2840,
  type: "web" | "news" | "ecommerce" = "web"
) {
  return dfsPost("/keywords_data/dataforseo_trends/demography/live", [
    { keywords: keywords.slice(0, 5), location_code: locationCode, type },
  ]);
}

/** Merged trends data combining multiple signals */
export async function getDFSTrendsMergedData(
  keywords: string[],
  locationCode = 2840
) {
  return dfsPost("/keywords_data/dataforseo_trends/merged_data/live", [
    { keywords: keywords.slice(0, 5), location_code: locationCode },
  ]);
}

// ─── Apple App Store Keywords ─────────────────────────────────────────────────

/**
 * Keywords an Apple App Store app ranks for.
 * @param appId  Numeric App Store app ID (e.g. "835599320" for TikTok)
 */
export async function getAppleKeywordsForApp(
  appId: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 100
) {
  const data = await dfsPost("/dataforseo_labs/apple/keywords_for_app/live", [
    { app_id: appId, location_code: locationCode, language_code: languageCode, limit },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => {
    const kd = (i.keyword_data ?? {}) as Record<string, unknown>;
    const ki = (kd.keyword_info ?? {}) as Record<string, unknown>;
    const se = (i.ranked_serp_element ?? {}) as Record<string, unknown>;
    const si = (se.serp_item ?? {}) as Record<string, unknown>;
    return {
      keyword: String(kd.keyword ?? ""),
      searchVolume: typeof ki.search_volume === "number" ? ki.search_volume : 0,
      rankAbsolute: typeof si.rank_absolute === "number" ? si.rank_absolute : null,
    };
  });
}

// ─── YouTube SERP ─────────────────────────────────────────────────────────────

/** Live YouTube organic SERP results for a keyword */
export async function getYoutubeOrganicSerpLive(
  keyword: string,
  locationCode = 2840,
  languageCode = "en"
) {
  const data = await dfsPost("/serp/youtube/organic/live/advanced", [
    { keyword, location_code: locationCode, language_code: languageCode },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    type: String(i.type ?? ""),
    rankAbsolute: typeof i.rank_absolute === "number" ? i.rank_absolute : null,
    title: typeof i.title === "string" ? i.title : null,
    url: typeof i.url === "string" ? i.url : null,
    videoId: typeof i.video_id === "string" ? i.video_id : null,
    channelName: typeof i.channel_name === "string" ? i.channel_name : null,
    viewsCount: typeof i.views_count === "number" ? i.views_count : null,
    description: typeof i.description === "string" ? i.description : null,
    durationSeconds: typeof i.duration_time_seconds === "number" ? i.duration_time_seconds : null,
  }));
}

// ─── Pinterest Social Media ───────────────────────────────────────────────────

/**
 * Pinterest pin counts for target URLs.
 * @param targets  Array of absolute page URLs (max 10)
 */
export async function getPinterestPinCounts(targets: string[]) {
  const data = await dfsPost("/business_data/social_media/pinterest/live", [
    { targets: targets.slice(0, 10) },
  ]);
  const results = (data?.tasks?.[0]?.result ?? []) as Record<string, unknown>[];
  return results.map((r) => ({
    pageUrl: typeof r.page_url === "string" ? r.page_url : null,
    pinsCount: typeof r.pins_count === "number" ? r.pins_count : 0,
  }));
}

// ─── Reddit Social Media ──────────────────────────────────────────────────────

/**
 * Reddit posts/shares for target URLs.
 * @param targets  Array of absolute page URLs (max 10)
 */
export async function getRedditPostsForUrls(targets: string[]) {
  const data = await dfsPost("/business_data/social_media/reddit/live", [
    { targets: targets.slice(0, 10) },
  ]);
  const results = (data?.tasks?.[0]?.result ?? []) as Record<string, unknown>[];
  return results.map((r) => ({
    pageUrl: typeof r.page_url === "string" ? r.page_url : null,
    reviews: Array.isArray(r.reddit_reviews)
      ? (r.reddit_reviews as Record<string, unknown>[]).map((rev) => ({
          subreddit: typeof rev.subreddit === "string" ? rev.subreddit : null,
          authorName: typeof rev.author_name === "string" ? rev.author_name : null,
          title: typeof rev.title === "string" ? rev.title : null,
          permalink: typeof rev.permalink === "string" ? rev.permalink : null,
          subredditMembers: typeof rev.subreddit_members === "number" ? rev.subreddit_members : 0,
        }))
      : [],
  }));
}

// ─── On-Page Lighthouse Live/JSON ─────────────────────────────────────────────

export interface LighthouseLiveResult {
  url: string;
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
  /** Top failing audits with title + score */
  failedAudits: { id: string; title: string; score: number; impact: string }[];
}

/**
 * Run a live Lighthouse audit for a URL using DataForSEO's instant endpoint.
 * Uses /on_page/lighthouse/live/json which returns scores + full audit data.
 */
export async function getLighthouseLiveJson(
  url: string,
  forMobile = false
): Promise<LighthouseLiveResult> {
  const targetUrl = url.startsWith("http") ? url : `https://${url}`;
  const data = await dfsPost("/on_page/lighthouse/live/json", [
    { url: targetUrl, for_mobile: forMobile },
  ]);

  const item = (
    data?.tasks?.[0]?.result?.[0]?.items?.[0] ??
    data?.tasks?.[0]?.result?.[0] ??
    null
  ) as Record<string, unknown> | null;

  if (!item) {
    return { url: targetUrl, performance: null, accessibility: null, bestPractices: null, seo: null, failedAudits: [] };
  }

  const lh = (item.lighthouse as Record<string, unknown>) ?? item;
  const cats = (lh.categories as Record<string, unknown>) ?? {};
  const audits = (lh.audits as Record<string, Record<string, unknown>>) ?? {};

  const getScore = (val: unknown): number | null => {
    if (typeof val === "number") return Math.round(val * (val <= 1 ? 100 : 1));
    if (typeof (val as Record<string, unknown> | null)?.score === "number") {
      const s = (val as Record<string, unknown>).score as number;
      return Math.round(s * (s <= 1 ? 100 : 1));
    }
    return null;
  };

  const failedAudits = Object.entries(audits)
    .filter(([, a]) => typeof a.score === "number" && (a.score as number) < 0.9 && a.score !== null)
    .map(([id, a]) => ({
      id,
      title: typeof a.title === "string" ? a.title : id,
      score: Math.round((a.score as number) * 100),
      impact: typeof a.details !== "undefined" || (a.score as number) < 0.5 ? "high" : "medium",
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 8);

  return {
    url: targetUrl,
    performance: getScore(cats.performance),
    accessibility: getScore(cats.accessibility),
    bestPractices: getScore(cats["best-practices"] ?? cats.bestPractices),
    seo: getScore(cats.seo),
    failedAudits,
  };
}

// ─── AI Keyword Search Volume ─────────────────────────────────────────────────

export interface AiKeywordVolumeItem {
  keyword: string;
  /** Estimated monthly AI search volume (perplexity, chatgpt, etc.) */
  searchVolume: number | null;
  /** Breakdown by AI model if available */
  breakdown: { model: string; volume: number }[];
}

/**
 * Get estimated AI search volume for a list of keywords.
 * Uses /ai_optimization/ai_keyword_data/keywords_search_volume/live
 */
export async function getAiKeywordSearchVolume(
  keywords: string[],
  locationCode = 2840,
  languageCode = "en"
): Promise<AiKeywordVolumeItem[]> {
  const data = await dfsPost("/ai_optimization/ai_keyword_data/keywords_search_volume/live", [
    { keywords: keywords.slice(0, 100), location_code: locationCode, language_code: languageCode },
  ]);

  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? data?.tasks?.[0]?.result ?? []) as Record<string, unknown>[];
  return items.map((i) => {
    const breakdown: { model: string; volume: number }[] = [];
    if (i.lm_details && typeof i.lm_details === "object") {
      for (const [model, vol] of Object.entries(i.lm_details as Record<string, unknown>)) {
        if (typeof vol === "number") breakdown.push({ model, volume: vol });
      }
    }
    return {
      keyword: String(i.keyword ?? ""),
      searchVolume: typeof i.search_volume === "number" ? i.search_volume : null,
      breakdown,
    };
  });
}

// ─── Batch Google Autocomplete (A-Z) ─────────────────────────────────────────

export interface AutocompleteLetterGroup {
  letter: string;
  suggestions: string[];
}

/**
 * Fetch A-Z autocomplete suggestions for a seed keyword.
 * Sends all 26 prefix tasks in a single batched POST request.
 */
export async function getGoogleAutocompleteAZ(
  seed: string,
  locationCode = 2840,
  languageCode = "en"
): Promise<AutocompleteLetterGroup[]> {
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
  const tasks = alphabet.map((letter) => ({
    keyword: `${seed} ${letter}`,
    location_code: locationCode,
    language_code: languageCode,
  }));

  const data = await dfsPost("/serp/google/autocomplete/live/advanced", tasks);
  const taskResults = (data?.tasks ?? []) as Record<string, unknown>[];

  return alphabet.map((letter, idx) => {
    const task = taskResults[idx];
    const resultArr = (task?.result ?? []) as Record<string, unknown>[];
    const items = ((resultArr[0]?.items ?? []) as Record<string, unknown>[]);
    const suggestions = items
      .filter((i) => String(i.type ?? "") === "autocomplete")
      .map((i) => String(i.suggestion ?? i.keyword ?? ""))
      .filter(Boolean)
      .slice(0, 8);
    return { letter, suggestions };
  });
}

// ─── SERP Top Organic Results ─────────────────────────────────────────────────

export interface SerpOrganicResult {
  position: number;
  url: string;
  title: string;
  description: string | null;
  domain: string;
  /** DataForSEO estimated traffic to this result */
  etv: number | null;
  breadcrumb: string | null;
  /** DataForSEO domain authority score (0–100) */
  domainRank: number | null;
  /** Backlinks to this specific URL */
  backlinks: number | null;
}

/**
 * Fetch the top organic Google SERP results for a keyword.
 * Uses /serp/google/organic/live/advanced
 */
export async function getTopOrganicResults(
  keyword: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 10
): Promise<SerpOrganicResult[]> {
  const data = await dfsPost("/serp/google/organic/live/advanced", [
    {
      keyword,
      location_code: locationCode,
      language_code: languageCode,
      device: "desktop",
      calculate_rectangles: false,
      depth: limit,
    },
  ]);

  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items
    .filter((i) => String(i.type ?? "") === "organic")
    .slice(0, limit)
    .map((i) => ({
      position: typeof i.rank_absolute === "number" ? i.rank_absolute : 0,
      url: typeof i.url === "string" ? i.url : "",
      title: typeof i.title === "string" ? i.title : "",
      description: typeof i.description === "string" ? i.description : null,
      domain: typeof i.domain === "string" ? i.domain : "",
      etv: typeof i.etv === "number" ? Math.round(i.etv) : null,
      breadcrumb: typeof i.breadcrumb === "string" ? i.breadcrumb : null,
      domainRank: typeof i.domain_rank === "number" ? i.domain_rank : null,
      backlinks: typeof i.backlinks === "number" ? i.backlinks : null,
    }));
}

// ─── Combined SERP: organic + People Also Ask ─────────────────────────────────

export interface PeopleAlsoAskItem {
  question: string;
  answer: string | null;
  url: string | null;
  domain: string | null;
}

/**
 * Single /serp/google/organic/live/advanced call that returns both
 * top organic results AND People Also Ask questions.
 */
export async function getSerpLiveData(
  keyword: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 10
): Promise<{ organic: SerpOrganicResult[]; paa: PeopleAlsoAskItem[] }> {
  const data = await dfsPost("/serp/google/organic/live/advanced", [
    {
      keyword,
      location_code: locationCode,
      language_code: languageCode,
      device: "desktop",
      calculate_rectangles: false,
      depth: Math.max(limit + 10, 30), // extra depth so PAA items are included
    },
  ]);

  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];

  const organic: SerpOrganicResult[] = items
    .filter((i) => String(i.type ?? "") === "organic")
    .slice(0, limit)
    .map((i) => ({
      position: typeof i.rank_absolute === "number" ? i.rank_absolute : 0,
      url: typeof i.url === "string" ? i.url : "",
      title: typeof i.title === "string" ? i.title : "",
      description: typeof i.description === "string" ? i.description : null,
      domain: typeof i.domain === "string" ? i.domain : "",
      etv: typeof i.etv === "number" ? Math.round(i.etv) : null,
      breadcrumb: typeof i.breadcrumb === "string" ? i.breadcrumb : null,
      domainRank: typeof i.domain_rank === "number" ? i.domain_rank : null,
      backlinks: typeof i.backlinks === "number" ? i.backlinks : null,
    }));

  // PAA: DFS may return PAA as container (type=people_also_ask with sub-items)
  // OR as flat top-level elements (type=people_also_ask_element). Handle both.
  function mapPaaElement(s: Record<string, unknown>): PeopleAlsoAskItem | null {
    const question = typeof s.title === "string" ? s.title.trim() : "";
    if (!question) return null;
    const answerItems = (s.items ?? []) as Record<string, unknown>[];
    const box = answerItems[0] as Record<string, unknown> | undefined;
    return {
      question,
      answer:
        typeof box?.description === "string" ? box.description :
        typeof box?.text === "string" ? box.text : null,
      url: typeof box?.url === "string" ? box.url : null,
      domain: typeof box?.domain === "string" ? box.domain : null,
    };
  }

  const paa: PeopleAlsoAskItem[] = [];
  for (const i of items) {
    const type = String(i.type ?? "");
    if (type === "people_also_ask_element") {
      const mapped = mapPaaElement(i);
      if (mapped) paa.push(mapped);
    } else if (type === "people_also_ask") {
      const subItems = (i.items ?? []) as Record<string, unknown>[];
      for (const s of subItems) {
        if (String(s.type ?? "") === "people_also_ask_element") {
          const mapped = mapPaaElement(s);
          if (mapped) paa.push(mapped);
        }
      }
    }
  }

  return { organic, paa: paa.slice(0, 12) };
}

// ─── Bulk Spam Score (backlinks) ───────────────────────────────────────────
export async function getBulkSpamScore(
  targets: string[]
): Promise<{ target: string; spamScore: number }[]> {
  if (!targets.length) return [];
  const data = await dfsPost("/backlinks/bulk_spam_score/live", [
    { targets },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    target: String(i.target ?? ""),
    spamScore: typeof i.spam_score === "number" ? i.spam_score : 0,
  }));
}

// ─── Backlinks Competitors ─────────────────────────────────────────────────
export async function getBacklinkCompetitors(
  target: string,
  limit = 10
): Promise<{ domain: string; intersections: number; relevantPages: number }[]> {
  const data = await dfsPost("/backlinks/competitors/live", [
    { target, limit },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    domain: String(i.domain ?? i.target ?? ""),
    intersections: typeof i.intersections === "number" ? i.intersections : 0,
    relevantPages: typeof i.relevant_pages === "number" ? i.relevant_pages : 0,
  }));
}

// ─── Bulk Traffic Estimation ───────────────────────────────────────────────
export async function getBulkTrafficEstimation(
  targets: { target: string; targetType?: "site" | "page" }[],
  locationCode = 2840,
  languageCode = "en"
): Promise<{ target: string; organicEtv: number; paidEtv: number; traffic: number }[]> {
  if (!targets.length) return [];
  const data = await dfsPost("/dataforseo_labs/google/bulk_traffic_estimation/live", [
    {
      targets: targets.map((t) => ({ target: t.target, target_type: t.targetType ?? "site" })),
      location_code: locationCode,
      language_code: languageCode,
    },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => {
    const metrics = (i.metrics as Record<string, unknown>) ?? {};
    const organic = (metrics.organic as Record<string, unknown>) ?? {};
    const paid = (metrics.paid as Record<string, unknown>) ?? {};
    return {
      target: String(i.target ?? ""),
      organicEtv: typeof organic.etv === "number" ? Math.round(organic.etv) : 0,
      paidEtv: typeof paid.etv === "number" ? Math.round(paid.etv) : 0,
      traffic: typeof organic.count === "number" ? organic.count : 0,
    };
  });
}

// ─── Historical Bulk Traffic Estimation ───────────────────────────────────
export async function getHistoricalBulkTraffic(
  targets: string[],
  locationCode = 2840,
  languageCode = "en"
): Promise<{ target: string; history: { date: string; traffic: number }[] }[]> {
  if (!targets.length) return [];
  const data = await dfsPost("/dataforseo_labs/google/historical_bulk_traffic_estimation/live", [
    {
      targets: targets.map((t) => ({ target: t, target_type: "site" })),
      location_code: locationCode,
      language_code: languageCode,
    },
  ]);
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  return items.map((i) => {
    const historyRaw = (i.history as Record<string, unknown>[]) ?? [];
    return {
      target: String(i.target ?? ""),
      history: historyRaw.map((h) => ({
        date: String(h.date ?? ""),
        traffic: typeof (h.organic as Record<string, unknown> | undefined)?.count === "number" ? ((h.organic as Record<string, unknown>).count as number) : 0,
      })),
    };
  });
}

// ─── Google Ads Keywords for Site ─────────────────────────────────────────
export async function getGoogleAdsKeywordsForSite(
  site: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 50
): Promise<{ keyword: string; searchVolume: number; cpc: number | null; competition: string | null }[]> {
  const data = await dfsPost("/keywords_data/google_ads/keywords_for_site/live", [
    { target: site, location_code: locationCode, language_code: languageCode, limit },
  ]);
  const items = (data?.tasks?.[0]?.result ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    keyword: String(i.keyword ?? ""),
    searchVolume: typeof i.search_volume === "number" ? i.search_volume : 0,
    cpc: typeof i.cpc === "number" ? Math.round(i.cpc * 100) / 100 : null,
    competition: typeof i.competition_level === "string" ? i.competition_level : null,
  }));
}

// ─── Bing Keyword Performance ─────────────────────────────────────────────
export interface BingKeywordPerformanceItem {
  keyword: string;
  searchVolume: number;
  cpc: number | null;
  competition: number | null;
}
export async function getBingKeywordPerformanceBatch(
  keywords: string[],
  locationCode = 2840,
  languageCode = "en"
): Promise<BingKeywordPerformanceItem[]> {
  if (!keywords.length) return [];
  const data = await dfsPost("/keywords_data/bing/keyword_performance/live", [
    { keywords, location_code: locationCode, language_code: languageCode },
  ]);
  const items = (data?.tasks?.[0]?.result ?? []) as Record<string, unknown>[];
  return items.map((i) => ({
    keyword: String(i.keyword ?? ""),
    searchVolume: typeof i.search_volume === "number" ? i.search_volume : 0,
    cpc: typeof i.cpc === "number" ? Math.round(i.cpc * 100) / 100 : null,
    competition: typeof i.competition === "number" ? i.competition : null,
  }));
}

// ─── Google Trends Explore ────────────────────────────────────────────────
export interface TrendsExploreItem {
  keyword: string;
  value: number;
}
export async function getGoogleTrendsExplore(
  keywords: string[],
  locationCode = 2840,
  languageCode = "en"
): Promise<TrendsExploreItem[]> {
  const data = await dfsPost("/keywords_data/google_trends/explore/live", [
    { keywords, location_code: locationCode, language_code: languageCode, type: "web_search" },
  ]);
  const result = (data?.tasks?.[0]?.result ?? []) as Record<string, unknown>[];
  const out: TrendsExploreItem[] = [];
  for (const r of result) {
    const items = (r.items ?? []) as Record<string, unknown>[];
    for (const item of items) {
      if (item.type === "google_trends_graph") {
        const kws = (item.keywords ?? []) as string[];
        const data2 = (item.data ?? []) as Record<string, unknown>[];
        for (let ki = 0; ki < kws.length; ki++) {
          const values = data2.map((d) => {
            const vals = (d.values ?? []) as number[];
            return vals[ki] ?? 0;
          });
          const avg = values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;
          out.push({ keyword: kws[ki], value: avg });
        }
      }
    }
  }
  return out;
}

// ─── Enhanced SERP with feature detection ────────────────────────────────────

export interface SerpFeaturesResult {
  hasAiOverview: boolean;
  hasFeaturedSnippet: boolean;
  topAdCount: number;
  bottomAdCount: number;
  hasShopping: boolean;
  hasVideoCarousel: boolean;
  hasLocalPack: boolean;
  hasPeopleAlsoAsk: boolean;
}

export interface LocalPackItem {
  title: string;
  address: string | null;
  phone: string | null;
  rating: number | null;
  reviewCount: number | null;
  website: string | null;
  category: string | null;
}

export interface SerpAdsItem {
  position: number;
  title: string;
  description: string | null;
  domain: string;
  url: string;
  displayUrl: string | null;
  isTopAd: boolean;
}

export interface MonthlyVolumeItem {
  year: number;
  month: number;
  volume: number;
}

/**
 * Like getSerpLiveData but also extracts SERP feature flags and top ad counts
 * from the same single API call so we can avoid paying for two requests.
 */
export async function getSerpLiveDataEnhanced(
  keyword: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 10
): Promise<{
  organic: SerpOrganicResult[];
  paa: PeopleAlsoAskItem[];
  features: SerpFeaturesResult;
  localPack: LocalPackItem[];
  ads: SerpAdsItem[];
}> {
  const data = await dfsPost("/serp/google/organic/live/advanced", [
    {
      keyword,
      location_code: locationCode,
      language_code: languageCode,
      device: "desktop",
      calculate_rectangles: false,
      depth: Math.max(limit + 10, 30),
      load_async_ai_overview: true,
    },
  ]);

  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  const types = items.map((i) => String(i.type ?? ""));

  const topAds = items.filter((i) => i.type === "paid" && (i.rank_absolute as number) <= 4);
  const bottomAds = items.filter((i) => i.type === "paid" && (i.rank_absolute as number) > 4);

  const features: SerpFeaturesResult = {
    hasAiOverview: types.includes("ai_overview") || types.includes("answer_box"),
    hasFeaturedSnippet: types.includes("featured_snippet"),
    topAdCount: topAds.length,
    bottomAdCount: bottomAds.length,
    hasShopping: types.includes("shopping"),
    hasVideoCarousel: types.includes("video"),
    hasLocalPack: types.includes("local_pack") || types.includes("maps"),
    hasPeopleAlsoAsk: types.includes("people_also_ask") || types.includes("people_also_ask_element"),
  };

  const organic: SerpOrganicResult[] = items
    .filter((i) => String(i.type ?? "") === "organic")
    .slice(0, limit)
    .map((i) => ({
      position: typeof i.rank_absolute === "number" ? i.rank_absolute : 0,
      url: typeof i.url === "string" ? i.url : "",
      title: typeof i.title === "string" ? i.title : "",
      description: typeof i.description === "string" ? i.description : null,
      domain: typeof i.domain === "string" ? i.domain : "",
      etv: typeof i.etv === "number" ? Math.round(i.etv) : null,
      breadcrumb: typeof i.breadcrumb === "string" ? i.breadcrumb : null,
      domainRank: typeof i.domain_rank === "number" ? i.domain_rank : null,
      backlinks: typeof i.backlinks === "number" ? i.backlinks : null,
    }));

  // Extract paid ads
  const ads: SerpAdsItem[] = [...topAds, ...bottomAds].map((i) => ({
    position: typeof i.rank_absolute === "number" ? i.rank_absolute : 0,
    title: typeof i.title === "string" ? i.title : "",
    description: typeof i.description === "string" ? i.description : null,
    domain: typeof i.domain === "string" ? i.domain : "",
    url: typeof i.url === "string" ? i.url : "",
    displayUrl: typeof i.breadcrumb === "string" ? i.breadcrumb : null,
    isTopAd: (i.rank_absolute as number) <= 4,
  }));

  // Extract local pack items
  const localPack: LocalPackItem[] = [];
  for (const i of items) {
    if (String(i.type ?? "") === "local_pack") {
      const subItems = (i.items ?? []) as Record<string, unknown>[];
      for (const s of subItems) {
        const ratingObj = (s.rating ?? {}) as Record<string, unknown>;
        localPack.push({
          title: typeof s.title === "string" ? s.title : "",
          address: typeof s.address === "string" ? s.address : null,
          phone: typeof s.phone === "string" ? s.phone : null,
          rating: typeof ratingObj.value === "number" ? ratingObj.value : null,
          reviewCount: typeof ratingObj.votes_count === "number" ? ratingObj.votes_count : null,
          website: typeof s.url === "string" ? s.url : null,
          category: typeof s.category === "string" ? s.category : null,
        });
      }
      break;
    }
  }

  // PAA extraction — handle both flat elements and container items
  function mapPaaElement(s: Record<string, unknown>): PeopleAlsoAskItem | null {
    const question = typeof s.title === "string" ? s.title.trim() : "";
    if (!question) return null;
    const answerItems = (s.items ?? []) as Record<string, unknown>[];
    const box = answerItems[0] as Record<string, unknown> | undefined;
    return {
      question,
      answer:
        typeof box?.description === "string" ? box.description :
        typeof box?.text === "string" ? box.text : null,
      url: typeof box?.url === "string" ? box.url : null,
      domain: typeof box?.domain === "string" ? box.domain : null,
    };
  }

  const paa: PeopleAlsoAskItem[] = [];
  for (const i of items) {
    const type = String(i.type ?? "");
    if (type === "people_also_ask_element") {
      const mapped = mapPaaElement(i);
      if (mapped) paa.push(mapped);
    } else if (type === "people_also_ask") {
      for (const s of (i.items ?? []) as Record<string, unknown>[]) {
        if (String(s.type ?? "") === "people_also_ask_element") {
          const mapped = mapPaaElement(s);
          if (mapped) paa.push(mapped);
        }
      }
    }
  }

  return { organic, paa: paa.slice(0, 12), features, localPack, ads };
}

// ─── Lightweight backlink summary (totals only, no individual links) ──────────
export interface BacklinkTotalSummary {
  backlinksTotal: number;
  referringDomains: number;
  domainRank: number;
}

export async function getBacklinkTotalSummary(target: string): Promise<BacklinkTotalSummary> {
  const summaryData = await dfsPost("/backlinks/summary/live", [
    { target, internal_list_limit: 0, external_list_limit: 0, include_subdomains: true },
  ]);
  const r = summaryData?.tasks?.[0]?.result?.[0] as Record<string, unknown> | undefined;
  return {
    backlinksTotal: typeof r?.backlinks === "number" ? r.backlinks : 0,
    referringDomains: typeof r?.referring_domains === "number" ? r.referring_domains : 0,
    domainRank: typeof r?.rank === "number" ? r.rank : 0,
  };
}

// ─── Common keywords between two domains (intersection count + list) ─────────
export interface CommonKeywordItem {
  keyword: string;
  volume: number | null;
  yourPosition: number | null;
  competitorPosition: number | null;
}

export async function getCommonKeywords(
  domain1: string,
  domain2: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 100
): Promise<{ count: number; items: CommonKeywordItem[] }> {
  const norm = (d: string) => d.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].toLowerCase();
  const d1 = norm(domain1);
  const d2 = norm(domain2);
  const data = await dfsPost("/dataforseo_labs/google/domain_intersection/live", [
    {
      targets: [
        { target: d1, type: "domain" },
        { target: d2, type: "domain" },
      ],
      location_code: locationCode,
      language_code: languageCode,
      limit,
      order_by: ["keyword_data.keyword_info.search_volume,desc"],
    },
  ]);
  const totalCount: number =
    (data?.tasks?.[0]?.result?.[0] as Record<string, unknown> | undefined)?.total_count as number ?? 0;
  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];
  const mapped: CommonKeywordItem[] = items.map((item) => {
    const kd = (item.keyword_data as Record<string, unknown>) ?? {};
    const ki = (kd.keyword_info as Record<string, unknown>) ?? {};
    const ranked = (item.ranked_elements as Record<string, unknown>[]) ?? [];
    const d1el = ranked.find((r) => String(r.target ?? r.domain ?? "").toLowerCase().includes(d1));
    const d2el = ranked.find((r) => String(r.target ?? r.domain ?? "").toLowerCase().includes(d2));
    return {
      keyword: String(kd.keyword ?? ""),
      volume: typeof ki.search_volume === "number" ? ki.search_volume : null,
      yourPosition: typeof d1el?.rank_absolute === "number" ? d1el.rank_absolute as number : null,
      competitorPosition: typeof d2el?.rank_absolute === "number" ? d2el.rank_absolute as number : null,
    };
  });
  return { count: typeof totalCount === "number" ? totalCount : mapped.length, items: mapped };
}
