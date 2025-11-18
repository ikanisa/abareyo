import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const AdminReportsDashboard = () => (
  <Card className="border-slate-800 bg-slate-900 text-slate-100">
    <CardHeader>
      <CardTitle className="text-lg">Reports</CardTitle>
      <CardDescription className="text-slate-400">Minimal exports and health summaries.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {["Finance", "Ticketing", "Community"].map((report, index) => (
        <div key={report} className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-200">
            <span>{report}</span>
            <span className="text-xs text-slate-400">Scheduled weekly</span>
          </div>
          {index < 2 ? <Separator className="bg-slate-800" /> : null}
        </div>
      ))}
    </CardContent>
  </Card>
);

export default AdminReportsDashboard;
