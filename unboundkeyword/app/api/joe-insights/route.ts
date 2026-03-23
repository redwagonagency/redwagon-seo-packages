import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface JoeInsightData {
  // user stats
  listCount: number;
  totalKeywordsInLists: number;
  discoverySessionCount: number;
  lastSeedKeyword: string | null;
  recentSeeds: string[];
  // site data
  domain: string | null;
  ga4Connected: boolean;
  gscConnected: boolean;
  competitorCount: number;
  // derived
  hasData: boolean;
}

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  // Fetch in parallel
  const [lists, discoverySessions, siteProject] = await Promise.all([
    prisma.keywordList.findMany({
      where: { userId },
      select: { id: true, keywords: { select: { id: true } } },
    }),
    prisma.discoverySession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { seedKeyword: true },
    }),
    prisma.siteProject.findFirst({
      where: { userId },
      select: {
        domain: true,
        ga4Connected: true,
        gscConnected: true,
        competitors: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const listCount = lists.length;
  const totalKeywordsInLists = lists.reduce((sum, l) => sum + l.keywords.length, 0);
  const recentSeeds = [...new Set(discoverySessions.map((s) => s.seedKeyword))];
  const lastSeedKeyword = recentSeeds[0] ?? null;
  let competitorCount = 0;
  try {
    const comps = JSON.parse(siteProject?.competitors ?? "[]") as string[];
    competitorCount = comps.filter(Boolean).length;
  } catch { /* ignore */ }

  const data: JoeInsightData = {
    listCount,
    totalKeywordsInLists,
    discoverySessionCount: discoverySessions.length,
    lastSeedKeyword,
    recentSeeds,
    domain: siteProject?.domain ?? null,
    ga4Connected: siteProject?.ga4Connected ?? false,
    gscConnected: siteProject?.gscConnected ?? false,
    competitorCount,
    hasData: listCount > 0 || discoverySessions.length > 0,
  };

  return Response.json(data);
}
