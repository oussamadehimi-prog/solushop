"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { FormEvent, useState } from "react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const shippingFee = 400;
  const total = subtotal + shippingFee;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProcessing(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = {
      customerName: form.get("customerName"),
      phone: form.get("phone"),
      email: form.get("email"),
      wilaya: form.get("wilaya"),
      commune: form.get("commune"),
      address: form.get("address"),
      note: form.get("note"),
      source: items.find((item) => item.source)?.source,
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        variant: item.variant,
        quantity: item.quantity,
      })),
    };

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setProcessing(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Une erreur est survenue lors du paiement.");
      return;
    }

    const data = await response.json();
    clear();
    const phone = String(form.get("phone") || "");
    router.push(`/order-confirmation?number=${encodeURIComponent(data.order.number)}&phone=${encodeURIComponent(phone)}`);
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-3xl font-black text-slate-900">Panier vide</h1>
        <p className="mt-4 text-slate-600">Ajouter des produits avant de passer la commande.</p>
        <Link href="/products" className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 font-semibold text-white">Voir les produits</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Checkout</p>
        <h1 className="text-3xl font-black text-slate-900">Finaliser ma commande</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Informations client</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">Nom et prénom</label>
                <input required name="customerName" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Téléphone</label>
                <input required name="phone" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Email (facultatif)</label>
                <input type="email" name="email" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Wilaya</label>
                <select required name="wilaya" defaultValue="Alger" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none">
                  <option value="Alger">Alger</option>
                  <option value="Bouira">Bouira</option>
                  <option value="Blida">Blida</option>
                  <option value="Oran">Oran</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Commune</label>
                <input required name="commune" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Adresse</label>
                <textarea required name="address" rows={3} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Remarque</label>
                <textarea name="note" rows={2} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Méthode de paiement</h2>
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Paiement à la livraison (Cash on Delivery / COD)
            </div>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Résumé de commande</h2>
          <div className="mt-5 space-y-3">
            {items.map((item) => (
              <div key={`${item.productId}-${item.variant ?? "default"}`} className="flex items-center justify-between gap-4 text-sm text-slate-600">
                <span>{item.name} x {item.quantity}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3 border-t border-slate-200 pt-4 text-sm text-slate-600">
            <div className="flex justify-between"><span>Sous-total</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span>Livraison</span><span>{formatCurrency(shippingFee)}</span></div>
            <div className="flex justify-between"><span>Réduction</span><span>{formatCurrency(0)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>
          <button type="submit" formAction="" disabled={processing} className="mt-6 w-full rounded-full bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-60">
            {processing ? "Validation..." : "Valider la commande"}
          </button>
        </aside>
      </form>
    </div>
  );
}
