const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@shop.com";
  const passwordHash = await hash("admin123", 10);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN" },
    create: {
      name: "Admin Boutique",
      email,
      phone: "+213555000111",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Admin account is ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
