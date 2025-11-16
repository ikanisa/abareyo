import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AdminDashboardClient = () => (
  <div className="space-y-4">
    <Card className="border-slate-800 bg-slate-900 text-slate-100">
      <CardHeader>
        <CardTitle className="text-lg">Operational snapshot</CardTitle>
        <CardDescription className="text-slate-400">Minimal overview for admin runtime.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {["Tickets", "Orders", "Rewards"].map((label) => (
          <div key={label} className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <p className="text-xl font-semibold text-slate-50">—</p>
            <p className="text-xs text-slate-400">Lean mode</p>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

export default AdminDashboardClient;
