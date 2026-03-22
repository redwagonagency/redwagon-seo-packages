import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  return NextResponse.json(snapshot);
}
