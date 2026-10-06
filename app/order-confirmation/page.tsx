import Link from "next/link";

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams?: Promise<{ number?: string; phone?: string }>;
}) {
  const params = (await searchParams) ?? {};

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-700">Commande enregistrée</p>
        <h1 className="mt-4 text-3xl font-black text-slate-900">Commande enregistrée avec succès</h1>
        <p className="mt-4 text-slate-600">Votre commande <strong>#{params.number ?? "CMD"}</strong> a bien été enregistrée.</p>
        <p className="mt-2 text-sm text-slate-600">Notre équipe va la traiter prochainement. Statut : En attente de confirmation.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white">Retour à l’accueil</Link>
          <Link href={`/track-order${params.number && params.phone ? `?number=${encodeURIComponent(params.number)}&phone=${encodeURIComponent(params.phone)}` : ""}`} className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-900">Suivre ma commande</Link>
        </div>
      </div>
    </div>
  );
}
