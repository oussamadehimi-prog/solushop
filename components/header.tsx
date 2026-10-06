"use client";

import Link from "next/link";
import { ShoppingCart, Search, Shield, Menu } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useState } from "react";

export function Header() {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setMenuOpen((open) => !open)} className="rounded-md border border-slate-200 p-2 md:hidden" aria-label="Menu" aria-expanded={menuOpen}>
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="text-2xl font-black tracking-tight text-slate-900">
            SOLU<span className="text-orange-500">SHOP</span>
          </Link>
        </div>

        <div className="hidden flex-1 items-center justify-center md:flex">
          <div className="flex w-full max-w-2xl items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Rechercher un produit..."
            />
          </div>
        </div>

        <nav className="flex items-center gap-3">
          <Link href="/products" className="hidden text-sm font-medium text-slate-700 md:inline-flex">
            Produits
          </Link>
          <Link href="/track-order" className="hidden text-sm font-medium text-slate-700 md:inline-flex">
            Suivre ma commande
          </Link>
          <Link href="/cart" className="relative rounded-full border border-slate-200 p-2 text-slate-800">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-2 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Espace admin</span>
          </Link>
        </nav>
      </div>
      {menuOpen && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm font-medium text-slate-700">
            <Link href="/products" onClick={() => setMenuOpen(false)}>Produits</Link>
            <Link href="/track-order" onClick={() => setMenuOpen(false)}>Suivre ma commande</Link>
          </div>
        </nav>
      )}
    </header>
  );
}
