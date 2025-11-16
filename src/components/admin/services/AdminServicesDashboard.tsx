import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const AdminServicesDashboard = () => (
  <Card className="border-slate-800 bg-slate-900 text-slate-100">
    <CardHeader>
      <CardTitle className="text-lg">Partner services</CardTitle>
      <CardDescription className="text-slate-400">Lean view of partner integrations.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {["Insurance", "SACCO", "Merch partners"].map((service, index) => (
        <div key={service} className="space-y-1">
          <p className="text-sm font-semibold text-slate-50">{service}</p>
          <p className="text-xs text-slate-400">Status: steady</p>
          {index < 2 ? <Separator className="bg-slate-800" /> : null}
        </div>
      ))}
    </CardContent>
  </Card>
);

export default AdminServicesDashboard;
