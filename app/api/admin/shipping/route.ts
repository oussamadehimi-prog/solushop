import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function revalidateDeliveryPages() {
  revalidatePath("/admin/shipping");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

const amountSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() !== "" ? Number(value) : value),
  z.number().finite("Le montant doit être un nombre fini.").nonnegative("Le montant doit être positif ou nul."),
);

const rateSchema = z
  .object({
    wilaya: z.string().trim().min(2).max(80),
    cost: amountSchema,
  })
  .strict();

const updateSchema = rateSchema.extend({ id: z.string().min(1), active: z.boolean().optional() }).strict();

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  return NextResponse.json(
    { rates: await prisma.shippingRate.findMany({ orderBy: { wilaya: "asc" } }) },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const parsed = rateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Tarif invalide. Le montant doit être positif ou nul." }, { status: 400 });
  }

  const existing = await prisma.shippingRate.findFirst({
    where: { wilaya: { equals: parsed.data.wilaya, mode: "insensitive" } },
  });
  if (existing) {
    return NextResponse.json({ error: "Un tarif existe déjà pour cette wilaya." }, { status: 409 });
  }

  const rate = await prisma.shippingRate.create({ data: { ...parsed.data, active: true } });
  revalidateDeliveryPages();
  return NextResponse.json({ rate }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Tarif invalide. Le montant doit être positif ou nul." }, { status: 400 });
  }

  const { id, ...data } = parsed.data;
  const current = await prisma.shippingRate.findUnique({ where: { id } });
  if (!current) {
    return NextResponse.json({ error: "Tarif introuvable." }, { status: 404 });
  }

  const duplicate = await prisma.shippingRate.findFirst({
    where: {
      id: { not: id },
      wilaya: { equals: data.wilaya, mode: "insensitive" },
    },
  });
  if (duplicate) {
    return NextResponse.json({ error: "Un tarif existe déjà pour cette wilaya." }, { status: 409 });
  }

  const rate = await prisma.shippingRate.update({ where: { id }, data });
  revalidateDeliveryPages();
  return NextResponse.json({ rate });
}

export async function DELETE(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const parsed = z.object({ id: z.string().min(1) }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Tarif invalide." }, { status: 400 });
  }

  const current = await prisma.shippingRate.findUnique({ where: { id: parsed.data.id } });
  if (!current) {
    return NextResponse.json({ error: "Tarif introuvable." }, { status: 404 });
  }

  await prisma.shippingRate.delete({ where: { id: parsed.data.id } });
  revalidateDeliveryPages();
  return NextResponse.json({ ok: true });
}
