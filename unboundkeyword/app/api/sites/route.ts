import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSelectedSiteForUser } from "@/lib/site-context";

function normalizeDomain(value: string) {
  const raw = value.trim();
  if (!raw) return "";
  try {
    const maybeUrl = raw.includes("://") ? raw : `https://${raw}`;
    const hostname = new URL(maybeUrl).hostname;
    return hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return raw.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].trim();
  }
}

function isValidDomain(value: string) {
  return /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(value);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const [sites, selected] = await Promise.all([
    prisma.siteProject.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    getSelectedSiteForUser(userId),
  ]);

  // Parse competitors JSON for each site
  const sitesWithCompetitors = sites.map((s) => ({
    ...s,
    competitorList: (() => { try { return JSON.parse(s.competitors ?? "[]") as string[]; } catch { return []; } })(),
  }));

  return Response.json({ sites: sitesWithCompetitors, selectedSiteId: selected?.id ?? null });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = (await req.json()) as { domain?: string; label?: string; location?: string; language?: string; competitors?: string[] };
  const domain = normalizeDomain(body.domain ?? "");

  if (!domain) return Response.json({ error: "Domain is required" }, { status: 400 });
  if (!isValidDomain(domain)) return Response.json({ error: "Enter a valid domain like example.com" }, { status: 400 });

  const competitorList = (body.competitors ?? [])
    .map((c) => normalizeDomain(c))
    .filter((c) => c && isValidDomain(c) && c !== domain)
    .slice(0, 5);

  try {
    const site = await prisma.siteProject.upsert({
      where: { userId_domain: { userId, domain } },
      update: {
        label: body.label ?? undefined,
        location: body.location ?? undefined,
        language: body.language ?? undefined,
        competitors: JSON.stringify(competitorList),
      },
      create: {
        userId,
        domain,
        label: body.label ?? null,
        location: body.location ?? "United States",
        language: body.language ?? "en",
        competitors: JSON.stringify(competitorList),
      },
    });

    await prisma.userPreference.upsert({
      where: { userId },
      update: { selectedSiteId: site.id },
      create: { userId, selectedSiteId: site.id },
    });

    return Response.json({ site: { ...site, competitorList } });
  } catch (error) {
    console.error("Failed to create/update site project", error);
    return Response.json({ error: "Unable to save domain right now. Please try again." }, { status: 500 });
  }
}

// PATCH: Update an existing project (label, location, language, competitors)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = (await req.json()) as { id?: string; label?: string; location?: string; language?: string; competitors?: string[] };
  if (!body.id) return Response.json({ error: "id is required" }, { status: 400 });

  const site = await prisma.siteProject.findFirst({ where: { id: body.id, userId } });
  if (!site) return Response.json({ error: "Not found" }, { status: 404 });

  const competitorList = body.competitors !== undefined
    ? (body.competitors).map((c) => normalizeDomain(c)).filter((c) => c && isValidDomain(c) && c !== site.domain).slice(0, 5)
    : undefined;

  const updated = await prisma.siteProject.update({
    where: { id: body.id },
    data: {
      label: body.label !== undefined ? body.label : undefined,
      location: body.location !== undefined ? body.location : undefined,
      language: body.language !== undefined ? body.language : undefined,
      ...(competitorList !== undefined ? { competitors: JSON.stringify(competitorList) } : {}),
    },
  });

  return Response.json({ site: { ...updated, competitorList: competitorList ?? (() => { try { return JSON.parse(updated.competitors ?? "[]") as string[]; } catch { return []; } })() } });
}

