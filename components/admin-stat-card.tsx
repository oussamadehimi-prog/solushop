type AdminStatCardProps = {
  title: string;
  value: string;
  subtext: string;
};

export function AdminStatCard({ title, value, subtext }: AdminStatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <h3 className="mt-3 text-3xl font-bold text-slate-900">{value}</h3>
      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">{subtext}</p>
    </div>
  );
}
