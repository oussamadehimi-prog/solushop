"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

type Props = {
  orderId: string;
  orderNumber: string;
  onDeleted?: () => void;
  redirectTo?: string;
  className?: string;
};

export function AdminOrderDeleteButton({ orderId, orderNumber, onDeleted, redirectTo, className }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer la commande ${orderNumber} ? Cette action est irréversible.`,
    );
    if (!confirmed) return;

    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Impossible de supprimer la commande.");
        return;
      }

      if (onDeleted) {
        onDeleted();
      } else if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch {
      setError("Impossible de supprimer la commande.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={`flex flex-col items-end gap-1 ${className ?? ""}`}>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {pending ? "Suppression..." : "Supprimer"}
      </button>
      {error && <p className="max-w-56 text-right text-xs text-rose-600">{error}</p>}
    </div>
  );
}
