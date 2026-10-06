import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, getProductDiscount, getSafeImageUrl } from "@/lib/utils";
import { ProductActions } from "@/components/product-actions";

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ source?: string }>;
}) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const source = ["instagram", "facebook", "tiktok", "whatsapp", "direct"].includes(query.source ?? "")
    ? query.source
    : undefined;
  const product = await prisma.product.findFirst({
    where: {
      active: true,
      OR: [{ slug }, { id: slug }],
    },
    include: { category: true, images: true, variants: true, reviews: { where: { approved: true }, include: { user: true } } },
  });

  if (!product) {
    notFound();
  }

  const similarProducts = await prisma.product.findMany({
    where: { active: true, categoryId: product.categoryId, id: { not: product.id } },
    include: { images: true },
    take: 3,
  });

  const averageRating = product.reviews.length
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">Accueil</Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-slate-900">Produits</Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
            <Image src={getSafeImageUrl(product.images[0]?.url)} alt={product.name} width={1200} height={1200} loading="eager" className="h-[480px] w-full rounded-2xl object-cover" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {product.images.slice(0, 3).map((image) => (
              <div key={image.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                <Image src={getSafeImageUrl(image.url)} alt={product.name} width={600} height={600} className="h-28 w-full rounded-xl object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">{product.category.name}</p>
            <h1 className="mt-2 text-4xl font-black text-slate-900">{product.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-orange-500">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className={`h-4 w-4 ${index < Math.round(averageRating) ? "fill-current" : "text-slate-300"}`} />
              ))}
            </div>
            <span className="text-sm text-slate-500">{product.reviews.length} avis</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-slate-900">{formatCurrency(product.promoPrice ?? product.price)}</span>
            {product.oldPrice && product.oldPrice > (product.promoPrice ?? product.price) && (
              <span className="text-lg text-slate-400 line-through">{formatCurrency(product.oldPrice)}</span>
            )}
            {getProductDiscount(product) > 0 && (
              <span className="rounded-full bg-orange-500 px-2 py-1 text-xs font-bold uppercase text-white">-{getProductDiscount(product)}%</span>
            )}
          </div>

          <p className="text-slate-600">{product.description}</p>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Disponibilité</p>
            <p className={product.stock > 0 ? "mt-2 text-emerald-600" : "mt-2 text-rose-600"}>
              {product.stock > 0 ? `${product.stock} unités disponibles` : "Rupture de stock"}
            </p>
          </div>

          <ProductActions
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.promoPrice ?? product.price,
              stock: product.stock,
              images: product.images.map((image) => ({ url: image.url })),
            }}
            source={source}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-500">Marque</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{product.brand ?? "Premium"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-500">SKU</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{product.sku}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Caractéristiques</h2>
          <ul className="mt-4 space-y-2 text-slate-600">
            <li>• Qualité premium et finition soignée</li>
            <li>• Design moderne et ergonomique</li>
            <li>• Garantie fabricant</li>
            <li>• Support client réactif</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Avis clients</h2>
          <div className="mt-5 space-y-4">
            {product.reviews.length > 0 ? (
              product.reviews.map((review) => (
                <div key={review.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{review.user.name}</p>
                    <div className="flex items-center gap-1 text-orange-500">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-current" : "text-slate-300"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-500">Aucun avis pour le moment. Soyez le premier à noter ce produit.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="mb-5 text-2xl font-bold text-slate-900">Produits similaires</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {similarProducts.map((similar) => (
            <Link key={similar.id} href={`/product/${similar.slug}`} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <Image src={getSafeImageUrl(similar.images[0]?.url)} alt={similar.name} width={600} height={600} className="h-48 w-full rounded-xl object-cover" />
              <div className="mt-3">
                <p className="font-semibold text-slate-900">{similar.name}</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{formatCurrency(similar.promoPrice ?? similar.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
