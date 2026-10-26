import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { restoreOrderStockIfNeeded } from "@/lib/order-stock";

const schema = z.object({
  number: z.string().trim().min(1),
  phone: z.string().trim().min(6).max(30),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Informations de commande invalides." }, { status: 400 });

  try {
    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findFirst({
        where: { number: parsed.data.number, phone: parsed.data.phone },
        select: { id: true, status: true },
      });
      if (!current) throw new Error("ORDER_NOT_FOUND");
      if (current.status !== "PENDING") throw new Error("ORDER_NOT_CANCELLABLE");

      await tx.order.update({
        where: { id: current.id },
        data: { status: "CANCELLED" },
      });
      await restoreOrderStockIfNeeded(tx, current.id);
      return tx.order.findUniqueOrThrow({ where: { id: current.id }, select: { number: true, status: true } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ ok: true, order });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    if (error instanceof Error && error.message === "ORDER_NOT_CANCELLABLE") return NextResponse.json({ error: "Cette commande ne peut plus être annulée." }, { status: 409 });
    console.error("Order cancellation failed", error);
    return NextResponse.json({ error: "Impossible d’annuler la commande." }, { status: 500 });
  }
}
