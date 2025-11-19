"use client";

import { useEffect, useMemo, useState } from "react";

import { QRCodeCanvas } from "qrcode.react";
import { CheckCircle2, Loader2, RefreshCw, Smartphone, Zap } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { GlassCard } from "@/components/ui/glass-card";
import { consumeHandshake, pollHandshakeStatus, requestHandshake, type Handshake, type QrPayload } from "@/lib/api/qr-handshake";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

const formatRemaining = (expiresAt?: number) => {
  if (!expiresAt) return "";
  const msRemaining = Math.max(0, expiresAt - Date.now());
  const minutes = Math.floor(msRemaining / 60000);
  const seconds = Math.floor((msRemaining % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const buildStatusCopy = (status: Handshake["status"], t: ReturnType<typeof useI18n>["t"]) => {
  switch (status) {
    case "pending":
      return t(
        "auth.qr.pending",
        "Scan the QR code with your mobile app to confirm this login. The code refreshes automatically.",
      );
    case "confirmed":
      return t(
        "auth.qr.confirmed",
        "We have a match from your phone. Finalizing a Supabase session for this browser...",
      );
    case "completed":
      return t("auth.qr.completed", "Login complete. You can continue using this browser tab.");
    case "expired":
    default:
      return t("auth.qr.expired", "This QR code expired. Generate a new one to continue.");
  }
};

const QrHandshakeCard = () => {
  const supabase = getSupabaseBrowserClient();
  const { refresh } = useAuth();
  const { t } = useI18n();

  const [handshake, setHandshake] = useState<Handshake | null>(null);
  const [qrPayload, setQrPayload] = useState<QrPayload | null>(null);
  const [remaining, setRemaining] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const qrValue = useMemo(() => {
    if (!qrPayload) return "";
    return JSON.stringify(qrPayload);
  }, [qrPayload]);

  const startHandshake = useMutation({
    mutationFn: requestHandshake,
    onSuccess: ({ handshake: nextHandshake, qrPayload: payload }) => {
      setHandshake(nextHandshake);
      setQrPayload(payload);
      setError(null);
    },
    onError: () => {
      setError(t("auth.qr.error", "Unable to start the QR login handshake. Please retry."));
    },
  });

  useEffect(() => {
    startHandshake.mutate();
  }, [startHandshake]);

  useEffect(() => {
    if (!handshake?.expiresAt || handshake.status === "completed") {
      setRemaining("");
      return;
    }

    setRemaining(formatRemaining(handshake.expiresAt));
    const id = setInterval(() => setRemaining(formatRemaining(handshake.expiresAt)), 1000);
    return () => clearInterval(id);
  }, [handshake]);

  const statusQuery = useQuery({
    queryKey: ["qr-handshake", handshake?.id],
    enabled: Boolean(handshake?.id && handshake.status !== "completed" && handshake.status !== "expired"),
    queryFn: async () => {
      if (!handshake) return null;
      const result = await pollHandshakeStatus(handshake.id, 8000);
      setHandshake(result.handshake);
      if (result.handshake.status === "completed") {
        await refresh();
      }
      return result;
    },
    refetchInterval: handshake?.status === "pending" ? 5000 : false,
  });

  const mobileConfirm = useMutation({
    mutationFn: async () => {
      if (!supabase || !handshake || !qrPayload) {
        throw new Error("supabase_missing");
      }
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session?.access_token) {
        throw error ?? new Error("session_missing");
      }
      const { access_token: accessToken, refresh_token: refreshToken } = data.session;
      const result = await consumeHandshake({
        handshakeId: handshake.id,
        secret: qrPayload.secret,
        accessToken,
        refreshToken,
      });
      setHandshake(result);
      return result;
    },
    onError: () => {
      setError(t("auth.qr.confirmError", "We could not confirm from your phone. Try rescanning."));
    },
  });

  const statusMessage = buildStatusCopy(handshake?.status ?? "pending", t);

  return (
    <GlassCard className="flex flex-col gap-4 p-6">
      <div className="flex items-start gap-3">
        <Smartphone className="mt-1 h-5 w-5 text-primary" />
        <div className="flex-1 space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            {t("auth.qr.title", "Use your phone to sign in on desktop")}
          </h2>
          <p className="text-sm text-muted-foreground">{statusMessage}</p>
        </div>
        <div className="text-xs text-muted-foreground">{remaining || ""}</div>
      </div>

      <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-6">
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-muted/40 p-4">
          {qrValue ? <QRCodeCanvas value={qrValue} size={164} level="H" includeMargin /> : <Loader2 className="h-10 w-10 animate-spin" />}
          <div className="text-xs text-muted-foreground">
            {t("auth.qr.helper", "Open the mobile app > tap Login > Scan this code")}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Zap className="mt-0.5 h-4 w-4 text-secondary" />
            <div>
              <p className="font-medium text-foreground">
                {t("auth.qr.realTime", "Real-time status")}
              </p>
              <p>
                {t(
                  "auth.qr.realTimeCopy",
                  "We use long-polling to update this page the moment your phone confirms the login.",
                )}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
            <div>
              <p className="font-medium text-foreground">
                {t("auth.qr.session", "Secure Supabase session")}
              </p>
              <p>
                {t(
                  "auth.qr.sessionCopy",
                  "Once confirmed, we exchange your phone session for a fresh browser session and refresh the Supabase cookies.",
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn"
              type="button"
              onClick={() => startHandshake.mutate()}
              disabled={startHandshake.isPending}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("auth.qr.refresh", "Refresh QR")}
            </button>
            {supabase ? (
              <button
                className="btn-secondary"
                type="button"
                onClick={() => mobileConfirm.mutate()}
                disabled={mobileConfirm.isPending || !handshake || !qrPayload}
              >
                {mobileConfirm.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("auth.qr.confirming", "Confirming from phone...")}
                  </span>
                ) : (
                  t("auth.qr.confirmButton", "Already on mobile? Tap to confirm")
                )}
              </button>
            ) : null}
          </div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          {statusQuery.isFetching ? (
            <p className="text-xs text-muted-foreground">{t("auth.qr.wait", "Waiting for phone confirmation...")}</p>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
};

export default QrHandshakeCard;
