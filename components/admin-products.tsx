"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { ProductShareActions } from "@/components/product-share-actions";

type Product = { id: string; name: string; slug: string; description: string; categoryId: string; sku: string; price: number; promoPrice: number | null; stock: number; lowStockThreshold: number; active: boolean; category: { name: string }; images: Array<{ url: string }> };
export function AdminProducts({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase())), [products, search]);
  async function remove(id: string) {
    if (!window.confirm("Voulez-vous vraiment supprimer ou archiver ce produit ?")) return;
    const response = await fetch("/api/admin/products", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (response.ok) setProducts((current) => current.filter((p) => p.id !== id));
  }
  async function toggle(product: Product) {
    const response = await fetch("/api/admin/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: product.id, name: product.name, description: product.description, categoryId: product.categoryId, sku: product.sku, price: product.price, promoPrice: product.promoPrice, oldPrice: null, stock: product.stock, lowStockThreshold: product.lowStockThreshold, active: !product.active }) });
    if (response.ok) setProducts((current) => current.map((p) => p.id === product.id ? { ...p, active: !p.active } : p));
  }
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit..." className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 outline-none" /><Link href="/admin/products/new" className="rounded-full bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white">+ Ajouter un produit</Link></div>
    <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400"><tr><th className="p-3">Produit</th><th className="p-3">Catégorie</th><th className="p-3">Prix</th><th className="p-3">Stock</th><th className="p-3">Statut</th><th className="p-3">Actions</th></tr></thead><tbody>{filtered.map((product) => <tr key={product.id} className="border-b border-slate-100"><td className="p-3"><p className="font-semibold text-slate-900">{product.name}</p><p className="text-xs text-slate-500">{product.sku}</p></td><td className="p-3">{product.category.name}</td><td className="p-3 font-semibold">{formatCurrency(product.promoPrice ?? product.price)}</td><td className="p-3"><span className={product.stock === 0 ? "text-rose-600" : product.stock <= product.lowStockThreshold ? "text-amber-600" : "text-emerald-600"}>{product.stock}</span></td><td className="p-3">{product.active ? "Actif" : "Inactif"}</td><td className="p-3"><div className="flex flex-wrap gap-2"><Link href={`/admin/products/${product.id}/edit`} className="rounded-full border px-3 py-1">Modifier</Link><ProductShareActions slug={product.slug} /><button onClick={() => toggle(product)} className="rounded-full border px-3 py-1">{product.active ? "Désactiver" : "Activer"}</button><button onClick={() => remove(product.id)} className="rounded-full border border-rose-200 px-3 py-1 text-rose-600">Supprimer</button></div></td></tr>)}</tbody></table></div>
  </div>;
}
