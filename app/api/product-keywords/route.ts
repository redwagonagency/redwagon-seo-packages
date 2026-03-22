import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKeywordIdeas, getKeywordOverview, type KeywordMetric } from "@/lib/dataforseo/client";

type ProductKeywordResponse = {
  keyword: string;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  intent: string | null;
  source: "ideas" | "overview";
};

const COMPARISON_MODIFIERS = [
  "vs",
  "versus",
  "alternative",
  "alternatives",
  "best",
  "top",
  "review",
  "reviews",
  "pricing",
  "price",
  "cost",
  "cheap",
  "for small business",
  "for ecommerce",
  "for agencies",
];

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function toResponse(row: KeywordMetric, source: ProductKeywordResponse["source"]): ProductKeywordResponse {
  return {
    keyword: row.keyword,
    volume: row.volume,
    difficulty: row.difficulty,
    cpc: row.cpc,
    intent: row.intent,
    source,
  };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    projectId?: string;
    product?: string;
  };

  const projectId = body.projectId;
  const product = normalize(body.product || "");

  if (!projectId || !product) {
    return Response.json({ error: "projectId and product are required" }, { status: 400 });
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

  const candidateQueries = Array.from(new Set([
    product,
    ...COMPARISON_MODIFIERS.map((modifier) => `${product} ${modifier}`),
    ...COMPARISON_MODIFIERS.map((modifier) => `${modifier} ${product}`),
  ])).slice(0, 30);

  try {
    const [ideas, overview] = await Promise.all([
      getKeywordIdeas([product], 2840, "en", 120),
      getKeywordOverview(candidateQueries, 2840, "en"),
    ]);

    const seen = new Set<string>();
    const merged: ProductKeywordResponse[] = [];

    const pushIfNew = (row: ProductKeywordResponse) => {
      const key = row.keyword.toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push(row);
    };

    overview.forEach((row) => pushIfNew(toResponse(row, "overview")));
    ideas.forEach((row) => pushIfNew(toResponse(row, "ideas")));

    const ranked = merged
      .filter((row) => row.keyword.length > 0)
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 150);

    const comparisons = ranked.filter((row) => /\b(vs|versus|alternative|alternatives|compare|review|reviews|best|top)\b/i.test(row.keyword));
    const buyingIntent = ranked.filter((row) => /\b(price|pricing|cost|buy|cheap|deal|quote)\b/i.test(row.keyword));
    const informational = ranked.filter((row) => /\b(how|what|why|guide|tutorial|examples)\b/i.test(row.keyword));

    return Response.json({
      product,
      results: ranked,
      groups: {
        comparisons: comparisons.slice(0, 25),
        buyingIntent: buyingIntent.slice(0, 25),
        informational: informational.slice(0, 25),
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to generate product keywords" },
      { status: 500 }
    );
  }
}
