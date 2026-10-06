import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(2),
  categoryId: z.string().min(1),
  brand: z.string().trim().max(100).optional().or(z.literal("")),
  sku: z.string().trim().min(1).max(80),
  price: z.coerce.number().positive(),
  oldPrice: z.coerce.number().nonnegative().nullable().optional(),
  promoPrice: z.coerce.number().nonnegative().nullable().optional(),
  stock: z.coerce.number().int().nonnegative(),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(5),
  active: z.boolean().default(true),
  image: z.string().trim().max(500).optional().or(z.literal("")),
});

async function authorized() {
  return Boolean(await getAdminSession());
}

export async function GET(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() || undefined;
  const products = await prisma.product.findMany({
    where: search ? { OR: [{ name: { contains: search } }, { sku: { contains: search } }] } : undefined,
    include: { category: true, images: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  const parsed = productSchema.omit({ id: true }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Données produit invalides." }, { status: 400 });
  const data = parsed.data;
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) return NextResponse.json({ error: "Catégorie introuvable." }, { status: 400 });
  try {
    const product = await prisma.product.create({
      data: {
        ...data,
        brand: data.brand || null,
        oldPrice: data.oldPrice ?? null,
        promoPrice: data.promoPrice ?? null,
        slug: `${slugify(data.name)}-${Date.now().toString(36)}`,
        images: data.image ? { create: [{ url: data.image, isPrimary: true, alt: data.name }] } : undefined,
      },
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) return NextResponse.json({ error: "Le SKU existe déjà." }, { status: 409 });
    console.error("Admin product creation failed", error);
    return NextResponse.json({ error: "Impossible de créer le produit." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  const parsed = productSchema.required({ id: true }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Données produit invalides." }, { status: 400 });
  const { id, image, ...data } = parsed.data;
  const product = await prisma.product.update({ where: { id }, data: { ...data, brand: data.brand || null, oldPrice: data.oldPrice ?? null, promoPrice: data.promoPrice ?? null } });
  if (image) await prisma.productImage.create({ data: { productId: id, url: image, alt: data.name, isPrimary: true } });
  return NextResponse.json({ product });
}

export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Produit invalide." }, { status: 400 });
  const linked = await prisma.orderItem.count({ where: { productId: parsed.data.id } });
  if (linked > 0) {
    const product = await prisma.product.update({ where: { id: parsed.data.id }, data: { active: false } });
    return NextResponse.json({ product, archived: true });
  }
  await prisma.product.delete({ where: { id: parsed.data.id } });
  return NextResponse.json({ ok: true });
}
