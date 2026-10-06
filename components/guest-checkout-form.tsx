"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: Array<{ url: string }>;
};

export function GuestCheckoutForm({
  product,
  source,
  onClose,
}: {
  product: Product;
  source?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const shippingFee = 400;
  const total = product.price * quantity + shippingFee;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProcessing(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.get("customerName"),
          phone: form.get("phone"),
          wilaya: form.get("wilaya"),
          commune: form.get("commune"),
          address: form.get("address"),
          note: form.get("note"),
          source,
          items: [{ productId: product.id, quantity }],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Impossible d’enregistrer la commande.");
        return;
      }
      router.push(`/order-confirmation?number=${encodeURIComponent(data.order.number)}&phone=${encodeURIComponent(String(form.get("phone") || ""))}`);
    } catch {
      setError("Une erreur réseau est survenue. Réessayez.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/50 px-4 py-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Achat invité</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Finaliser votre commande</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border px-3 py-1 text-slate-500" aria-label="Fermer">×</button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="space-y-4">
            <p className="rounded-2xl bg-slate-50 p-4 font-semibold text-slate-900">{product.name}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium text-slate-700">Nom et prénom<input required name="customerName" className="rounded-2xl border bg-slate-50 px-4 py-3 outline-none" /></label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">Numéro de téléphone<input required name="phone" type="tel" className="rounded-2xl border bg-slate-50 px-4 py-3 outline-none" /></label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">Wilaya<select required name="wilaya" defaultValue="Alger" className="rounded-2xl border bg-slate-50 px-4 py-3 outline-none"><option>Alger</option><option>Blida</option><option>Bouira</option><option>Oran</option></select></label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">Commune<input required name="commune" className="rounded-2xl border bg-slate-50 px-4 py-3 outline-none" /></label>
              <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">Adresse de livraison<textarea required name="address" rows={3} className="rounded-2xl border bg-slate-50 px-4 py-3 outline-none" /></label>
              <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">Remarque (facultatif)<textarea name="note" rows={2} className="rounded-2xl border bg-slate-50 px-4 py-3 outline-none" /></label>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border bg-slate-50 p-5">
            <h3 className="font-bold text-slate-900">Résumé</h3>
            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="text-sm text-slate-600">Quantité</span>
              <div className="flex items-center gap-2"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-8 w-8 rounded-full border">−</button><span className="w-6 text-center font-semibold">{quantity}</span><button type="button" onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))} className="h-8 w-8 rounded-full border">+</button></div>
            </div>
            <div className="mt-5 space-y-3 border-t pt-4 text-sm text-slate-600">
              <div className="flex justify-between"><span>Prix unitaire</span><span>{formatCurrency(product.price)}</span></div>
              <div className="flex justify-between"><span>Produit</span><span>{formatCurrency(product.price * quantity)}</span></div>
              <div className="flex justify-between"><span>Livraison</span><span>{formatCurrency(shippingFee)}</span></div>
              <div className="flex justify-between border-t pt-3 text-base font-bold text-slate-900"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>
            {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
            <button type="submit" disabled={processing} className="mt-5 w-full rounded-full bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-60">{processing ? "Validation..." : "Confirmer la commande"}</button>
          </aside>
        </form>
      </div>
    </div>
  );
}
