import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildOrderNumber } from "@/lib/utils";
import { z } from "zod";

const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  wilaya: z.string().trim().min(2).max(80),
  commune: z.string().trim().min(2).max(100),
  address: z.string().trim().min(5).max(500),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
  source: z.enum(["instagram", "facebook", "tiktok", "whatsapp", "direct"]).optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    variant: z.string().trim().max(120).optional().nullable(),
    quantity: z.number().int().min(1).max(99),
  })).min(1).max(50),
});

export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Corps de requête JSON invalide." }, { status: 400 });
    }
    const parsed = orderSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Vérifiez les informations de livraison." }, { status: 400 });
    }

    const body = parsed.data;
    const order = await prisma.$transaction(async (tx) => {
      const orderItemsData: Array<{ productId: string; quantity: number; price: number; total: number; variant: string | null }> = [];
      let subtotal = 0;

      for (const item of body.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || !product.active) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        const updated = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count !== 1) {
          throw new Error(`OUT_OF_STOCK:${product.name}`);
        }

        const price = product.promoPrice ?? product.price;
        const total = price * item.quantity;
        subtotal += total;
        orderItemsData.push({ productId: product.id, quantity: item.quantity, price, total, variant: item.variant ?? null });
      }

      const shippingRate = await tx.shippingRate.findUnique({ where: { wilaya: body.wilaya } });
      const shippingFee = shippingRate?.cost ?? 400;
      const discount = 0;
      const orderNumber = buildOrderNumber();
      const order = await tx.order.create({
        data: {
          number: orderNumber,
          userId: null,
          subtotal,
          shippingFee,
          discount,
          total: subtotal + shippingFee - discount,
          customerName: body.customerName,
          phone: body.phone,
          email: body.email || null,
          wilaya: body.wilaya,
          commune: body.commune,
          address: body.address,
          note: body.note || null,
          source: body.source ?? "direct",
          paymentMethod: "COD",
          items: { create: orderItemsData },
          payment: { create: { method: "COD", status: "PENDING", reference: `PAY-${orderNumber}` } },
        },
        include: { items: true },
      });
      return order;
    });

    return NextResponse.json({ ok: true, order: { number: order.number, status: order.status, total: order.total } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("OUT_OF_STOCK:")) {
      return NextResponse.json({ error: `Stock insuffisant pour ${message.slice("OUT_OF_STOCK:".length)}.` }, { status: 409 });
    }
    if (message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "Un produit de votre panier n’est plus disponible." }, { status: 400 });
    }
    console.error("Guest order creation failed", error);
    return NextResponse.json({ error: "Impossible d’enregistrer la commande." }, { status: 500 });
  }
}
