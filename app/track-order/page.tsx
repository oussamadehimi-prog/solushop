"use client";

import { FormEvent, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type TrackedOrder = {
  number: string;
  status: string;
  customerName: string;
  wilaya: string;
  commune: string;
  address: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  createdAt: string;
  items: Array<{ quantity: number; price: number; total: number; variant: string | null; product: { name: string } }>;
};

const statuses = [
  ["PENDING", "En attente"],
  ["CONFIRMED", "Confirmée"],
  ["PREPARING", "En préparation"],
  ["SHIPPED", "Expédiée"],
  ["DELIVERED", "Livrée"],
  ["REJECTED", "Refusée"],
];

export default function TrackOrderPage() {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setOrder(null);
    const response = await fetch(`/api/orders/track?number=${encodeURIComponent(String(form.get("number")))}&phone=${encodeURIComponent(String(form.get("phone")))}`);
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Commande introuvable.");
      return;
    }
    setOrder(data.order);
  }

  const currentIndex = order ? statuses.findIndex(([status]) => status === order.status) : -1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Suivi sécurisé</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Suivre ma commande</h1>
        <p className="mt-3 text-slate-600">Saisissez le numéro de commande et le téléphone utilisés lors de la commande.</p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <input required name="number" placeholder="CMD-2026-..." className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
          <input required name="phone" placeholder="Numéro de téléphone" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
          <button className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white sm:col-span-2">Rechercher</button>
        </form>
        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </div>

      {order && (
        <div className="mt-6 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-sm text-slate-500">Commande</p><h2 className="text-2xl font-black text-slate-900">#{order.number}</h2></div>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${order.status === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>{statuses[currentIndex]?.[1] ?? order.status}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {statuses.map(([status, label], index) => <div key={status} className={`rounded-2xl p-3 text-center text-xs font-semibold ${index <= currentIndex ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"}`}>{label}</div>)}
          </div>
          <div className="space-y-3 border-t border-slate-200 pt-5">
            {order.status === "REJECTED" && <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">Cette commande a été refusée par notre équipe.</p>}
            {order.items.map((item, index) => <div key={`${item.product.name}-${index}`} className="flex justify-between gap-4 text-sm text-slate-600"><span>{item.product.name} x {item.quantity}</span><span>{formatCurrency(item.total)}</span></div>)}
          </div>
          <div className="grid gap-2 border-t border-slate-200 pt-4 text-sm text-slate-600 sm:grid-cols-2">
            <p>Livraison : {order.address}, {order.commune}, {order.wilaya}</p>
            <p className="text-right text-lg font-bold text-slate-900">Total : {formatCurrency(order.total)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
