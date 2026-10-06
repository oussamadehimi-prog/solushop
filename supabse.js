const { PrismaClient } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Run this script with your environment file, for example: node --env-file=.env supabse.js",
  );
  process.exitCode = 1;
} else {
  const prisma = new PrismaClient();

  async function testConnection() {
    try {
      await prisma.$queryRaw`SELECT 1 AS connected`;
      console.log("Supabase database connection successful.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Supabase database connection failed:", message);
      process.exitCode = 1;
    } finally {
      await prisma.$disconnect();
    }
  }

  testConnection().catch((error) => {
    console.error("Supabase database connection test failed unexpectedly.");
    process.exitCode = 1;
    prisma.$disconnect().catch(() => {});
  });
}
