"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const { items, subtotal, removeItem, updateQuantity, clear } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-3xl font-black text-slate-900">Votre panier est vide</h1>
        <p className="mt-4 text-slate-600">Ajoutez quelques produits pour commencer votre commande.</p>
        <Link href="/products" className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 font-semibold text-white">
          Continuer mes achats
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Panier</p>
        <h1 className="text-3xl font-black text-slate-900">Votre commande</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={`${item.productId}-${item.variant ?? "default"}`} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
              <div className="h-24 w-full overflow-hidden rounded-2xl bg-slate-100 sm:w-24">
                {item.image && <Image src={item.image} alt={item.name} width={200} height={200} className="h-full w-full object-cover" />}
              </div>

              <div className="flex-1">
                <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                {item.variant && <p className="text-sm text-slate-500">Variante: {item.variant}</p>}
                <p className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(item.price)}</p>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => updateQuantity(item.productId, item.variant, -1)} className="rounded-full border border-slate-200 p-2 text-slate-700">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-semibold text-slate-900">{item.quantity}</span>
                <button type="button" onClick={() => updateQuantity(item.productId, item.variant, 1)} className="rounded-full border border-slate-200 p-2 text-slate-700">
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <p className="w-24 text-right font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</p>
                <button type="button" onClick={() => removeItem(item.productId, item.variant)} className="rounded-full border border-rose-200 p-2 text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-bold text-slate-900">Résumé</p>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex justify-between"><span>Sous-total</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span>Livraison</span><span>{formatCurrency(400)}</span></div>
            <div className="flex justify-between"><span>Réduction</span><span>{formatCurrency(0)}</span></div>
            <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-base font-bold text-slate-900"><span>Total</span><span>{formatCurrency(subtotal + 400)}</span></div>
          </div>

          <div className="mt-6 space-y-3">
            <Link href="/products" className="block rounded-full border border-slate-200 px-4 py-3 text-center font-medium text-slate-900">
              Continuer mes achats
            </Link>
            <button type="button" onClick={clear} className="block w-full rounded-full border border-rose-200 px-4 py-3 font-medium text-rose-600">
              Vider le panier
            </button>
            <Link href="/checkout" className="block rounded-full bg-slate-900 px-4 py-3 text-center font-medium text-white">
              Passer la commande
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
