import { prisma } from "@/lib/prisma";
import { AdminOrdersTable } from "@/components/admin-orders-table";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ deleted?: string | string[] }>;
}) {
  const params = (await searchParams) ?? {};
  const deleted = Array.isArray(params.deleted) ? params.deleted[0] : params.deleted;
  const orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } });

  return (
    <>
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ventes</p>
        <h1 className="text-3xl font-black">Commandes</h1>
      </div>
      {deleted && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          La commande {deleted} a été supprimée avec succès.
        </div>
      )}
      <AdminOrdersTable initialOrders={orders} />
    </>
  );
}
