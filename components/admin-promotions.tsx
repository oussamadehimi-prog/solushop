"use client";

import { FormEvent, useState } from "react";

type Promotion = {
  id: string;
  name: string;
  type: string;
  value: number;
  startDate: string | Date;
  endDate: string | Date;
  productIds: string;
  active: boolean;
};

function toInputDate(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

export function AdminPromotions({ initial }: { initial: Promotion[] }) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState("");

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        type: form.get("type"),
        value: form.get("value"),
        startDate: form.get("startDate"),
        endDate: form.get("endDate"),
        productIds: form.get("productIds") || "",
        active: true,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Promotion invalide.");
      return;
    }
    setItems((current) => [data.promotion, ...current]);
    formElement.reset();
  }

  async function toggle(item: Promotion) {
    const response = await fetch("/api/admin/promotions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...item,
        startDate: toInputDate(item.startDate),
        endDate: toInputDate(item.endDate),
        active: !item.active,
      }),
    });
    if (response.ok) setItems((current) => current.map((value) => value.id === item.id ? { ...value, active: !value.active } : value));
  }

  async function remove(id: string) {
    if (!window.confirm("Supprimer cette promotion ?")) return;
    const response = await fetch("/api/admin/promotions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) setItems((current) => current.filter((item) => item.id !== id));
  }

  return <div className="space-y-5">
    <form onSubmit={create} className="grid gap-3 rounded-3xl border bg-white p-5 shadow-sm md:grid-cols-2">
      <input required name="name" placeholder="Nom de la promotion" className="rounded-2xl border p-3" />
      <select name="type" className="rounded-2xl border p-3"><option value="percentage">Pourcentage</option><option value="fixed">Montant fixe</option></select>
      <input required name="value" type="number" min="0" step="0.01" placeholder="Valeur" className="rounded-2xl border p-3" />
      <input name="productIds" placeholder="IDs produits séparés par des virgules (facultatif)" className="rounded-2xl border p-3" />
      <label className="grid gap-1 text-sm">Début<input required name="startDate" type="date" className="rounded-2xl border p-3" /></label>
      <label className="grid gap-1 text-sm">Fin<input required name="endDate" type="date" className="rounded-2xl border p-3" /></label>
      <button className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white md:col-span-2">Créer la promotion</button>
    </form>
    {error && <p className="text-sm text-rose-600">{error}</p>}
    <div className="rounded-3xl border bg-white p-5 shadow-sm">{items.length === 0 ? <p className="text-slate-500">Aucune promotion.</p> : items.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-4 last:border-0"><div><p className="font-bold">{item.name}</p><p className="text-sm text-slate-500">{item.type === "percentage" ? `${item.value}%` : `${item.value} DA`} · du {toInputDate(item.startDate)} au {toInputDate(item.endDate)}</p></div><div className="flex gap-2"><button onClick={() => toggle(item)} className="rounded-full border px-3 py-1">{item.active ? "Désactiver" : "Activer"}</button><button onClick={() => remove(item.id)} className="rounded-full border border-rose-200 px-3 py-1 text-rose-600">Supprimer</button></div></div>)}</div>
  </div>;
}
