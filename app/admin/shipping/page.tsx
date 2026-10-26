import { prisma } from "@/lib/prisma";
import { AdminShipping } from "@/components/admin-shipping";

export const dynamic = "force-dynamic";

export default async function ShippingPage() { const [rates, settings] = await Promise.all([prisma.shippingRate.findMany({ orderBy: { wilaya: "asc" } }), prisma.deliverySetting.findUnique({ where: { id: "default" } })]); return <><div className="mb-6"><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Logistique</p><h1 className="text-3xl font-black">Paramètres de livraison</h1></div><AdminShipping initial={rates} settings={settings} /></>; }
