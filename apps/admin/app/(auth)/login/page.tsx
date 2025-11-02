"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle, Button, Input } from "@rayon/ui";
import { getBrowserClient } from "@/supabase/browser-client";

const LoginPage = () => {
  const router = useRouter();
  const supabase = getBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setError("Supabase credentials are not configured. Contact platform engineering.");
      return;
    }

    startTransition(async () => {
      setError(null);
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        return;
      }
      router.replace("/");
      router.refresh();
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Admin console</h1>
        <p className="text-sm text-muted-foreground">Sign in with your Rayon FC staff credentials.</p>
      </div>
      {error ? (
        <Alert variant="danger">
          <AlertTitle>Authentication failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-4">
        <label className="space-y-2 text-left text-sm font-medium">
          <span>Email</span>
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="space-y-2 text-left text-sm font-medium">
          <span>Password</span>
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Multifactor enforcement is handled via Supabase policies. Contact security@rayonfc.rw if you encounter issues.
      </p>
    </form>
  );
};

export default LoginPage;
