import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { DELIVERY_MODES, getDeliveryPricing } from "@/lib/delivery";

export const dynamic = "force-dynamic";

const schema = z.object({
  wilaya: z.string().trim().min(2).max(80),
  mode: z.enum(DELIVERY_MODES).default("OFFICE"),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = schema.safeParse({
    wilaya: url.searchParams.get("wilaya"),
    mode: url.searchParams.get("mode") ?? "OFFICE",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Mode de livraison invalide." }, { status: 400 });
  }

  try {
    const pricing = await prisma.$transaction((tx) =>
      getDeliveryPricing(tx, parsed.data.wilaya, parsed.data.mode),
    );
    return NextResponse.json(pricing, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DELIVERY_WILAYA_UNAVAILABLE") {
      return NextResponse.json(
        { error: "Cette wilaya n’est plus disponible à la livraison." },
        { status: 409 },
      );
    }
    if (error instanceof Error && error.message === "DELIVERY_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Les tarifs de livraison ne sont pas encore configurés par l’administrateur." },
        { status: 503 },
      );
    }
    console.error("Delivery pricing lookup failed", error);
    return NextResponse.json({ error: "Impossible de récupérer les tarifs de livraison." }, { status: 500 });
  }
}
