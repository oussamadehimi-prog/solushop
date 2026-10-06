import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const trackingSchema = z.object({
  number: z.string().trim().min(8).max(80),
  phone: z.string().trim().min(6).max(30),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = trackingSchema.safeParse({
    number: url.searchParams.get("number"),
    phone: url.searchParams.get("phone"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Numéro de commande et téléphone requis." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { number: parsed.data.number, phone: parsed.data.phone },
    select: {
      number: true,
      status: true,
      customerName: true,
      phone: true,
      wilaya: true,
      commune: true,
      address: true,
      subtotal: true,
      shippingFee: true,
      discount: true,
      total: true,
      createdAt: true,
      items: { select: { quantity: true, price: true, total: true, variant: true, product: { select: { name: true } } } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable ou informations incorrectes." }, { status: 404 });
  }

  return NextResponse.json({ order });
}
