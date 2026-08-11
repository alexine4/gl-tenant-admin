import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "acme" },
    update: {},
    create: {
      name: "Acme Inc.",
      slug: "acme",
      branding: { create: {} },
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@acme.test" },
    update: {},
    create: {
      email: "admin@acme.test",
      displayName: "Acme Admin",
      passwordHash: await bcrypt.hash("password123", 10),
    },
  });

  await prisma.tenantMembership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: admin.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: admin.id,
      role: "TenantAdmin",
      status: "Active",
    },
  });

  console.log("Seeded tenant 'acme' with TenantAdmin admin@acme.test / password123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
