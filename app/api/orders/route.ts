import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildOrderNumber } from "@/lib/utils";
import { z } from "zod";
import { DELIVERY_MODES, getDeliveryPricing } from "@/lib/delivery";

const orderItemSchema = z
  .object({
    productId: z.string().min(1),
    variant: z.string().trim().max(120).optional().nullable(),
    quantity: z.number().int().min(1).max(99),
  })
  .strict();

const orderSchema = z
  .object({
    customerName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(6).max(30),
    email: z.string().trim().email().max(160).optional().or(z.literal("")),
    wilaya: z.string().trim().min(2).max(80),
    commune: z.string().trim().min(2).max(100),
    address: z.string().trim().max(500).optional().or(z.literal("")),
    note: z.string().trim().max(1000).optional().or(z.literal("")),
    source: z.enum(["instagram", "facebook", "tiktok", "whatsapp", "direct"]).optional(),
    deliveryMode: z.enum(DELIVERY_MODES),
    items: z.array(orderItemSchema).min(1).max(50),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.deliveryMode === "HOME" && (!value.address || value.address.trim().length < 5)) {
      ctx.addIssue({
        code: "custom",
        path: ["address"],
        message: "Une adresse complète est requise pour la livraison à domicile.",
      });
    }
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
      return NextResponse.json(
        { error: "Vérifiez les informations de livraison. Une adresse complète est requise pour la livraison à domicile." },
        { status: 400 },
      );
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

      const delivery = await getDeliveryPricing(tx, body.wilaya, body.deliveryMode);
      const shippingFee = delivery.shippingFee;
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
          address: body.address?.trim() ?? "",
          note: body.note || null,
          source: body.source ?? "direct",
          deliveryMode: body.deliveryMode,
          paymentMethod: "COD",
          items: { create: orderItemsData },
          payment: { create: { method: "COD", status: "PENDING", reference: `PAY-${orderNumber}` } },
        },
        include: { items: true },
      });
      return order;
    });

    return NextResponse.json({
      ok: true,
      order: {
        number: order.number,
        status: order.status,
        deliveryMode: order.deliveryMode,
        shippingFee: order.shippingFee,
        subtotal: order.subtotal,
        total: order.total,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("OUT_OF_STOCK:")) {
      return NextResponse.json({ error: `Stock insuffisant pour ${message.slice("OUT_OF_STOCK:".length)}.` }, { status: 409 });
    }
    if (message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "Un produit de votre panier n’est plus disponible." }, { status: 400 });
    }
    if (message === "DELIVERY_WILAYA_UNAVAILABLE") {
      return NextResponse.json(
        { error: "Cette wilaya n’est plus disponible à la livraison. Choisissez une autre wilaya." },
        { status: 409 },
      );
    }
    if (message === "DELIVERY_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Les tarifs de livraison ne sont pas encore configurés par l’administrateur." },
        { status: 503 },
      );
    }
    console.error("Guest order creation failed", error);
    return NextResponse.json({ error: "Impossible d’enregistrer la commande." }, { status: 500 });
  }
}
