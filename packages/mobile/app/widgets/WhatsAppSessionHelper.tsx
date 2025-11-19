import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

type WhatsAppSessionHelperProps = {
  phone: string;
  baseUrl?: string;
  supportWhatsAppNumber?: string;
  escalationNumber?: string;
  manualSessionDocUrl?: string;
};

const otpStatusSchema = z
  .object({
    whatsapp: z
      .object({
        lastDeliveryStatus: z.string().optional(),
        lastError: z.string().nullish(),
        lastSentAt: z.string().nullish(),
        templateApproved: z.boolean().optional(),
      })
      .default({}),
    redis: z.object({ connected: z.boolean().optional() }).optional(),
  })
  .default({ whatsapp: {} });

type OtpStatus = z.infer<typeof otpStatusSchema>;

const resendSchema = z
  .object({
    ok: z.boolean().optional(),
    status: z.string().optional(),
  })
  .passthrough();

const formatRelativeTime = (iso?: string | null) => {
  if (!iso) return "Unknown";
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return iso;
  const delta = Date.now() - timestamp;
  if (delta < 0) return "Just now";
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const openLink = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch (error) {
    console.warn("Unable to open link", error);
  }
};

export const WhatsAppSessionHelper = ({
  phone,
  baseUrl = "/api",
  supportWhatsAppNumber = "250788000000",
  escalationNumber = "250788000000",
  manualSessionDocUrl = "https://github.com/rayonhq/abareyo/blob/main/docs/runbooks/otp-fallbacks.md#2-manual-session-provisioning",
}: WhatsAppSessionHelperProps) => {
  const [status, setStatus] = useState<OtpStatus>({ whatsapp: {} });
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/otp/status`, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Status request failed with ${response.status}`);
      }
      const payload = await response.json();
      setStatus(otpStatusSchema.parse(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const resendOtp = useCallback(async () => {
    setResending(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/otp/whatsapp/resend`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Resend failed with ${response.status}`);
      }
      resendSchema.parse(await response.json().catch(() => ({ ok: true })));
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setResending(false);
    }
  }, [baseUrl, fetchStatus, phone]);

  const whatsappLink = useMemo(() => {
    const digits = supportWhatsAppNumber.replace(/\D/g, "");
    const message = encodeURIComponent(`Checking OTP delivery for ${phone}`);
    return `https://wa.me/${digits}?text=${message}`;
  }, [phone, supportWhatsAppNumber]);

  const escalationLink = useMemo(() => {
    const digits = escalationNumber.replace(/\D/g, "");
    const message = encodeURIComponent("Escalating WhatsApp OTP incident per runbook.");
    return `https://wa.me/${digits}?text=${message}`;
  }, [escalationNumber]);

  const lastStatus = status.whatsapp?.lastDeliveryStatus ?? "unknown";
  const lastSentAgo = formatRelativeTime(status.whatsapp?.lastSentAt);
  const redisHealthy = status.redis?.connected !== false;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.heading}>WhatsApp session helper</Text>
        <Text style={[styles.badge, redisHealthy ? styles.badgeOk : styles.badgeWarn]}>
          {redisHealthy ? "Redis healthy" : "Redis degraded"}
        </Text>
      </View>
      <Text style={styles.copy}>
        Monitor OTP delivery, resend messages, or trigger the manual session flow when Redis or the
        Meta template misbehaves. Follow the runbook if you need to mint a temporary session.
      </Text>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Last status</Text>
        <Text style={styles.statusValue}>{lastStatus}</Text>
      </View>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Last sent</Text>
        <Text style={styles.statusValue}>{lastSentAgo}</Text>
      </View>
      {status.whatsapp?.lastError ? (
        <Text style={styles.errorCopy}>{status.whatsapp.lastError}</Text>
      ) : null}
      {error ? <Text style={styles.errorCopy}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={resendOtp}
        disabled={resending}
        style={[styles.primaryCta, resending && styles.disabled]}
      >
        <Text style={styles.primaryCtaText}>{resending ? "Resending..." : "Resend WhatsApp OTP"}</Text>
      </Pressable>
      <View style={styles.secondaryRow}>
        <Pressable accessibilityRole="button" onPress={() => openLink(whatsappLink)} style={styles.secondaryCta}>
          <Text style={styles.secondaryCtaText}>Open chat</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => openLink(escalationLink)} style={styles.secondaryCta}>
          <Text style={styles.secondaryCtaText}>Escalate</Text>
        </Pressable>
      </View>
      <Pressable accessibilityRole="link" onPress={() => openLink(manualSessionDocUrl)}>
        <Text style={styles.linkText}>Manual session instructions</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={fetchStatus} disabled={loading} style={styles.refreshCta}>
        <Text style={styles.refreshText}>{loading ? "Refreshing..." : "Refresh status"}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: "#111827",
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  badgeOk: {
    backgroundColor: "rgba(34,197,94,0.2)",
    color: "#4ade80",
  },
  badgeWarn: {
    backgroundColor: "rgba(251,191,36,0.2)",
    color: "#fbbf24",
  },
  copy: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  statusValue: {
    color: "#fff",
    fontWeight: "600",
  },
  errorCopy: {
    color: "#f87171",
    fontSize: 13,
  },
  primaryCta: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#2563eb",
  },
  primaryCtaText: {
    color: "#fff",
    fontWeight: "600",
  },
  secondaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryCta: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryCtaText: {
    color: "rgba(255,255,255,0.95)",
    fontWeight: "500",
  },
  linkText: {
    color: "#38bdf8",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  refreshCta: {
    alignItems: "center",
    paddingVertical: 8,
  },
  refreshText: {
    color: "rgba(148,163,184,0.9)",
    fontSize: 13,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default WhatsAppSessionHelper;
