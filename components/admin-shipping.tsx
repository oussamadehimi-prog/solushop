"use client";

import { FormEvent, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type Rate = { id: string; wilaya: string; cost: number; active: boolean };
type Settings = { officeFee: number | null; homeSurcharge: number | null } | null;

export function AdminShipping({ initial, settings }: { initial: Rate[]; settings: Settings }) {
  const [rates, setRates] = useState(initial);
  const [deliverySettings, setDeliverySettings] = useState(settings);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const configured =
    deliverySettings !== null &&
    deliverySettings.officeFee !== null &&
    deliverySettings.officeFee !== undefined &&
    deliverySettings.homeSurcharge !== null &&
    deliverySettings.homeSurcharge !== undefined;

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/delivery", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        officeFee: form.get("officeFee"),
        homeSurcharge: form.get("homeSurcharge"),
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error || "Impossible d’enregistrer les tarifs.");
      return;
    }

    setDeliverySettings(data.settings);
    setNotice("Paramètres de livraison enregistrés.");
  }

  async function addRate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wilaya: form.get("wilaya"), cost: form.get("cost") }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error || "Impossible d’ajouter le tarif.");
      return;
    }

    setRates((current) => [...current, data.rate]);
    formElement.reset();
    setNotice(`Tarif spécifique ajouté pour ${data.rate.wilaya}.`);
  }

  async function editRate(rate: Rate) {
    const cost = window.prompt("Frais de livraison au bureau (DA)", String(rate.cost));
    if (cost === null) return;

    setError("");
    setNotice("");

    const response = await fetch("/api/admin/shipping", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rate.id, wilaya: rate.wilaya, cost }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error || "Impossible de modifier le tarif.");
      return;
    }

    setRates((current) => current.map((entry) => (entry.id === rate.id ? data.rate : entry)));
    setNotice(`Tarif mis à jour pour ${data.rate.wilaya}.`);
  }

  async function toggleRate(rate: Rate) {
    setError("");
    setNotice("");

    const response = await fetch("/api/admin/shipping", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rate.id, wilaya: rate.wilaya, cost: rate.cost, active: !rate.active }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error || "Impossible de modifier la disponibilité de la wilaya.");
      return;
    }

    setRates((current) => current.map((entry) => (entry.id === rate.id ? data.rate : entry)));
    setNotice(
      data.rate.active
        ? `${data.rate.wilaya} est de nouveau proposée aux clients.`
        : `${data.rate.wilaya} n’est plus proposée aux clients.`,
    );
  }

  async function removeRate(rate: Rate) {
    if (!window.confirm(`Supprimer le tarif spécifique pour ${rate.wilaya} ?`)) return;

    setError("");
    setNotice("");

    const response = await fetch("/api/admin/shipping", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rate.id }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error || "Impossible de supprimer le tarif.");
      return;
    }

    setRates((current) => current.filter((entry) => entry.id !== rate.id));
    setNotice(`Tarif supprimé pour ${rate.wilaya}.`);
  }

  return (
    <div className="space-y-5">
      {!configured && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Les tarifs globaux ne sont pas encore configurés. Tant qu’ils ne le sont pas, les clients ne peuvent pas valider de commande.
        </p>
      )}

      <form onSubmit={saveSettings} className="grid gap-3 rounded-3xl border bg-white p-5 shadow-sm md:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium">
          Tarif de livraison au bureau (DA)
          <input required name="officeFee" type="number" min="0" step="0.01" defaultValue={deliverySettings?.officeFee ?? ""} className="rounded-2xl border p-3" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Supplément de livraison à domicile (DA)
          <input required name="homeSurcharge" type="number" min="0" step="0.01" defaultValue={deliverySettings?.homeSurcharge ?? ""} className="rounded-2xl border p-3" />
        </label>
        <button className="self-end rounded-full bg-slate-900 px-5 py-3 font-semibold text-white">Enregistrer les tarifs</button>
        <p className="text-xs text-slate-500 md:col-span-3">
          Total à domicile = tarif bureau + supplément domicile. Si un tarif spécifique est défini pour la wilaya du client, il remplace le tarif bureau global ; le supplément domicile s’y ajoute toujours.
        </p>
      </form>

      {(error || notice) && (
        <p className={`text-sm ${error ? "text-rose-600" : "text-emerald-600"}`}>{error || notice}</p>
      )}

      <form onSubmit={addRate} className="flex flex-col gap-3 rounded-3xl border bg-white p-5 shadow-sm md:flex-row">
        <input required name="wilaya" placeholder="Wilaya" className="flex-1 rounded-2xl border p-3" />
        <input required name="cost" type="number" min="0" step="0.01" placeholder="Frais bureau (DA)" className="w-full rounded-2xl border p-3 md:w-40" />
        <button className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white">Ajouter</button>
        <p className="text-xs text-slate-500 md:w-full">
          Une wilaya ajoutée est active par défaut et apparaît immédiatement dans le formulaire de commande du client.
        </p>
      </form>

      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <h2 className="mb-2 font-bold text-slate-900">Wilayas et tarifs</h2>
        {rates.length === 0 ? (
          <p className="py-3 text-sm text-slate-500">Aucune wilaya configurée. Ajoutez une wilaya pour la proposer aux clients.</p>
        ) : (
          rates.map((rate) => (
            <div key={rate.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{rate.wilaya}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${rate.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {rate.active ? "Active" : "Désactivée"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span>{formatCurrency(rate.cost)}</span>
                <button type="button" onClick={() => editRate(rate)} className="rounded-full border px-3 py-1">Modifier</button>
                <button type="button" onClick={() => toggleRate(rate)} className="rounded-full border px-3 py-1">
                  {rate.active ? "Désactiver" : "Activer"}
                </button>
                <button type="button" onClick={() => removeRate(rate)} className="rounded-full border border-rose-200 px-3 py-1 text-rose-600">Supprimer</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
