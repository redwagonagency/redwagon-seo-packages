import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "joe@redwagon.agency";
  const password = "Jojo123$";
  const name = "Joe";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Update role to SUPERADMIN and ensure password is correct
    const hash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { email },
      data: { role: "SUPERADMIN", password: hash, name },
    });
    console.log("✓ Updated existing user to SUPERADMIN:", email);
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hash,
      role: "SUPERADMIN",
    },
  });

  // Create a tenant for this user
  const tenant = await prisma.tenant.create({
    data: {
      name: "Red Wagon Agency",
      slug: "redwagon-agency",
      plan: "ENTERPRISE",
    },
  });

  await prisma.tenantMember.create({
    data: {
      userId: user.id,
      tenantId: tenant.id,
      role: "OWNER",
    },
  });

  console.log("✓ Created SUPERADMIN user:", email);
  console.log("✓ Created tenant: Red Wagon Agency");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
