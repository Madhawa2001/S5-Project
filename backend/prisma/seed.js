// prisma/seed.js
import { PrismaClient } from "@prisma/client";
import { withOptimize } from "@prisma/extension-optimize";
import bcrypt from "bcrypt";

// const prisma = new PrismaClient();

const prisma = new PrismaClient().$extends(
  withOptimize({ apiKey: process.env.OPTIMIZE_API_KEY })
);

async function main() {
  // Seed roles
  await prisma.role.createMany({
    data: [
      { name: "doctor" },
      { name: "admin" },
      { name: "nurse" },
      { name: "unauthorized" },
    ],
    skipDuplicates: true,
  });

  // Create initial admin (only runs once)
  const hashed = await bcrypt.hash("Admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
      email: "admin@gmail.com",
      password: hashed,
      name: "Super Admin",
      isActive: true,
      roles: {
        create: [
          {
            role: { connect: { name: "admin" } },
          },
        ],
      },
    },
  });

  console.log("✅ Seeded roles and initial admin:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
