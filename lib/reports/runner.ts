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

import { isPrismaMissingTableError, prisma } from "@/lib/prisma";
import {
  analyzePageInstant,
  checkBusinessListings,
  crawlSitePages,
  getBacklinkProfile,
  getDomainRankOverview,
  getRankedKeywords,
  getDomainIntersection,
  getRelevantPages,
  getPageIntersection,
  getTopSearches,
  getRelatedKeywords,
  getKeywordSuggestions,
  getKeywordIdeasLabs,
  getKeywordOverviewLabs,
  getBulkKeywordDifficulty,
  getSearchIntent,
  getLlmMentionsSearchLive,
  getLlmTopPagesLive,
  getLlmTopDomainsLive,
  getLlmAggregatedMetricsLive,
  getLlmCrossAggregatedMetricsLive,
  getPerplexityLlmResponsesLive,
  getCategoriesForKeywords,
  getKeywordsForCategories,
  getCategoriesForDomain,
  getDomainMetricsByCategories,
  getKeywordsForSite,
  getLocalBusinessInfo,
  getQuestionsAndAnswers,
  getLocalKeywordRanking,
  type PageAuditResult,
  type LocalBusinessInfo,
  type QaItem,
  type LocalRankingItem,
  type RankedKeywordItem,
  type RelevantPageItem,
  type KeywordOverviewItem,
  type SearchIntentItem,
  type DomainCategoryItem,
  type KeywordForSiteItem,
} from "@/lib/dataforseo/client";
import {
  getRankForDomain,
  checkAiVisibility,
  getLocalPackRankForKeyword,
  getLocalPackResult,
  locationNameToCode,
  type AiMentionResult,
} from "@/lib/serpapi/client";
import {
  finishReportProgress,
  getReportProgress,
  updateReportProgress,
} from "@/lib/reports/progress";

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

export type LlmEntry = AiMentionResult;

export interface LocalSeoData {
  position: number | null;
  rating: number | null;
  reviews: number | null;
  address: string | null;
  phone: string | null;
  found: boolean;
}

export interface LocalKeywordRank extends LocalSeoData {
  keyword: string;
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

export interface CompetitorResult {
  domain: string;
  score: number;
  crawledPages: number;
  issues: { type: string; severity: string; description: string; count: number }[];
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

// Plan → max pages to crawl in on-page analysis
const PLAN_PAGE_LIMITS: Record<string, number> = {
  STARTER: 10,
  PRO: 50,
  ENTERPRISE: 100,
  AGENCY: 500,
  ADMIN: 9999,
};

const CORE_AUDIT_DOMAIN = "redwagon.agency";

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// Hard safety guard to avoid runaway crawls that can destabilize the app.
const GLOBAL_MAX_CRAWL_PAGES = parsePositiveInt(process.env.REPORT_GLOBAL_MAX_PAGES, 500);
const CORE_AUDIT_PAGE_LIMIT = parsePositiveInt(process.env.REPORT_CORE_AUDIT_MAX_PAGES, 500);
const FORCED_CORE_AUDIT_PAGES = 500;

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
  const planPageLimit = PLAN_PAGE_LIMITS[plan] ?? 10;
  const normalizedDomain = project.domain
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase();
  const maxPages = normalizedDomain === CORE_AUDIT_DOMAIN
    ? FORCED_CORE_AUDIT_PAGES
    : Math.min(planPageLimit, GLOBAL_MAX_CRAWL_PAGES, CORE_AUDIT_PAGE_LIMIT);

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

  // Use existing RUNNING snapshot created by run endpoint when available.
  const activeProgress = getReportProgress(projectId);
  const snapshot = activeProgress?.snapshotId
    ? await prisma.reportSnapshot.findUnique({ where: { id: activeProgress.snapshotId } })
    : null;

  const snapshotRecord =
    snapshot ??
    (await prisma.reportSnapshot.create({
      data: { projectId, status: "RUNNING" },
    }));

  updateReportProgress(projectId, {
    snapshotId: snapshotRecord.id,
    phase: "Collecting data",
    message: "Starting report sections",
    percent: 8,
    targetPages: maxPages,
  });

  const errors: string[] = [];

  type SiteData = Partial<{ siteScore: number; siteCrawledPages: number; siteIssuesJson: string }>;
  type OnPageData = Partial<{ onPagePagesJson: string; onPageCrawledCount: number; onPageAvgScore: number; onPageErrorsJson: string; onPageDuplicateTagsJson: string; onPageBrokenLinksJson: string }>;
  type RankData = Partial<{ rankingsJson: string; avgPosition: number; top3Count: number; top10Count: number }>;
  type LlmData = Partial<{ llmJson: string; llmMentionRate: number }>;
  type LocalData = Partial<{ localJson: string; localFound: boolean }>;
  type BacklinkData = Partial<{ backlinksJson: string; toxicLinksJson: string; domainRank: number; backlinksTotal: number; referringDomains: number; backlinksSpamScore: number }>;
  type CompetitorData = Partial<{ competitorJson: string }>;
  type UserPositioningData = Partial<{ userKeywordCountJson: string; userTopPagesJson: string; growthOpportunitiesJson: string }>;
  type KeywordResearchData = Partial<{ keywordIdeaJson: string; keywordSearchIntentJson: string; topSearchesJson: string; siteKeywordsJson: string }>;
  type CategoryAnalysisData = Partial<{ domainCategoriesJson: string; categoryMetricsJson: string }>;

  let siteData: SiteData = {};
  let onPageData: OnPageData = {};
  let rankData: RankData = {};
  let llmData: LlmData = {};
  let localData: LocalData = {};
  let backlinkData: BacklinkData = {};
  let competitorData: CompetitorData = {};
  let userPositioningData: UserPositioningData = {};
  let keywordResearchData: KeywordResearchData = {};
  let categoryAnalysisData: CategoryAnalysisData = {};

  const totalSections = 11;
  let completedSections = 0;

  const markSectionDone = (section: string, ok: boolean) => {
    completedSections += 1;
    const percent = 10 + (completedSections / totalSections) * 85;
    updateReportProgress(projectId, {
      phase: section,
      message: ok ? `${section} complete` : `${section} completed with issues`,
      percent,
    });
  };

  let onPagePersistedCount = 0;
  let onPagePersistedAt = 0;

  const persistOnPageProgress = async (
    pages: PageAuditResult[],
    force = false,
    phaseLabel = "On-page crawl"
  ) => {
    if (pages.length === 0) return;

    const now = Date.now();
    const deltaPages = pages.length - onPagePersistedCount;
    const deltaTime = now - onPagePersistedAt;
    if (!force && deltaPages < 10 && deltaTime < 5000) return;

    const avgScore = Math.round(pages.reduce((sum, page) => sum + page.score, 0) / pages.length);
    onPageData = {
      onPagePagesJson: JSON.stringify(pages),
      onPageCrawledCount: pages.length,
      onPageAvgScore: avgScore,
    };

    updateReportProgress(projectId, {
      phase: phaseLabel,
      message: `Crawled ${pages.length}/${maxPages} pages`,
      crawledPages: pages.length,
      targetPages: maxPages,
    });

    try {
      await prisma.reportSnapshot.update({
        where: { id: snapshotRecord.id },
        data: {
          status: "RUNNING",
          onPagePagesJson: onPageData.onPagePagesJson,
          onPageCrawledCount: onPageData.onPageCrawledCount,
          onPageAvgScore: onPageData.onPageAvgScore,
        },
      });
    } catch {
      // Do not block report execution on intermediate writes.
    }

    onPagePersistedCount = pages.length;
    onPagePersistedAt = now;
  };

  // ── Run all sections concurrently ──────────────────────────────────────────
  await Promise.allSettled([

    // 1. Site Audit — homepage (instant, always runs)
    (async () => {
      try {
        updateReportProgress(projectId, {
          phase: "Site audit",
          message: "Analyzing homepage",
        });
        const result = await analyzePageInstant(`https://${project.domain}`);
        siteData = {
          siteScore: result.score,
          siteCrawledPages: result.crawledPages,
          siteIssuesJson: JSON.stringify(result.issues),
        };
        markSectionDone("Site audit", true);
      } catch (err) {
        errors.push(`Site audit: ${err instanceof Error ? err.message : String(err)}`);
        markSectionDone("Site audit", false);
      }
    })(),

    // 2. On-Page Multi-Page Crawl (plan-gated, sitemap-based)
    (async () => {
      try {
        updateReportProgress(projectId, {
          phase: "On-page crawl",
          message: `Crawling up to ${maxPages} pages`,
        });
        const crawlResult = await crawlSitePages(
          project.domain,
          maxPages,
          async (update) => {
            await persistOnPageProgress(
              update.pages,
              false,
              update.phase === "fallback" ? "On-page fallback crawl" : "On-page crawl"
            );
          }
        );

        await persistOnPageProgress(crawlResult.pages, true, "On-page crawl");

        // Store site-wide error summary, duplicate tags, and broken links from the task.
        if (crawlResult.errors.length > 0 || crawlResult.duplicateTags.length > 0 || crawlResult.brokenLinks.length > 0) {
          onPageData.onPageErrorsJson = JSON.stringify(crawlResult.errors);
          onPageData.onPageDuplicateTagsJson = JSON.stringify(crawlResult.duplicateTags);
          onPageData.onPageBrokenLinksJson = JSON.stringify(crawlResult.brokenLinks);
          try {
            await prisma.reportSnapshot.update({
              where: { id: snapshotRecord.id },
              data: {
                onPageErrorsJson: onPageData.onPageErrorsJson,
                onPageDuplicateTagsJson: onPageData.onPageDuplicateTagsJson,
                onPageBrokenLinksJson: onPageData.onPageBrokenLinksJson,
              },
            });
          } catch { /* non-fatal intermediate write */ }
        }
        markSectionDone("On-page crawl", true);
      } catch (err) {
        errors.push(`On-page crawl: ${err instanceof Error ? err.message : String(err)}`);
        markSectionDone("On-page crawl", false);
      }
    })(),

    // 3. Rank Tracking (SerpAPI)
    (async () => {
      if (allKeywords.length === 0) return;
      try {
        updateReportProgress(projectId, {
          phase: "Rank tracking",
          message: `Checking ${allKeywords.length} keywords`,
        });
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
                position: match.position,
                url: match.url,
                searchVolume: null,
                checkedAt: new Date(),
              },
            });
          }
        }
        markSectionDone("Rank tracking", true);
      } catch (err) {
        errors.push(`Rank tracking: ${err instanceof Error ? err.message : String(err)}`);
        markSectionDone("Rank tracking", false);
      }
    })(),

    // 4. LLM / AI Visibility (SerpAPI)
    (async () => {
      try {
        updateReportProgress(projectId, {
          phase: "LLM visibility",
          message: "Checking LIVE AI Optimization mentions",
        });

        const keywordSeed = new Set<string>([project.name]);
        for (const kw of allKeywords.slice(0, 9)) keywordSeed.add(kw.keyword);
        const llmQueries = Array.from(keywordSeed).map((q) => q.trim()).filter(Boolean).slice(0, 10);

        const searchSettled = await Promise.allSettled(
          llmQueries.map((q) => getLlmMentionsSearchLive(q, project.domain, 15))
        );

        const perplexitySettled = await Promise.allSettled(
          llmQueries.slice(0, 5).map((q) => getPerplexityLlmResponsesLive(q, project.domain, 8))
        );

        // Collect additional LIVE endpoint outputs for richer analytics payload.
        const [topPages, topDomains, aggregated, crossAggregated] = await Promise.allSettled([
          getLlmTopPagesLive(project.domain, 15),
          getLlmTopDomainsLive(project.name, 15),
          getLlmAggregatedMetricsLive(project.domain),
          getLlmCrossAggregatedMetricsLive(project.domain),
        ]);

        const mergedMentions: LlmEntry[] = [];
        for (const item of searchSettled) {
          if (item.status === "fulfilled") {
            mergedMentions.push(
              ...item.value.map((m) => ({
                query: m.query,
                mentioned: m.mentioned,
                source: m.source,
                snippet: m.snippet,
              }))
            );
          }
        }

        for (const item of perplexitySettled) {
          if (item.status === "fulfilled") {
            mergedMentions.push(
              ...item.value.map((m) => ({
                query: m.query,
                mentioned: m.mentioned,
                source: m.source,
                snippet: m.snippet,
              }))
            );
          }
        }

        const dedupedMentions: LlmEntry[] = [];
        const seen = new Set<string>();
        for (const m of mergedMentions) {
          const key = `${m.query}::${m.source}::${m.snippet ?? ""}`;
          if (seen.has(key)) continue;
          seen.add(key);
          dedupedMentions.push(m);
        }

        let mentionRate = dedupedMentions.length > 0
          ? Math.round((dedupedMentions.filter((m) => m.mentioned).length / dedupedMentions.length) * 100)
          : 0;

        if (aggregated.status === "fulfilled" && aggregated.value.length > 0) {
          const rates = aggregated.value
            .map((m) => m.mentionRate)
            .filter((r): r is number => typeof r === "number" && Number.isFinite(r));
          if (rates.length > 0) {
            mentionRate = Math.round(rates.reduce((sum, r) => sum + r, 0) / rates.length);
          }
        }

        llmData = {
          llmJson: JSON.stringify({
            mentions: dedupedMentions,
            topPages: topPages.status === "fulfilled" ? topPages.value : [],
            topDomains: topDomains.status === "fulfilled" ? topDomains.value : [],
            aggregatedMetrics: aggregated.status === "fulfilled" ? aggregated.value : [],
            crossAggregatedMetrics: crossAggregated.status === "fulfilled" ? crossAggregated.value : [],
          }),
          llmMentionRate: mentionRate,
        };

        markSectionDone("LLM visibility", true);
      } catch (err) {
        errors.push(`LLM visibility: ${err instanceof Error ? err.message : String(err)}`);
        markSectionDone("LLM visibility", false);
      }
    })(),

    // 5. Local SEO (SerpAPI)
    (async () => {
      try {
        updateReportProgress(projectId, {
          phase: "Local SEO",
          message: "Checking local pack and citations",
        });
        const business = await getLocalPackResult(project.name, project.location, project.domain);

        // Track local map positions for up to 20 project/rank keywords.
        const keywordSeed = new Set<string>(allKeywords.map((k) => k.keyword));
        if (project.keywordsJson) {
          try {
            const parsed = JSON.parse(project.keywordsJson) as string[];
            for (const kw of parsed) keywordSeed.add(kw);
          } catch {
            // Ignore malformed historical keywords JSON
          }
        }

        const localKeywords = Array.from(keywordSeed)
          .map((k) => k.trim())
          .filter(Boolean)
          .slice(0, 20);

        const keywordResults: LocalKeywordRank[] = [];
        if (localKeywords.length > 0) {
          const results = await Promise.allSettled(
            localKeywords.map((keyword) =>
              getLocalPackRankForKeyword(keyword, project.name, project.location, project.domain)
            )
          );

          for (const result of results) {
            if (result.status === "fulfilled") keywordResults.push(result.value);
          }
        }

        const foundRanks = keywordResults.filter((k) => k.position !== null).map((k) => k.position as number);
        const avgPosition = foundRanks.length > 0
          ? Math.round((foundRanks.reduce((sum, val) => sum + val, 0) / foundRanks.length) * 10) / 10
          : null;

        const localSnapshot: LocalSeoSnapshot = {
          business,
          keywords: keywordResults,
          summary: {
            trackedCount: keywordResults.length,
            foundCount: keywordResults.filter((k) => k.found).length,
            avgPosition,
          },
        };

        // Fetch enhanced GMB business details
        const locationCode = locationNameToCode(project.location);
        let businessDetails: LocalBusinessInfo | null = null;
        let questionsAndAnswers: QaItem[] = [];
        let localRankings: LocalRankingItem[] = [];

        try {
          updateReportProgress(projectId, {
            phase: "Local SEO",
            message: "Fetching GMB business details",
          });
          businessDetails = await getLocalBusinessInfo(project.name, locationCode);
        } catch (err) {
          console.error("Failed to fetch GMB business info:", err);
        }

        try {
          updateReportProgress(projectId, {
            phase: "Local SEO",
            message: "Fetching GMB Q&A data",
          });
          questionsAndAnswers = await getQuestionsAndAnswers(project.name, locationCode);
        } catch (err) {
          console.error("Failed to fetch Q&A data:", err);
        }

        try {
          updateReportProgress(projectId, {
            phase: "Local SEO",
            message: "Fetching local keyword rankings",
          });
          if (localKeywords.length > 0) {
            const rankingResults = await Promise.allSettled(
              localKeywords.map((keyword) =>
                getLocalKeywordRanking(keyword, project.name, locationCode)
              )
            );

            for (const result of rankingResults) {
              if (result.status === "fulfilled" && result.value) {
                localRankings.push(result.value);
              }
            }
          }
        } catch (err) {
          console.error("Failed to fetch local keyword rankings:", err);
        }

        // Build extended snapshot with new data
        const extendedLocalSnapshot = {
          ...localSnapshot,
          businessDetails,
          questionsAndAnswers,
          localRankings,
        };

        localData = {
          localJson: JSON.stringify(extendedLocalSnapshot),
          localFound: business.found,
        };

        // Refresh local citation consistency data for directory listings.
        if (project.location && project.name) {
          const citations = await checkBusinessListings(
            project.name,
            business.address ?? "",
            business.phone ?? "",
            project.location,
            200
          );

          await prisma.localCitation.deleteMany({ where: { projectId } });
          if (citations.length > 0) {
            await prisma.localCitation.createMany({
              data: citations.map((c) => ({
                projectId,
                directory: c.directory,
                name: project.name,
                address: business.address,
                phone: business.phone,
                website: c.listingUrl,
                status: c.status.toUpperCase(),
                naConsistent: c.status === "consistent",
              })),
            });
          }
        }
        markSectionDone("Local SEO", true);
      } catch (err) {
        errors.push(`Local SEO: ${err instanceof Error ? err.message : String(err)}`);
        markSectionDone("Local SEO", false);
      }
    })(),

    // 6. Backlinks + Toxic Link Detection (DataForSEO)
    (async () => {
      try {
        updateReportProgress(projectId, {
          phase: "Backlinks",
          message: "Analyzing backlink profile",
        });
        const profile = await getBacklinkProfile(project.domain, 200);
        backlinkData = {
          backlinksJson: JSON.stringify(profile.backlinks),
          toxicLinksJson: JSON.stringify(profile.toxicLinks),
          domainRank: profile.domainRank,
          backlinksTotal: profile.backlinksTotal,
          referringDomains: profile.referringDomains,
          backlinksSpamScore: profile.spamScore,
        };
        markSectionDone("Backlinks", true);
      } catch (err) {
        errors.push(`Backlinks: ${err instanceof Error ? err.message : String(err)}`);
        markSectionDone("Backlinks", false);
      }
    })(),

    // 7. Competitor Research (crawl + backlinks + domain overview + AI visibility + Labs APIs)
    (async () => {
      if (competitorDomains.length === 0) return;
      try {
        updateReportProgress(projectId, {
          phase: "Competitors",
          message: `Analyzing ${competitorDomains.length} competitors with SEO and Labs APIs`,
        });
        const results = await Promise.allSettled(
          competitorDomains.map(async (cd): Promise<CompetitorResult> => {
            try {
              // Part 1: Core domain analysis + Labs APIs for this competitor
              const [
                competitorCrawlResult,
                backlinkProfile,
                domainOverview,
                aiChecks,
                rankedKeywords,
                relevantPages,
                // Get domain intersection with user domain to find strategic gaps
                domainIntersection,
              ] = await Promise.all([
                crawlSitePages(cd, Math.min(maxPages, 100)),
                getBacklinkProfile(cd, 150),
                getDomainRankOverview(cd),
                Promise.allSettled([
                  checkAiVisibility(cd, cd),
                  checkAiVisibility(`site:${cd}`, cd),
                ]),
                getRankedKeywords(cd, 2840, "en", 100),
                getRelevantPages(cd, 2840, "en", 25),
                getDomainIntersection(project.domain, cd, 2840, "en", 100),
              ]);
              const competitorPages = competitorCrawlResult.pages;

              const primary = competitorPages[0] ?? await analyzePageInstant(`https://${cd}`);
              const issueMap = new Map<string, { type: string; severity: string; description: string; count: number }>();

              for (const page of competitorPages) {
                for (const issue of page.issues) {
                  const key = `${issue.type}|${issue.severity}`;
                  const existing = issueMap.get(key);
                  if (existing) {
                    existing.count += issue.count;
                  } else {
                    issueMap.set(key, {
                      type: issue.type,
                      severity: issue.severity,
                      description: issue.description,
                      count: issue.count,
                    });
                  }
                }
              }

              const avgScore = competitorPages.length > 0
                ? Math.round(competitorPages.reduce((sum, page) => sum + page.score, 0) / competitorPages.length)
                : primary.score;

              const aiMentions = aiChecks
                .filter((r): r is PromiseFulfilledResult<AiMentionResult> => r.status === "fulfilled")
                .map((r) => r.value);
              const aiMentionRate = aiMentions.length > 0
                ? Math.round((aiMentions.filter((m) => m.mentioned).length / aiMentions.length) * 100)
                : 0;

              // Extract top pages from relevant_pages API
              const topPages = relevantPages
                .slice(0, 5)
                .map((p) => p.url);

              // Find dominance opportunities: keywords where competitor ranks better
              const dominanceGaps = domainIntersection
                .filter((item) => item.opportunity === "they_rank_higher" && item.searchVolume > 100)
                .sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0))
                .slice(0, 20)
                .map((item) => ({
                  keyword: item.keyword,
                  theirPosition: item.theirPosition,
                  opportunity: "they_rank_higher",
                  volume: item.searchVolume,
                }));

              return {
                domain: cd,
                score: avgScore,
                crawledPages: competitorPages.length > 0 ? competitorPages.length : 1,
                issues: Array.from(issueMap.values()).sort((a, b) => b.count - a.count).slice(0, 20),
                title: primary.title,
                loadTimeMs: primary.loadTimeMs,
                hasCanonical: primary.hasCanonical,
                hasSchema: primary.hasSchema,
                domainRank: backlinkProfile.domainRank,
                backlinksTotal: backlinkProfile.backlinksTotal,
                referringDomains: backlinkProfile.referringDomains,
                backlinksSpamScore: backlinkProfile.spamScore,
                organicKeywords: domainOverview.organicKeywords,
                organicTraffic: domainOverview.organicTraffic,
                aiMentionRate,
                rankedKeywordCount: rankedKeywords.length,
                topPages,
                pageIntersectionCount: relevantPages.length,
                dominanceOpportunitiesJson: JSON.stringify(dominanceGaps),
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
        markSectionDone("Competitors", true);
      } catch (err) {
        errors.push(`Competitor research: ${err instanceof Error ? err.message : String(err)}`);
        markSectionDone("Competitors", false);
      }
    })(),

    // 7b. User Domain Labs Analysis (self-analysis for competitive positioning)
    (async () => {
      if (competitorDomains.length === 0) return;
      try {
        updateReportProgress(projectId, {
          phase: "Competitive positioning",
          message: "Analyzing your domain positioning vs competitors",
        });
        const [userKeywords, userRelevantPages, userDomainOverview] = await Promise.all([
          getRankedKeywords(project.domain, 2840, "en", 100),
          getRelevantPages(project.domain, 2840, "en", 25),
          getDomainRankOverview(project.domain),
        ]);

        // Find growth opportunities: keywords you don't rank for but competitors do
        const competitorAnalyses = await Promise.allSettled(
          competitorDomains.slice(0, 5).map((cd) => getDomainIntersection(project.domain, cd, 2840, "en", 100))
        );

        const allGaps: Array<{ keyword: string; ourPosition: number | null; theirDomain: string; theirPosition: number | null; volume: number }> = [];
        
        for (let i = 0; i < competitorAnalyses.length; i++) {
          const result = competitorAnalyses[i];
          if (result.status === "fulfilled") {
            const intersections = result.value;
            for (const item of intersections) {
              if ((item.yourPosition === null || item.yourPosition > 10) && item.theirPosition !== null && item.theirPosition < 20) {
                allGaps.push({
                  keyword: item.keyword,
                  ourPosition: item.yourPosition,
                  theirDomain: competitorDomains[i],
                  theirPosition: item.theirPosition,
                  volume: item.searchVolume,
                });
              }
            }
          }
        }

        // Sort by opportunity score (volume × position gap)
        const opportunityScore = (gap: typeof allGaps[0]) =>
          (gap.volume || 100) * ((gap.theirPosition || 1) - (gap.ourPosition || 100));

        const topOpportunities = allGaps
          .sort((a, b) => opportunityScore(b) - opportunityScore(a))
          .slice(0, 20)
          .map((gap) => ({
            keyword: gap.keyword,
            yourPosition: gap.ourPosition,
            competitorPosition: gap.theirPosition,
            competitorDomain: gap.theirDomain,
            volume: gap.volume,
          }));

        // Store user domain analysis summary
        userPositioningData = {
          userKeywordCountJson: JSON.stringify({ total: userKeywords.length }),
          userTopPagesJson: JSON.stringify(userRelevantPages.slice(0, 10).map((p) => ({ url: p.url, traffic: p.traffic }))),
          growthOpportunitiesJson: JSON.stringify(topOpportunities),
        };

        markSectionDone("Competitive positioning", true);
      } catch (err) {
        errors.push(`Competitive positioning: ${err instanceof Error ? err.message : String(err)}`);
        markSectionDone("Competitive positioning", false);
      }
    })(),

    // 8. Domain Analytics cache
    (async () => {
      try {
        updateReportProgress(projectId, {
          phase: "Domain analytics",
          message: "Caching domain analytics",
        });
        const overview = await getDomainRankOverview(project.domain);
        try {
          await prisma.domainAnalysis.create({
            data: {
              projectId,
              domain: project.domain,
              organicKeywords: overview.organicKeywords,
              organicTraffic: overview.organicTraffic,
              domainRank: overview.domainRank,
              etv: overview.etv,
              topKeywordsJson: JSON.stringify(overview.topKeywords),
              competitorsJson: JSON.stringify(overview.competitorDomains),
            },
          });
        } catch (dbErr) {
          if (!isPrismaMissingTableError(dbErr, "DomainAnalysis")) {
            throw dbErr;
          }
          // Optional cache table may be absent in older local DBs; do not fail the report.
        }
        markSectionDone("Domain analytics", true);
      } catch (err) {
        errors.push(`Domain analytics: ${err instanceof Error ? err.message : String(err)}`);
        markSectionDone("Domain analytics", false);
      }
    })(),

    // 9. Keyword Research (Labs APIs)
    (async () => {
      if (project.rankTrackers.length === 0) return;
      try {
        updateReportProgress(projectId, {
          phase: "Keyword research",
          message: "Analyzing tracked keywords with Labs APIs",
        });

        // Extract unique keywords from all trackers
        const trackedKeywords = Array.from(
          new Set(project.rankTrackers.map((rt) => rt.keyword).filter(Boolean))
        );

        if (trackedKeywords.length === 0) {
          markSectionDone("Keyword research", true);
          return;
        }

        // Run parallel keyword research queries
        const [overviews, intents, suggestions, ideas, topSearches, relatedKeywords, siteKeywords] = await Promise.allSettled([
          Promise.resolve(
            await Promise.all(
              trackedKeywords
                .slice(0, 20)
                .map((kw) => getKeywordOverviewLabs([kw]).catch(() => []))
            ).then((results) => results.flat())
          ),
          getSearchIntent(trackedKeywords.slice(0, 20)).catch(() => []),
          getKeywordSuggestions(trackedKeywords[0] || "seo", 2840, "en", 30).catch(() => []),
          getKeywordIdeasLabs(trackedKeywords[0] || "seo", 2840, "en", 25).catch(() => []),
          getTopSearches(2840, "en", 25).catch(() => []),
          (async () => {
            const results = [];
            for (const kw of trackedKeywords.slice(0, 5)) {
              const related = await getRelatedKeywords(kw, 2840, "en", 10).catch(() => []);
              results.push(...related);
            }
            return results.slice(0, 30);
          })(),
          getKeywordsForSite(project.domain, 2840, "en", 50).catch(() => []),
        ]);

        const keywordOverviewList = overviews.status === "fulfilled" ? overviews.value : [];
        const intent = intents.status === "fulfilled" ? intents.value : [];
        const suggestion = suggestions.status === "fulfilled" ? suggestions.value : [];
        const idea = ideas.status === "fulfilled" ? ideas.value : [];
        const trending = topSearches.status === "fulfilled" ? topSearches.value : [];
        const related = relatedKeywords.status === "fulfilled" ? relatedKeywords.value : [];
        const siteKws = siteKeywords.status === "fulfilled" ? siteKeywords.value : [];

        keywordResearchData = {
          keywordIdeaJson: JSON.stringify({
            ideas: idea.slice(0, 20),
            suggestions: suggestion.slice(0, 20),
            relatedByKeyword: related.slice(0, 20),
          }),
          keywordSearchIntentJson: JSON.stringify(intent.slice(0, 20)),
          topSearchesJson: JSON.stringify(trending.slice(0, 20)),
          siteKeywordsJson: JSON.stringify(siteKws.slice(0, 50)),
        };

        markSectionDone("Keyword research", true);
      } catch (err) {
        errors.push(`Keyword research: ${err instanceof Error ? err.message : String(err)}`);
        markSectionDone("Keyword research", false);
      }
    })(),

    // 10. Category Analysis (Labs APIs)
    (async () => {
      try {
        updateReportProgress(projectId, {
          phase: "Category analysis",
          message: "Analyzing domain categories and market positioning",
        });

        const [domainCategories, categoryMetrics] = await Promise.all([
          getCategoriesForDomain(project.domain, 2840, "en").catch(() => []),
          getDomainMetricsByCategories(project.domain, 2840, "en").catch(() => []),
        ]);

        categoryAnalysisData = {
          domainCategoriesJson: JSON.stringify(
            domainCategories.slice(0, 15).map((c) => ({
              id: c.categoryId,
              name: c.categoryName,
              relevance: c.relevance,
              keywords: c.matchingKeywords,
            }))
          ),
          categoryMetricsJson: JSON.stringify(
            categoryMetrics.slice(0, 15).map((m) => ({
              id: m.categoryId,
              name: m.categoryName,
              keywords: m.organicKeywords,
              traffic: m.organicTraffic,
              rank: m.domainRank,
            }))
          ),
        };

        markSectionDone("Category analysis", true);
      } catch (err) {
        errors.push(`Category analysis: ${err instanceof Error ? err.message : String(err)}`);
        markSectionDone("Category analysis", false);
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
    Object.keys(competitorData).length > 0 ||
    Object.keys(userPositioningData).length > 0 ||
    Object.keys(keywordResearchData).length > 0 ||
    Object.keys(categoryAnalysisData).length > 0;

  const status = errors.length === 0 ? "COMPLETE" : hasSomeData ? "PARTIAL" : "FAILED";

  // Write all data into the single snapshot record
  const updated = await prisma.reportSnapshot.update({
    where: { id: snapshotRecord.id },
    data: {
      status,
      ...siteData,
      ...onPageData,
      ...rankData,
      ...llmData,
      ...localData,
      ...backlinkData,
      ...competitorData,
      ...userPositioningData,
      ...keywordResearchData,
      ...categoryAnalysisData,
      errorMessage: errors.length > 0 ? errors.join("; ") : null,
      completedAt: new Date(),
    },
  });

  finishReportProgress(projectId, status, errors.length > 0 ? errors.join("; ") : null);

  return updated;
}
