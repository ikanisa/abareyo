"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { OptimizedImage } from "@/components/ui/optimized-image";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useI18n } from "@/providers/i18n-provider";

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "/api";
const ADMIN_LOGIN_ENDPOINT = `${BACKEND_BASE}/admin/auth/supabase`;
const ADMIN_LOGOUT_ENDPOINT = `${BACKEND_BASE}/admin/auth/logout`;

export default function AdminLoginForm() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formPending, setFormPending] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!supabase) {
      setError(t("adminAuth.errors.misconfigured", "Supabase configuration is missing."));
    }
  }, [supabase, t]);

  const completeAdminSignIn = useCallback(
    async (accessToken: string | null | undefined) => {
      if (!supabase) {
        setError(t("adminAuth.errors.misconfigured", "Supabase configuration is missing."));
        return false;
      }
      if (!accessToken) {
        setError(t("adminAuth.errors.missingAccessToken", "Supabase did not return an access token."));
        await supabase.auth.signOut();
        return false;
      }

      try {
        const response = await fetch(ADMIN_LOGIN_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ accessToken }),
        });

        if (!response.ok) {
          let messageText = t("adminAuth.errors.session", "Failed to establish an admin session.");
          try {
            const payload = (await response.json()) as { message?: string; error?: string };
            if (payload?.message) {
              messageText = payload.message;
            } else if (payload?.error) {
              messageText = payload.error;
            }
          } catch (parseError) {
            console.debug("Failed to parse admin session error", parseError);
          }
          setError(messageText);
          await supabase.auth.signOut();
          return false;
        }

        setMessage(t("adminAuth.success.redirect", "Success! Redirecting to admin dashboard…"));
        router.refresh();
        router.push("/admin");
        return true;
      } catch (exchangeError) {
        console.error("Admin session exchange failed", exchangeError);
        setError(t("adminAuth.errors.session", "Failed to establish an admin session."));
        return false;
      }
    },
    [router, supabase, t],
  );

  const handleCredentialsSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!supabase) {
        setError(t("adminAuth.errors.misconfigured", "Supabase configuration is missing."));
        return;
      }
      setFormPending(true);
      setError(null);
      setMessage(null);
      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError(signInError.message || t("auth.errors.generic", "Something went wrong. Try again."));
          return;
        }

        const session = data.session;
        await completeAdminSignIn(session?.access_token);
      } catch (unknownError) {
        console.error("Sign in failed", unknownError);
        setError(t("auth.errors.generic", "Something went wrong. Try again."));
      } finally {
        setFormPending(false);
      }
    },
    [completeAdminSignIn, email, password, supabase, t],
  );

  const handleSwitchAccount = useCallback(async () => {
    if (switchingAccount) return;
    setSwitchingAccount(true);
    setError(null);
    setMessage(null);
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      await fetch(ADMIN_LOGOUT_ENDPOINT, { method: "POST", credentials: "include" });
    } catch (signOutError) {
      console.error("Failed to sign out before switching accounts", signOutError);
    } finally {
      setEmail("");
      setPassword("");
      setSwitchingAccount(false);
    }
  }, [supabase, switchingAccount]);

  const disableInputs = !supabase || formPending || switchingAccount;

  return (
    <form onSubmit={handleCredentialsSubmit} className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-neutral-0">
        <OptimizedImage src="/logo-window.svg" alt="SACCO" width={48} height={48} priority />
        <h2 className="text-sm font-semibold">{t("adminAuth.title", "Sign in as administrator")}</h2>
        <p className="text-xs text-neutral-2">
          {t("adminAuth.subtitle", "Use your administrator email and password to continue.")}
        </p>
      </div>
      {error && (
        <p
          role="alert"
          tabIndex={-1}
          className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {error}
        </p>
      )}
      {message && !error && (
        <p className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      )}
      <div className="space-y-2 text-left">
        <label htmlFor="admin-email" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
          {t("adminAuth.email.label", "Email")}
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          ref={emailInputRef}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-0 placeholder-neutral-500"
          placeholder={t("adminAuth.email.placeholder", "you@example.com")}
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={disableInputs}
          required
        />
        <label htmlFor="admin-password" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
          {t("adminAuth.password.label", "Password")}
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          ref={passwordInputRef}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-0 placeholder-neutral-500"
          placeholder={t("adminAuth.password.placeholder", "••••••••")}
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={disableInputs}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="submit"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-neutral-0 disabled:bg-neutral-700"
          disabled={disableInputs}
        >
          {t("adminAuth.submit", "Sign in")}
        </button>
        <button
          type="button"
          className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-0"
          onClick={handleSwitchAccount}
          disabled={disableInputs}
        >
          {t("adminAuth.switchAccount", "Switch account")}
        </button>
      </div>
    </form>
  );
}
