"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
type Category = { id: string; name: string };
type Product = { id?: string; name: string; description: string; categoryId: string; brand: string | null; sku: string; price: number; oldPrice: number | null; promoPrice: number | null; stock: number; lowStockThreshold: number; active: boolean; images?: Array<{ url: string }> };
export function AdminProductForm({ categories, product }: { categories: Category[]; product?: Product }) {
  const router = useRouter(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(""); const f = new FormData(event.currentTarget); const payload = { ...(product?.id ? { id: product.id } : {}), name: f.get("name"), description: f.get("description"), categoryId: f.get("categoryId"), brand: f.get("brand"), sku: f.get("sku"), price: f.get("price"), oldPrice: f.get("oldPrice") || null, promoPrice: f.get("promoPrice") || null, stock: f.get("stock"), lowStockThreshold: f.get("lowStockThreshold"), active: f.get("active") === "on", image: f.get("image") };
    const response = await fetch("/api/admin/products", { method: product?.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const data = await response.json(); setLoading(false); if (!response.ok) { setError(data.error || "Erreur."); return; } router.push("/admin/products"); router.refresh(); }
  return <form onSubmit={submit} className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
    <label className="grid gap-1 text-sm font-medium">Nom<input name="name" required defaultValue={product?.name} className="rounded-2xl border p-3" /></label>
    <label className="grid gap-1 text-sm font-medium">SKU<input name="sku" required defaultValue={product?.sku} className="rounded-2xl border p-3" /></label>
    <label className="grid gap-1 text-sm font-medium">Catégorie<select name="categoryId" required defaultValue={product?.categoryId} className="rounded-2xl border p-3">{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label className="grid gap-1 text-sm font-medium">Marque<input name="brand" defaultValue={product?.brand ?? ""} className="rounded-2xl border p-3" /></label>
    <label className="grid gap-1 text-sm font-medium">Prix<input name="price" type="number" min="0.01" step="0.01" required defaultValue={product?.price} className="rounded-2xl border p-3" /></label>
    <label className="grid gap-1 text-sm font-medium">Ancien prix<input name="oldPrice" type="number" min="0" step="0.01" defaultValue={product?.oldPrice ?? ""} className="rounded-2xl border p-3" /></label>
    <label className="grid gap-1 text-sm font-medium">Prix promotionnel<input name="promoPrice" type="number" min="0" step="0.01" defaultValue={product?.promoPrice ?? ""} className="rounded-2xl border p-3" /></label>
    <label className="grid gap-1 text-sm font-medium">Stock<input name="stock" type="number" min="0" required defaultValue={product?.stock ?? 0} className="rounded-2xl border p-3" /></label>
    <label className="grid gap-1 text-sm font-medium">Seuil stock faible<input name="lowStockThreshold" type="number" min="0" required defaultValue={product?.lowStockThreshold ?? 5} className="rounded-2xl border p-3" /></label>
    <label className="grid gap-1 text-sm font-medium md:col-span-2">Image principale (URL)<input name="image" defaultValue={product?.images?.[0]?.url ?? ""} className="rounded-2xl border p-3" /></label>
    <label className="grid gap-1 text-sm font-medium md:col-span-2">Description<textarea name="description" required rows={5} defaultValue={product?.description} className="rounded-2xl border p-3" /></label>
    <label className="flex items-center gap-2 text-sm font-medium"><input name="active" type="checkbox" defaultChecked={product?.active ?? true} /> Produit actif</label>
    {error && <p className="text-sm text-rose-600 md:col-span-2">{error}</p>}
    <button disabled={loading} className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white md:col-span-2">{loading ? "Enregistrement..." : product ? "Enregistrer les modifications" : "Créer le produit"}</button>
  </form>;
}
