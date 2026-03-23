/**
 * POST /api/product-keywords
 * Returns e-commerce keyword research for a product keyword
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getKeywordIdeasLabs, getKeywordSuggestions, getSearchIntent } from "@/lib/dataforseo/client";
import { logUserSearch } from "@/lib/search-logger";
import { getSelectedSiteIdForUser } from "@/lib/site-context";
import { runWithApiUsageUserContext } from "@/lib/api-usage-context";

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
  const userId = (session.user as { id: string }).id;
  const selectedSiteId = await getSelectedSiteIdForUser(userId).catch(() => null);

  const body = (await req.json()) as { keyword?: string; location?: number; language?: string };
  const { keyword, location = 2840, language = "en" } = body;

  if (!keyword || typeof keyword !== "string") {
    return Response.json({ error: "keyword required" }, { status: 400 });
  }

  try {
    // Fetch keyword ideas for product + common e-commerce variants
    const seeds = [keyword, `best ${keyword}`, `${keyword} review`, `buy ${keyword}`];
      const ideaResults = await runWithApiUsageUserContext(userId, () =>
        Promise.allSettled(
          seeds.map((s) => getKeywordIdeasLabs(s, location, language, 80))
        )
      , { siteId: selectedSiteId, useCase: "product_keywords" });
    const allIdeas = ideaResults
      .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof getKeywordIdeasLabs>>> => result.status === "fulfilled")
      .map((result) => result.value);

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

    // Fallback source if primary ideas endpoint returned sparse results
    if (rows.length < 20) {
      const fallbackSuggestions = await runWithApiUsageUserContext(userId, () => getKeywordSuggestions(keyword, location, language, 120).catch(() => []), { siteId: selectedSiteId, useCase: "product_keywords_suggestions" });
      for (const suggestion of fallbackSuggestions) {
        const key = suggestion.keyword.toLowerCase().trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        rows.push({
          keyword: suggestion.keyword,
          volume: suggestion.searchVolume ?? 0,
          cpc: suggestion.cpc ?? null,
          difficulty: suggestion.difficulty ?? null,
          intent: null,
          ecommerceSignal: isEcommerceIntent(suggestion.keyword),
        });
      }
    }

    // Sort: e-commerce signal first, then by volume desc
    rows.sort((a, b) => {
      if (a.ecommerceSignal !== b.ecommerceSignal) return a.ecommerceSignal ? -1 : 1;
      return (b.volume ?? 0) - (a.volume ?? 0);
    });

    // Try to get intent data for top 20
    const top50 = rows.slice(0, 50).map((r) => r.keyword);
    try {
      const intentData = await runWithApiUsageUserContext(userId, () => getSearchIntent(top50, location, language), { siteId: selectedSiteId, useCase: "product_keywords_intent" });
      for (const kw of rows) {
        const match = intentData.find((i) => i.keyword.toLowerCase() === kw.keyword.toLowerCase());
        if (match) kw.intent = match.intent;
      }
    } catch { /* intent is optional */ }

    void logUserSearch(session.user.id, keyword, "product", { results: rows.length }, {
      siteId: selectedSiteId,
      source: "product",
      keywords: rows.map((row) => ({
        keyword: row.keyword,
        volume: row.volume,
        cpc: row.cpc,
        difficulty: row.difficulty,
        intent: row.intent,
      })),
    });

    return Response.json({ results: rows.slice(0, 500), total: rows.length });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Product keyword search failed" },
      { status: 500 }
    );
  }
}

