import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type KeywordClusterRow = {
  keyword: string;
  platform: string | null;
  intent: string | null;
  seedKeyword: string | null;
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const view = req.nextUrl.searchParams.get("view") || "platform";

  try {
    const prismaCompat = prisma as unknown as {
      discoveryKeyword: {
        findMany: (args: unknown) => Promise<KeywordClusterRow[]>;
      };
    };

    const keywords = await prismaCompat.discoveryKeyword.findMany({
      where: { userId: userId! },
      select: {
        keyword: true,
        platform: true,
        intent: true,
        seedKeyword: true,
      },
    });

    const clusters: Record<string, Record<string, number>> = {};

    if (view === "platform") {
      // Group by platform
      keywords.forEach((kw: KeywordClusterRow) => {
        const platform = kw.platform || "Unknown";
        if (!clusters[platform]) {
          clusters[platform] = {};
        }
        clusters[platform][kw.intent || "Mixed"] =
          (clusters[platform][kw.intent || "Mixed"] || 0) + 1;
      });
    } else if (view === "intent") {
      // Group by intent
      keywords.forEach((kw: KeywordClusterRow) => {
        const intent = kw.intent || "Unknown";
        if (!clusters[intent]) {
          clusters[intent] = {};
        }
        clusters[intent][kw.platform || "Google"] =
          (clusters[intent][kw.platform || "Google"] || 0) + 1;
      });
    } else if (view === "seed") {
      // Group by seed keyword
      keywords.forEach((kw: KeywordClusterRow) => {
        const seed = kw.seedKeyword || "Unknown";
        if (!clusters[seed]) {
          clusters[seed] = {};
        }
        clusters[seed][kw.platform || "Google"] =
          (clusters[seed][kw.platform || "Google"] || 0) + 1;
      });
    }

    return NextResponse.json({ clusters, view, total: keywords.length });
  } catch (error) {
    console.error("Error fetching keyword clusters:", error);
    return NextResponse.json(
      { error: "Failed to fetch keyword clusters" },
      { status: 500 }
    );
  }
}
