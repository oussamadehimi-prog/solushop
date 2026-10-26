export const DELIVERY_MODES = ["OFFICE", "HOME"] as const;
export type DeliveryMode = (typeof DELIVERY_MODES)[number];

export const DELIVERY_PREF_KEY = "shop_delivery_preference";

export type DeliveryPricing = {
  officeFee: number;
  homeSurcharge: number;
  shippingFee: number;
};

export type DeliveryWilaya = {
  id: string;
  wilaya: string;
  officeFee: number;
  homeSurcharge: number;
};

export type DeliveryWilayaList = {
  wilayas: DeliveryWilaya[];
  configured: boolean;
};

export function deliveryModeLabel(mode: string | null | undefined) {
  if (mode === "HOME") return "Domicile";
  if (mode === "OFFICE") return "Bureau";
  return "Non spécifié";
}

export function readDeliveryPreference(): { wilaya: string; mode: DeliveryMode } | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(DELIVERY_PREF_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as { wilaya?: unknown; mode?: unknown };
    const wilaya =
      typeof parsed.wilaya === "string" && parsed.wilaya.trim().length > 0 ? parsed.wilaya.trim() : undefined;
    const mode = DELIVERY_MODES.includes(parsed.mode as DeliveryMode) ? (parsed.mode as DeliveryMode) : undefined;

    return wilaya && mode ? { wilaya, mode } : null;
  } catch {
    return null;
  }
}

export function saveDeliveryPreference(wilaya: string, mode: DeliveryMode) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(DELIVERY_PREF_KEY, JSON.stringify({ wilaya, mode }));
  } catch {
    // Ignore storage failures (private browsing, quota, etc.).
  }
}
