/**
 * POST /api/local-keywords
 * Returns localized keyword variants with search volume for selected US states/DMAs.
 * Generates "{keyword} in {location}" and "{keyword} {location}" variants,
 * then fetches volumes via Google Ads search volume API.
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getKeywordOverview } from "@/lib/dataforseo/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    keyword?: string;
    states?: string[];
    dmas?: string[];
  };

  const { keyword, states = [], dmas = [] } = body;

  if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
    return Response.json({ error: "keyword required" }, { status: 400 });
  }

  if (states.length === 0 && dmas.length === 0) {
    return Response.json({ error: "Select at least one state or DMA" }, { status: 400 });
  }

  const seed = keyword.trim().toLowerCase();
  const locations = [...states, ...dmas];

  // Build keyword variants for each location
  const variants: string[] = [];
  for (const loc of locations) {
    variants.push(`${seed} in ${loc.toLowerCase()}`);
    variants.push(`${seed} ${loc.toLowerCase()}`);
  }
  // Also include the national seed keyword for reference
  variants.push(seed);

  try {
    // Batch fetch all variants in one API call
    const overviewResults = await getKeywordOverview(variants, 2840, "en");

    // Build a lookup map: keyword → metric
    const volumeMap: Record<string, { volume: number | null; cpc: number | null; difficulty: number | null }> = {};
    for (const row of overviewResults) {
      volumeMap[row.keyword.toLowerCase()] = {
        volume: row.volume,
        cpc: row.cpc,
        difficulty: row.difficulty,
      };
    }

    const nationalData = volumeMap[seed];

    // Assemble per-location results
    const rows = locations.map((loc) => {
      const inVariantKey = `${seed} in ${loc.toLowerCase()}`;
      const bareVariantKey = `${seed} ${loc.toLowerCase()}`;
      const inVariant = volumeMap[inVariantKey];
      const bareVariant = volumeMap[bareVariantKey];

      // Pick the variant with higher volume
      const best =
        (inVariant?.volume ?? 0) >= (bareVariant?.volume ?? 0) ? inVariant : bareVariant;
      const bestKeyword =
        (inVariant?.volume ?? 0) >= (bareVariant?.volume ?? 0) ? inVariantKey : bareVariantKey;

      const isState = states.includes(loc);

      return {
        location: loc,
        locationType: isState ? "state" : "dma",
        localizedKeyword: bestKeyword,
        volume: best?.volume ?? 0,
        inVariant: {
          keyword: inVariantKey,
          volume: inVariant?.volume ?? 0,
          cpc: inVariant?.cpc ?? null,
          difficulty: inVariant?.difficulty ?? null,
        },
        bareVariant: {
          keyword: bareVariantKey,
          volume: bareVariant?.volume ?? 0,
          cpc: bareVariant?.cpc ?? null,
          difficulty: bareVariant?.difficulty ?? null,
        },
        cpc: best?.cpc ?? null,
        difficulty: best?.difficulty ?? null,
      };
    });

    return Response.json({
      keyword: seed,
      nationalVolume: nationalData?.volume ?? 0,
      rows: rows.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)),
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Local keyword lookup failed" },
      { status: 500 }
    );
  }
}
