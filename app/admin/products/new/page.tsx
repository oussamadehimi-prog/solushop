import { prisma } from "@/lib/prisma";
import { AdminProductForm } from "@/components/admin-product-form";
export default async function NewProductPage() { return <><div className="mb-6"><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Catalogue</p><h1 className="text-3xl font-black">Ajouter un produit</h1></div><AdminProductForm categories={await prisma.category.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } })} /></>; }
