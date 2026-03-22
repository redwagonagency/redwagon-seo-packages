import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildActionEngine } from "@/lib/decision-engine";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user && "id" in session.user ? (session.user.id as string | undefined) : undefined;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { keyword?: string };
  const keyword = body.keyword?.trim();
  if (!keyword) {
    return NextResponse.json({ error: "keyword is required" }, { status: 400 });
  }

  const actionPlan = buildActionEngine(keyword);
  return NextResponse.json({ actionPlan });
}
