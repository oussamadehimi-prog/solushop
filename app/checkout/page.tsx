"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { FormEvent, useEffect, useState } from "react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
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
  const total = delivery ? subtotal + delivery.shippingFee : null;

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!delivery) {
      setError(deliveryError || "Les frais de livraison ne sont pas encore disponibles.");
      return;
    }

    setProcessing(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = {
      customerName: form.get("customerName"),
      phone: form.get("phone"),
      email: form.get("email"),
      wilaya: form.get("wilaya"),
      commune: form.get("commune"),
      deliveryMode,
      address: form.get("address"),
      note: form.get("note"),
      source: items.find((item) => item.source)?.source,
      items: items.map((item) => ({
        productId: item.productId,
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
                <select required name="wilaya" value={wilaya} disabled={!wilayasLoaded || wilayas.length === 0} onChange={(event) => setWilaya(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none disabled:opacity-60">
                  {wilayas.length === 0 ? (
                    <option value="">{wilayasLoaded ? "Aucune wilaya disponible" : "Chargement…"}</option>
                  ) : (
                    wilayas.map((entry) => <option key={entry.id} value={entry.wilaya}>{entry.wilaya}</option>)
                  )}
                </select>
                {wilayasError && <p className="mt-1 text-xs text-rose-600">{wilayasError}</p>}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Mode de livraison</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {DELIVERY_MODES.map((mode) => (
                    <label key={mode} className={`cursor-pointer rounded-2xl border p-4 ${deliveryMode === mode ? "border-orange-500 bg-orange-50" : "border-slate-200"}`}>
                      <input type="radio" name="deliveryMode" value={mode} checked={deliveryMode === mode} onChange={() => setDeliveryMode(mode)} className="mr-2" />
                      <span className="font-semibold">{mode === "HOME" ? "Livraison à domicile" : "Bureau de livraison"}</span>
                      {delivery && (
                        <span className="mt-1 block text-sm text-slate-600">
                          {formatCurrency(mode === "HOME" ? delivery.officeFee + delivery.homeSurcharge : delivery.officeFee)}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {deliveryLoading && <p className="mt-3 text-sm text-slate-500">Calcul des frais de livraison…</p>}
                {!deliveryLoading && deliveryError && <p className="mt-3 text-sm text-rose-600">{deliveryError}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Commune</label>
                <input required name="commune" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {deliveryMode === "HOME" ? "Adresse de livraison" : "Adresse ou repère (facultatif)"}
                </label>
                <textarea required={deliveryMode === "HOME"} name="address" rows={3} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
                {deliveryMode === "OFFICE" && <p className="mt-1 text-xs text-slate-500">Le retrait se fait au bureau de livraison de votre commune.</p>}
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
            <div className="flex justify-between"><span>Frais de livraison au bureau</span><span>{delivery ? formatCurrency(delivery.officeFee) : "—"}</span></div>
            {deliveryMode === "HOME" && <div className="flex justify-between"><span>Supplément à domicile</span><span>{delivery ? formatCurrency(delivery.homeSurcharge) : "—"}</span></div>}
            <div className="flex justify-between font-semibold text-slate-900"><span>Livraison</span><span>{delivery ? formatCurrency(delivery.shippingFee) : "—"}</span></div>
            <div className="flex justify-between"><span>Réduction</span><span>{formatCurrency(0)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900"><span>Total</span><span>{total === null ? "—" : formatCurrency(total)}</span></div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Les frais de livraison sont recalculés côté serveur au moment de la validation.</p>
          <button type="submit" disabled={processing || !delivery || Boolean(deliveryError)} className="mt-6 w-full rounded-full bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-60">
            {processing ? "Validation..." : "Valider la commande"}
          </button>
        </aside>
      </form>
    </div>
  );
}
