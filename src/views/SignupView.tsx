"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import PageShell from "@/app/_components/shell/PageShell";
import TopAppBar from "@/app/_components/ui/TopAppBar";
import HeroBlock from "@/app/_components/widgets/HeroBlock";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

const SignupView = () => {
  const { t } = useI18n();
  const { signUp, sendMagicLink, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch", "Passwords must match."));
      return;
    }
    try {
      await signUp({ email: email.trim(), password });
      setMessage(t("auth.signupSuccess", "Account created. Check your inbox to confirm."));
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : t("auth.errors.generic", "Unable to sign up."));
    }
  };

  const handleMagicLink = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await sendMagicLink({ email: email.trim() });
      setMessage(t("auth.magicLinkSent", "Check your email for a magic sign-in link."));
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : t("auth.errors.generic", "Unable to send link."));
    }
  };

  return (
    <PageShell mainClassName="space-y-6 pb-24">
      <TopAppBar right={<Link className="btn" href="/auth/login">{t("auth.signIn", "Sign in")}</Link>} />
      <HeroBlock
        title={t("auth.signupHeadline", "Create your account")}
        subtitle={t("auth.signupSubtitle", "Use email and a strong password to join. Magic links are also available.")}
        ctas={
          <Link className="btn" href="/auth/login">
            {t("auth.haveAccount", "Already have an account?")}
          </Link>
        }
      />

      <section className="space-y-3">
        <GlassCard className="flex flex-col gap-4 p-6">
          <form className="space-y-4" onSubmit={handleSignup}>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email", "Email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password", "Password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t("auth.confirmPassword", "Confirm password")}</Label>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
            {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
            {message && !error && <p className="text-sm text-emerald-500">{message}</p>}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {t("auth.signUp", "Create account")}
              </Button>
              <Button type="button" variant="secondary" disabled={loading} onClick={handleMagicLink} className="w-full sm:w-auto">
                {t("auth.magicLink", "Email me a magic link")}
              </Button>
            </div>
          </form>
        </GlassCard>

        <GlassCard className="flex flex-col gap-4 p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-5 w-5 text-secondary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("auth.signupTips", "Tips for a smooth start")}</h2>
              <p className="text-sm text-muted-foreground">
                {t(
                  "auth.signupCopy",
                  "Use a reachable email address so you never miss password resets or magic links. You can always upgrade permissions later.",
                )}
              </p>
            </div>
          </div>
        </GlassCard>
      </section>
    </PageShell>
  );
};

export default SignupView;
