/**
 * POST /api/superadmin/ai-monitor
 *
 * Analyses platform usage data and generates actionable improvement
 * recommendations for the superadmin. Pure rule-based analysis — no
 * external LLM calls, low latency, zero API cost.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isJoeSuperAdmin } from "@/lib/superadmin";

export type AiMonitorInsight = {
  category: "errors" | "usage" | "growth" | "performance" | "churn";
  priority: "high" | "medium" | "low";
  title: string;
  body: string;
  action: string;
};

export type AiMonitorResult = {
  generatedAt: string;
  insights: AiMonitorInsight[];
  summary: string;
};

export async function POST() {
  const session = await auth();
  if (!isJoeSuperAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const [
    userCount,
    recentUserCount,
    apiLogCount,
    failedApiLogs,
    slowApiLogs,
    topUseCases,
    errorMessages,
    kwListCount,
    kwInListCount,
    siteCount,
    decisionRunCount,
    recentDecisionRuns,
    ga4ErrorLogs,
    gscErrorLogs,
    unauthLogs,
    discoveryKwCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.apiQueryLog.count({ where: { createdAt: { gte: since } } }),
    prisma.apiQueryLog.count({ where: { createdAt: { gte: since }, success: false } }),
    prisma.apiQueryLog.count({ where: { createdAt: { gte: since }, durationMs: { gte: 5000 } } }),
    prisma.apiQueryLog.groupBy({
      by: ["useCase"],
      _count: { id: true },
      where: { createdAt: { gte: since } },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    prisma.apiQueryLog.findMany({
      where: { createdAt: { gte: since }, success: false, errorMessage: { not: null } },
      select: { useCase: true, errorMessage: true, provider: true },
      take: 30,
    }),
    prisma.keywordList.count(),
    prisma.keywordInList.count(),
    prisma.siteProject.count(),
    prisma.decisionRun.count(),
    prisma.decisionRun.count({ where: { createdAt: { gte: since } } }),
    prisma.apiQueryLog.count({ where: { createdAt: { gte: since }, useCase: "ga4_properties_list", success: false } }),
    prisma.apiQueryLog.count({ where: { createdAt: { gte: since }, useCase: { contains: "gsc" }, success: false } }),
    prisma.apiQueryLog.count({ where: { createdAt: { gte: since }, useCase: "google_oauth_refresh", success: false } }),
    (prisma as unknown as { discoveryKeyword: { count: () => Promise<number> } }).discoveryKeyword.count(),
  ]);

  const insights: AiMonitorInsight[] = [];

  // ── Error rate ──────────────────────────────────────────────────────────────
  if (apiLogCount > 0) {
    const errorRate = failedApiLogs / apiLogCount;
    if (errorRate > 0.15) {
      insights.push({
        category: "errors",
        priority: "high",
        title: `High API error rate: ${Math.round(errorRate * 100)}% of calls failed this week`,
        body: `${failedApiLogs} out of ${apiLogCount} API calls returned errors in the last 7 days. This suggests a DataForSEO quota issue, invalid credentials, or a broken endpoint.`,
        action: "Review failed API logs and check DataForSEO account balance",
      });
    } else if (errorRate > 0.05) {
      insights.push({
        category: "errors",
        priority: "medium",
        title: `Elevated API error rate: ${Math.round(errorRate * 100)}%`,
        body: `${failedApiLogs} API calls failed in the last 7 days. Minor but worth monitoring.`,
        action: "Check error messages in the API log table below",
      });
    }
  }

  // ── Slow queries ─────────────────────────────────────────────────────────────
  if (slowApiLogs > 5) {
    insights.push({
      category: "performance",
      priority: slowApiLogs > 20 ? "high" : "medium",
      title: `${slowApiLogs} API calls took >5 seconds this week`,
      body: "Slow responses degrade user experience. Consider caching frequently requested keyword data or batching DataForSEO requests.",
      action: "Add result caching to the top slow endpoints",
    });
  }

  // ── OAuth / Google auth errors ───────────────────────────────────────────────
  if (ga4ErrorLogs + gscErrorLogs + unauthLogs > 0) {
    const total = ga4ErrorLogs + gscErrorLogs + unauthLogs;
    insights.push({
      category: "errors",
      priority: total > 3 ? "high" : "medium",
      title: `Google OAuth errors detected: ${total} failures this week`,
      body: `GA4 errors: ${ga4ErrorLogs}, GSC errors: ${gscErrorLogs}, token refresh failures: ${unauthLogs}. Users may be silently unable to connect their Google accounts.`,
      action: "Review the OAuth connect flow — ensure autoConnect handles post-signin redirect",
    });
  }

  // ── Feature adoption ─────────────────────────────────────────────────────────
  const topFeatures = topUseCases.slice(0, 3).map((u) => `${u.useCase} (${u._count.id}×)`).join(", ");
  if (topFeatures) {
    insights.push({
      category: "usage",
      priority: "low",
      title: `Top features this week: ${topFeatures}`,
      body: "Understanding the most-used features helps prioritise improvements and surface them more prominently in the UI.",
      action: "Consider promoting top features in on-boarding or dashboard cards",
    });
  }

  // ── Decision Engine ──────────────────────────────────────────────────────────
  if (recentDecisionRuns === 0 && kwInListCount > 50) {
    insights.push({
      category: "churn",
      priority: "medium",
      title: "Decision Engine unused despite keyword data being available",
      body: `There are ${kwInListCount.toLocaleString()} tracked keywords across ${kwListCount} lists, but no AI Decision Reports were run in the last 7 days. This is a core value-driver.`,
      action: "Add a prompt or CTA in the keyword list UI to run the Decision Engine",
    });
  }

  // ── User growth ──────────────────────────────────────────────────────────────
  if (recentUserCount === 0) {
    insights.push({
      category: "growth",
      priority: "low",
      title: "No new user signups in the last 7 days",
      body: `Total users: ${userCount}. Acquisition appears stalled. Review marketing CTAs and pricing page conversion.`,
      action: "Check pricing page analytics and consider A/B testing the headline",
    });
  } else if (recentUserCount > 0) {
    insights.push({
      category: "growth",
      priority: "low",
      title: `${recentUserCount} new user${recentUserCount > 1 ? "s" : ""} signed up this week`,
      body: `Platform total: ${userCount} users, ${siteCount} site projects, ${kwInListCount.toLocaleString()} tracked keywords, ${discoveryKwCount.toLocaleString()} discovery keywords.`,
      action: "Ensure new users receive a prompt to add their domain and first keyword list",
    });
  }

  // ── Error message patterns ────────────────────────────────────────────────────
  const authErrors = errorMessages.filter((l) => l.errorMessage?.includes("401") || l.errorMessage?.includes("403") || l.errorMessage?.includes("Unauthorized"));
  if (authErrors.length > 2) {
    insights.push({
      category: "errors",
      priority: "high",
      title: `${authErrors.length} authorization errors in API logs`,
      body: "Multiple 401/403 responses from external APIs. Credentials may be expired or incorrectly configured.",
      action: "Rotate DataForSEO API keys and verify GOOGLE_CLIENT_ID/SECRET env vars",
    });
  }

  // Sort: high → medium → low
  const order = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => order[a.priority] - order[b.priority]);

  const highCount = insights.filter((i) => i.priority === "high").length;
  const summary = highCount > 0
    ? `${highCount} high-priority issue${highCount > 1 ? "s" : ""} require attention. ${insights.length} total insights.`
    : `Platform healthy — ${insights.length} recommendation${insights.length !== 1 ? "s" : ""} to review.`;

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    insights,
    summary,
  } satisfies AiMonitorResult);
}
