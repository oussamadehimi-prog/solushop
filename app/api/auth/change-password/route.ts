import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { z } from "zod";

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });

  const parsed = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères." }, { status: 400 });

  const valid = await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash);
  if (!valid) return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 401 });

  await prisma.user.update({
    where: { id: admin.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
  });
  return NextResponse.json({ ok: true });
}
