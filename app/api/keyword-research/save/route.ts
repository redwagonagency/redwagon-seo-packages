import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    projectId: string;
    keyword: { keyword: string; volume: number | null; difficulty: number | null; cpc: number | null; intent: string | null };
    source: string;
  };

  const { projectId, keyword, source } = body;
  if (!projectId || !keyword?.keyword) {
    return Response.json({ error: "projectId and keyword required" }, { status: 400 });
  }

  // Verify membership
  const member = await prisma.tenantMember.findFirst({
    where: { userId: session.user.id, tenant: { projects: { some: { id: projectId } } } },
  });
  if (!member) return Response.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.savedKeyword.findFirst({
    where: { projectId, keyword: keyword.keyword },
    select: { id: true },
  });

  const saved = existing
    ? await prisma.savedKeyword.update({
        where: { id: existing.id },
        data: {
          volume: keyword.volume,
          difficulty: keyword.difficulty,
          cpc: keyword.cpc,
          intent: keyword.intent,
          source,
        },
      })
    : await prisma.savedKeyword.create({
        data: {
          projectId,
          keyword: keyword.keyword,
          volume: keyword.volume,
          difficulty: keyword.difficulty,
          cpc: keyword.cpc,
          intent: keyword.intent,
          source,
        },
      });

  return Response.json({ keyword: { ...saved, savedAt: saved.savedAt.toISOString() } });
}
