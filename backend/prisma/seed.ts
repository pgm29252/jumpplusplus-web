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

  await prisma.blog.upsert({
    where: { slug: "welcome-to-jumpplusplus-blog" },
    update: {},
    create: {
      title: "Welcome to the JumpPlusPlus Blog",
      slug: "welcome-to-jumpplusplus-blog",
      excerpt:
        "Product updates, event tips, and platform news from the JumpPlusPlus team.",
      content:
        "Welcome to the official JumpPlusPlus blog. In this space, we share platform updates, booking workflow improvements, and ideas for creating better event experiences. Stay tuned for weekly highlights and practical guides.",
      isPublished: true,
      authorId: admin.id,
    },
  });

  await prisma.blog.upsert({
    where: { slug: "how-to-run-smoother-events" },
    update: {},
    create: {
      title: "How to Run Smoother Events",
      slug: "how-to-run-smoother-events",
      excerpt:
        "A quick checklist to reduce booking friction and improve attendee satisfaction.",
      content:
        "Smoother events start with clear schedules, accurate location details, and realistic slot capacity. Keep your event descriptions concise, confirm date ranges before opening bookings, and monitor booking status changes to avoid conflicts.",
      isPublished: true,
      authorId: moderator.id,
    },
  });

  console.log("✅ Seeded sample blogs");
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
