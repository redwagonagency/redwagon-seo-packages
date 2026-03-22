/**
 * POST /api/seo-toolkit
 * Unified SEO research aggregator combining keyword research, product search,
 * traffic, competitors, and insights into a single query endpoint
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getKeywordIdeasLabs,
  getGoogleShoppingRankings,
  getSearchIntent,
  type KeywordIdeaItem,
} from "@/lib/dataforseo/client";

export interface ToolkitKeywordResult {
  keyword: string;
  searchVolume: number;
  cpc: number | null;
  difficulty: number | null;
  intent: string | null;
}

export interface ToolkitProductResult {
  keyword: string;
  productCount: number;
  avgPrice: string | null;
  topProduct: {
    title: string | null;
    price: string | null;
    seller: string | null;
    rating: number | null;
  };
}

export interface ToolkitQueryResponse {
  query: string;
  keywords: ToolkitKeywordResult[];
  products: ToolkitProductResult[];
  totalResults: {
    keywordIdeas: number;
    productListings: number;
  };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    query?: string;
    location?: number;
    language?: string;
    includeKeywords?: boolean;
    includeProducts?: boolean;
    limit?: number;
  };

  const {
    query,
    location = 2840,
    language = "en",
    includeKeywords = true,
    includeProducts = true,
    limit = 50,
  } = body;

  if (!query || typeof query !== "string") {
    return Response.json({ error: "query parameter required" }, { status: 400 });
  }

  try {
    const [keywordData, intentData, productData] = await Promise.all([
      includeKeywords
        ? getKeywordIdeasLabs(query, location, language, Math.min(limit, 100))
        : Promise.resolve([]),
      includeKeywords
        ? getSearchIntent([query], location, language).catch(() => [])
        : Promise.resolve([]),
      includeProducts
        ? dfsPost("/serp/google/shopping/live/advanced", [
            { keyword: query, location_code: location, language_code: language },
          ])
        : Promise.resolve(null),
    ]);

    // Build intent map
    const intentMap: Record<string, string> = {};
    for (const item of intentData as any[]) {
      if (item.keyword) {
        intentMap[item.keyword.toLowerCase()] = item.intent;
      }
    }

    // Process keyword ideas
    const keywords: ToolkitKeywordResult[] = (keywordData as KeywordIdeaItem[])
      .slice(0, limit)
      .map((item) => ({
        keyword: item.keyword,
        searchVolume: item.searchVolume ?? 0,
        cpc: item.cpc ?? null,
        difficulty: null,
        intent: intentMap[item.keyword.toLowerCase()] ?? item.intent ?? null,
      }));

    // Process product results
    const products: ToolkitProductResult[] = [];
    if (productData) {
      const items = (productData?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<
        string,
        unknown
      >[];
      const shopping = items.filter((i) => i.type === "shopping" || i.type === "paid").slice(0, 5);

      if (shopping.length > 0) {
        const topProduct = shopping[0];
        products.push({
          keyword: query,
          productCount: shopping.length,
          avgPrice: null, // Could calculate from items
          topProduct: {
            title: typeof topProduct.title === "string" ? topProduct.title : null,
            price: typeof topProduct.price === "string" ? topProduct.price : null,
            seller: typeof topProduct.seller === "string" ? topProduct.seller : null,
            rating: typeof topProduct.rating === "number" ? topProduct.rating : null,
          },
        });
      }
    }

    return Response.json({
      query,
      keywords,
      products,
      totalResults: {
        keywordIdeas: keywords.length,
        productListings: products.reduce((sum, p) => sum + p.productCount, 0),
      },
    } as ToolkitQueryResponse);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "SEO toolkit query failed" },
      { status: 500 }
    );
  }
}

// Helper to call DataForSEO
async function dfsPost(endpoint: string, body: unknown) {
  const login = process.env.DATAFORSEO_LOGIN ?? "";
  const password = process.env.DATAFORSEO_PASSWORD ?? "";
  const encoded = Buffer.from(`${login}:${password}`).toString("base64");

  const res = await fetch(`https://api.dataforseo.com/v3${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`DataForSEO ${endpoint} failed: ${res.status}${errorText ? ` ${errorText}` : ""}`);
  }

  return res.json();
}
