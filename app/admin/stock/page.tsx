import { prisma } from "@/lib/prisma";
import { AdminStock } from "@/components/admin-stock";
export default async function StockPage() { return <><div className="mb-6"><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Inventaire</p><h1 className="text-3xl font-black">Gestion du stock</h1></div><AdminStock initial={await prisma.product.findMany({ select: { id: true, name: true, sku: true, stock: true, lowStockThreshold: true, active: true }, orderBy: { stock: "asc" } })} /></>; }
