/**
 * POST /api/product-keywords
 * Returns e-commerce keyword research for a product keyword
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getKeywordIdeasLabs, getSearchIntent } from "@/lib/dataforseo/client";
import { logUserSearch } from "@/lib/search-logger";

const ECOMMERCE_SIGNALS = [
  "buy", "price", "cheap", "discount", "coupon", "sale", "deal", "review", "best",
  "vs", "compare", "comparison", "top", "affordable", "near me", "online", "shop",
  "order", "shipping", "warranty", "refund", "return", "cost", "how much",
];

function isEcommerceIntent(keyword: string): boolean {
  const lower = keyword.toLowerCase();
  return ECOMMERCE_SIGNALS.some((s) => lower.includes(s));
}

export interface ProductKeywordRow {
  keyword: string;
  volume: number;
  cpc: number | null;
  difficulty: number | null;
  intent: string | null;
  ecommerceSignal: boolean;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { keyword?: string; location?: number; language?: string };
  const { keyword, location = 2840, language = "en" } = body;

  if (!keyword || typeof keyword !== "string") {
    return Response.json({ error: "keyword required" }, { status: 400 });
  }

  try {
    // Fetch keyword ideas for product + common e-commerce variants
    const seeds = [keyword, `best ${keyword}`, `${keyword} review`, `buy ${keyword}`];
    const allIdeas = await Promise.all(
      seeds.slice(0, 2).map((s) => getKeywordIdeasLabs(s, location, language, 60))
    );

    // Deduplicate across seeds
    const seen = new Set<string>();
    const rows: ProductKeywordRow[] = [];
    for (const ideas of allIdeas) {
      for (const idea of ideas) {
        const key = idea.keyword.toLowerCase().trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        rows.push({
          keyword: idea.keyword,
          volume: idea.searchVolume ?? 0,
          cpc: idea.cpc ?? null,
          difficulty: null,
          intent: null,
          ecommerceSignal: isEcommerceIntent(idea.keyword),
        });
      }
    }

    // Sort: e-commerce signal first, then by volume desc
    rows.sort((a, b) => {
      if (a.ecommerceSignal !== b.ecommerceSignal) return a.ecommerceSignal ? -1 : 1;
      return (b.volume ?? 0) - (a.volume ?? 0);
    });

    // Try to get intent data for top 20
    const top20 = rows.slice(0, 20).map((r) => r.keyword);
    try {
      const intentData = await getSearchIntent(top20, location, language);
      for (const kw of rows) {
        const match = intentData.find((i) => i.keyword.toLowerCase() === kw.keyword.toLowerCase());
        if (match) kw.intent = match.intent;
      }
    } catch { /* intent is optional */ }

    void logUserSearch(session.user.id, keyword, "product", { results: rows.length });

    return Response.json({ results: rows.slice(0, 100) });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Product keyword search failed" },
      { status: 500 }
    );
  }
}

