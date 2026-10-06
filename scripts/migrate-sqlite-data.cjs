/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const mode = process.argv[2];
const exportPath = path.resolve(__dirname, "../prisma/sqlite-data.export.json");

const models = [
  "user",
  "address",
  "category",
  "product",
  "productImage",
  "productVariant",
  "cart",
  "cartItem",
  "order",
  "orderItem",
  "payment",
  "promotion",
  "coupon",
  "review",
  "shippingRate",
  "notification",
  "campaignEvent",
];

function reviveDates(value) {
  if (Array.isArray(value)) return value.map(reviveDates);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, reviveDates(entry)]));
  }
  if (typeof value === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)) {
    return new Date(value);
  }
  return value;
}

async function exportData(prisma) {
  const data = {};
  for (const model of models) {
    data[model] = await prisma[model].findMany();
  }
  fs.writeFileSync(exportPath, JSON.stringify(data, null, 2), "utf8");
  console.log(`Exported ${models.reduce((total, model) => total + data[model].length, 0)} records to ${exportPath}`);
}

async function importData(prisma) {
  if (!fs.existsSync(exportPath)) {
    throw new Error(`Export file not found: ${exportPath}`);
  }

  const data = reviveDates(JSON.parse(fs.readFileSync(exportPath, "utf8")));
  await prisma.$transaction(async (tx) => {
    for (const model of models) {
      const records = data[model] ?? [];
      if (records.length > 0) {
        await tx[model].createMany({ data: records, skipDuplicates: true });
      }
    }
  });

  console.log(`Imported ${models.reduce((total, model) => total + (data[model]?.length ?? 0), 0)} records`);
}

async function main() {
  if (!["export", "import"].includes(mode)) {
    throw new Error("Usage: node scripts/migrate-sqlite-data.cjs export|import");
  }

  const prisma = new PrismaClient();
  try {
    if (mode === "export") await exportData(prisma);
    else await importData(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
