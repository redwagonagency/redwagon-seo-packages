import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isJoeSuperAdmin } from "@/lib/superadmin";

type SuperadminCompat = {
  user: {
    count: (args?: unknown) => Promise<number>;
    findMany: (args: unknown) => Promise<Array<{ id: string; email: string | null; name: string | null; createdAt: Date }>>;
  };
  siteProject: {
    count: (args?: unknown) => Promise<number>;
  };
  discoveryKeyword: {
    count: (args?: unknown) => Promise<number>;
  };
  keywordList: {
    count: (args?: unknown) => Promise<number>;
  };
  industryStat: {
    count: (args?: unknown) => Promise<number>;
  };
};

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!isJoeSuperAdmin(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = prisma as unknown as SuperadminCompat;
  const [users, userCount, siteCount, keywordCount, listCount, statCount] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, email: true, name: true, createdAt: true },
    }),
    db.user.count(),
    db.siteProject.count(),
    db.discoveryKeyword.count(),
    db.keywordList.count(),
    db.industryStat.count(),
  ]);

  return NextResponse.json({
    summary: {
      users: userCount,
      projects: siteCount,
      trackedKeywords: keywordCount,
      keywordLists: listCount,
      industryStats: statCount,
    },
    users,
  });
}
