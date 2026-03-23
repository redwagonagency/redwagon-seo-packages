/**
 * Helper to asynchronously log a user search to the DB.
 * Fire-and-forget — never throws.
 */
import { captureKeywordsToUncategorized } from "@/lib/keyword-capture";

export async function logUserSearch(
  userId: string,
  query: string,
  searchType: string,
  resultMeta?: Record<string, unknown>,
  options?: {
    siteId?: string | null;
    source?: string;
    keywords?: Array<{
      keyword: string;
      volume?: number | null;
      cpc?: number | null;
      difficulty?: number | null;
      intent?: string | null;
      competition?: number | null;
    }>;
  }
) {
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.userSearch.create({
      data: {
        userId,
        query,
        searchType,
        resultMeta: JSON.stringify(resultMeta ?? {}),
      },
    });

    const source = options?.source ?? searchType;
    const rows = [
      { keyword: query },
      ...(options?.keywords ?? []),
    ];

    void captureKeywordsToUncategorized({
      userId,
      siteId: options?.siteId ?? null,
      source,
      rows,
    });
  } catch {
    // logging is non-critical
  }
}
