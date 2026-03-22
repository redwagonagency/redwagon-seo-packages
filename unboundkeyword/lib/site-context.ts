import { prisma } from "@/lib/prisma";

export async function getSelectedSiteForUser(userId: string) {
  const preference = await prisma.userPreference.findUnique({
    where: { userId },
    include: { selectedSite: true },
  });

  if (preference?.selectedSite) return preference.selectedSite;

  const fallback = await prisma.siteProject.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  if (!fallback) return null;

  await prisma.userPreference.upsert({
    where: { userId },
    update: { selectedSiteId: fallback.id },
    create: { userId, selectedSiteId: fallback.id },
  });

  return fallback;
}

export async function getSelectedSiteIdForUser(userId: string) {
  const site = await getSelectedSiteForUser(userId);
  return site?.id ?? null;
}
