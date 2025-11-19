import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

type StoreLinkMap = {
  ios?: string;
  android?: string;
  universal?: string;
};

type InstallPromptProps = {
  storeLinks?: StoreLinkMap;
  heading?: string;
  description?: string;
  onDismiss?: () => void;
};

const DEFAULT_STORE_LINKS: StoreLinkMap = {
  ios: "https://apps.apple.com/app/id6502774330",
  android: "https://play.google.com/store/apps/details?id=com.rayon.app",
};

const hasWindow = () => typeof window !== "undefined";

const STORAGE_KEY = "rayon-pwa-opt-in";

const readStoredOptIn = (): boolean => {
  if (!hasWindow()) return false;
  try {
    const payload = window.localStorage.getItem(STORAGE_KEY);
    if (!payload) return false;
    const record = JSON.parse(payload) as { timestamp?: number } | null;
    if (!record?.timestamp) return false;
    const age = Date.now() - record.timestamp;
    const ttl = 1000 * 60 * 60 * 24 * 180;
    if (age < 0 || age > ttl) {
      window.localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("Unable to read stored PWA preference", error);
    return false;
  }
};

const recordStoredOptIn = () => {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ timestamp: Date.now(), optedIn: true, reason: "install" }),
    );
  } catch (error) {
    console.warn("Unable to persist PWA preference", error);
  }
};

export const InstallPrompt = ({
  storeLinks = DEFAULT_STORE_LINKS,
  heading = "Install GIKUNDIRO App?",
  description = "Save fixtures, tickets, and wallet access offline with the home screen app experience.",
  onDismiss,
}: InstallPromptProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showWebPrompt, setShowWebPrompt] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [showNativeSheet, setShowNativeSheet] = useState(false);
  const [ctaBusy, setCtaBusy] = useState(false);
  const installButtonRef = useRef<Pressable | null>(null);
  const closeButtonRef = useRef<Pressable | null>(null);
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();

  const resolvedStoreLink = useMemo(() => {
    if (Platform.OS === "ios") {
      return storeLinks.ios ?? storeLinks.universal ?? null;
    }
    if (Platform.OS === "android") {
      return storeLinks.android ?? storeLinks.universal ?? null;
    }
    return storeLinks.universal ?? storeLinks.ios ?? storeLinks.android ?? null;
  }, [storeLinks]);

  useEffect(() => {
    if (Platform.OS !== "web") {
      setShowNativeSheet(Boolean(resolvedStoreLink));
      setShowIosPrompt(Platform.OS === "ios" && !resolvedStoreLink);
      return;
    }

    if (!hasWindow()) return;
    if (readStoredOptIn()) {
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isiOS = /iphone|ipad|ipod/.test(ua);
    const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
    const inStandalone =
      "standalone" in navigatorWithStandalone && Boolean(navigatorWithStandalone.standalone);
    if (isiOS && !inStandalone) {
      setShowIosPrompt(true);
    }

    const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setShowWebPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, [resolvedStoreLink]);

  useEffect(() => {
    if (showWebPrompt) {
      installButtonRef.current?.focus();
    }
  }, [showWebPrompt]);

  useEffect(() => {
    if (showIosPrompt) {
      closeButtonRef.current?.focus();
    }
  }, [showIosPrompt]);

  const closeAll = useCallback(() => {
    setShowWebPrompt(false);
    setShowIosPrompt(false);
    setShowNativeSheet(false);
    onDismiss?.();
  }, [onDismiss]);

  const handleInstall = useCallback(async () => {
    if (Platform.OS === "web") {
      recordStoredOptIn();
      try {
        await deferredPrompt?.prompt();
      } catch (error) {
        console.warn("PWA installation prompt failed", error);
      } finally {
        closeAll();
      }
      return;
    }

    if (!resolvedStoreLink) {
      closeAll();
      return;
    }

    setCtaBusy(true);
    try {
      const supported = await Linking.canOpenURL(resolvedStoreLink);
      if (supported) {
        await Linking.openURL(resolvedStoreLink);
      }
    } catch (error) {
      console.warn("Unable to open store link", error);
    } finally {
      setCtaBusy(false);
      closeAll();
    }
  }, [closeAll, deferredPrompt, resolvedStoreLink]);

  if (!showWebPrompt && !showIosPrompt && !showNativeSheet) {
    return null;
  }

  const renderButtons = (primaryLabel: string, secondaryLabel = "Not now") => (
    <View style={styles.actions}>
      <Pressable
        ref={installButtonRef}
        accessibilityRole="button"
        onPress={handleInstall}
        disabled={ctaBusy}
        style={[styles.buttonPrimary, ctaBusy && styles.buttonDisabled]}
      >
        <Text style={styles.buttonPrimaryText}>{ctaBusy ? "Opening..." : primaryLabel}</Text>
      </Pressable>
      <Pressable
        ref={closeButtonRef}
        accessibilityRole="button"
        onPress={closeAll}
        style={styles.buttonSecondary}
      >
        <Text style={styles.buttonSecondaryText}>{secondaryLabel}</Text>
      </Pressable>
    </View>
  );

  const bodyCopy = (
    <>
      <Text nativeID={dialogTitleId} style={styles.heading}>
        {heading}
      </Text>
      <Text nativeID={dialogDescriptionId} style={styles.description}>
        {description}
      </Text>
    </>
  );

  return (
    <View
      role="dialog"
      aria-modal="true"
      accessibilityLabelledBy={dialogTitleId}
      accessibilityHint={dialogDescriptionId}
      style={styles.container}
    >
      {bodyCopy}
      {showIosPrompt
        ? renderButtons("Got it", "Dismiss message")
        : renderButtons(Platform.OS === "web" ? "Install" : "Open store")}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 48,
    borderRadius: 20,
    padding: 16,
    backgroundColor: "rgba(10,10,10,0.92)",
    gap: 12,
  },
  heading: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  description: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  buttonPrimary: {
    flexGrow: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#3b82f6",
    alignItems: "center",
  },
  buttonPrimaryText: {
    color: "#fff",
    fontWeight: "600",
  },
  buttonSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  buttonSecondaryText: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default InstallPrompt;
