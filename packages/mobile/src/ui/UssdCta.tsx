import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";

import { useTheme } from "@/providers/ThemeProvider";

export type UssdCtaProps = {
  code: string;
  label?: string;
  copyLabel?: string;
  testID?: string;
  copyTestID?: string;
};

const encodeTel = (code: string) => {
  const trimmed = code.startsWith("tel:") ? code : `tel:${code}`;
  return trimmed.replace(/#/g, "%23");
};

export function UssdCta({
  code,
  label = "Dial USSD",
  copyLabel = "Copy USSD",
  testID,
  copyTestID,
}: UssdCtaProps) {
  const theme = useTheme();
  const [status, setStatus] = useState<"idle" | "copied" | "fallback">("idle");

  const formattedCode = useMemo(() => code.replace(/^tel:/, ""), [code]);
  const telUrl = useMemo(() => encodeTel(code), [code]);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(formattedCode);
    setStatus("copied");
  }, [formattedCode]);

  const handleDial = useCallback(async () => {
    try {
      const supported = await Linking.canOpenURL(telUrl);
      if (!supported) {
        setStatus("fallback");
        await handleCopy();
        return;
      }

      await Linking.openURL(telUrl);
      setStatus("idle");
    } catch (error) {
      console.warn("[ussd] Unable to open dialer", error);
      setStatus("fallback");
      await handleCopy();
    }
  }, [handleCopy, telUrl]);

  return (
    <View style={[styles.wrapper, { borderColor: theme.colors.surface, backgroundColor: theme.colors.surface }]}
      accessibilityRole="group"
      accessibilityLabel={`USSD action ${formattedCode}`}
    >
      <Text style={[styles.code, { color: theme.colors.text }]} accessibilityRole="text">
        {formattedCode}
      </Text>
      <Text style={[styles.helper, { color: theme.colors.subtext }]}>
        {status === "copied"
          ? "Code copied — paste in your dialer"
          : status === "fallback"
            ? "Dialer unavailable. Code copied to clipboard."
            : "Tap to dial instantly or copy if your device blocks USSD."}
      </Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityHint="Opens the phone dialer with the USSD code"
          onPress={handleDial}
          style={[styles.button, { backgroundColor: theme.colors.accent }]}
          testID={testID}
        >
          <Text style={styles.buttonLabel}>{label}</Text>
        </Pressable>
        <Pressable
          accessibilityHint="Copies the USSD code to your clipboard"
          onPress={handleCopy}
          style={[styles.button, styles.copyButton, { borderColor: theme.colors.accent }]}
          testID={copyTestID}
        >
          <Text style={[styles.buttonLabel, { color: theme.colors.accent }]}>{copyLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  code: {
    fontSize: 20,
    fontWeight: "700",
  },
  helper: {
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  copyButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  buttonLabel: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
