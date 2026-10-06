import { prisma } from "@/lib/prisma";
import { AdminPromotions } from "@/components/admin-promotions";
export default async function PromotionsPage() { const promotions = await prisma.promotion.findMany({ orderBy: { startDate: "desc" } }); return <><div className="mb-6"><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Marketing</p><h1 className="text-3xl font-black">Promotions</h1></div><AdminPromotions initial={promotions} /></>; }
