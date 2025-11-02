import { useCallback, useMemo, useState } from "react";
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from "react-native";
import * as Clipboard from "expo-clipboard";

import {
  buildUssdString,
  createUssdCopyEvent,
  createUssdLaunchEvent,
  formatTelUri,
  formatUssdDisplay,
  sanitizeAmount,
  type Provider,
  type UssdAnalyticsEvent,
} from "@rayon/api/payments/ussd";

const DISABLED_STATES = new Set(["off", "disabled", "false", "0", "none"]);

const environmentLabel = (process.env.EXPO_PUBLIC_ENVIRONMENT_LABEL ?? "").trim().toLowerCase();
const isProductionEnv = environmentLabel === "production" || environmentLabel === "prod";

const parseRolloutEnabled = (value: string | undefined, fallback: boolean) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalised = value.trim().toLowerCase();
  if (!normalised) {
    return fallback;
  }

  if (DISABLED_STATES.has(normalised)) {
    return false;
  }

  if (normalised === "internal" || normalised === "beta") {
    return !isProductionEnv;
  }

  return true;
};

const COPY_ROLLOUT_ENABLED = parseRolloutEnabled(process.env.EXPO_PUBLIC_ROLLOUT_USSD_COPY, true);
const ANALYTICS_ENABLED = parseRolloutEnabled(process.env.EXPO_PUBLIC_ROLLOUT_USSD_ANALYTICS, true);

const logAnalyticsEvent = (event: UssdAnalyticsEvent) => {
  if (!ANALYTICS_ENABLED) {
    return;
  }

  if (typeof console !== "undefined") {
    if (typeof console.debug === "function") {
      console.debug("[mobile][ussd]", event);
    } else {
      console.log("[mobile][ussd]", event);
    }
  }
};

export type MobileUssdPayButtonProps = {
  amount: number;
  phone?: string;
  provider?: Provider;
  disabled?: boolean;
  disabledLabel?: string;
  onCopied?: () => void;
  onDial?: () => void;
  style?: StyleProp<ViewStyle>;
};

const COPY_STATUS_LABEL: Record<"idle" | "copied" | "failed", string> = {
  idle: "Copy USSD",
  copied: "Code copied",
  failed: "Copy failed",
};

export function UssdPayButton({
  amount,
  phone,
  provider = "mtn",
  disabled = false,
  disabledLabel = "Unavailable",
  onCopied,
  onDial,
  style,
}: MobileUssdPayButtonProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [dialError, setDialError] = useState<string | null>(null);

  const sanitisedAmount = useMemo(() => Number.parseInt(sanitizeAmount(amount), 10), [amount]);
  const isAmountInvalid = !Number.isFinite(sanitisedAmount) || sanitisedAmount <= 0;
  const isDisabled = disabled || isAmountInvalid;

  const rawCode = useMemo(
    () => (isDisabled ? "" : buildUssdString({ amount: sanitisedAmount, phone, provider })),
    [isDisabled, sanitisedAmount, phone, provider],
  );
  const href = useMemo(() => (rawCode ? formatTelUri(rawCode) : ""), [rawCode]);
  const displayCode = useMemo(() => (href ? formatUssdDisplay(href) : ""), [href]);

  const iosCopyEnabled = COPY_ROLLOUT_ENABLED && Platform.OS === "ios" && !isDisabled;

  const handleCopy = useCallback(async () => {
    if (!iosCopyEnabled || !displayCode) {
      return false;
    }

    try {
      await Clipboard.setStringAsync(displayCode);
      setCopyStatus("copied");
      onCopied?.();
      logAnalyticsEvent(
        createUssdCopyEvent({
          displayCode,
          succeeded: true,
        }),
      );
      return true;
    } catch (error) {
      console.warn("[mobile][ussd] clipboard copy failed", error);
      setCopyStatus("failed");
      logAnalyticsEvent(
        createUssdCopyEvent({
          displayCode,
          succeeded: false,
        }),
      );
      return false;
    }
  }, [displayCode, iosCopyEnabled, onCopied]);

  const handleDial = useCallback(async () => {
    if (!href || isDisabled) {
      return;
    }

    try {
      await Linking.openURL(href);
      setDialError(null);
      onDial?.();
      logAnalyticsEvent(
        createUssdLaunchEvent({
          href,
          original: rawCode,
          fallbackConfigured: iosCopyEnabled,
        }),
      );
    } catch (error) {
      console.warn("[mobile][ussd] dial failed", error);
      setDialError("Dial failed, copy the code instead.");
      await handleCopy();
    }
  }, [handleCopy, href, iosCopyEnabled, isDisabled, onDial, rawCode]);

  return (
    <View style={[styles.container, style]} testID="mobile-ussd-container">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPress={handleDial}
        style={[styles.primaryButton, isDisabled && styles.disabledButton]}
        testID="mobile-ussd-dial"
      >
        <Text style={styles.primaryLabel}>{isDisabled ? disabledLabel : "Pay via USSD"}</Text>
      </TouchableOpacity>

      {iosCopyEnabled ? (
        <View style={styles.copyContainer}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleCopy}
            style={styles.secondaryButton}
            testID="mobile-ussd-copy"
          >
            <Text style={styles.secondaryLabel}>{COPY_STATUS_LABEL[copyStatus]}</Text>
          </TouchableOpacity>
          <Text style={styles.helper} testID="mobile-ussd-display">
            Dial {displayCode}
          </Text>
        </View>
      ) : null}

      {dialError ? (
        <Text style={styles.error} accessibilityRole="alert">
          {dialError}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 14,
    paddingVertical: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryLabel: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "600",
  },
  copyContainer: {
    gap: 6,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "rgba(17,24,39,0.08)",
    borderRadius: 12,
    paddingVertical: 12,
  },
  secondaryLabel: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "500",
  },
  helper: {
    color: "#4B5563",
    fontSize: 13,
    textAlign: "center",
  },
  error: {
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
  },
});

export default UssdPayButton;
