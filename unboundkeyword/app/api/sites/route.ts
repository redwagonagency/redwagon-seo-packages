import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSelectedSiteForUser } from "@/lib/site-context";

function normalizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const [sites, selected] = await Promise.all([
    prisma.siteProject.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    getSelectedSiteForUser(userId),
  ]);

  return Response.json({ sites, selectedSiteId: selected?.id ?? null });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = (await req.json()) as { domain?: string; label?: string; location?: string; language?: string };
  const domain = normalizeDomain(body.domain ?? "");

  if (!domain) return Response.json({ error: "Domain is required" }, { status: 400 });

  const site = await prisma.siteProject.upsert({
    where: { userId_domain: { userId, domain } },
    update: {
      label: body.label ?? undefined,
      location: body.location ?? undefined,
      language: body.language ?? undefined,
    },
    create: {
      userId,
      domain,
      label: body.label ?? null,
      location: body.location ?? "United States",
      language: body.language ?? "en",
    },
  });

  await prisma.userPreference.upsert({
    where: { userId },
    update: { selectedSiteId: site.id },
    create: { userId, selectedSiteId: site.id },
  });

  return Response.json({ site });
}
