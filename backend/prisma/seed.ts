import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  const userPassword = await bcrypt.hash("User@123456", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@jumpplusplus.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@jumpplusplus.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const moderator = await prisma.user.upsert({
    where: { email: "moderator@jumpplusplus.com" },
    update: {},
    create: {
      name: "Moderator",
      email: "moderator@jumpplusplus.com",
      password: userPassword,
      role: "MODERATOR",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@jumpplusplus.com" },
    update: {},
    create: {
      name: "Regular User",
      email: "user@jumpplusplus.com",
      password: userPassword,
      role: "USER",
    },
  });

  console.log("✅ Seeded users:");
  console.log(`  Admin:     ${admin.email}`);
  console.log(`  Moderator: ${moderator.email}`);
  console.log(`  User:      ${user.email}`);
  console.log("\n📝 Default passwords:");
  console.log("  Admin:     Admin@123456");
  console.log("  Others:    User@123456");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
