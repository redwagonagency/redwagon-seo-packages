/**
 * Helper to asynchronously log a user search to the DB.
 * Fire-and-forget — never throws.
 */
export async function logUserSearch(
  userId: string,
  query: string,
  searchType: string,
  resultMeta?: Record<string, unknown>
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
  } catch {
    // logging is non-critical
  }
}
