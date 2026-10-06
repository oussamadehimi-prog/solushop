import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; search?: string; sort?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const categorySlug = params.category;
  const search = params.search ?? "";
  const sort = params.sort ?? "newest";

  const where: Record<string, unknown> = { active: true };
  if (categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (category) {
      where.categoryId = category.id;
    }
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { brand: { contains: search } },
    ];
  }

  const orderBy: Record<string, string | { _count?: string }> = {};
  if (sort === "price-low") orderBy.price = "asc";
  if (sort === "price-high") orderBy.price = "desc";
  if (sort === "newest") orderBy.createdAt = "desc";

  const products = await prisma.product.findMany({
    where,
    include: { category: true, images: true },
    orderBy,
    take: 24,
  });

  const categories = await prisma.category.findMany({ where: { active: true } });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Catalogue</p>
            <h1 className="text-3xl font-black text-slate-900">Tous nos produits</h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <form className="flex flex-wrap gap-2">
              <input name="search" defaultValue={search} placeholder="Recherche..." className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none" />
              <select name="sort" defaultValue={sort} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm">
                <option value="newest">Nouveautés</option>
                <option value="price-low">Prix croissant</option>
                <option value="price-high">Prix décroissant</option>
              </select>
              <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Chercher</button>
            </form>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/products" className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700">Tout</Link>
          {categories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.slug}`} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700">
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
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
    </div>
  );
}
