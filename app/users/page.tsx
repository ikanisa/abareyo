import { PageHeader } from "@/app/_components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const users = [
  { name: "Aline N.", role: "Owner", status: "Active", lastSeen: "Just now" },
  { name: "James O.", role: "Maintainer", status: "Active", lastSeen: "12m ago" },
  { name: "Moses R.", role: "Analyst", status: "Invited", lastSeen: "—" },
];

const invitations = [
  { email: "ops+billing@rayon.rw", role: "Billing", expires: "Aug 04" },
  { email: "data+contracts@rayon.rw", role: "Viewer", expires: "Aug 06" },
];

const UsersPage = () => (
  <div className="space-y-8">
    <PageHeader
      title="User management"
      description="Keep admin accounts, roles, and invitations lean."
      actions={<Button size="sm">Add member</Button>}
    />

    <Card className="border-slate-800 bg-slate-900 text-slate-100">
      <CardHeader>
        <CardTitle className="text-lg">Current team</CardTitle>
        <CardDescription className="text-slate-400">Account owners and maintainers with panel access.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.map((user, index) => (
          <div key={user.name} className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-50">{user.name}</span>
                <span className="text-xs text-slate-400">{user.role}</span>
              </div>
              <Badge variant={user.status === "Active" ? "default" : "secondary"} className="bg-slate-800 text-xs">
                {user.status}
              </Badge>
              <span className="ml-auto text-xs text-slate-400">Last seen: {user.lastSeen}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="rounded-md bg-slate-900 px-2 py-1">MFA enforced</span>
              <span className="rounded-md bg-slate-900 px-2 py-1">SSO ready</span>
            </div>
            {index < users.length - 1 ? <Separator className="bg-slate-800" /> : null}
          </div>
        ))}
      </CardContent>
    </Card>

    <Card className="border-slate-800 bg-slate-900 text-slate-100">
      <CardHeader>
        <CardTitle className="text-lg">Open invitations</CardTitle>
        <CardDescription className="text-slate-400">Minimal invites with tight expiration windows.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {invitations.map((invite) => (
          <div key={invite.email} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-50">{invite.email}</span>
              <span className="text-xs text-slate-400">{invite.role}</span>
            </div>
            <span className="ml-auto text-xs text-slate-400">Expires {invite.expires}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" className="bg-slate-800 text-slate-50 hover:bg-slate-700">
                Resend
              </Button>
              <Button size="sm" variant="ghost" className="text-slate-300 hover:text-slate-50">
                Revoke
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

export default UsersPage;
