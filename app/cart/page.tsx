"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import {
  DELIVERY_MODES,
  readDeliveryPreference,
  saveDeliveryPreference,
  type DeliveryMode,
  type DeliveryPricing,
  type DeliveryWilaya,
  type DeliveryWilayaList,
} from "@/lib/delivery-config";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const { items, subtotal, removeItem, updateQuantity, clear } = useCart();
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("OFFICE");
  const [wilaya, setWilaya] = useState("");
  const [wilayas, setWilayas] = useState<DeliveryWilaya[]>([]);
  const [wilayasError, setWilayasError] = useState("");
  const [wilayasLoaded, setWilayasLoaded] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<{ key: string; pricing: DeliveryPricing } | null>(null);
  const [deliveryFailure, setDeliveryFailure] = useState<{ key: string; message: string } | null>(null);
  const deliveryKey = `${wilaya}|${deliveryMode}`;
  const delivery = deliveryResult?.key === deliveryKey ? deliveryResult.pricing : null;
  const deliveryError = deliveryFailure?.key === deliveryKey ? deliveryFailure.message : "";
  const deliveryLoading = Boolean(wilaya) && !delivery && !deliveryError;

  useEffect(() => {
    let active = true;

    fetch("/api/delivery/wilayas", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Wilayas de livraison indisponibles.");
        return data as Partial<DeliveryWilayaList>;
      })
      .then((data) => {
        if (!active) return;

        const list = Array.isArray(data.wilayas) ? data.wilayas : [];
        const preference = readDeliveryPreference();
        const preferred = preference
          ? list.find((entry) => entry.wilaya.toLowerCase() === preference.wilaya.toLowerCase())
          : undefined;

        setWilayas(list);
        setWilaya(preferred?.wilaya ?? list[0]?.wilaya ?? "");
        if (preference) setDeliveryMode(preference.mode);
        if (!data.configured) {
          setWilayasError("Les tarifs de livraison ne sont pas encore configurés par l’administrateur.");
        } else if (list.length === 0) {
          setWilayasError("Aucune wilaya n’est actuellement disponible pour la livraison.");
        }
        setWilayasLoaded(true);
      })
      .catch((reason: unknown) => {
        if (active) {
          setWilayas([]);
          setWilayasError(reason instanceof Error ? reason.message : "Wilayas de livraison indisponibles.");
          setWilayasLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!wilayasLoaded || !wilaya) return;

    saveDeliveryPreference(wilaya, deliveryMode);
    let active = true;

    fetch(`/api/delivery?wilaya=${encodeURIComponent(wilaya)}&mode=${deliveryMode}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Tarifs de livraison indisponibles.");
        if (active) {
          setDeliveryResult({ key: deliveryKey, pricing: data as DeliveryPricing });
          setDeliveryFailure((current) => (current?.key === deliveryKey ? null : current));
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setDeliveryResult((current) => (current?.key === deliveryKey ? null : current));
          setDeliveryFailure({
            key: deliveryKey,
            message: reason instanceof Error ? reason.message : "Tarifs de livraison indisponibles.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [deliveryKey, deliveryMode, wilaya, wilayasLoaded]);

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

          <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">Mode de livraison</p>
            <label className="grid gap-1 text-xs font-medium text-slate-600">
              Wilaya
              <select
                value={wilaya}
                disabled={!wilayasLoaded || wilayas.length === 0}
                onChange={(event) => setWilaya(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none disabled:opacity-60"
              >
                {wilayas.length === 0 ? (
                  <option value="">{wilayasLoaded ? "Aucune wilaya disponible" : "Chargement…"}</option>
                ) : (
                  wilayas.map((entry) => (
                    <option key={entry.id} value={entry.wilaya}>{entry.wilaya}</option>
                  ))
                )}
              </select>
              {wilayasError && <span className="text-xs text-rose-600">{wilayasError}</span>}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DELIVERY_MODES.map((mode) => (
                <label
                  key={mode}
                  className={`cursor-pointer rounded-xl border p-2 text-center text-sm ${deliveryMode === mode ? "border-orange-500 bg-orange-50 text-slate-900" : "border-slate-200 bg-white text-slate-600"}`}
                >
                  <input
                    type="radio"
                    name="cartDeliveryMode"
                    checked={deliveryMode === mode}
                    onChange={() => setDeliveryMode(mode)}
                    className="mr-1"
                  />
                  {mode === "HOME" ? "Domicile" : "Bureau"}
                </label>
              ))}
            </div>
            {deliveryLoading && <p className="text-xs text-slate-500">Calcul des frais de livraison…</p>}
            {!deliveryLoading && delivery && (
              <div className="space-y-1 text-xs text-slate-600">
                <p>Frais de livraison au bureau : {formatCurrency(delivery.officeFee)}</p>
                {deliveryMode === "HOME" && <p>Supplément à domicile : {formatCurrency(delivery.homeSurcharge)}</p>}
                <p className="font-semibold text-slate-900">Frais appliqués : {formatCurrency(delivery.shippingFee)}</p>
              </div>
            )}
            {!deliveryLoading && deliveryError && <p className="text-xs text-rose-600">{deliveryError}</p>}
          </div>

          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex justify-between"><span>Sous-total</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span>Livraison</span><span>{delivery ? formatCurrency(delivery.shippingFee) : "—"}</span></div>
            <div className="flex justify-between"><span>Réduction</span><span>{formatCurrency(0)}</span></div>
            <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-base font-bold text-slate-900"><span>Total</span><span>{delivery ? formatCurrency(subtotal + delivery.shippingFee) : "—"}</span></div>
          </div>

          <div className="mt-6 space-y-3">
            <Link href="/products" className="block rounded-full border border-slate-200 px-4 py-3 text-center font-medium text-slate-900">
              Continuer mes achats
            </Link>
            <button type="button" onClick={clear} className="block w-full rounded-full border border-rose-200 px-4 py-3 font-medium text-rose-600">
              Vider le panier
            </button>
            {delivery ? (
              <Link href="/checkout" className="block rounded-full bg-slate-900 px-4 py-3 text-center font-medium text-white">
                Passer la commande
              </Link>
            ) : (
              <span className="block cursor-not-allowed rounded-full bg-slate-300 px-4 py-3 text-center font-medium text-white">
                Passer la commande
              </span>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
