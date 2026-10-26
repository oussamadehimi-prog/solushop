import { Prisma } from "@prisma/client";

type Transaction = Prisma.TransactionClient;

const TERMINAL_STATUSES = new Set(["CANCELLED", "REJECTED"]);

export async function restoreOrderStockIfNeeded(tx: Transaction, orderId: string) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: { select: { productId: true, quantity: true } } },
  });

  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.stockRestoredAt || !TERMINAL_STATUSES.has(order.status)) return false;

  for (const item of order.items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }

  await tx.order.update({
    where: { id: order.id },
    data: { stockRestoredAt: new Date() },
  });
  return true;
}

export { TERMINAL_STATUSES };
