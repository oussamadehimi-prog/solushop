import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminOrders } from "@/components/admin-orders";
import { AdminOrderDeleteButton } from "@/components/admin-order-delete-button";
import { deliveryModeLabel } from "@/lib/delivery-config";
import { orderStatusLabel } from "@/lib/order-status";
import { formatCurrency } from "@/lib/utils";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!order) notFound();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Commande</p>
          <h1 className="text-3xl font-black">{order.number}</h1>
        </div>
        <AdminOrderDeleteButton
          orderId={order.id}
          orderNumber={order.number}
          redirectTo={`/admin/orders?deleted=${encodeURIComponent(order.number)}`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="font-bold">Coordonnées</h2>
          <p className="mt-3">
            {order.customerName}
            <br />
            {order.phone}
            <br />
            {order.commune}, {order.wilaya}
          </p>
          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Mode de livraison : {deliveryModeLabel(order.deliveryMode)}</p>
            <p>Frais appliqués : {formatCurrency(order.shippingFee)}</p>
            {order.deliveryMode === "OFFICE" ? (
              <p className="mt-2">Retrait au bureau de livraison ({order.commune}, {order.wilaya}).</p>
            ) : order.address ? (
              <p className="mt-2">Adresse : {order.address}</p>
            ) : null}
          </div>
          <p className="mt-3 text-sm text-slate-500">Source : {order.source ?? "direct"}</p>
          {order.note && <p className="mt-3 text-sm text-slate-500">Note : {order.note}</p>}
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="font-bold">Articles</h2>
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between border-b py-3 last:border-0">
              <span>{item.product.name} × {item.quantity}</span>
              <span>{formatCurrency(item.total)}</span>
            </div>
          ))}
          <div className="mt-4 space-y-2 border-t pt-4 text-sm text-slate-600">
            <div className="flex justify-between"><span>Sous-total</span><span>{formatCurrency(order.subtotal)}</span></div>
            <div className="flex justify-between"><span>Livraison ({deliveryModeLabel(order.deliveryMode)})</span><span>{formatCurrency(order.shippingFee)}</span></div>
            <div className="flex justify-between"><span>Réduction</span><span>{formatCurrency(order.discount)}</span></div>
            <div className="flex justify-between border-t pt-3 text-xl font-black text-slate-900"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border bg-white p-6 shadow-sm">
        <p className="mb-3 font-bold">Workflow : {orderStatusLabel(order.status)}</p>
        <AdminOrders
          initialOrders={[
            {
              ...order,
              items: order.items.map((item) => ({
                id: item.id,
                product: { name: item.product.name },
                quantity: item.quantity,
              })),
            },
          ]}
        />
      </div>
    </>
  );
}
