"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

type AdminOrder = {
  id: string;
  number: string;
  status: string;
  customerName: string;
  phone: string;
  wilaya: string;
  commune: string;
  total: number;
  createdAt: Date;
  items: Array<{ id: string; quantity: number; product: { name: string } }>;
};

const statuses = ["PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "REJECTED"];

export function AdminOrders({ initialOrders }: { initialOrders: AdminOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [error, setError] = useState("");

  async function updateStatus(orderId: string, status: string) {
    setError("");
    const rejectionReason = status === "REJECTED" ? window.prompt("Raison du refus")?.trim() : undefined;
    if (status === "REJECTED" && !rejectionReason) return;
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status, rejectionReason }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Impossible de modifier le statut.");
      return;
    }
    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status: data.order.status } : order));
  }

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Gestion</p><h2 className="text-2xl font-bold text-slate-900">Commandes récentes</h2></div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>
      <div className="mt-5 space-y-4">
        {orders.length === 0 ? <p className="text-slate-500">Aucune commande.</p> : orders.map((order) => (
          <div key={order.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-bold text-slate-900">#{order.number}</p>
                <p className="text-sm text-slate-600">{order.customerName} · {order.phone}</p>
                <p className="text-sm text-slate-500">{order.commune}, {order.wilaya} · {new Date(order.createdAt).toLocaleDateString("fr-FR")}</p>
                <p className="mt-2 text-sm text-slate-600">{order.items.map((item) => `${item.product.name} x ${item.quantity}`).join(", ")}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900">{formatCurrency(order.total)}</span>
                <select value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold">
                  {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
