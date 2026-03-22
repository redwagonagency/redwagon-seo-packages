import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzePageInstant, type PageAuditResult } from "@/lib/dataforseo/client";
import { NextRequest } from "next/server";

/**
 * POST /api/reports/analyze-pages
 * Runs on-demand on-page analysis for selected URLs within a project.
 * Results are returned in-response (not persisted to DB snapshot).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { projectId: string; urls: string[] };
  const { projectId, urls } = body;

  if (!projectId || !Array.isArray(urls) || urls.length === 0) {
    return Response.json({ error: "projectId and urls required" }, { status: 400 });
  }
  if (urls.length > 50) {
    return Response.json({ error: "Max 50 URLs per request" }, { status: 400 });
  }

  // Verify ownership
  const member = await prisma.tenantMember.findFirst({
    where: {
      userId: session.user.id,
      tenant: { projects: { some: { id: projectId } } },
    },
  });
  if (!member) return Response.json({ error: "Forbidden" }, { status: 403 });

  // Run analysis in batches of 5
  const results: PageAuditResult[] = [];
  for (let i = 0; i < urls.length; i += 5) {
    const batch = urls.slice(i, i + 5);
    const settled = await Promise.allSettled(
      batch.map(async (url): Promise<PageAuditResult> => {
        const r = await analyzePageInstant(url);
        return {
          url,
          score: r.score,
          title: r.title,
          description: r.description,
          hasCanonical: r.hasCanonical,
          hasSchema: r.hasSchema,
          loadTimeMs: r.loadTimeMs,
          responseCode: r.responseCode,
          issues: r.issues,
        };
      })
    );
    for (const r of settled) {
      if (r.status === "fulfilled") results.push(r.value);
    }
  }

  return Response.json({ results });
}
