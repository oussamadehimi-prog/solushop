import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listAvailableWilayas } from "@/lib/delivery";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await prisma.$transaction((tx) => listAvailableWilayas(tx));
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Delivery wilaya lookup failed", error);
    return NextResponse.json({ error: "Impossible de récupérer les wilayas de livraison." }, { status: 500 });
  }
}
