import { prisma } from "@/lib/prisma";
import { AdminReviews } from "@/components/admin-reviews";
export default async function ReviewsPage() { const reviews = await prisma.review.findMany({ include: { product: { select: { name: true } }, user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } }); return <><div className="mb-6"><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Qualité</p><h1 className="text-3xl font-black">Avis clients</h1></div><AdminReviews initial={reviews} /></>; }
