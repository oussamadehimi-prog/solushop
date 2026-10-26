ALTER TABLE "Product" DROP COLUMN "sku";

ALTER TABLE "Order"
  ADD COLUMN "deliveryMode" TEXT,
  ADD COLUMN "stockRestoredAt" TIMESTAMP(3);

CREATE TABLE "DeliverySetting" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "officeFee" DOUBLE PRECISION,
  "homeSurcharge" DOUBLE PRECISION,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeliverySetting_pkey" PRIMARY KEY ("id")
);
