"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";

import PageShell from "@/app/_components/shell/PageShell";
import TopAppBar from "@/app/_components/ui/TopAppBar";
import HeroBlock from "@/app/_components/widgets/HeroBlock";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

const LoginView = () => {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { loginWithSupabase, user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setError(t("auth.errors.misconfigured", "Supabase configuration is missing."));
      return;
    }

    setPending(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        const message =
          (signInError as AuthError).status === 400 || (signInError as AuthError).status === 401
            ? t("auth.errors.invalidCredentials", "Email or password was incorrect.")
            : signInError.message || t("auth.errors.generic", "Something went wrong. Try again.");
        setError(message);
        return;
      }

      const accessToken = data.session?.access_token;
      if (!accessToken) {
        setError(t("auth.errors.missingAccessToken", "Supabase did not return an access token."));
        return;
      }

      await loginWithSupabase(accessToken).catch((loginError: unknown) => {
        if (loginError instanceof Error) {
          setError(loginError.message);
        } else {
          setError(t("auth.errors.generic", "Something went wrong. Try again."));
        }
        throw loginError;
      });

      setPassword("");
      toast({
        title: t("auth.loginSuccess", "Welcome back!"),
        description: t("auth.loginRedirect", "Your supporter session is ready."),
      });
      router.push("/more");
    } catch (err) {
      console.error("Fan login failed", err);
    } finally {
      setPending(false);
    }
  };

  if (!supabase) {
    return (
      <PageShell mainClassName="space-y-6 pb-24">
        <TopAppBar />
        <HeroBlock title={t("auth.login", "Log in")}
          subtitle={t("auth.errors.misconfigured", "Supabase configuration is missing. Contact support.")} />
      </PageShell>
    );
  }

  if (user) {
    return (
      <PageShell mainClassName="space-y-6 pb-24">
        <TopAppBar />
        <HeroBlock
          title={t("auth.alreadySignedIn", "You're already signed in")}
          subtitle={t("auth.alreadySignedInSubtitle", "Manage your account from the More tab.")}
          ctas={<Link className="btn-primary" href="/more">{t("nav.more", "More")}</Link>}
        />
      </PageShell>
    );
  }

  return (
    <PageShell mainClassName="space-y-6 pb-24">
      <TopAppBar />
      <HeroBlock
        title={t("auth.login", "Log in")}
        subtitle={t("auth.loginSubtitle", "Sign in with your supporter email to sync wallet and passes." )}
        ctas={
          <Link className="btn" href="/onboarding">
            {t("auth.startOnboarding", "New fan? Start onboarding")}
          </Link>
        }
      />

      <section className="space-y-3">
        <GlassCard className="space-y-4 p-6">
          <header className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">{t("auth.login", "Log in")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("auth.loginDescription", "Use your Supabase supporter credentials to access wallet, tickets, and membership.")}
            </p>
          </header>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                {t("auth.email", "Email")}
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                {t("auth.password", "Password")}
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? t("auth.loggingIn", "Signing in…") : t("auth.login", "Log in")}
            </Button>
          </form>
        </GlassCard>
      </section>
    </PageShell>
  );
};

export default LoginView;
