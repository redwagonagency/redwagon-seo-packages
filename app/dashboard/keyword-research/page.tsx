import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import KeywordResearchClient from "@/components/dashboard/KeywordResearchClient";

export default async function KeywordResearchPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const member = await prisma.tenantMember.findFirst({
    where: { userId },
    include: {
      tenant: { include: { projects: { take: 1 } } },
    },
  });

  const project = member?.tenant?.projects?.[0] ?? null;
  const plan = (member?.tenant as { plan?: string } | undefined)?.plan ?? "STARTER";

  // Load saved keywords for this project
  const saved = project
    ? await prisma.savedKeyword.findMany({
        where: { projectId: project.id },
        orderBy: { savedAt: "desc" },
        take: 200,
      })
    : [];

  return (
    <KeywordResearchClient
      projectId={project?.id ?? null}
      projectDomain={project?.domain ?? null}
      plan={plan}
      savedKeywords={saved.map((k) => ({
        id: k.id,
        keyword: k.keyword,
        volume: k.volume,
        difficulty: k.difficulty,
        cpc: k.cpc,
        intent: k.intent,
        source: k.source,
        savedAt: k.savedAt.toISOString(),
      }))}
    />
  );
}
