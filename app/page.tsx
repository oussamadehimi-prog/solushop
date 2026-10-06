import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { prisma } from "@/lib/prisma";
import { formatCurrency, getProductDiscount, getProductPrice, getSafeImageUrl } from "@/lib/utils";

export default async function HomePage() {
  const categories = await prisma.category.findMany({ where: { active: true }, take: 6 });
  const featuredProducts = await prisma.product.findMany({
    where: { active: true, featured: true },
    include: { category: true, images: true },
    take: 6,
  });
  const promotions = await prisma.product.findMany({
    where: { active: true, promoPrice: { not: null } },
    include: { category: true, images: true },
    take: 6,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-900 via-slate-800 to-orange-600 p-8 text-white shadow-xl md:p-12">
        <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-orange-100">
              <Sparkles className="h-4 w-4" />
              Nouveau 2026
            </span>
            <h1 className="max-w-xl text-4xl font-black tracking-tight md:text-6xl">
              Des produits choisis pour des achats rapides et fiables.
            </h1>
            <p className="max-w-lg text-base text-slate-200 md:text-lg">
              Découvrez une sélection premium de gadgets, maison, sport et accessoires pensés pour le mobile.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100">
                Acheter maintenant
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/admin" className="rounded-full border border-white/30 px-5 py-3 font-semibold text-white hover:bg-white/5">
                Dashboard admin
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "Livraison rapide", icon: Truck },
              { title: "Paiement à la livraison", icon: ShieldCheck },
            ].map(({ title, icon: Icon }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <Icon className="mb-4 h-8 w-8 text-orange-300" />
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-slate-300">Service fiable et pensé pour une conversion mobile optimale.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Catégories</h2>
          <Link href="/products" className="text-sm font-medium text-orange-600">Voir tout</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1">
              <div className="mb-4 h-32 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
                <Image src={getSafeImageUrl(category.image)} alt={category.name} width={800} height={600} className="h-full w-full object-cover transition group-hover:scale-105" />
              </div>
              <p className="text-lg font-semibold text-slate-900">{category.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Produits populaires</h2>
          <Link href="/products" className="text-sm font-medium text-orange-600">Découvrir</Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                oldPrice: product.oldPrice,
                promoPrice: product.promoPrice,
                stock: product.stock,
                category: product.category,
                images: product.images.map((image) => ({ url: image.url, isPrimary: image.isPrimary })),
              }}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Promotions</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {promotions.map((product) => {
            const discount = getProductDiscount(product);
            return (
              <div key={product.id} className="rounded-2xl border border-orange-100 bg-orange-50 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-orange-500 px-2 py-1 text-xs font-bold uppercase text-white">-{discount}%</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Promo</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-bold text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-600">{product.shortDescription}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-slate-900">{formatCurrency(getProductPrice(product))}</span>
                    <span className="text-sm text-slate-400 line-through">{formatCurrency(product.oldPrice ?? product.price)}</span>
                  </div>
                  <Link href={`/product/${product.slug}`} className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                    Voir l’offre
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
