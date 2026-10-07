"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Category = { id: string; name: string };
type ProductImage = { id: string; url: string; isPrimary: boolean };
type Product = {
  id?: string;
  name: string;
  description: string;
  categoryId: string;
  brand: string | null;
  sku: string;
  price: number;
  oldPrice: number | null;
  promoPrice: number | null;
  stock: number;
  lowStockThreshold: number;
  active: boolean;
  images?: ProductImage[];
};

export function AdminProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: Product;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = event.currentTarget;
    const response = await fetch("/api/admin/products", {
      method: product?.id ? "PATCH" : "POST",
      body: new FormData(form),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error || "Erreur.");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={submit} encType="multipart/form-data" className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
      {product?.id && <input type="hidden" name="id" value={product.id} />}
      <label className="grid gap-1 text-sm font-medium">Nom<input name="name" required defaultValue={product?.name} className="rounded-2xl border p-3" /></label>
      <label className="grid gap-1 text-sm font-medium">SKU<input name="sku" required defaultValue={product?.sku} className="rounded-2xl border p-3" /></label>
      <label className="grid gap-1 text-sm font-medium">Catégorie<select name="categoryId" required defaultValue={product?.categoryId} className="rounded-2xl border p-3">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium">Marque<input name="brand" defaultValue={product?.brand ?? ""} className="rounded-2xl border p-3" /></label>
      <label className="grid gap-1 text-sm font-medium">Prix<input name="price" type="number" min="0.01" step="0.01" required defaultValue={product?.price} className="rounded-2xl border p-3" /></label>
      <label className="grid gap-1 text-sm font-medium">Ancien prix<input name="oldPrice" type="number" min="0" step="0.01" defaultValue={product?.oldPrice ?? ""} className="rounded-2xl border p-3" /></label>
      <label className="grid gap-1 text-sm font-medium">Prix promotionnel<input name="promoPrice" type="number" min="0" step="0.01" defaultValue={product?.promoPrice ?? ""} className="rounded-2xl border p-3" /></label>
      <label className="grid gap-1 text-sm font-medium">Stock<input name="stock" type="number" min="0" required defaultValue={product?.stock ?? 0} className="rounded-2xl border p-3" /></label>
      <label className="grid gap-1 text-sm font-medium">Seuil stock faible<input name="lowStockThreshold" type="number" min="0" required defaultValue={product?.lowStockThreshold ?? 5} className="rounded-2xl border p-3" /></label>
      <label className="grid gap-1 text-sm font-medium md:col-span-2">Images (JPG, PNG, WEBP, 5 Mo maximum par fichier)<input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple className="rounded-2xl border p-3" /></label>
      {product?.images && product.images.length > 0 && (
        <fieldset className="grid gap-3 md:col-span-2">
          <legend className="text-sm font-medium">Images existantes</legend>
          {product.images.map((image) => (
            <label key={image.id} className="flex items-center gap-3 rounded-2xl border p-3 text-sm">
              <Image src={image.url} alt="" width={64} height={64} className="h-16 w-16 rounded-xl object-cover" />
              <span className="min-w-0 flex-1 truncate">{image.url}</span>
              <input type="radio" name="primaryImageId" value={image.id} defaultChecked={image.isPrimary} title="Image principale" />
              <span>Principale</span>
              <input type="checkbox" name="removeImageIds" value={image.id} />
              <span>Supprimer</span>
            </label>
          ))}
        </fieldset>
      )}
      <label className="grid gap-1 text-sm font-medium md:col-span-2">Description<textarea name="description" required rows={5} defaultValue={product?.description} className="rounded-2xl border p-3" /></label>
      <label className="flex items-center gap-2 text-sm font-medium"><input name="active" type="checkbox" defaultChecked={product?.active ?? true} /> Produit actif</label>
      {error && <p className="text-sm text-rose-600 md:col-span-2">{error}</p>}
      <button disabled={loading} className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white md:col-span-2">{loading ? "Enregistrement..." : product ? "Enregistrer les modifications" : "Créer le produit"}</button>
    </form>
  );
}
