import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isJoeSuperAdmin } from "@/lib/superadmin";

type IndustryStatsCompat = {
  industryStat: {
    findMany: (args: unknown) => Promise<Array<{
      id: string;
      industry: string;
      metricKey: string;
      metricValue: number;
      unit: string | null;
      note: string | null;
      source: string | null;
      updatedAt: Date;
    }>>;
    upsert: (args: unknown) => Promise<{ id: string }>;
  };
};

export async function GET() {
  const session = await auth();
  if (!isJoeSuperAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = prisma as unknown as IndustryStatsCompat;
  const stats = await db.industryStat.findMany({
    orderBy: [{ industry: "asc" }, { metricKey: "asc" }],
  });

  return NextResponse.json({ stats });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isJoeSuperAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    industry?: string;
    metricKey?: string;
    metricValue?: number;
    unit?: string;
    note?: string;
    source?: string;
  };

  const industry = (body.industry || "general").trim().toLowerCase();
  const metricKey = (body.metricKey || "").trim().toLowerCase();
  const metricValue = Number(body.metricValue);

  if (!industry || !metricKey || !Number.isFinite(metricValue)) {
    return NextResponse.json(
      { error: "industry, metricKey, and metricValue are required" },
      { status: 400 }
    );
  }

  const db = prisma as unknown as IndustryStatsCompat;
  await db.industryStat.upsert({
    where: { industry_metricKey: { industry, metricKey } },
    update: {
      metricValue,
      unit: body.unit || null,
      note: body.note || null,
      source: body.source || null,
    },
    create: {
      industry,
      metricKey,
      metricValue,
      unit: body.unit || null,
      note: body.note || null,
      source: body.source || null,
    },
  });

  return NextResponse.json({ ok: true });
}
