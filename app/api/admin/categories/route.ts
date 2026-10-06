import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({ id: z.string().optional(), name: z.string().trim().min(2).max(100), description: z.string().trim().max(500).optional().or(z.literal("")), active: z.boolean().default(true) });
async function guard() { return Boolean(await getAdminSession()); }
export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  return NextResponse.json({ categories: await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: "asc" } }) });
}
export async function POST(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  const parsed = schema.omit({ id: true }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  const category = await prisma.category.create({ data: { ...parsed.data, description: parsed.data.description || null, slug: `${slugify(parsed.data.name)}-${Date.now().toString(36)}` } });
  return NextResponse.json({ category }, { status: 201 });
}
export async function PATCH(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  const parsed = schema.required({ id: true }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  const { id, ...data } = parsed.data;
  return NextResponse.json({ category: await prisma.category.update({ where: { id }, data: { ...data, description: data.description || null } }) });
}
export async function DELETE(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  const parsed = z.object({ id: z.string() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Catégorie invalide." }, { status: 400 });
  const count = await prisma.product.count({ where: { categoryId: parsed.data.id } });
  if (count) return NextResponse.json({ error: "Cette catégorie contient des produits. Désactivez-la plutôt." }, { status: 409 });
  await prisma.category.delete({ where: { id: parsed.data.id } });
  return NextResponse.json({ ok: true });
}
