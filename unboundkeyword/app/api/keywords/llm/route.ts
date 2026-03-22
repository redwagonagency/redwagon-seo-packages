/**
 * POST /api/keywords/llm
 * Check LLM visibility: calls getLlmAggregatedMetricsLive for a domain,
 * which returns per-LLM aggregate mention stats.
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getLlmAggregatedMetricsLive } from "@/lib/dataforseo/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { domain, keywords } = await req.json() as { domain?: string; keywords?: string[] };
  if (!domain) {
    return Response.json({ error: "domain is required" }, { status: 400 });
  }

  try {
    const metrics = await getLlmAggregatedMetricsLive(domain);

    // Build per-keyword results: if keywords provided, map them to the aggregate result
    const results = (keywords && keywords.length > 0 ? keywords : [domain]).map((kw) => ({
      keyword: kw,
      mentionsCount: metrics.reduce((s, m) => s + m.mentions, 0),
      rating: metrics.length > 0
        ? Math.min(10, Math.round(metrics.reduce((s, m) => s + m.mentions, 0) / 5))
        : 0,
      urls: [],
    }));

    return Response.json({ results, domainMetrics: metrics });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "LLM check failed" },
      { status: 500 }
    );
  }
}
