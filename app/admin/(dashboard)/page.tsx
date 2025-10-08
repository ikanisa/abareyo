const AdminOverviewPage = async () => {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((card) => (
          <div
            key={card}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-lg shadow-primary/5"
          >
            <div className="text-xs uppercase tracking-wide text-slate-400">KPI {card}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-100">--</div>
            <div className="text-xs text-slate-500">Coming soon</div>
          </div>
        ))}
      </section>
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-slate-100">Operations Snapshot</h2>
        <p className="mt-2 text-sm text-slate-400">
          Admin dashboards, alerts, and realtime widgets will surface here in the next milestones.
        </p>
      </section>
    </div>
  );
};

export default AdminOverviewPage;
