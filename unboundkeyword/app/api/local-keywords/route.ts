/**
 * POST /api/local-keywords
 * Generates local keyword variants from seed + state/DMA selection,
 * fetches real search volume & difficulty via DataForSEO.
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getKeywordData } from "@/lib/dataforseo/client";
import {
  US_STATES,
  US_DMAS,
  generateLocalVariants,
  getStateByAbbr,
  getDmaZips,
} from "@/lib/data/usa-geo";

export interface LocalKeywordRow {
  keyword: string;
  city: string;
  state: string;
  dmaName: string | null;
  volume: number | null;
  cpc: number | null;
  difficulty: number | null;
  competition: string | null;
}

export interface LocalKeywordsResponse {
  keyword: string;
  totalRows: number;
  rows: LocalKeywordRow[];
}

// Re-export geo data so the page can import it
export { US_STATES, US_DMAS };

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    keyword?: string;
    states?: string[];   // state abbreviations
    dmaIds?: string[];   // DMA IDs
    location?: number;
    language?: string;
  };

  const { keyword, states = [], dmaIds = [], location = 2840, language = "en" } = body;

  if (!keyword?.trim()) return Response.json({ error: "keyword required" }, { status: 400 });

  const seed = keyword.trim().toLowerCase();

  // Collect all city entries to generate variants for
  const cityEntries: { city: string; stateName: string; stateAbbr: string; dmaName: string | null; aliases: Record<string, string>; dmaId?: string }[] = [];

  // From selected DMAs
  const selectedDmas = US_DMAS.filter((d) => dmaIds.includes(d.id));
  for (const dma of selectedDmas) {
    const stateInfo = getStateByAbbr(dma.state);
    const stateName = stateInfo?.name ?? dma.state;
    for (const city of dma.cities.slice(0, 10)) {
      cityEntries.push({ city, stateName, stateAbbr: dma.state, dmaName: dma.name, aliases: dma.aliases, dmaId: dma.id });
    }
  }

  // From selected states (if no DMA selected, use state-level terms)
  for (const stateAbbr of states) {
    const stateInfo = getStateByAbbr(stateAbbr);
    if (!stateInfo) continue;
    // Only add state-level entry if this state isn't already covered by a DMA
    const alreadyCovered = selectedDmas.some((d) => d.state === stateAbbr.toUpperCase());
    if (!alreadyCovered) {
      cityEntries.push({
        city: stateInfo.name,
        stateName: stateInfo.name,
        stateAbbr,
        dmaName: null,
        aliases: {},
      });
    }
  }

  // Generate all variants
  const variantMap = new Map<string, { city: string; stateName: string; stateAbbr: string; dmaName: string | null }>();

  for (const entry of cityEntries) {
    const variants = generateLocalVariants(seed, entry.city, entry.stateName, entry.stateAbbr, entry.aliases, entry.dmaId ? getDmaZips(entry.dmaId) : undefined);
    for (const v of variants) {
      if (!variantMap.has(v)) {
        variantMap.set(v, { city: entry.city, stateName: entry.stateName, stateAbbr: entry.stateAbbr, dmaName: entry.dmaName });
      }
    }
  }

  const allVariants = [...variantMap.keys()];

  // Batch fetch keyword data in chunks of 50 (DFS limit)
  const CHUNK_SIZE = 50;
  const chunks: string[][] = [];
  for (let i = 0; i < allVariants.length; i += CHUNK_SIZE) {
    chunks.push(allVariants.slice(i, i + CHUNK_SIZE));
  }

  // Limit to 5 chunks (250 keywords max) to avoid long waits
  const safeChunks = chunks.slice(0, 5);
  const volumeMap = new Map<string, { volume: number | null; cpc: number | null; difficulty: number | null; competition: string | null }>();

  for (const chunk of safeChunks) {
    try {
      const raw = await getKeywordData(chunk);
      type KwRaw = { tasks?: Array<{ result?: Array<{ items?: Array<Record<string, unknown>> }> }> };
      const items = (raw as KwRaw)?.tasks?.[0]?.result?.[0]?.items ?? [];
      for (const item of items as Record<string, unknown>[]) {
        const kw = String(item.keyword ?? "").toLowerCase();
        const ki = (item.keyword_info ?? {}) as Record<string, unknown>;
        volumeMap.set(kw, {
          volume: typeof ki.search_volume === "number" ? ki.search_volume : null,
          cpc: typeof ki.cpc === "number" ? ki.cpc : null,
          difficulty: typeof (item.keyword_properties as Record<string, unknown>)?.keyword_difficulty === "number"
            ? (item.keyword_properties as Record<string, unknown>).keyword_difficulty as number
            : null,
          competition: typeof ki.competition_level === "string" ? ki.competition_level as string : null,
        });
      }
    } catch {
      // Continue — some chunks may fail
    }
  }

  // Build result rows
  const rows: LocalKeywordRow[] = allVariants.map((kw) => {
    const geo = variantMap.get(kw)!;
    const data = volumeMap.get(kw.toLowerCase()) ?? { volume: null, cpc: null, difficulty: null, competition: null };
    return {
      keyword: kw,
      city: geo.city,
      state: geo.stateAbbr,
      dmaName: geo.dmaName,
      volume: data.volume,
      cpc: data.cpc,
      difficulty: data.difficulty,
      competition: data.competition,
    };
  }).sort((a, b) => (b.volume ?? -1) - (a.volume ?? -1));

  return Response.json({ keyword: seed, totalRows: rows.length, rows } satisfies LocalKeywordsResponse);
}
