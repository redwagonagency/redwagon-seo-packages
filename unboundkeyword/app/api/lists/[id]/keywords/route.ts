/**
 * Keywords within a list
 * GET    /api/lists/[id]/keywords           — get all keywords in list
 * POST   /api/lists/[id]/keywords           — add keyword(s)
 * DELETE /api/lists/[id]/keywords?kw=...    — remove keyword
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

async function getList(userId: string, listId: string) {
  return prisma.keywordList.findFirst({ where: { id: listId, userId } });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const list = await getList(userId, id);
  if (!list) return Response.json({ error: "Not found" }, { status: 404 });

  const keywords = await prisma.keywordInList.findMany({
    where: { listId: id },
    orderBy: [{ volume: "desc" }, { keyword: "asc" }],
  });

  return Response.json({ list, keywords });
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const list = await getList(userId, id);
  if (!list) return Response.json({ error: "Not found" }, { status: 404 });

  const { keywords } = await req.json() as {
    keywords: {
      keyword: string;
      volume?: number;
      difficulty?: number;
      cpc?: number;
      intent?: string;
      competition?: number;
      source?: string;
      notes?: string;
    }[];
  };

  if (!Array.isArray(keywords) || keywords.length === 0) {
    return Response.json({ error: "keywords array required" }, { status: 400 });
  }

  // Upsert up to 500 keywords per call
  const toUpsert = keywords.slice(0, 500);
  const results = await Promise.allSettled(
    toUpsert.map((k) =>
      prisma.keywordInList.upsert({
        where: { listId_keyword: { listId: id, keyword: k.keyword } },
        create: { listId: id, ...k },
        update: {
          volume: k.volume,
          difficulty: k.difficulty,
          cpc: k.cpc,
          intent: k.intent,
          competition: k.competition,
          source: k.source,
          notes: k.notes,
        },
      })
    )
  );

  const added = results.filter((r) => r.status === "fulfilled").length;

  // Bump list updatedAt
  await prisma.keywordList.update({ where: { id }, data: { updatedAt: new Date() } });

  return Response.json({ added });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const list = await getList(userId, id);
  if (!list) return Response.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const kw = searchParams.get("kw");
  if (!kw) return Response.json({ error: "kw required" }, { status: 400 });

  await prisma.keywordInList.deleteMany({ where: { listId: id, keyword: kw } });
  return Response.json({ ok: true });
}
