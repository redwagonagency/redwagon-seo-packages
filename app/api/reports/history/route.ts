import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reports/history?projectId=xxx
// Returns the last 20 snapshots for history view.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const projectId = req.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const access = await prisma.project.findFirst({
    where: {
      id: projectId,
      tenant: { members: { some: { userId } } },
    },
  });

  if (!access) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const snapshots = await prisma.reportSnapshot.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      status: true,
      siteScore: true,
      avgPosition: true,
      top10Count: true,
      llmMentionRate: true,
      localFound: true,
      createdAt: true,
      completedAt: true,
      errorMessage: true,
    },
  });

  return NextResponse.json(snapshots);
}
