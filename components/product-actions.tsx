"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { useState } from "react";
import { GuestCheckoutForm } from "@/components/guest-checkout-form";

export function ProductActions({
  product,
  source,
}: {
  product: { id: string; name: string; slug: string; price: number; stock: number; images: Array<{ url: string }> };
  source?: string;
}) {
  const { addItem } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={product.stock <= 0}
          onClick={() =>
            addItem({
              id: product.id,
              productId: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              quantity: 1,
              image: product.images[0]?.url,
              stock: product.stock,
              source,
            })
          }
          className="rounded-full bg-slate-900 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {product.stock > 0 ? "Ajouter au panier" : "Rupture de stock"}
        </button>
        <button
          type="button"
          disabled={product.stock <= 0}
          onClick={() => setShowCheckout(true)}
          className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Acheter maintenant
        </button>
        <Link href="/checkout" className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-900">
          Voir le panier
        </Link>
      </div>
      {showCheckout && (
        <GuestCheckoutForm
          product={product}
          source={source}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </>
  );
}
