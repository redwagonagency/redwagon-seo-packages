/**
 * Keyword list CRUD
 * GET    /api/lists          — get all lists for user
 * POST   /api/lists          — create new list
 * PUT    /api/lists          — rename list
 * DELETE /api/lists?id=...   — delete list
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSelectedSiteIdForUser } from "@/lib/site-context";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const siteId = await getSelectedSiteIdForUser(userId);

  const lists = await prisma.keywordList.findMany({
    where: { userId, ...(siteId ? { siteId } : { siteId: null }) },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { keywords: true } },
    },
  });

  return Response.json({ lists });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const siteId = await getSelectedSiteIdForUser(userId);

  const { name, description, color } = await req.json();
  if (!name) return Response.json({ error: "name required" }, { status: 400 });

  const list = await prisma.keywordList.create({
    data: { userId, siteId, name, description, color: color ?? "#6366f1" },
    include: { _count: { select: { keywords: true } } },
  });

  return Response.json({ list });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { id, name, description, color } = await req.json();
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.keywordList.findFirst({ where: { id, userId } });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const list = await prisma.keywordList.update({
    where: { id },
    data: { name, description, color },
    include: { _count: { select: { keywords: true } } },
  });

  return Response.json({ list });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.keywordList.findFirst({ where: { id, userId } });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.keywordList.delete({ where: { id } });
  return Response.json({ ok: true });
}
