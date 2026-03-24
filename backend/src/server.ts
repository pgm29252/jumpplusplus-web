import app from "./app";
import { prisma } from "./lib/prisma";

const PORT = process.env.PORT || 4000;

async function main() {
  await prisma.$connect();
  console.log("✅ Database connected");

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📄 Health: http://localhost:${PORT}/health`);
  });
}

main().catch(async (err) => {
  console.error("❌ Failed to start server:", err);
  await prisma.$disconnect();
  process.exit(1);
});
