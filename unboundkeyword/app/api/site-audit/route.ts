import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getLighthouseLiveJson } from "@/lib/dataforseo/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { url?: string; forMobile?: boolean };
  const { url, forMobile = false } = body;

  if (!url?.trim()) {
    return Response.json({ error: "url required" }, { status: 400 });
  }

  try {
    const result = await getLighthouseLiveJson(url.trim(), forMobile);
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Audit failed" },
      { status: 500 }
    );
  }
}
