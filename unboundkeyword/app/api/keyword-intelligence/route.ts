/**
 * GET /api/keyword-intelligence?keyword=X&location=2840&language=en
 * Returns saved intelligence for a keyword, including historical analyses.
 *
 * GET /api/keyword-intelligence/top
 * Returns top analyzed keywords for the current user.
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword");
  const locationCode = parseInt(searchParams.get("location") ?? "2840", 10);
  const languageCode = searchParams.get("language") ?? "en";

  if (keyword) {
    // Single keyword lookup
    const intel = await prisma.keywordIntelligence.findUnique({
      where: {
        userId_keyword_locationCode_languageCode: {
          userId: session.user.id,
          keyword: keyword.trim(),
          locationCode,
          languageCode,
        },
      },
    });
    return Response.json({ intel });
  }

  // Return top recently analyzed keywords
  const recent = await prisma.keywordIntelligence.findMany({
    where: { userId: session.user.id },
    orderBy: { lastAnalyzed: "desc" },
    take: 50,
    select: {
      keyword: true,
      searchVolume: true,
      cpc: true,
      competition: true,
      competitionLevel: true,
      difficulty: true,
      organicClickPct: true,
      paidClickPct: true,
      aiOverviewPct: true,
      noClickPct: true,
      hasAiOverview: true,
      hasLocalPack: true,
      topAdCount: true,
      analyzedCount: true,
      lastAnalyzed: true,
    },
  });

  return Response.json({ keywords: recent });
}
