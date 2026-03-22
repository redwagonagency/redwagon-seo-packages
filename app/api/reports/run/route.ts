import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runProjectReport } from "@/lib/reports/runner";
import {
  isReportRunning,
  startReportProgress,
  updateReportProgress,
} from "@/lib/reports/progress";

// POST /api/reports/run
// Body: { projectId: string }
// Runs all enabled data collectors for the project and stores results
// as a new ReportSnapshot. Returns immediately while the job runs in background.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  let body: { projectId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { projectId } = body;
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  // Verify the user has access to this project via their tenant membership
  const access = await prisma.project.findFirst({
    where: {
      id: projectId,
      tenant: {
        members: { some: { userId } },
      },
    },
  });

  if (!access) {
    return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });
  }

  if (isReportRunning(projectId)) {
    return NextResponse.json({ status: "RUNNING", message: "Report already in progress" });
  }

  // Recover from orphaned/stale RUNNING snapshots (e.g., dev server restart).
  const staleCutoff = new Date(Date.now() - 30 * 60 * 1000);
  await prisma.reportSnapshot.updateMany({
    where: {
      projectId,
      status: "RUNNING",
      createdAt: { lt: staleCutoff },
      completedAt: null,
    },
    data: {
      status: "FAILED",
      errorMessage: "Report process was interrupted (stale RUNNING snapshot auto-closed)",
      completedAt: new Date(),
    },
  });

  const snapshot = await prisma.reportSnapshot.create({
    data: { projectId, status: "RUNNING" },
    select: { id: true },
  });

  startReportProgress(projectId, snapshot.id);
  updateReportProgress(projectId, {
    phase: "Initializing",
    message: "Preparing report sections",
    percent: 3,
  });

  void runProjectReport(projectId)
    .catch((err) => {
      const message = err instanceof Error ? err.message : "Report run failed";
      console.error("Report run error:", message);
      updateReportProgress(projectId, {
        status: "FAILED",
        phase: "Failed",
        message,
        percent: 100,
        errorMessage: message,
      });

      // Persist failure so dashboards don't get stuck on RUNNING snapshots.
      void prisma.reportSnapshot.update({
        where: { id: snapshot.id },
        data: {
          status: "FAILED",
          errorMessage: message,
          completedAt: new Date(),
        },
      }).catch((persistErr) => {
        console.error("Failed to persist report failure:", persistErr);
      });
    });

  return NextResponse.json({ status: "RUNNING", message: "Report started" });
}
