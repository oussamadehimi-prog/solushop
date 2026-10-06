"use client";

import { useState } from "react";

export function ProductShareActions({ slug }: { slug: string }) {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  function getLink() {
    return `${window.location.origin}/product/${slug}`;
  }

  async function copyLink() {
    await navigator.clipboard.writeText(getLink());
    setMessage("Lien copié");
    setOpen(false);
    window.setTimeout(() => setMessage(""), 2000);
  }

  async function share(network: "facebook" | "whatsapp" | "instagram" | "tiktok") {
    const link = getLink();
    if (network === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, "_blank", "noopener,noreferrer");
    } else if (network === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(link)}`, "_blank", "noopener,noreferrer");
    } else {
      await navigator.clipboard.writeText(link);
      setMessage(`Lien copié pour ${network === "instagram" ? "Instagram" : "TikTok"}`);
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-full border px-3 py-1">Partager</button>
        <button type="button" onClick={copyLink} className="rounded-full border px-3 py-1">Copier le lien</button>
      </div>
      {open && (
        <div className="absolute right-0 top-10 z-10 grid min-w-40 gap-1 rounded-2xl border bg-white p-2 shadow-lg">
          <button type="button" onClick={() => share("facebook")} className="rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-100">Facebook</button>
          <button type="button" onClick={() => share("whatsapp")} className="rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-100">WhatsApp</button>
          <button type="button" onClick={() => share("instagram")} className="rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-100">Instagram</button>
          <button type="button" onClick={() => share("tiktok")} className="rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-100">TikTok</button>
        </div>
      )}
      {message && <span className="ml-2 text-xs text-emerald-600">{message}</span>}
    </div>
  );
}
