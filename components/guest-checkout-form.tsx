"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const total = product.price * quantity + (delivery?.shippingFee ?? 0);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!delivery) {
      setError(deliveryError || "Les frais de livraison ne sont pas encore disponibles.");
      return;
    }

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
          deliveryMode,
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
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Wilaya
                <select required name="wilaya" value={wilaya} disabled={!wilayasLoaded || wilayas.length === 0} onChange={(event) => setWilaya(event.target.value)} className="rounded-2xl border bg-slate-50 px-4 py-3 outline-none disabled:opacity-60">
                  {wilayas.length === 0 ? (
                    <option value="">{wilayasLoaded ? "Aucune wilaya disponible" : "Chargement…"}</option>
                  ) : (
                    wilayas.map((entry) => <option key={entry.id} value={entry.wilaya}>{entry.wilaya}</option>)
                  )}
                </select>
                {wilayasError && <span className="text-xs font-normal text-rose-600">{wilayasError}</span>}
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">Commune<input required name="commune" className="rounded-2xl border bg-slate-50 px-4 py-3 outline-none" /></label>
              <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
                {deliveryMode === "HOME" ? "Adresse de livraison" : "Adresse ou repère (facultatif)"}
                <textarea required={deliveryMode === "HOME"} name="address" rows={3} className="rounded-2xl border bg-slate-50 px-4 py-3 outline-none" />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">Remarque (facultatif)<textarea name="note" rows={2} className="rounded-2xl border bg-slate-50 px-4 py-3 outline-none" /></label>
              <fieldset className="grid gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                <legend>Mode de livraison</legend>
                {DELIVERY_MODES.map((mode) => (
                  <label key={mode} className={`rounded-2xl border p-3 ${deliveryMode === mode ? "border-orange-500 bg-orange-50" : "border-slate-200"}`}>
                    <input type="radio" name="deliveryMode" checked={deliveryMode === mode} onChange={() => setDeliveryMode(mode)} className="mr-2" />
                    {mode === "HOME" ? "Livraison à domicile" : "Bureau de livraison"}
                    {delivery && <span className="text-slate-500"> ({formatCurrency(mode === "HOME" ? delivery.officeFee + delivery.homeSurcharge : delivery.officeFee)})</span>}
                  </label>
                ))}
                {deliveryLoading && <p className="text-xs font-normal text-slate-500">Calcul des frais de livraison…</p>}
                {!deliveryLoading && deliveryError && <p className="text-xs font-normal text-rose-600">{deliveryError}</p>}
              </fieldset>
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
              <div className="flex justify-between"><span>Frais de livraison au bureau</span><span>{delivery ? formatCurrency(delivery.officeFee) : "—"}</span></div>
              {deliveryMode === "HOME" && <div className="flex justify-between"><span>Supplément à domicile</span><span>{delivery ? formatCurrency(delivery.homeSurcharge) : "—"}</span></div>}
              <div className="flex justify-between font-semibold text-slate-900"><span>Livraison</span><span>{delivery ? formatCurrency(delivery.shippingFee) : "—"}</span></div>
              <div className="flex justify-between border-t pt-3 text-base font-bold text-slate-900"><span>Total</span><span>{delivery ? formatCurrency(total) : "—"}</span></div>
            </div>
            <p className="mt-3 text-xs text-slate-500">Les frais sont recalculés côté serveur.</p>
            {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
            <button type="submit" disabled={processing || !delivery || Boolean(deliveryError)} className="mt-5 w-full rounded-full bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-60">{processing ? "Validation..." : "Confirmer la commande"}</button>
          </aside>
        </form>
      </div>
    </div>
  );
}
