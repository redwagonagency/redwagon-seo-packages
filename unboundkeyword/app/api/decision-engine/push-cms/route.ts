import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user && "id" in session.user ? (session.user.id as string | undefined) : undefined;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    runId?: string;
    payload?: unknown;
    destination?: string;
  };

  const webhook = process.env.CMS_WEBHOOK_URL;
  if (!webhook) {
    return NextResponse.json(
      {
        ok: false,
        message: "CMS_WEBHOOK_URL is not configured. Add it to enable one-click push.",
      },
      { status: 400 }
    );
  }

  const response = await fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-source": "unboundkeyword-decision-engine",
    },
    body: JSON.stringify({
      runId: body.runId ?? null,
      destination: body.destination ?? "default",
      payload: body.payload ?? null,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return NextResponse.json(
      {
        ok: false,
        message: "Webhook push failed",
        status: response.status,
        details: text.slice(0, 2000),
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, message: "Decision plan pushed to CMS webhook." });
}
