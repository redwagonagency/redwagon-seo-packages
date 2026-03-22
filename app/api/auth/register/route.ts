import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    });

    // Create a default tenant for the new user
    const slug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
    const tenant = await prisma.tenant.create({
      data: {
        name: name ?? email,
        slug: `${slug}-${user.id.slice(0, 6)}`,
        plan: "STARTER",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.tenantMember.create({
      data: { tenantId: tenant.id, userId: user.id, role: "OWNER" },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
