import Link from "next/link";

import { Alert, AlertDescription, AlertTitle, Button } from "@rayon/ui";

const UnauthorizedPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
    <Alert variant="warning" className="max-w-lg">
      <AlertTitle>Access restricted</AlertTitle>
      <AlertDescription>
        You&apos;re signed in, but your account does not have permission to view this resource. Request access from an
        administrator or switch to a permitted workspace.
      </AlertDescription>
    </Alert>
    <div className="flex gap-3">
      <Button asChild variant="secondary">
        <Link href="/">Go to overview</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/login">Return to login</Link>
      </Button>
    </div>
  </div>
);

export default UnauthorizedPage;
