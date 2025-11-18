import { PageHeader } from "@/app/_components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const logs = [
  {
    actor: "Aline N.",
    action: "Updated role for james@rayon.rw",
    time: "08:34 CAT",
    status: "success" as const,
  },
  {
    actor: "System",
    action: "API latency crossed SLO threshold",
    time: "08:12 CAT",
    status: "warning" as const,
  },
  {
    actor: "James O.",
    action: "Revoked invite for ops+legacy@rayon.rw",
    time: "07:58 CAT",
    status: "success" as const,
  },
];

const filters = ["24h", "7d", "30d"];

const AuditPage = () => (
  <div className="space-y-8">
    <PageHeader
      title="Audit & logs"
      description="Concise event stream for account, access, and configuration changes."
      actions={
        <div className="flex items-center gap-2">
          {filters.map((filter) => (
            <Badge key={filter} variant={filter === "24h" ? "default" : "secondary"} className="bg-slate-800 text-xs">
              {filter}
            </Badge>
          ))}
        </div>
      }
    />

    <Card className="border-slate-800 bg-slate-900 text-slate-100">
      <CardHeader>
        <CardTitle className="text-lg">Recent events</CardTitle>
        <CardDescription className="text-slate-400">Only high-signal actions and alerts are shown.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.map((log, index) => (
          <div key={`${log.actor}-${log.time}`} className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-50">{log.actor}</span>
                <span className="text-xs text-slate-400">{log.action}</span>
              </div>
              <Badge
                variant={log.status === "success" ? "default" : "secondary"}
                className={log.status === "warning" ? "bg-amber-900/50 text-amber-200" : "bg-slate-800"}
              >
                {log.status}
              </Badge>
              <span className="ml-auto text-xs text-slate-400">{log.time}</span>
            </div>
            {index < logs.length - 1 ? <Separator className="bg-slate-800" /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

export default AuditPage;
