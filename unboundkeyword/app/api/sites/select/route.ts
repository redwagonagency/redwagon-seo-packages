import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = (await req.json()) as { siteId?: string };
  if (!body.siteId) return Response.json({ error: "siteId is required" }, { status: 400 });

  const site = await prisma.siteProject.findFirst({ where: { id: body.siteId, userId } });
  if (!site) return Response.json({ error: "Site not found" }, { status: 404 });

  await prisma.userPreference.upsert({
    where: { userId },
    update: { selectedSiteId: body.siteId },
    create: { userId, selectedSiteId: body.siteId },
  });

  return Response.json({ ok: true, site });
}
