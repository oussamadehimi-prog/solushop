import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminProductForm } from "@/components/admin-product-form";
export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const [product, categories] = await Promise.all([prisma.product.findUnique({ where: { id }, include: { images: true } }), prisma.category.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } })]); if (!product) notFound(); return <><div className="mb-6"><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Catalogue</p><h1 className="text-3xl font-black">Modifier le produit</h1></div><AdminProductForm product={product} categories={categories} /></>; }
