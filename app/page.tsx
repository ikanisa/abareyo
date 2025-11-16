import { AlertTriangle, CheckCircle2, Clock3, Shield } from "lucide-react";

import { PageHeader } from "./_components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const kpis = [
  { label: "Active sessions", value: "1,284", trend: "+4.2% vs last hour" },
  { label: "Open incidents", value: "3", trend: "2 acknowledged" },
  { label: "Pending invites", value: "12", trend: "5 expire this week" },
];

const tasks = [
  { title: "Rotate service credentials", status: "Due today", icon: Shield },
  { title: "Review access changes", status: "In progress", icon: CheckCircle2 },
  { title: "Publish outage postmortem", status: "Draft", icon: Clock3 },
];

const alerts = [
  {
    title: "Elevated error rate",
    detail: "API latency breached the 95th percentile budget for 7m.",
    severity: "high" as const,
  },
  {
    title: "New admin invited",
    detail: "infrastructure@rayon.rw was added with Maintainer role.",
    severity: "info" as const,
  },
];

const statusTone = {
  high: "text-amber-400",
  info: "text-slate-300",
};

const DashboardPage = () => (
  <div className="space-y-8">
    <PageHeader
      title="Dashboard"
      description="Minimal operational view of user, audit, and platform activity."
      actions={<span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">Live</span>}
    />

    <section className="grid gap-4 md:grid-cols-3">
      {kpis.map((item) => (
        <Card key={item.label} className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold">{item.value}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-400">{item.trend}</CardContent>
        </Card>
      ))}
    </section>

    <Card className="border-slate-800 bg-slate-900 text-slate-100">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Operational alerts</CardTitle>
          <CardDescription className="text-slate-400">
            The most recent platform signals requiring review.
          </CardDescription>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">Realtime feed</span>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.title} className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-400" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-50">{alert.title}</p>
                <p className="text-sm text-slate-400">{alert.detail}</p>
              </div>
              <span className={`ml-auto text-xs ${statusTone[alert.severity]}`}>{alert.severity.toUpperCase()}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>

    <Card className="border-slate-800 bg-slate-900 text-slate-100">
      <CardHeader>
        <CardTitle className="text-lg">Team tasks</CardTitle>
        <CardDescription className="text-slate-400">Lightweight queue for the on-call crew.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.map((task, index) => {
          const Icon = task.icon;
          return (
            <div key={task.title} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800">
                  <Icon className="h-4 w-4 text-slate-200" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-50">{task.title}</p>
                  <p className="text-xs text-slate-400">{task.status}</p>
                </div>
              </div>
              {index < tasks.length - 1 ? <Separator className="bg-slate-800" /> : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  </div>
);

export default DashboardPage;
