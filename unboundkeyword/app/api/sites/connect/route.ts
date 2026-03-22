import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSelectedSiteForUser } from "@/lib/site-context";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = (await req.json()) as { type?: "ga4" | "gsc" };
  if (!body.type) return Response.json({ error: "type is required" }, { status: 400 });

  const googleAccount = await prisma.account.findFirst({ where: { userId, provider: "google" } });
  if (!googleAccount) {
    return Response.json({
      error: "Google account not connected. Sign in with Google first.",
      needsGoogleAuth: true,
    }, { status: 400 });
  }

  const selected = await getSelectedSiteForUser(userId);
  if (!selected) return Response.json({ error: "No selected site" }, { status: 400 });

  const updated = await prisma.siteProject.update({
    where: { id: selected.id },
    data: body.type === "ga4" ? { ga4Connected: true } : { gscConnected: true },
  });

  return Response.json({ ok: true, site: updated });
}
