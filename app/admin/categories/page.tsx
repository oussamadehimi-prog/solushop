import { prisma } from "@/lib/prisma";
import { AdminCategories } from "@/components/admin-categories";
export default async function CategoriesPage() { return <><div className="mb-6"><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Catalogue</p><h1 className="text-3xl font-black">Catégories</h1></div><AdminCategories initial={await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: "asc" } })} /></>; }
