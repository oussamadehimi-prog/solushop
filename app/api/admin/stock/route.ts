import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  return NextResponse.json({ products: await prisma.product.findMany({ select: { id: true, name: true, sku: true, stock: true, lowStockThreshold: true, active: true }, orderBy: { stock: "asc" } }) });
}
export async function PATCH(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  const parsed = z.object({ id: z.string(), stock: z.coerce.number().int().nonnegative(), lowStockThreshold: z.coerce.number().int().nonnegative().optional() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Stock invalide." }, { status: 400 });
  return NextResponse.json({ product: await prisma.product.update({ where: { id: parsed.data.id }, data: { stock: parsed.data.stock, ...(parsed.data.lowStockThreshold === undefined ? {} : { lowStockThreshold: parsed.data.lowStockThreshold }) } }) });
}
