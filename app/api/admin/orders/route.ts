import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getAdminSession } from "@/lib/auth";
import { restoreOrderStockIfNeeded, TERMINAL_STATUSES } from "@/lib/order-stock";
import { z } from "zod";

const statusSchema = z.enum(["PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "REJECTED"]);

const deleteSchema = z.object({ orderId: z.string().min(1) });

const FULFILLED_STATUSES = new Set(["SHIPPED", "DELIVERED"]);

export async function DELETE(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Commande invalide." }, { status: 400 });

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: parsed.data.orderId },
        include: { items: { select: { productId: true, quantity: true } } },
      });
      if (!order) throw new Error("ORDER_NOT_FOUND");

      const shouldRestoreStock = !order.stockRestoredAt && !FULFILLED_STATUSES.has(order.status);
      if (shouldRestoreStock) {
        for (const item of order.items) {
          await tx.product.updateMany({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      await tx.payment.deleteMany({ where: { orderId: order.id } });
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.order.delete({ where: { id: order.id } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") {
      return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    }
    console.error("Admin order deletion failed", error);
    return NextResponse.json({ error: "Impossible de supprimer la commande." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });

  const body = await request.json();
  const parsed = z.object({ orderId: z.string().min(1), status: statusSchema, rejectionReason: z.string().trim().max(500).optional() }).superRefine((value, ctx) => {
    if (value.status === "REJECTED" && !value.rejectionReason) ctx.addIssue({ code: "custom", path: ["rejectionReason"], message: "Une raison est requise." });
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Statut invalide." }, { status: 400 });

  try {
    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: parsed.data.orderId }, select: { status: true } });
      if (!current) throw new Error("ORDER_NOT_FOUND");
      if (TERMINAL_STATUSES.has(current.status) && current.status !== parsed.data.status) {
        throw new Error("ORDER_TERMINAL");
      }

      const updated = await tx.order.update({
        where: { id: parsed.data.orderId },
        data: { status: parsed.data.status, rejectionReason: parsed.data.status === "REJECTED" ? parsed.data.rejectionReason : null },
        select: { id: true, number: true, status: true },
      });
      if (TERMINAL_STATUSES.has(parsed.data.status)) {
        await restoreOrderStockIfNeeded(tx, parsed.data.orderId);
      }
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    if (error instanceof Error && error.message === "ORDER_TERMINAL") return NextResponse.json({ error: "Cette commande est déjà annulée ou refusée." }, { status: 409 });
    console.error("Admin order status update failed", error);
    return NextResponse.json({ error: "Impossible de modifier la commande." }, { status: 500 });
  }
}
