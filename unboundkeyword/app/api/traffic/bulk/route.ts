import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getDomainRankOverview, getBulkTrafficEstimation } from "@/lib/dataforseo/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json()) as { domains?: string[]; location?: number; language?: string };
    const domains = (body.domains ?? [])
      .map((d) => d.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10);

    if (domains.length === 0) return Response.json({ rows: [] });

    const location = body.location ?? 2840;
    const language = body.language ?? "en";

    // Run bulk traffic + individual overviews in parallel
    const [bulkResult, ...overviewResults] = await Promise.allSettled([
      getBulkTrafficEstimation(domains.map((t) => ({ target: t })), location, language),
      ...domains.map((d) => getDomainRankOverview(d, location, language)),
    ]);

    const bulkData = bulkResult.status === "fulfilled" ? bulkResult.value : [];
    const bulkMap = new Map(bulkData.map((b) => [b.target, b]));

    const rows = domains.map((d, i) => {
      const overview = overviewResults[i]?.status === "fulfilled" ? overviewResults[i].value : null;
      const bulk = bulkMap.get(d);
      return {
        domain: d,
        organicTraffic: overview?.organicTraffic ?? bulk?.traffic ?? 0,
        organicKeywords: overview?.organicKeywords ?? 0,
        domainRank: overview?.domainRank ?? 0,
        etv: overview?.etv ?? bulk?.organicEtv ?? 0,
      };
    });

    return Response.json({ rows });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Bulk traffic failed" }, { status: 500 });
  }
}
