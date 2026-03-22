import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKeywordGap } from "@/lib/dataforseo/client";

function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    projectId?: string;
    competitors?: string[];
  };

  const projectId = body.projectId;
  if (!projectId) {
    return Response.json({ error: "projectId is required" }, { status: 400 });
  }

  const member = await prisma.tenantMember.findFirst({
    where: {
      userId: session.user.id,
      tenant: { projects: { some: { id: projectId } } },
    },
    select: { id: true },
  });

  if (!member) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { domain: true, competitorsJson: true },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const configured = (() => {
    try {
      return project.competitorsJson ? (JSON.parse(project.competitorsJson) as string[]) : [];
    } catch {
      return [] as string[];
    }
  })();

  const provided = (body.competitors || []).map(normalizeDomain).filter(Boolean);
  const competitors = Array.from(new Set([...provided, ...configured.map(normalizeDomain).filter(Boolean)]))
    .filter((domain) => domain !== normalizeDomain(project.domain))
    .slice(0, 5);

  if (competitors.length === 0) {
    return Response.json({
      error: "No competitor domains configured. Add competitors in project settings first.",
    }, { status: 400 });
  }

  try {
    const gaps = await getKeywordGap(project.domain, competitors, 2840, "en", 120);
    return Response.json({
      projectDomain: project.domain,
      competitors,
      gaps,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to run keyword gap" },
      { status: 500 }
    );
  }
}
