const AdminNotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-100">
    <div className="glass-card w-full max-w-xl space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
      <p className="text-xs uppercase tracking-[0.32em] text-white/60">Admin dashboard</p>
      <h1 className="text-2xl font-semibold">Module not available</h1>
      <p className="text-sm text-white/70">
        The admin screen you tried to open is missing. Return to the overview to continue monitoring club operations.
      </p>
      <a className="btn" href="/admin">
        Back to admin home
      </a>
    </div>
  </div>
);

export default AdminNotFound;
