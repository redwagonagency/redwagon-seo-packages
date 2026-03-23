/**
 * GET /api/superadmin/discovery-sessions
 * Fetch recent discovery sessions for superadmin dashboard
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SUPERADMIN_EMAILS = ["joe@redwagon.agency", "admin@unboundkeyword.com"];

function isSuperAdmin(email: string | null | undefined): boolean {
  return email ? SUPERADMIN_EMAILS.includes(email.toLowerCase()) : false;
}

export async function GET() {
  try {
    const session = await auth();
    const email = session?.user?.email;

    if (!isSuperAdmin(email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const prismaCompat = prisma as unknown as {
      discoverySession: {
        findMany: (args: unknown) => Promise<unknown>;
      };
    };

    // Fetch recent discovery sessions with their keywords
    const sessions = (await prismaCompat.discoverySession.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        keywords: {
          take: 300, // Limit keywords per session for performance
        },
      },
    } as any)) as any[];

    return NextResponse.json({
      sessions,
      totalSessions: sessions.length,
    });
  } catch (error: unknown) {
    console.error("[discovery-sessions]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
