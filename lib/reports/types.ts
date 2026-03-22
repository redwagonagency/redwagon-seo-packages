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

export interface LocalSeoData {
  position: number | null;
  rating: number | null;
  reviews: number | null;
  address: string | null;
  phone: string | null;
  found: boolean;
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
  try { return JSON.parse(json) as LlmEntry[]; } catch { return []; }
}

export function parseLocal(json: string | null): LocalSeoData | null {
  if (!json) return null;
  try { return JSON.parse(json) as LocalSeoData; } catch { return null; }
}

export function parseBacklinks(json: string | null): BacklinkEntry[] {
  if (!json) return [];
  try { return JSON.parse(json) as BacklinkEntry[]; } catch { return []; }
}

export function parsePages(json: string | null): PageAuditResult[] {
  if (!json) return [];
  try { return JSON.parse(json) as PageAuditResult[]; } catch { return []; }
}

export function parseCompetitors(json: string | null): CompetitorResult[] {
  if (!json) return [];
  try { return JSON.parse(json) as CompetitorResult[]; } catch { return []; }
}
