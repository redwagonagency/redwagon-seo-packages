import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSelectedSiteForUser } from "@/lib/site-context";
import { buildDecisionEngineBundle } from "@/lib/decision-engine";

type DecisionRunModelCompat = {
  create: (args: {
    data: {
      userId: string;
      siteId: string | null;
      keyword: string;
      domain: string;
      location: string;
      language: string;
      score?: number;
      priority?: string;
      payloadJson: string;
    };
  }) => Promise<{ id: string }>;
  findMany: (args: {
    where: { userId: string; siteId: string | null };
    orderBy: { createdAt: "desc" };
    take: number;
  }) => Promise<Array<{ id: string; keyword: string; score: number | null; priority: string | null; createdAt: Date }>>;
};

function normalizeDomain(input: string): string {
  return input.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0] ?? input;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user && "id" in session.user ? (session.user.id as string | undefined) : undefined;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    keyword?: string;
    domain?: string;
    locationCode?: number;
    languageCode?: string;
  };

  const keyword = body.keyword?.trim();
  if (!keyword) {
    return NextResponse.json({ error: "keyword is required" }, { status: 400 });
  }

  const selectedSite = await getSelectedSiteForUser(userId);
  const domain = normalizeDomain(body.domain?.trim() || selectedSite?.domain || "");
  if (!domain) {
    return NextResponse.json({ error: "domain is required" }, { status: 400 });
  }

  const bundle = await buildDecisionEngineBundle({
    keyword,
    domain,
    locationCode: body.locationCode ?? 2840,
    languageCode: body.languageCode ?? "en",
  });

  const decisionRunModel = (prisma as unknown as { decisionRun: DecisionRunModelCompat }).decisionRun;
  const created = await decisionRunModel.create({
    data: {
      userId,
      siteId: selectedSite?.id ?? null,
      keyword,
      domain,
      location: selectedSite?.location ?? "United States",
      language: selectedSite?.language ?? "en",
      score: bundle.opportunity.opportunityScore,
      priority: bundle.opportunity.priority,
      payloadJson: JSON.stringify(bundle),
    },
  });

  const recentRuns = await decisionRunModel.findMany({
    where: { userId, siteId: selectedSite?.id ?? null },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return NextResponse.json({
    runId: created.id,
    bundle,
    recentRuns,
  });
}
