import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const amountSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() !== "" ? Number(value) : value),
  z.number().finite("Le montant doit être un nombre fini.").nonnegative("Le montant doit être positif ou nul."),
);

const schema = z
  .object({
    officeFee: amountSchema,
    homeSurcharge: amountSchema,
  })
  .strict();

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  return NextResponse.json({ settings: await prisma.deliverySetting.findUnique({ where: { id: "default" } }) });
}

export async function PUT(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Les tarifs doivent être des montants numériques positifs ou nuls." },
      { status: 400 },
    );
  }

  const settings = await prisma.deliverySetting.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });

  revalidatePath("/admin/shipping");
  revalidatePath("/cart");
  revalidatePath("/checkout");

  return NextResponse.json({ settings });
}
