import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

type KeywordInput = {
  keyword: string;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  intent: string | null;
  competition?: number | null;
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    projectId: string;
    keywords: KeywordInput[];
    source: string;
  };

  const { projectId, keywords, source } = body;
  if (!projectId || !Array.isArray(keywords) || keywords.length === 0) {
    return Response.json(
      { error: "projectId and at least one keyword are required" },
      { status: 400 }
    );
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

  const limited = keywords
    .filter((kw) => kw && typeof kw.keyword === "string" && kw.keyword.trim().length > 0)
    .slice(0, 200);

  if (limited.length === 0) {
    return Response.json({ error: "No valid keywords found" }, { status: 400 });
  }

  const saved = await Promise.all(
    limited.map((kw) =>
      prisma.savedKeyword.upsert({
        where: {
          projectId_keyword: {
            projectId,
            keyword: kw.keyword.trim(),
          },
        },
        update: {
          volume: kw.volume,
          difficulty: kw.difficulty,
          cpc: kw.cpc,
          intent: kw.intent,
          competition:
            typeof kw.competition === "number" ? kw.competition : null,
          source,
          savedAt: new Date(),
        },
        create: {
          projectId,
          keyword: kw.keyword.trim(),
          volume: kw.volume,
          difficulty: kw.difficulty,
          cpc: kw.cpc,
          intent: kw.intent,
          competition:
            typeof kw.competition === "number" ? kw.competition : null,
          source,
        },
      })
    )
  );

  return Response.json({
    savedCount: saved.length,
    keywords: saved
      .sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime())
      .map((kw) => ({ ...kw, savedAt: kw.savedAt.toISOString() })),
  });
}
