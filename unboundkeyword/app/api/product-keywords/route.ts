/**
 * POST /api/product-keywords
 * Returns Google Shopping results for product keyword variations
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getProductKeywords } from "@/lib/dataforseo/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { keyword?: string; location?: number };
  const { keyword, location = 2840 } = body;

  if (!keyword || typeof keyword !== "string") {
    return Response.json({ error: "keyword required" }, { status: 400 });
  }

  try {
    const results = await getProductKeywords(keyword, location);
    return Response.json({ results });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Product keyword search failed" },
      { status: 500 }
    );
  }
}
