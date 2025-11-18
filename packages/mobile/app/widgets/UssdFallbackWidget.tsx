import { useMemo } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { buildUssd, formatUssdDisplay, type Provider } from "@rayon/api/payments/ussd";

type UssdFallbackWidgetProps = {
  amount: number;
  phone?: string;
  provider?: Provider;
  escalationNumber?: string;
  supportWhatsAppNumber?: string;
};

const buildWhatsappCta = (number?: string, message?: string) => {
  if (!number) return null;
  const encodedMessage = encodeURIComponent(message ?? "OTP fallback session needed");
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodedMessage}`;
};

export const UssdFallbackWidget = ({
  amount,
  phone,
  provider = "mtn",
  escalationNumber = "250788000000",
  supportWhatsAppNumber = "250788000000",
}: UssdFallbackWidgetProps) => {
  const telUri = useMemo(() => buildUssd({ amount, phone, provider }), [amount, phone, provider]);
  const readableCode = useMemo(() => formatUssdDisplay(telUri), [telUri]);
  const whatsappEscalation = useMemo(
    () =>
      buildWhatsappCta(
        escalationNumber,
        "Redis degraded or OTP rejected. Need manual session provisioning per runbook.",
      ),
    [escalationNumber],
  );

  const supportLink = useMemo(
    () => buildWhatsappCta(supportWhatsAppNumber, `USSD fallback for ${readableCode}`),
    [readableCode, supportWhatsAppNumber],
  );

  const handleDial = () => {
    Linking.openURL(telUri).catch((error) => {
      console.warn("USSD dial failed", error);
    });
  };

  const handleOpenWhatsapp = (url: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch((error) => {
      console.warn("Unable to open WhatsApp", error);
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>USSD fallback ready</Text>
      <Text style={styles.copy}>
        Redis outages or template rejections should not block onboarding—run the manual session
        provisioning playbook and let fans dial the shortcode directly.
      </Text>
      <View style={styles.codeBlock}>
        <Text style={styles.codeLabel}>Dial code</Text>
        <Text selectable style={styles.codeValue}>
          {readableCode}
        </Text>
      </View>
      <Pressable accessibilityRole="button" onPress={handleDial} style={styles.primaryCta}>
        <Text style={styles.primaryCtaText}>
          {Platform.OS === "ios" ? "Copy & dial" : "Dial now"}
        </Text>
      </Pressable>
      <View style={styles.secondaryActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => handleOpenWhatsapp(supportLink)}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryText}>Share via WhatsApp</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => handleOpenWhatsapp(whatsappEscalation)}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryText}>Escalate to ops</Text>
        </Pressable>
      </View>
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
  heading: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
  },
  copy: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  codeBlock: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    padding: 12,
    gap: 4,
  },
  codeLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.7)",
  },
  codeValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1,
  },
  primaryCta: {
    backgroundColor: "#10b981",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryCtaText: {
    color: "#042f2e",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderColor: "rgba(255,255,255,0.3)",
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryText: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
});

export default UssdFallbackWidget;
