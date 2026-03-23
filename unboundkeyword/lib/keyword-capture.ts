import { prisma } from "@/lib/prisma";

export interface CaptureKeywordRow {
  keyword: string;
  volume?: number | null;
  cpc?: number | null;
  difficulty?: number | null;
  intent?: string | null;
  competition?: number | null;
}

function normalizeKeyword(value: string): string {
  return value.trim().toLowerCase();
}

async function ensureUncategorizedList(userId: string, siteId: string | null = null) {
  const existing = await prisma.keywordList.findFirst({
    where: {
      userId,
      siteId,
      name: "Uncategorized",
    },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) return existing;

  return prisma.keywordList.create({
    data: {
      userId,
      siteId,
      name: "Uncategorized",
      description: "Auto-captured keywords from searches and API pulls",
      color: "#64748b",
    },
  });
}

export async function captureKeywordsToUncategorized(params: {
  userId: string;
  siteId?: string | null;
  source: string;
  rows: CaptureKeywordRow[];
}) {
  const { userId, siteId = null, source, rows } = params;
  const deduped = new Map<string, CaptureKeywordRow>();

  for (const row of rows) {
    const normalized = normalizeKeyword(row.keyword ?? "");
    if (!normalized) continue;
    if (!deduped.has(normalized)) {
      deduped.set(normalized, {
        keyword: normalized,
        volume: row.volume ?? null,
        cpc: row.cpc ?? null,
        difficulty: row.difficulty ?? null,
        intent: row.intent ?? null,
        competition: row.competition ?? null,
      });
      continue;
    }

    const existing = deduped.get(normalized)!;
    if ((existing.volume ?? 0) === 0 && (row.volume ?? 0) > 0) existing.volume = row.volume;
    if (existing.cpc == null && row.cpc != null) existing.cpc = row.cpc;
    if (existing.difficulty == null && row.difficulty != null) existing.difficulty = row.difficulty;
    if (existing.intent == null && row.intent != null) existing.intent = row.intent;
    if (existing.competition == null && row.competition != null) existing.competition = row.competition;
  }

  if (deduped.size === 0) return;

  const list = await ensureUncategorizedList(userId, siteId);

  await Promise.all(
    [...deduped.values()].map((row) =>
      prisma.keywordInList.upsert({
        where: { listId_keyword: { listId: list.id, keyword: row.keyword } },
        update: {
          volume: row.volume ?? undefined,
          cpc: row.cpc ?? undefined,
          difficulty: row.difficulty ?? undefined,
          intent: row.intent ?? undefined,
          competition: row.competition ?? undefined,
        },
        create: {
          listId: list.id,
          keyword: row.keyword,
          volume: row.volume ?? null,
          cpc: row.cpc ?? null,
          difficulty: row.difficulty ?? null,
          intent: row.intent ?? null,
          competition: row.competition ?? null,
          source,
        },
      })
    )
  );
}
