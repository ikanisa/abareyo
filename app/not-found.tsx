import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const NotFound = () => (
  <div className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 text-left">
      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="text-xl">Page not found</CardTitle>
          <CardDescription className="text-slate-400">
            The route you tried to open is not part of the minimal admin surface.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-400">
          <p>Use the primary navigation to return to a supported view.</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link className="rounded-lg border border-slate-800 px-3 py-2 text-slate-100" href="/">
              Dashboard
            </Link>
            <Link className="rounded-lg border border-slate-800 px-3 py-2 text-slate-100" href="/users">
              Users
            </Link>
            <Link className="rounded-lg border border-slate-800 px-3 py-2 text-slate-100" href="/audit">
              Audit & logs
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
);

export default NotFound;
