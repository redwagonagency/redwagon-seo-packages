import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSelectedSiteForUser } from "@/lib/site-context";
import { buildDailyIntelFeed } from "@/lib/decision-engine";

type DailyIntelDigestCompat = {
  create: (args: { data: { userId: string; siteId: string | null; topic: string; payloadJson: string } }) => Promise<{ id: string }>;
};

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user && "id" in session.user ? (session.user.id as string | undefined) : undefined;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const selectedSite = await getSelectedSiteForUser(userId);
  const topic = req.nextUrl.searchParams.get("topic")?.trim() || selectedSite?.domain || "seo";

  const feed = await buildDailyIntelFeed(topic);

  const digestModel = (prisma as unknown as { dailyIntelDigest: DailyIntelDigestCompat }).dailyIntelDigest;
  await digestModel.create({
    data: {
      userId,
      siteId: selectedSite?.id ?? null,
      topic,
      payloadJson: JSON.stringify(feed),
    },
  });

  return NextResponse.json({ topic, feed });
}
