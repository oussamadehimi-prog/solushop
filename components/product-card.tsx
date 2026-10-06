"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { formatCurrency, getProductDiscount, getProductPrice, getSafeImageUrl } from "@/lib/utils";
import { useCart } from "@/components/cart-provider";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number | null;
  promoPrice?: number | null;
  stock: number;
  category?: { name: string } | null;
  images: Array<{ url: string; isPrimary?: boolean }>;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart();
  const discount = getProductDiscount(product);
  const image = getSafeImageUrl(product.images.find((image) => image.isPrimary)?.url ?? product.images[0]?.url);
  const currentPrice = getProductPrice(product);

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative">
        <Link href={`/product/${product.slug}`} className="block">
          <Image
            src={image}
            alt={product.name}
            width={600}
            height={600}
            className="h-64 w-full object-cover"
          />
        </Link>
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-2 py-1 text-[10px] font-bold text-white">
            -{discount}%
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-500">
          <span>{product.category?.name ?? "Produit"}</span>
          <span className={product.stock > 0 ? "text-emerald-600" : "text-rose-600"}>
            {product.stock > 0 ? "En stock" : "Rupture"}
          </span>
        </div>

        <Link href={`/product/${product.slug}`} className="block text-lg font-semibold text-slate-900">
          {product.name}
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-slate-900">{formatCurrency(currentPrice)}</span>
          {product.oldPrice && product.oldPrice > currentPrice && (
            <span className="text-sm text-slate-400 line-through">{formatCurrency(product.oldPrice)}</span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Link
            href={`/product/${product.slug}`}
            className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-800"
          >
            Voir le produit
          </Link>
          <button
            type="button"
            onClick={() =>
              addItem({
                id: product.id,
                productId: product.id,
                name: product.name,
                slug: product.slug,
                price: currentPrice,
                quantity: 1,
                image,
                stock: product.stock,
              })
            }
            disabled={product.stock <= 0}
            className="rounded-full bg-slate-900 p-2 text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            aria-label={`Ajouter ${product.name} au panier`}
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
