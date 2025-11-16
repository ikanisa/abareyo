import { PageHeader } from "@/app/_components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const preferences = [
  { title: "Notifications", description: "Weekly digests for audit summaries and incident wrap-ups." },
  { title: "Environment", description: "Production channel locked. Sandbox deploys paused." },
  { title: "Access", description: "SCIM and SSO enforced for all maintainers." },
];

const SettingsPage = () => (
  <div className="space-y-8">
    <PageHeader title="Settings" description="Compact controls for the control center itself." />

    <Card className="border-slate-800 bg-slate-900 text-slate-100">
      <CardHeader>
        <CardTitle className="text-lg">Workspace preferences</CardTitle>
        <CardDescription className="text-slate-400">Only the essentials needed to stay aligned.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {preferences.map((preference, index) => (
          <div key={preference.title} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-50">{preference.title}</p>
                <p className="text-xs text-slate-400">{preference.description}</p>
              </div>
              <Button size="sm" variant="secondary" className="bg-slate-800 text-slate-50 hover:bg-slate-700">
                Edit
              </Button>
            </div>
            {index < preferences.length - 1 ? <Separator className="bg-slate-800" /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

export default SettingsPage;
