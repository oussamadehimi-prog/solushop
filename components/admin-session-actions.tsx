"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminSessionActions({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: form.get("currentPassword"), newPassword: form.get("newPassword") }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Impossible de changer le mot de passe.");
      return;
    }
    event.currentTarget.reset();
    setMessage("Mot de passe administrateur mis à jour.");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (compact) {
    return <button type="button" onClick={logout} className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50">Se déconnecter</button>;
  }

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Sécurité</p><h2 className="text-xl font-bold text-slate-900">Compte administrateur</h2></div>
        <button type="button" onClick={logout} className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700">Se déconnecter</button>
      </div>
      <form onSubmit={changePassword} className="mt-5 grid gap-3 sm:grid-cols-3">
        <input name="currentPassword" required type="password" placeholder="Mot de passe actuel" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
        <input name="newPassword" required minLength={8} type="password" placeholder="Nouveau mot de passe" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
        <button className="rounded-full bg-slate-900 px-4 py-3 font-semibold text-white">Changer le mot de passe</button>
      </form>
      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
    </section>
  );
}
