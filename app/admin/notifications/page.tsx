import { prisma } from "@/lib/prisma";
import { AdminNotifications } from "@/components/admin-notifications";
export default async function NotificationsPage() { const notifications = await prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 100 }); return <><div className="mb-6"><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Système</p><h1 className="text-3xl font-black">Notifications</h1></div><AdminNotifications initial={notifications} /></>; }
