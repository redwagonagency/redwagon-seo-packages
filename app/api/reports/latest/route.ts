import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReportProgress } from "@/lib/reports/progress";

// GET /api/reports/latest?projectId=xxx
// Returns the most recent ReportSnapshot for the given project.
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

  // Verify access
  const access = await prisma.project.findFirst({
    where: {
      id: projectId,
      tenant: { members: { some: { userId } } },
    },
  });

  if (!access) {
    return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });
  }

  const snapshot = await prisma.reportSnapshot.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  if (!snapshot) {
    return NextResponse.json(null);
  }

  // If the latest row is RUNNING but there is no active in-memory job,
  // return the newest non-running snapshot so dashboards stay useful.
  if (snapshot.status === "RUNNING" && !getReportProgress(projectId)) {
    const stable = await prisma.reportSnapshot.findFirst({
      where: { projectId, status: { not: "RUNNING" } },
      orderBy: { createdAt: "desc" },
    });
    if (stable) return NextResponse.json(stable);
  }

  return NextResponse.json(snapshot);
}
