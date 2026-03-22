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

  const saved = await prisma.savedKeyword.upsert({
    where: { projectId_keyword: { projectId, keyword: keyword.keyword } } as Parameters<typeof prisma.savedKeyword.upsert>[0]["where"],
    update: { volume: keyword.volume, difficulty: keyword.difficulty, cpc: keyword.cpc, intent: keyword.intent, source },
    create: { projectId, keyword: keyword.keyword, volume: keyword.volume, difficulty: keyword.difficulty, cpc: keyword.cpc, intent: keyword.intent, source },
  });

  return Response.json({ keyword: { ...saved, savedAt: saved.savedAt.toISOString() } });
}
