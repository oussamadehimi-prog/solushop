"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminOrderDeleteButton } from "@/components/admin-order-delete-button";
import { deliveryModeLabel } from "@/lib/delivery-config";
import { orderStatusLabel } from "@/lib/order-status";
import { formatCurrency } from "@/lib/utils";

type OrderRow = {
  id: string;
  number: string;
  customerName: string;
  phone: string;
  deliveryMode: string | null;
  commune: string;
  wilaya: string;
  shippingFee: number;
  total: number;
  status: string;
  createdAt: Date;
  items: Array<{ id: string }>;
};

type Message = { type: "success" | "error"; text: string };

export function AdminOrdersTable({ initialOrders }: { initialOrders: OrderRow[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [message, setMessage] = useState<Message | null>(null);

  function handleDeleted(order: OrderRow) {
    setOrders((current) => current.filter((item) => item.id !== order.id));
    setMessage({ type: "success", text: `La commande ${order.number} a été supprimée avec succès.` });
    router.refresh();
  }

  return (
    <>
      {message && (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      )}
      <div className="overflow-x-auto rounded-3xl border bg-white p-5 shadow-sm">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="border-b text-xs uppercase text-slate-400">
            <tr>
              <th className="p-3">Commande</th>
              <th className="p-3">Client</th>
              <th className="p-3">Livraison</th>
              <th className="p-3">Frais</th>
              <th className="p-3">Total</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b last:border-0">
                <td className="p-3">
                  <Link className="font-semibold underline" href={`/admin/orders/${order.id}`}>{order.number}</Link>
                  <p className="text-xs text-slate-500">{order.items.length} article(s)</p>
                </td>
                <td className="p-3">
                  {order.customerName}
                  <p className="text-xs text-slate-500">{order.phone}</p>
                </td>
                <td className="p-3">
                  {deliveryModeLabel(order.deliveryMode)}
                  <p className="text-xs text-slate-500">{order.commune}, {order.wilaya}</p>
                </td>
                <td className="p-3">{formatCurrency(order.shippingFee)}</td>
                <td className="p-3 font-semibold">{formatCurrency(order.total)}</td>
                <td className="p-3">
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {orderStatusLabel(order.status)}
                  </span>
                </td>
                <td className="p-3">{order.createdAt.toLocaleDateString("fr-FR")}</td>
                <td className="p-3">
                  <AdminOrderDeleteButton orderId={order.id} orderNumber={order.number} onDeleted={() => handleDeleted(order)} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-500">Aucune commande.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
