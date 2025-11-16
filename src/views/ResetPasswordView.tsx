"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import PageShell from "@/app/_components/shell/PageShell";
import TopAppBar from "@/app/_components/ui/TopAppBar";
import HeroBlock from "@/app/_components/widgets/HeroBlock";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

const ResetPasswordView = () => {
  const { t } = useI18n();
  const { resetPassword, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await resetPassword({ email: email.trim() });
      setMessage(t("auth.resetSent", "Password reset email sent."));
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : t("auth.errors.generic", "Unable to reset password."));
    }
  };

  return (
    <PageShell mainClassName="space-y-6 pb-24">
      <TopAppBar right={<Link className="btn" href="/auth/login">{t("auth.signIn", "Sign in")}</Link>} />
      <HeroBlock
        title={t("auth.resetHeadline", "Reset your password")}
        subtitle={t("auth.resetSubtitle", "Enter the email linked to your account to receive a reset link.")}
      />

      <section className="space-y-3">
        <GlassCard className="flex flex-col gap-4 p-6">
          <form className="space-y-4" onSubmit={handleReset}>
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
            {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
            {message && !error && <p className="text-sm text-emerald-500">{message}</p>}
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {t("auth.sendReset", "Send reset link")}
            </Button>
          </form>
        </GlassCard>

        <GlassCard className="flex flex-col gap-4 p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("auth.resetHelp", "Need more help?")}</h2>
              <p className="text-sm text-muted-foreground">
                {t(
                  "auth.resetCopy",
                  "If you no longer have access to this email, contact support so we can verify ownership before updating credentials.",
                )}
              </p>
              <Link className="btn mt-3" href="/support">
                {t("auth.contactSupport", "Contact support")}
              </Link>
            </div>
          </div>
        </GlassCard>
      </section>
    </PageShell>
  );
};

export default ResetPasswordView;
