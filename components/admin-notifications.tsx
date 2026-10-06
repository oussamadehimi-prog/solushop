"use client";

import { useState } from "react";

type Notification = { id: string; title: string; message: string; read: boolean; createdAt: string | Date };

export function AdminNotifications({ initial }: { initial: Notification[] }) {
  const [items, setItems] = useState(initial);
  async function toggle(item: Notification) {
    const response = await fetch("/api/admin/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, read: !item.read }) });
    if (response.ok) setItems((current) => current.map((value) => value.id === item.id ? { ...value, read: !value.read } : value));
  }
  return <div className="rounded-3xl border bg-white p-5 shadow-sm">{items.length === 0 ? <p className="text-slate-500">Aucune notification.</p> : items.map((item) => <div key={item.id} className={`flex flex-wrap items-center justify-between gap-3 border-b py-4 last:border-0 ${item.read ? "opacity-60" : ""}`}><div><p className="font-bold">{item.title}</p><p className="text-sm text-slate-600">{item.message}</p><p className="mt-1 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString("fr-FR")}</p></div><button onClick={() => toggle(item)} className="rounded-full border px-3 py-1">{item.read ? "Marquer non lue" : "Marquer lue"}</button></div>)}</div>;
}
