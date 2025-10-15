"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";

import { OptimizedImage } from "@/components/ui/optimized-image";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useI18n } from "@/providers/i18n-provider";

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "/api";
const ADMIN_LOGIN_ENDPOINT = `${BACKEND_BASE}/admin/auth/supabase`;
const ADMIN_LOGOUT_ENDPOINT = `${BACKEND_BASE}/admin/auth/logout`;

type Step = "credentials" | "mfa";

interface MfaState {
  factor: {
    id: string;
    status: string;
  };
  challengeId: string;
  expiresAt: number | null;
}

export default function AdminLoginForm() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const { t } = useI18n();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [mfa, setMfa] = useState<MfaState | null>(null);
  const [formPending, setFormPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!supabase) {
      setError(t("adminAuth.errors.misconfigured", "Supabase configuration is missing."));
    }
  }, [supabase, t]);

  useEffect(() => {
    if (step === "mfa") {
      codeInputRef.current?.focus();
    } else {
      emailInputRef.current?.focus();
    }
  }, [step]);

  const resetState = useCallback((options?: { clearCredentials?: boolean }) => {
    setStep("credentials");
    setCode("");
    setMfa(null);
    setMessage(null);
    setError(null);
    setFormPending(false);
    setResendPending(false);
    setSwitchingAccount(false);
    if (options?.clearCredentials) {
      setEmail("");
      setPassword("");
    }
  }, []);

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
          let messageText = t(
            "adminAuth.errors.session",
            "Failed to establish an admin session."
          );
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

        setMessage(
          t("adminAuth.success.redirect", "Success! Redirecting to admin dashboard…")
        );
        router.refresh();
        router.push("/admin");
        return true;
      } catch (exchangeError) {
        console.error("Admin session exchange failed", exchangeError);
        setError(t("adminAuth.errors.session", "Failed to establish an admin session."));
        await supabase.auth.signOut();
        return false;
      }
    },
    [router, supabase, t]
  );

  const startMfaChallenge = useCallback(async () => {
    if (!supabase) {
      throw new Error("supabase_unavailable");
    }
    const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) throw new Error("list_factors_failed");
    const totpFactors = factorsData?.totp ?? [];
    const factor = totpFactors.find((item) => item.status === "verified");
    if (!factor) throw new Error("no_totp_factor");
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: factor.id,
    });
    if (challengeError || !challengeData)
      throw new Error(challengeError?.message || "challenge_failed");

    let expiresAt: number | null = null;
    const expiresRaw = (challengeData as { expiresAt?: number | string | null }).expiresAt;
    if (typeof expiresRaw === "number") {
      expiresAt = expiresRaw;
    } else if (typeof expiresRaw === "string") {
      const parsed = Date.parse(expiresRaw);
      expiresAt = Number.isNaN(parsed) ? null : Math.round(parsed / 1000);
    }

    setMfa({ factor, challengeId: challengeData.id, expiresAt });
    setStep("mfa");
    setCode("");
    setMessage(
      t(
        "adminAuth.mfa.prompt",
        "Enter the 6-digit code from your authenticator app to finish signing in."
      )
    );
    setError(null);
  }, [supabase, t]);

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
          if (
            (signInError as AuthError).status === 400 ||
            (signInError as AuthError).status === 401
          ) {
            setError(t("auth.errors.invalidCredentials", "Email or password was incorrect."));
          } else {
            setError(
              signInError.message || t("auth.errors.generic", "Something went wrong. Try again.")
            );
          }
          return;
        }

        const session = data.session;
        if (session?.access_token) {
          await completeAdminSignIn(session.access_token);
          return;
        }

        await startMfaChallenge();
      } catch (unknownError) {
        console.error("Sign in failed", unknownError);
        setError(t("auth.errors.generic", "Something went wrong. Try again."));
      } finally {
        setFormPending(false);
      }
    },
    [completeAdminSignIn, email, password, startMfaChallenge, supabase, t]
  );

  const handleMfaSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!supabase) {
        setError(t("adminAuth.errors.misconfigured", "Supabase configuration is missing."));
        return;
      }
      if (!mfa) {
        setError(t("adminAuth.mfa.missing", "No verified authenticator was found for this account."));
        return;
      }
      if (code.trim().length < 6) {
        setError(t("auth.errors.enterCode", "Enter the 6-digit code from your authenticator."));
        return;
      }
      setFormPending(true);
      setError(null);
      setMessage(null);
      try {
        const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
          factorId: mfa.factor.id,
          challengeId: mfa.challengeId,
          code,
        });
        if (verifyError) {
          if (
            (verifyError as AuthError).status === 400 ||
            (verifyError as AuthError).status === 422
          ) {
            setError(t("auth.errors.invalidCode", "That code was not accepted. Try again."));
          } else {
            setError(
              verifyError.message ||
                t("auth.errors.generic", "Unable to verify the authenticator code.")
            );
          }
          return;
        }

        const accessToken = verifyData?.access_token;
        if (accessToken) {
          await completeAdminSignIn(accessToken);
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const fallbackToken = sessionData.session?.access_token;
        if (!fallbackToken) {
          setError(t("auth.errors.generic", "Something went wrong. Try again."));
          return;
        }
        await completeAdminSignIn(fallbackToken);
      } catch (unknownError) {
        console.error("MFA verification failed", unknownError);
        setError(t("auth.errors.generic", "Unable to verify the authenticator code."));
      } finally {
        setFormPending(false);
      }
    },
    [code, completeAdminSignIn, mfa, supabase, t]
  );

  const handleResend = useCallback(async () => {
    if (!supabase || !mfa?.factor || resendPending) return;
    setResendPending(true);
    setError(null);
    try {
      await startMfaChallenge();
      setMessage(
        t("adminAuth.mfa.codeResent", "We've sent a new code to your authenticator.")
      );
    } catch (challengeError) {
      console.error("MFA challenge restart failed", challengeError);
      setError(t("auth.errors.generic", "We couldn't start multi-factor authentication."));
    } finally {
      setResendPending(false);
    }
  }, [mfa, resendPending, startMfaChallenge, supabase, t]);

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
      resetState({ clearCredentials: true });
      setSwitchingAccount(false);
    }
  }, [resetState, supabase, switchingAccount]);

  const submitHandler = step === "credentials" ? handleCredentialsSubmit : handleMfaSubmit;
  const disableInputs =
    !supabase || formPending || resendPending || switchingAccount;

  return (
    <form onSubmit={submitHandler} className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-neutral-0">
        <OptimizedImage src="/logo-window.svg" alt="SACCO" width={48} height={48} priority />
        <h2 className="text-sm font-semibold">
          {t("adminAuth.title", "Sign in as administrator")}
        </h2>
        <p className="text-xs text-neutral-2">
          {step === "credentials"
            ? t(
                "adminAuth.subtitle",
                "Use your administrator email and password to continue."
              )
            : t(
                "adminAuth.mfa.title",
                "Finish signing in with your authenticator app."
              )}
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
      {step === "credentials" ? (
        <div className="space-y-2 text-left">
          <label
            htmlFor="admin-email"
            className="block text-xs uppercase tracking-[0.3em] text-neutral-2"
          >
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
          <label
            htmlFor="admin-password"
            className="block text-xs uppercase tracking-[0.3em] text-neutral-2"
          >
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
      ) : (
        <div className="space-y-2 text-left">
          <label
            htmlFor="admin-code"
            className="block text-xs uppercase tracking-[0.3em] text-neutral-2"
          >
            {t("adminAuth.code.label", "Authenticator code")}
          </label>
          <input
            id="admin-code"
            name="code"
            type="text"
            ref={codeInputRef}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-0 placeholder-neutral-500"
            placeholder="· · · · · ·"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            disabled={disableInputs}
            required
          />
          <button
            type="button"
            className="text-sm text-neutral-3 underline"
            onClick={handleResend}
            disabled={disableInputs}
          >
            {t("adminAuth.mfa.resend", "Resend code")}
          </button>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <button
          type="submit"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-neutral-0 disabled:bg-neutral-700"
          disabled={disableInputs}
        >
          {step === "credentials"
            ? t("adminAuth.submit", "Sign in")
            : t("adminAuth.verify", "Verify code")}
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
