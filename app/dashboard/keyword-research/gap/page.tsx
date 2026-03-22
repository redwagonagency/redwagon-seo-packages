import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import KeywordGapClient from "@/components/dashboard/KeywordGapClient";

export default async function KeywordResearchGapPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;

  const member = await prisma.tenantMember.findFirst({
    where: { userId },
    include: { tenant: { include: { projects: { take: 1 } } } },
  });

  const project = member?.tenant?.projects?.[0] ?? null;

  return <KeywordGapClient projectId={project?.id ?? null} />;
}
