import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runProjectReport } from "@/lib/reports/runner";

// POST /api/reports/run
// Body: { projectId: string }
// Runs all enabled data collectors for the project and stores results
// as a new ReportSnapshot. Returns when complete (synchronous).
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

  try {
    const snapshot = await runProjectReport(projectId);
    return NextResponse.json({ snapshotId: snapshot.id, status: snapshot.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Report run failed";
    console.error("Report run error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
