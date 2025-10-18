"use client";

import Link from "next/link";
import { LifeBuoy, ShieldCheck, User } from "lucide-react";

import PageShell from "@/app/_components/shell/PageShell";
import TopAppBar from "@/app/_components/ui/TopAppBar";
import HeroBlock from "@/app/_components/widgets/HeroBlock";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

const LoginView = () => {
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <PageShell mainClassName="space-y-6 pb-24">
      <TopAppBar right={<Link className="btn" href="/more">{t("nav.more", "More")}</Link>} />
      <HeroBlock
        title={t("auth.loginHeadline", "You're already signed in")}
        subtitle={t(
          "auth.loginSubtitle",
          "Fans receive an anonymous Supabase session on first visit, so wallet and tickets are always available.",
        )}
        ctas={
          <Link className="btn-primary" href="/support">
            {t("auth.needHelp", "Need help?")}
          </Link>
        }
      />

      <section className="space-y-3">
        <GlassCard className="flex flex-col gap-4 p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {t("auth.autoLoginTitle", "How login works")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t(
                  "auth.autoLoginDescription",
                  "The app creates an anonymous Supabase session as soon as you open it. That session is linked to your supporter profile so balances, passes, and rewards follow you automatically.",
                )}
              </p>
            </div>
          </div>

          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• {t("auth.autoLoginBullet1", "No extra email sign-in is required for fans.")}</li>
            <li>• {t("auth.autoLoginBullet2", "Closing the app or switching devices generates a fresh anonymous session automatically.")}</li>
            <li>• {t("auth.autoLoginBullet3", `Your supporter ID stays the same: ${user?.id ?? 'guest'}`)}</li>
          </ul>
        </GlassCard>

        <GlassCard className="flex flex-col gap-4 p-6">
          <div className="flex items-start gap-3">
            <User className="mt-1 h-5 w-5 text-accent" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {t("auth.adminAccounts", "Need to access the admin console?")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t(
                  "auth.adminAccountsDescription",
                  "Email-and-password authentication is reserved for staff in the admin panel.",
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn" href="/admin/login">
              {t("auth.openAdminLogin", "Open admin login")}
            </Link>
            <Link className="btn" href="/support">
              {t("auth.requestAccess", "Request admin access")}
            </Link>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col gap-4 p-6">
          <div className="flex items-start gap-3">
            <LifeBuoy className="mt-1 h-5 w-5 text-secondary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {t("auth.passwordResetTitle", "Password help")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t(
                  "auth.passwordResetDescription",
                  "Need to reset an admin password or revoke a shared device? Visit the admin login page and use the reset link or contact the match-ops team.",
                )}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              "auth.passwordResetNote",
              "Fan sessions do not require passwords. Clearing the app storage or logging out will simply generate a new anonymous session and keep your passes safe.",
            )}
          </p>
        </GlassCard>
      </section>
    </PageShell>
  );
};

export default LoginView;
