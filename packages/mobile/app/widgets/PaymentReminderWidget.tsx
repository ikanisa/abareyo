import { useMemo } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

type PaymentReminderWidgetProps = {
  amount: number;
  reference?: string;
  supportWhatsAppNumber?: string;
  deeplink?: string;
};

const buildWhatsAppMessage = (amount: number, reference?: string) => {
  const formattedAmount = new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF" }).format(amount);
  const parts = [
    `Payment confirmation for ${formattedAmount}`,
    reference ? `Reference: ${reference}` : null,
    "Customer notified via SMS/WhatsApp per policy.",
  ]
    .filter(Boolean)
    .join("\n");
  return encodeURIComponent(parts);
};

export const PaymentReminderWidget = ({
  amount,
  reference,
  supportWhatsAppNumber = "250788000000",
  deeplink = "rayon://payments/history",
}: PaymentReminderWidgetProps) => {
  const whatsappMessage = useMemo(() => buildWhatsAppMessage(amount, reference), [amount, reference]);
  const whatsappLink = useMemo(() => {
    const phone = supportWhatsAppNumber.replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${whatsappMessage}`;
  }, [supportWhatsAppNumber, whatsappMessage]);

  const openLink = (url: string) => {
    Linking.openURL(url).catch((error) => {
      console.warn("Unable to open link", error);
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Payment-first reminder</Text>
      <Text style={styles.copy}>
        Customers must receive MTN/Airtel confirmation via SMS or WhatsApp before UI updates are
        marked complete. Record the reference so reconciliation stays auditable and meets the
        finance retention policy.
      </Text>
      <View style={styles.meta}>
        <Text style={styles.metaLabel}>Amount</Text>
        <Text style={styles.metaValue}>{`RWF ${amount.toLocaleString("en-US")}`}</Text>
      </View>
      {reference ? (
        <View style={styles.meta}>
          <Text style={styles.metaLabel}>Reference</Text>
          <Text style={styles.metaValue}>{reference}</Text>
        </View>
      ) : null}
      <Pressable accessibilityRole="button" onPress={() => openLink(deeplink)} style={styles.primaryCta}>
        <Text style={styles.primaryCtaText}>Open payment history</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => openLink(whatsappLink)} style={styles.secondaryCta}>
        <Text style={styles.secondaryCtaText}>Send WhatsApp receipt</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: "#0f172a",
    gap: 12,
  },
  heading: {
    fontSize: 18,
    color: "#f1f5f9",
    fontWeight: "700",
  },
  copy: {
    color: "rgba(226,232,240,0.9)",
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    backgroundColor: "rgba(15,118,110,0.15)",
    borderRadius: 12,
    padding: 12,
  },
  metaLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    color: "rgba(226,232,240,0.7)",
  },
  metaValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#34d399",
  },
  primaryCta: {
    borderRadius: 999,
    paddingVertical: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
  },
  primaryCtaText: {
    color: "#fff",
    fontWeight: "600",
  },
  secondaryCta: {
    borderRadius: 999,
    paddingVertical: 12,
    borderColor: "rgba(148,163,184,0.6)",
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryCtaText: {
    color: "rgba(241,245,249,0.9)",
    fontWeight: "500",
  },
});

export default PaymentReminderWidget;
