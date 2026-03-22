import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { getKeywordOverview, getKeywordIdeas, getKeywordGap } from "@/lib/dataforseo/client";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { keywords: string[]; mode: "overview" | "magic" | "gap"; projectId?: string };
  const { keywords, mode, projectId } = body;

  if (mode !== "gap" && (!Array.isArray(keywords) || keywords.length === 0)) {
    return Response.json({ error: "keywords required" }, { status: 400 });
  }

  try {
    if (mode === "gap") {
      if (!projectId) {
        return Response.json({ error: "projectId is required for gap mode" }, { status: 400 });
      }

      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          tenant: { members: { some: { userId: session.user.id } } },
        },
        select: { domain: true, competitorsJson: true },
      });

      if (!project) {
        return Response.json({ error: "Project not found" }, { status: 404 });
      }

      let competitors: string[] = [];
      if (project.competitorsJson) {
        try {
          competitors = JSON.parse(project.competitorsJson) as string[];
        } catch {
          competitors = [];
        }
      }

      if (competitors.length === 0) {
        return Response.json({ error: "Add competitor domains in project settings first." }, { status: 400 });
      }

      const results = await getKeywordGap(project.domain, competitors.slice(0, 5), 2840, "en", 100);
      return Response.json({ results });
    }

    const results = mode === "magic"
      ? await getKeywordIdeas(keywords.slice(0, 5), 2840, "en", 100)
      : await getKeywordOverview(keywords.slice(0, 20), 2840, "en");

    return Response.json({ results });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "DataForSEO error" }, { status: 500 });
  }
}
