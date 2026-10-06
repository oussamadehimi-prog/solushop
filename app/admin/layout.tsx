import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminSessionActions } from "@/components/admin-session-actions";

const links = [
  ["Dashboard", "/admin"],
  ["Produits", "/admin/products"],
  ["Catégories", "/admin/categories"],
  ["Commandes", "/admin/orders"],
  ["Clients", "/admin/customers"],
  ["Stock", "/admin/stock"],
  ["Promotions", "/admin/promotions"],
  ["Livraison", "/admin/shipping"],
  ["Avis", "/admin/reviews"],
  ["Statistiques", "/admin/analytics"],
  ["Notifications", "/admin/notifications"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-4 lg:flex-row">
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:w-64">
          <Link href="/admin" className="block px-3 py-3 text-xl font-black text-slate-900">SOLU<span className="text-orange-500">SHOP</span></Link>
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Administration</p>
          <nav className="grid grid-cols-2 gap-1 lg:grid-cols-1">
            {links.map(([label, href]) => <Link key={href} href={href} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900">{label}</Link>)}
          </nav>
          <div className="mt-4 border-t border-slate-100 pt-4"><AdminSessionActions compact /></div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
