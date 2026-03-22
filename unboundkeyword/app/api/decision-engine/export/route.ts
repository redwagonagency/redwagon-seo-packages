import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type DecisionRunReadCompat = {
  findFirst: (args: {
    where: { id?: string; userId: string };
    orderBy?: { createdAt: "desc" };
  }) => Promise<{
    id: string;
    keyword: string;
    domain: string;
    score: number | null;
    priority: string | null;
    payloadJson: string;
    createdAt: Date;
  } | null>;
};

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user && "id" in session.user ? (session.user.id as string | undefined) : undefined;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runId = req.nextUrl.searchParams.get("runId")?.trim();
  const runModel = (prisma as unknown as { decisionRun: DecisionRunReadCompat }).decisionRun;

  const run = await runModel.findFirst(
    runId
      ? { where: { id: runId, userId } }
      : { where: { userId }, orderBy: { createdAt: "desc" } }
  );

  if (!run) {
    return NextResponse.json({ error: "No decision run found" }, { status: 404 });
  }

  const payload = JSON.parse(run.payloadJson);

  return NextResponse.json({
    runId: run.id,
    keyword: run.keyword,
    domain: run.domain,
    score: run.score,
    priority: run.priority,
    createdAt: run.createdAt,
    payload,
  });
}
