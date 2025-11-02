const AdminAuthNotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-100">
    <div className="glass-card w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
      <p className="text-xs uppercase tracking-[0.32em] text-white/60">Admin access</p>
      <h1 className="text-2xl font-semibold">Sign-in route missing</h1>
      <p className="text-sm text-white/70">
        The authentication step you requested is unavailable. Head back to the login screen to restart verification.
      </p>
      <a className="btn" href="/admin/login">
        Back to admin login
      </a>
    </div>
  </div>
);

export default AdminAuthNotFound;
