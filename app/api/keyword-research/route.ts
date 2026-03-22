import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { getKeywordOverview, getKeywordIdeas } from "@/lib/dataforseo/client";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { keywords: string[]; mode: "overview" | "magic"; projectId?: string };
  const { keywords, mode } = body;

  if (!Array.isArray(keywords) || keywords.length === 0) {
    return Response.json({ error: "keywords required" }, { status: 400 });
  }

  try {
    const results = mode === "magic"
      ? await getKeywordIdeas(keywords.slice(0, 5), 2840, "en", 100)
      : await getKeywordOverview(keywords.slice(0, 20), 2840, "en");

    return Response.json({ results });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "DataForSEO error" }, { status: 500 });
  }
}
