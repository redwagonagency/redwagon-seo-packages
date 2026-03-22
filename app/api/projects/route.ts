import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/projects — create a new project
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  let body: {
    name?: string;
    domain?: string;
    location?: string;
    keywords?: string[];
    competitors?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, domain, location, keywords = [], competitors = [] } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  // Validate and clean domain
  const cleanDomain = (domain ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0];

  if (!cleanDomain || !/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/.test(cleanDomain)) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  // Clean competitor domains — max 5, skip empties, strip protocol+www
  const cleanedCompetitors = competitors
    .map((c) =>
      c.trim().toLowerCase()
        .replace(/^https?:\/\//i, "")
        .replace(/^www\./i, "")
        .split("/")[0]
    )
    .filter((c) => c && /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/.test(c))
    .slice(0, 5);

  // Find the tenant for this user
  const member = await prisma.tenantMember.findFirst({
    where: { userId },
    select: { tenantId: true },
  });

  if (!member) {
    return NextResponse.json({ error: "No tenant found for user" }, { status: 403 });
  }

  const project = await prisma.project.create({
    data: {
      tenantId: member.tenantId,
      name: name.trim(),
      domain: cleanDomain,
      location: location?.trim() || "United States",
      keywordsJson: keywords.length > 0 ? JSON.stringify(keywords.map((k) => k.trim()).filter(Boolean)) : null,
      competitorsJson: cleanedCompetitors.length > 0 ? JSON.stringify(cleanedCompetitors) : null,
    },
  });

  return NextResponse.json({ id: project.id, domain: project.domain, name: project.name }, { status: 201 });
}

// GET /api/projects — list projects for current user's tenant
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const member = await prisma.tenantMember.findFirst({
    where: { userId },
    include: {
      tenant: {
        include: {
          projects: {
            orderBy: { createdAt: "desc" },
            include: {
              reportSnapshots: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { siteScore: true, avgPosition: true, top10Count: true, status: true, createdAt: true },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(member?.tenant?.projects ?? []);
}
