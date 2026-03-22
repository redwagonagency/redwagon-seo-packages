import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import KeywordDiscoveryClient from "@/components/dashboard/KeywordDiscoveryClient";

export default async function KeywordResearchMagicPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;

  const member = await prisma.tenantMember.findFirst({
    where: { userId },
    include: { tenant: { include: { projects: { take: 1 } } } },
  });

  const project = member?.tenant?.projects?.[0] ?? null;

  return <KeywordDiscoveryClient projectId={project?.id ?? null} />;
}
