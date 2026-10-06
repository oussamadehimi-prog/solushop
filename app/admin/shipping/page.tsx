import { prisma } from "@/lib/prisma";
import { AdminShipping } from "@/components/admin-shipping";
export default async function ShippingPage() { return <><div className="mb-6"><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Logistique</p><h1 className="text-3xl font-black">Frais de livraison</h1></div><AdminShipping initial={await prisma.shippingRate.findMany({ orderBy: { wilaya: "asc" } })} /></>; }
