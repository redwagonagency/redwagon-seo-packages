import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const KEYWORD_LIMITS: Record<string, number> = {
  STARTER: 20,
  PRO: 100,
  ENTERPRISE: 250,
  AGENCY: 500,
  ADMIN: 9999,
};

async function getMemberAndPlan(userId: string, projectId: string) {
  return prisma.tenantMember.findFirst({
    where: {
      userId,
      tenant: { projects: { some: { id: projectId } } },
    },
    include: { tenant: { select: { plan: true } } },
  });
}

/** GET /api/keywords?projectId=xxx — list keywords + limit */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId) return Response.json({ error: "projectId required" }, { status: 400 });

  const member = await getMemberAndPlan(session.user.id, projectId);
  if (!member) return Response.json({ error: "Forbidden" }, { status: 403 });

  const keywords = await prisma.rankTracker.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { id: true, keyword: true, device: true, location: true, createdAt: true },
  });

  const plan = (member.tenant as { plan: string }).plan ?? "STARTER";
  const limit = KEYWORD_LIMITS[plan] ?? 20;

  return Response.json({ keywords, limit, count: keywords.length });
}

/** POST /api/keywords — add keywords to a project */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { projectId: string; keywords: string[] };
  const { projectId, keywords } = body;

  if (!projectId || !Array.isArray(keywords) || keywords.length === 0) {
    return Response.json({ error: "projectId and keywords required" }, { status: 400 });
  }

  const member = await getMemberAndPlan(session.user.id, projectId);
  if (!member) return Response.json({ error: "Forbidden" }, { status: 403 });

  const plan = (member.tenant as { plan: string }).plan ?? "STARTER";
  const limit = KEYWORD_LIMITS[plan] ?? 20;

  const existing = await prisma.rankTracker.count({ where: { projectId } });
  const available = limit - existing;
  if (available <= 0) {
    return Response.json(
      { error: `Keyword limit reached (${limit} max on ${plan} plan)` },
      { status: 400 }
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { location: true },
  });

  const clean = keywords
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  // Filter out keywords that already exist for this project
  const existingKeywords = await prisma.rankTracker.findMany({
    where: { projectId, keyword: { in: clean } },
    select: { keyword: true },
  });
  const existingSet = new Set(existingKeywords.map((e) => e.keyword));
  const newKeywords = clean.filter((kw) => !existingSet.has(kw));

  const toAdd = newKeywords.slice(0, available);

  if (toAdd.length > 0) {
    await prisma.rankTracker.createMany({
      data: toAdd.map((kw) => ({
        projectId,
        keyword: kw,
        device: "desktop",
        location: project?.location ?? "United States",
      })),
    });
  }

  return Response.json({ added: toAdd.length, skipped: clean.length - toAdd.length });
}

/** DELETE /api/keywords — remove a single keyword by trackerId */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { trackerId: string };
  const { trackerId } = body;
  if (!trackerId) return Response.json({ error: "trackerId required" }, { status: 400 });

  // Verify ownership via tenant membership
  const tracker = await prisma.rankTracker.findUnique({
    where: { id: trackerId },
    include: {
      project: {
        include: {
          tenant: {
            include: { members: { where: { userId: session.user.id } } },
          },
        },
      },
    },
  });

  if (!tracker || tracker.project.tenant.members.length === 0) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.rankTracker.delete({ where: { id: trackerId } });
  return Response.json({ success: true });
}
