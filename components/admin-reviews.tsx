"use client";

import { useState } from "react";

type Review = { id: string; rating: number; comment: string; approved: boolean; product: { name: string }; user: { name: string | null; email?: string | null } };

export function AdminReviews({ initial }: { initial: Review[] }) {
  const [items, setItems] = useState(initial);
  async function approve(item: Review) {
    const response = await fetch("/api/admin/reviews", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, approved: !item.approved }) });
    if (response.ok) setItems((current) => current.map((value) => value.id === item.id ? { ...value, approved: !value.approved } : value));
  }
  async function remove(id: string) {
    if (!window.confirm("Supprimer cet avis ?")) return;
    const response = await fetch("/api/admin/reviews", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (response.ok) setItems((current) => current.filter((item) => item.id !== id));
  }
  return <div className="space-y-3">{items.length === 0 ? <div className="rounded-3xl border bg-white p-6 text-slate-500">Aucun avis.</div> : items.map((item) => <div key={item.id} className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-bold">{item.product.name} · {"★".repeat(item.rating)}</p><p className="text-xs text-slate-400">{item.user.name || item.user.email || "Client"}</p></div><span className={item.approved ? "text-emerald-600" : "text-amber-600"}>{item.approved ? "Publié" : "En attente"}</span></div><p className="mt-3 text-slate-600">{item.comment}</p><div className="mt-4 flex gap-2"><button onClick={() => approve(item)} className="rounded-full border px-3 py-1">{item.approved ? "Masquer" : "Publier"}</button><button onClick={() => remove(item.id)} className="rounded-full border border-rose-200 px-3 py-1 text-rose-600">Supprimer</button></div></div>)}</div>;
}
