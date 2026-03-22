import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReportProgress } from "@/lib/reports/progress";

// GET /api/reports/progress?projectId=xxx
// Returns in-memory run progress and falls back to latest snapshot status.
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
    select: { id: true },
  });

  if (!access) {
    return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });
  }

  const progress = getReportProgress(projectId);
  if (progress) {
    return NextResponse.json(progress);
  }

  const latest = await prisma.reportSnapshot.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      completedAt: true,
      onPageCrawledCount: true,
      errorMessage: true,
    },
  });

  if (!latest) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    projectId,
    snapshotId: latest.id,
    status: latest.status,
    phase: latest.status === "RUNNING" ? "Running" : "Completed",
    message:
      latest.status === "RUNNING"
        ? "Report is running"
        : latest.status === "FAILED"
        ? "Report failed"
        : latest.status === "PARTIAL"
        ? "Report completed with partial results"
        : "Report completed",
    percent: latest.status === "RUNNING" ? 50 : 100,
    crawledPages: latest.onPageCrawledCount ?? 0,
    targetPages: 0,
    startedAt: latest.createdAt.toISOString(),
    updatedAt: (latest.completedAt ?? latest.createdAt).toISOString(),
    errorMessage: latest.errorMessage,
  });
}
