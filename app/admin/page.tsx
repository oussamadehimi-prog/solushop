import { redirect } from "next/navigation";
import { AdminStatCard } from "@/components/admin-stat-card";
import { AdminOrders } from "@/components/admin-orders";
import { AdminSessionActions } from "@/components/admin-session-actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function AdminDashboardPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({ include: { items: true } });
  const products = await prisma.product.findMany({ where: { active: true } });
  const customerCount = new Set(orders.map((order) => order.phone)).size;
  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { items: { include: { product: { select: { name: true } } } } },
  });

  const pending = orders.filter((order) => order.status === "PENDING").length;
  const confirmed = orders.filter((order) => order.status === "CONFIRMED").length;
  const preparing = orders.filter((order) => order.status === "PREPARING").length;
  const shipped = orders.filter((order) => order.status === "SHIPPED").length;
  const delivered = orders.filter((order) => order.status === "DELIVERED").length;
  const cancelled = orders.filter((order) => order.status === "CANCELLED").length;
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  const lowStock = products.filter((product) => product.stock <= 5).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Dashboard</p>
          <h1 className="text-3xl font-black text-slate-900">Tableau de bord</h1>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="Commandes total" value={String(orders.length)} subtext="Total" />
        <AdminStatCard title="Commandes en attente" value={String(pending)} subtext="Pending" />
        <AdminStatCard title="Confirmées" value={String(confirmed)} subtext="Confirmed" />
        <AdminStatCard title="Chiffre d’affaires" value={formatCurrency(revenue)} subtext="Revenue" />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="Préparation" value={String(preparing)} subtext="Preparing" />
        <AdminStatCard title="Expédiées" value={String(shipped)} subtext="Shipped" />
        <AdminStatCard title="Livrées" value={String(delivered)} subtext="Delivered" />
        <AdminStatCard title="Clients" value={String(customerCount)} subtext="Clients ayant commandé" />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Stock faible</h3>
          <p className="mt-3 text-3xl font-black text-slate-900">{lowStock}</p>
          <p className="mt-2 text-sm text-slate-500">Produits presque en rupture</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Produits</h3>
          <p className="mt-3 text-3xl font-black text-slate-900">{products.length}</p>
          <p className="mt-2 text-sm text-slate-500">Produits actifs</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Annulées</h3>
          <p className="mt-3 text-3xl font-black text-slate-900">{cancelled}</p>
          <p className="mt-2 text-sm text-slate-500">Commandes annulées</p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Statuts des commandes</h3>
          <div className="mt-5 space-y-4">
            {[
              ["Pending", pending],
              ["Confirmed", confirmed],
              ["Preparing", preparing],
              ["Shipped", shipped],
              ["Delivered", delivered],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-sm text-slate-600"><span>{label}</span><span>{value}</span></div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-slate-900" style={{ width: `${Math.min((Number(value) / Math.max(orders.length, 1)) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Produits les plus vendus</h3>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            {products.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                <span>{product.name}</span>
                <span className="font-semibold text-slate-900">{product.stock} en stock</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AdminOrders initialOrders={recentOrders} />
      <AdminSessionActions />
    </div>
  );
}
