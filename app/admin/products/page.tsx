import { prisma } from "@/lib/prisma";
import { AdminProducts } from "@/components/admin-products";
export default async function AdminProductsPage() { const products = await prisma.product.findMany({ include: { category: true, images: true }, orderBy: { createdAt: "desc" } }); return <><div className="mb-6"><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Catalogue</p><h1 className="text-3xl font-black">Produits</h1></div><AdminProducts initialProducts={products} /></>; }
