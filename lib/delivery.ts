import { Prisma } from "@prisma/client";
import {
  DELIVERY_MODES,
  type DeliveryMode,
  type DeliveryPricing,
  type DeliveryWilayaList,
} from "@/lib/delivery-config";

export { DELIVERY_MODES };
export type { DeliveryMode, DeliveryPricing, DeliveryWilayaList };

type Transaction = Prisma.TransactionClient;

function isConfiguredAmount(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export async function listAvailableWilayas(tx: Transaction): Promise<DeliveryWilayaList> {
  const [rates, settings] = await Promise.all([
    tx.shippingRate.findMany({
      where: { active: true },
      orderBy: { wilaya: "asc" },
    }),
    tx.deliverySetting.findUnique({ where: { id: "default" } }),
  ]);

  const homeSurcharge = settings?.homeSurcharge;
  if (!isConfiguredAmount(homeSurcharge)) {
    return { wilayas: [], configured: false };
  }

  const wilayas = rates
    .filter((rate) => isConfiguredAmount(rate.cost))
    .map((rate) => ({
      id: rate.id,
      wilaya: rate.wilaya,
      officeFee: rate.cost,
      homeSurcharge,
    }));

  return { wilayas, configured: true };
}

export async function getDeliveryPricing(
  tx: Transaction,
  wilaya: string,
  mode: DeliveryMode,
): Promise<DeliveryPricing> {
  const normalizedWilaya = wilaya.trim();
  const [rate, settings] = await Promise.all([
    tx.shippingRate.findFirst({
      where: { wilaya: { equals: normalizedWilaya, mode: "insensitive" }, active: true },
      orderBy: { createdAt: "desc" },
    }),
    tx.deliverySetting.findUnique({ where: { id: "default" } }),
  ]);

  if (!rate) {
    throw new Error("DELIVERY_WILAYA_UNAVAILABLE");
  }

  const officeFee = rate.cost;
  const homeSurcharge = settings?.homeSurcharge;

  if (!isConfiguredAmount(officeFee) || !isConfiguredAmount(homeSurcharge)) {
    throw new Error("DELIVERY_NOT_CONFIGURED");
  }

  return {
    officeFee,
    homeSurcharge,
    shippingFee: mode === "HOME" ? officeFee + homeSurcharge : officeFee,
  };
}
