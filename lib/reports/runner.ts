/**
 * Unified Report Runner
 *
 * Each call creates one ReportSnapshot record for a project.
 * Sections: Site Audit (homepage), On-Page Multi-Page Crawl, Rank Tracking,
 *           LLM Visibility, Local SEO, Backlinks + Toxic Links, Competitor Research.
 *
 * Sections run concurrently. If one fails, snapshot is PARTIAL with error note.
 *
 * Plan-based page crawl limits:
 *   STARTER → 10 pages | PRO → 50 pages | ENTERPRISE → 100 pages
 */

import { prisma } from "@/lib/prisma";
import {
  analyzePageInstant,
  crawlSitePages,
  getBacklinkProfile,
  type BacklinkEntry,
  type PageAuditResult,
} from "@/lib/dataforseo/client";
import {
  getRankForDomain,
  checkAiVisibility,
  getLocalPackResult,
  type AiMentionResult,
} from "@/lib/serpapi/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RankingEntry {
  keyword: string;
  position: number | null;
  prevPosition: number | null;
  url: string | null;
  title: string | null;
  device: string;
  location: string;
}

export interface LlmEntry extends AiMentionResult {}

export interface LocalSeoData {
  position: number | null;
  rating: number | null;
  reviews: number | null;
  address: string | null;
  phone: string | null;
  found: boolean;
}

export interface CompetitorResult {
  domain: string;
  score: number;
  crawledPages: number;
  issues: { type: string; severity: string; description: string; count: number }[];
  title: string | null;
  loadTimeMs: number;
  hasCanonical: boolean;
  hasSchema: boolean;
  error?: string;
}

// Plan → max pages to crawl in on-page analysis
const PLAN_PAGE_LIMITS: Record<string, number> = {
  STARTER: 10,
  PRO: 50,
  ENTERPRISE: 100,
  AGENCY: 500,
  ADMIN: 9999,
};

// ─── Main Runner ─────────────────────────────────────────────────────────────

export async function runProjectReport(projectId: string) {
  // Fetch project with keywords, competitors, tenant plan
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      rankTrackers: {
        include: {
          rankings: { orderBy: { checkedAt: "desc" }, take: 1 },
        },
      },
      reportSnapshots: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      tenant: { select: { plan: true } },
    },
  });

  if (!project) throw new Error("Project not found");

  const plan = (project.tenant as { plan: string }).plan ?? "STARTER";
  const maxPages = PLAN_PAGE_LIMITS[plan] ?? 10;

  // Parse competitor domains from project
  let competitorDomains: string[] = [];
  if (project.competitorsJson) {
    try { competitorDomains = JSON.parse(project.competitorsJson); } catch { /* ignore */ }
  }

  // Build keyword list: prefer RankTracker records, fall back to keywordsJson
  type KeywordEntry = {
    keyword: string;
    device: string;
    location: string;
    trackerId: string | null;
    prevPosition: number | null;
  };

  const trackerKeywords: KeywordEntry[] = project.rankTrackers.map((rt) => ({
    keyword: rt.keyword,
    device: rt.device,
    location: rt.location,
    trackerId: rt.id,
    prevPosition: rt.rankings[0]?.position ?? null,
  }));

  let allKeywords = trackerKeywords;
  if (allKeywords.length === 0 && project.keywordsJson) {
    try {
      const extras: string[] = JSON.parse(project.keywordsJson);
      allKeywords = extras.map((kw) => ({
        keyword: kw,
        device: "desktop",
        location: project.location,
        trackerId: null as string | null,
        prevPosition: null as number | null,
      }));
    } catch { /* ignore */ }
  }

  // Create snapshot (RUNNING status) — all data will be written back at the end
  const snapshot = await prisma.reportSnapshot.create({
    data: { projectId, status: "RUNNING" },
  });

  const errors: string[] = [];

  type SiteData = Partial<{ siteScore: number; siteCrawledPages: number; siteIssuesJson: string }>;
  type OnPageData = Partial<{ onPagePagesJson: string; onPageCrawledCount: number; onPageAvgScore: number }>;
  type RankData = Partial<{ rankingsJson: string; avgPosition: number; top3Count: number; top10Count: number }>;
  type LlmData = Partial<{ llmJson: string; llmMentionRate: number }>;
  type LocalData = Partial<{ localJson: string; localFound: boolean }>;
  type BacklinkData = Partial<{ backlinksJson: string; toxicLinksJson: string; domainRank: number; backlinksTotal: number; referringDomains: number; backlinksSpamScore: number }>;
  type CompetitorData = Partial<{ competitorJson: string }>;

  let siteData: SiteData = {};
  let onPageData: OnPageData = {};
  let rankData: RankData = {};
  let llmData: LlmData = {};
  let localData: LocalData = {};
  let backlinkData: BacklinkData = {};
  let competitorData: CompetitorData = {};

  // ── Run all sections concurrently ──────────────────────────────────────────
  await Promise.allSettled([

    // 1. Site Audit — homepage (instant, always runs)
    (async () => {
      try {
        const result = await analyzePageInstant(`https://${project.domain}`);
        siteData = {
          siteScore: result.score,
          siteCrawledPages: result.crawledPages,
          siteIssuesJson: JSON.stringify(result.issues),
        };
      } catch (err) {
        errors.push(`Site audit: ${err instanceof Error ? err.message : String(err)}`);
      }
    })(),

    // 2. On-Page Multi-Page Crawl (plan-gated, sitemap-based)
    (async () => {
      try {
        const crawlResult = await crawlSitePages(project.domain, maxPages);
        const pages: PageAuditResult[] = Array.isArray(crawlResult)
          ? crawlResult
          : (crawlResult as { pages: PageAuditResult[] }).pages;
        const avgScore = pages.length > 0
          ? Math.round(pages.reduce((s, p) => s + p.score, 0) / pages.length)
          : 0;
        onPageData = {
          onPagePagesJson: JSON.stringify(pages),
          onPageCrawledCount: pages.length,
          onPageAvgScore: avgScore,
        };
      } catch (err) {
        errors.push(`On-page crawl: ${err instanceof Error ? err.message : String(err)}`);
      }
    })(),

    // 3. Rank Tracking (SerpAPI)
    (async () => {
      if (allKeywords.length === 0) return;
      try {
        const batchSize = 10;
        const rankings: RankingEntry[] = [];

        for (let i = 0; i < allKeywords.length; i += batchSize) {
          const batch = allKeywords.slice(i, i + batchSize);
          const results = await Promise.allSettled(
            batch.map(async (kw) => {
              const r = await getRankForDomain(kw.keyword, project.domain, {
                device: kw.device,
                location: kw.location !== "United States" ? kw.location : undefined,
              });
              return {
                keyword: kw.keyword,
                position: r.position,
                prevPosition: kw.prevPosition,
                url: r.url,
                title: r.title,
                device: kw.device,
                location: kw.location,
              } as RankingEntry;
            })
          );
          for (const r of results) {
            if (r.status === "fulfilled") rankings.push(r.value);
          }
        }

        const ranked = rankings.filter((r) => r.position !== null);
        const avgPos = ranked.length > 0
          ? ranked.reduce((s, r) => s + r.position!, 0) / ranked.length
          : 0;

        rankData = {
          rankingsJson: JSON.stringify(rankings),
          avgPosition: Math.round(avgPos * 10) / 10,
          top3Count: ranked.filter((r) => r.position! <= 3).length,
          top10Count: ranked.filter((r) => r.position! <= 10).length,
        };

        // Persist to individual KeywordRanking records for historical tracking
        for (const kw of allKeywords) {
          if (!kw.trackerId) continue;
          const match = rankings.find((r) => r.keyword === kw.keyword);
          if (match) {
            await prisma.keywordRanking.create({
              data: {
                rankTrackerId: kw.trackerId,
                position: match.position ?? 0,
                searchVolume: null,
                checkedAt: new Date(),
              },
            });
          }
        }
      } catch (err) {
        errors.push(`Rank tracking: ${err instanceof Error ? err.message : String(err)}`);
      }
    })(),

    // 4. LLM / AI Visibility (SerpAPI)
    (async () => {
      try {
        const queries = [project.name, `site:${project.domain}`];
        const results = await Promise.allSettled(
          queries.map((q) => checkAiVisibility(q, project.domain))
        );
        const mentions: LlmEntry[] = results
          .filter((r): r is PromiseFulfilledResult<AiMentionResult> => r.status === "fulfilled")
          .map((r) => r.value);
        const mentionRate = mentions.length > 0
          ? Math.round((mentions.filter((m) => m.mentioned).length / mentions.length) * 100)
          : 0;
        llmData = { llmJson: JSON.stringify(mentions), llmMentionRate: mentionRate };
      } catch (err) {
        errors.push(`LLM visibility: ${err instanceof Error ? err.message : String(err)}`);
      }
    })(),

    // 5. Local SEO (SerpAPI)
    (async () => {
      try {
        const result = await getLocalPackResult(project.name, project.location, project.domain);
        localData = { localJson: JSON.stringify(result), localFound: result.found };
      } catch (err) {
        errors.push(`Local SEO: ${err instanceof Error ? err.message : String(err)}`);
      }
    })(),

    // 6. Backlinks + Toxic Link Detection (DataForSEO)
    (async () => {
      try {
        const profile = await getBacklinkProfile(project.domain, 200);
        backlinkData = {
          backlinksJson: JSON.stringify(profile.backlinks),
          toxicLinksJson: JSON.stringify(profile.toxicLinks),
          domainRank: profile.domainRank,
          backlinksTotal: profile.backlinksTotal,
          referringDomains: profile.referringDomains,
          backlinksSpamScore: profile.spamScore,
        };
      } catch (err) {
        errors.push(`Backlinks: ${err instanceof Error ? err.message : String(err)}`);
      }
    })(),

    // 7. Competitor Research (DataForSEO instant pages on each competitor)
    (async () => {
      if (competitorDomains.length === 0) return;
      try {
        const results = await Promise.allSettled(
          competitorDomains.map(async (cd): Promise<CompetitorResult> => {
            try {
              const r = await analyzePageInstant(`https://${cd}`);
              return {
                domain: cd,
                score: r.score,
                crawledPages: r.crawledPages,
                issues: r.issues,
                title: r.title,
                loadTimeMs: r.loadTimeMs,
                hasCanonical: r.hasCanonical,
                hasSchema: r.hasSchema,
              };
            } catch (e) {
              return {
                domain: cd,
                score: 0,
                crawledPages: 0,
                issues: [],
                title: null,
                loadTimeMs: 0,
                hasCanonical: false,
                hasSchema: false,
                error: e instanceof Error ? e.message : "Failed to analyze",
              };
            }
          })
        );
        const competitors: CompetitorResult[] = results
          .filter((r): r is PromiseFulfilledResult<CompetitorResult> => r.status === "fulfilled")
          .map((r) => r.value);
        competitorData = { competitorJson: JSON.stringify(competitors) };
      } catch (err) {
        errors.push(`Competitor research: ${err instanceof Error ? err.message : String(err)}`);
      }
    })(),
  ]);

  // Determine final status
  const hasSomeData =
    Object.keys(siteData).length > 0 ||
    Object.keys(onPageData).length > 0 ||
    Object.keys(rankData).length > 0 ||
    Object.keys(llmData).length > 0 ||
    Object.keys(localData).length > 0 ||
    Object.keys(backlinkData).length > 0 ||
    Object.keys(competitorData).length > 0;

  const status = errors.length === 0 ? "COMPLETE" : hasSomeData ? "PARTIAL" : "FAILED";

  // Write all data into the single snapshot record
  const updated = await prisma.reportSnapshot.update({
    where: { id: snapshot.id },
    data: {
      status,
      ...siteData,
      ...onPageData,
      ...rankData,
      ...llmData,
      ...localData,
      ...backlinkData,
      ...competitorData,
      errorMessage: errors.length > 0 ? errors.join("; ") : null,
      completedAt: new Date(),
    },
  });

  return updated;
}
