/**
 * POST /api/site-audit-enhanced
 * Enhanced site audit with domain analytics, ranked keywords, traffic, SERP features, backlink anchors
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getSiteAuditMetricsEnhanced,
  getSerpFeaturesForDomain,
  getBacklinkAnchorsForDomain,
  crawlSitePages,
  getOnPageErrors,
  getOnPageDuplicateTags,
  getOnPageBrokenLinks,
} from "@/lib/dataforseo/client";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await request.json() as { url?: string };
    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    // Clean URL to domain
    const domain = url.replace(/^https?:\/\//, "").split("/")[0];

    // Parallel fetch of all enhanced metrics
    const [metricsResult, serpResult, anchorResult, crawlResult] = await Promise.allSettled([
      getSiteAuditMetricsEnhanced(domain),
      getSerpFeaturesForDomain(domain, 50),
      getBacklinkAnchorsForDomain(domain, 30),
      crawlSitePages(domain, 50),
    ]);

    // Extract on-page audit details if crawl succeeded
    let onPageDetails = null;
    if (crawlResult.status === "fulfilled") {
      onPageDetails = {
        pages: crawlResult.value.pages.slice(0, 20),
        errorCount: crawlResult.value.errors.length,
        duplicateTagsCount: crawlResult.value.duplicateTags.length,
        brokenLinksCount: crawlResult.value.brokenLinks.length,
        errors: crawlResult.value.errors.slice(0, 10),
      };
    }

    const response = {
      domain,
      domainMetrics:
        metricsResult.status === "fulfilled"
          ? metricsResult.value
          : null,
      onPageAudit: onPageDetails,
      serpFeatures:
        serpResult.status === "fulfilled"
          ? serpResult.value.slice(0, 20)
          : [],
      backlinks:
        anchorResult.status === "fulfilled"
          ? anchorResult.value.slice(0, 15)
          : [],
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("[site-audit-enhanced]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Audit failed" },
      { status: 500 }
    );
  }
}
