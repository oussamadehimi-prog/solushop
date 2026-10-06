import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { z } from "zod";

const statusSchema = z.enum(["PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "REJECTED"]);

export async function PATCH(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });

  const body = await request.json();
  const parsed = z.object({ orderId: z.string().min(1), status: statusSchema, rejectionReason: z.string().trim().max(500).optional() }).superRefine((value, ctx) => {
    if (value.status === "REJECTED" && !value.rejectionReason) ctx.addIssue({ code: "custom", path: ["rejectionReason"], message: "Une raison est requise." });
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Statut invalide." }, { status: 400 });

  const order = await prisma.order.update({
    where: { id: parsed.data.orderId },
    data: { status: parsed.data.status, rejectionReason: parsed.data.status === "REJECTED" ? parsed.data.rejectionReason : null },
    select: { id: true, number: true, status: true },
  });
  return NextResponse.json({ order });
}
