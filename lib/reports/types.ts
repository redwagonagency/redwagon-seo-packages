// Shared types for ReportSnapshot data — used by dashboard pages

export interface SiteIssue {
  type: string;
  severity: "critical" | "warning" | "info";
  description: string;
  count: number;
}

export interface RankingEntry {
  keyword: string;
  position: number | null;
  prevPosition: number | null;
  url: string | null;
  title: string | null;
  device: string;
  location: string;
}

export interface LlmEntry {
  query: string;
  mentioned: boolean;
  source: string;
  snippet: string | null;
}

export interface LlmTopPage {
  page: string;
  mentions: number;
  share: number | null;
}

export interface LlmTopDomain {
  domain: string;
  mentions: number;
  share: number | null;
}

export interface LlmSnapshot {
  mentions: LlmEntry[];
  topPages?: LlmTopPage[];
  topDomains?: LlmTopDomain[];
  aggregatedMetrics?: unknown[];
  crossAggregatedMetrics?: unknown[];
}

export interface LocalSeoData {
  position: number | null;
  rating: number | null;
  reviews: number | null;
  address: string | null;
  phone: string | null;
  found: boolean;
}

export interface LocalKeywordRank {
  keyword: string;
  position: number | null;
  found: boolean;
  rating: number | null;
  reviews: number | null;
  address: string | null;
  phone: string | null;
}

export interface LocalSeoSnapshot {
  business: LocalSeoData;
  keywords: LocalKeywordRank[];
  summary: {
    trackedCount: number;
    foundCount: number;
    avgPosition: number | null;
  };
}

export interface LocalBusinessDetail {
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

export interface LocalQaItem {
  question: string;
  answerCount: number;
  topAnswer: string | null;
  topAnswerAuthor: string | null;
}

export interface LocalRankingData {
  keyword: string;
  location: string;
  position: number | null;
  title: string | null;
  url: string | null;
}

export interface ExtendedLocalSeoSnapshot extends LocalSeoSnapshot {
  businessDetails?: LocalBusinessDetail;
  questionsAnswers?: LocalQaItem[];
  localRankings?: LocalRankingData[];
}

export interface BacklinkEntry {
  domain: string;
  url: string;
  anchor: string;
  spamScore: number;     // 0-100. >60 = toxic
  domainRank: number;    // DataForSEO domain rank (0-100, equiv. to DA/DR)
  dofollow: boolean;
  firstSeen: string | null;
  toxic: boolean;
}

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
  issues: SiteIssue[];
}

export interface CompetitorResult {
  domain: string;
  score: number;
  crawledPages: number;
  issues: SiteIssue[];
  title: string | null;
  loadTimeMs: number;
  hasCanonical: boolean;
  hasSchema: boolean;
  domainRank?: number;
  backlinksTotal?: number;
  referringDomains?: number;
  backlinksSpamScore?: number;
  organicKeywords?: number;
  organicTraffic?: number;
  aiMentionRate?: number;
  rankedKeywordCount?: number;
  topPages?: string[];
  pageIntersectionCount?: number;
  dominanceOpportunitiesJson?: string;
  error?: string;
}

// Safe JSON parsers — all return empty defaults on parse failure
export function parseSiteIssues(json: string | null): SiteIssue[] {
  if (!json) return [];
  try { return JSON.parse(json) as SiteIssue[]; } catch { return []; }
}

export function parseRankings(json: string | null): RankingEntry[] {
  if (!json) return [];
  try { return JSON.parse(json) as RankingEntry[]; } catch { return []; }
}

export function parseLlm(json: string | null): LlmEntry[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as LlmEntry[] | LlmSnapshot;
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.mentions)) {
      return parsed.mentions;
    }
    return [];
  } catch {
    return [];
  }
}

export function parseLlmSnapshot(json: string | null): LlmSnapshot {
  if (!json) return { mentions: [] };
  try {
    const parsed = JSON.parse(json) as LlmEntry[] | LlmSnapshot;
    if (Array.isArray(parsed)) return { mentions: parsed };
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.mentions)) {
      return parsed;
    }
    return { mentions: [] };
  } catch {
    return { mentions: [] };
  }
}

export function parseLocal(json: string | null): ExtendedLocalSeoSnapshot | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as LocalSeoData | LocalSeoSnapshot;

    // Backward compatibility for older snapshots that stored only LocalSeoData
    if (
      parsed &&
      typeof parsed === "object" &&
      "position" in parsed &&
      "found" in parsed
    ) {
      const legacy = parsed as LocalSeoData;
      return {
        business: legacy,
        keywords: [],
        summary: { trackedCount: 0, foundCount: 0, avgPosition: null },
      };
    }

    return parsed as ExtendedLocalSeoSnapshot;
  } catch {
    return null;
  }
}

export function parseBacklinks(json: string | null): BacklinkEntry[] {
  if (!json) return [];
  try { return JSON.parse(json) as BacklinkEntry[]; } catch { return []; }
}

export function parsePages(json: string | null): PageAuditResult[] {
  if (!json) return [];
  try { return JSON.parse(json) as PageAuditResult[]; } catch { return []; }
}

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

export function parseOnPageErrors(json: string | null): OnPageErrorItem[] {
  if (!json) return [];
  try { return JSON.parse(json) as OnPageErrorItem[]; } catch { return []; }
}

export function parseOnPageDuplicateTags(json: string | null): DuplicateTagItem[] {
  if (!json) return [];
  try { return JSON.parse(json) as DuplicateTagItem[]; } catch { return []; }
}

export function parseOnPageBrokenLinks(json: string | null): OnPageLinkItem[] {
  if (!json) return [];
  try { return JSON.parse(json) as OnPageLinkItem[]; } catch { return []; }
}

export function parseCompetitors(json: string | null): CompetitorResult[] {
  if (!json) return [];
  try { return JSON.parse(json) as CompetitorResult[]; } catch { return []; }
}
