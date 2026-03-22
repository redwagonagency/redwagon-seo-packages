import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGscSearchAnalytics } from "@/lib/integrations/google-search-console";
import { NextRequest } from "next/server";

/**
 * GET /api/gsc/import?projectId=xxx
 * Returns top search queries from Google Search Console for the project domain.
 * Requires the user to have signed in with Google (access_token stored in Account table).
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId) return Response.json({ error: "projectId required" }, { status: 400 });

  // Verify user has access to this project
  const member = await prisma.tenantMember.findFirst({
    where: {
      userId: session.user.id,
      tenant: { projects: { some: { id: projectId } } },
    },
  });
  if (!member) return Response.json({ error: "Forbidden" }, { status: 403 });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { domain: true },
  });
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  // Get the Google OAuth access token from the Account table
  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
    select: { access_token: true },
  });

  if (!account?.access_token) {
    return Response.json(
      { error: "No Google account connected. Sign in with Google to import GSC data." },
      { status: 400 }
    );
  }

  // Fetch last 90 days of search queries from GSC
  const today = new Date();
  const endDate = today.toISOString().split("T")[0];
  const startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Try HTTPS and HTTP site URL formats GSC uses
  const siteUrls = [
    `https://${project.domain}/`,
    `sc-domain:${project.domain}`,
    `https://www.${project.domain}/`,
  ];

  for (const siteUrl of siteUrls) {
    try {
      const gscData = await getGscSearchAnalytics(
        account.access_token,
        siteUrl,
        startDate,
        endDate,
        ["query"]
      );

      if (gscData?.error) continue; // try next URL format

      const rows = (gscData?.rows ?? []) as Record<string, unknown>[];
      if (rows.length === 0) continue;

      const keywords = rows
        .map((row) => (row.keys as string[])?.[0])
        .filter(Boolean)
        .slice(0, 500);

      return Response.json({ keywords, total: keywords.length, siteUrl });
    } catch {
      continue;
    }
  }

  return Response.json(
    { error: "No GSC data found. Make sure your site is verified in Google Search Console." },
    { status: 404 }
  );
}
