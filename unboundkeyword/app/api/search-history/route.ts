import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const history = await prisma.userSearch.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      query: true,
      searchType: true,
      resultMeta: true,
      createdAt: true,
    },
  });

  const parsed = history.map((h: { id: string; query: string; searchType: string; resultMeta: string; createdAt: Date }) => ({
    ...h,
    resultMeta: (() => { try { return JSON.parse(h.resultMeta) as Record<string, unknown>; } catch { return {}; } })(),
  }));

  return Response.json({ history: parsed });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.userSearch.deleteMany({ where: { userId: session.user.id } });
  return Response.json({ ok: true });
}
