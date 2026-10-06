import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { z } from "zod";
export async function GET() { const admin = await getAdminSession(); if (!admin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 }); return NextResponse.json({ notifications: await prisma.notification.findMany({ where: { OR: [{ userId: admin.id }, { userId: null }] }, orderBy: { createdAt: "desc" }, take: 100 }) }); }
export async function PATCH(request: Request) { const admin = await getAdminSession(); if (!admin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 }); const p = z.object({ id: z.string(), read: z.boolean().default(true) }).safeParse(await request.json()); if (!p.success) return NextResponse.json({ error: "Notification invalide." }, { status: 400 }); return NextResponse.json({ notification: await prisma.notification.updateMany({ where: { id: p.data.id, OR: [{ userId: admin.id }, { userId: null }] }, data: { read: p.data.read } }) }); }
