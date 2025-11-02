import { useEffect } from "react";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";

type HermesProfiler = {
  enableProfiling?: () => void;
  disableProfiling?: () => void;
  startProfiling?: (name?: string) => unknown;
  stopProfiling?: (name?: string) => unknown;
  startProfile?: (name: string) => unknown;
  stopProfile?: (name?: string) => unknown;
};

type UseHermesStartupTraceOptions = {
  destination?: "cache" | "documents";
  flushDelayMs?: number;
  label?: string;
};

const PROFILE_FLAG = process.env.EXPO_PUBLIC_ENABLE_HERMES_PROFILING;

const isProfilingEnabled = (value: string | undefined) => {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true";
};

const getHermesInternal = (): HermesProfiler | undefined => {
  return (globalThis as { HermesInternal?: HermesProfiler }).HermesInternal;
};

const resolveDirectory = (destination: "cache" | "documents") => {
  if (destination === "documents") {
    return FileSystem.documentDirectory ?? null;
  }
  return FileSystem.cacheDirectory ?? null;
};

const startHermesProfiling = (hermes: HermesProfiler, profileId: string) => {
  try {
    hermes.enableProfiling?.();
    if (typeof hermes.startProfiling === "function") {
      const result = hermes.startProfiling(profileId);
      return result !== false;
    }
    if (typeof hermes.startProfile === "function") {
      hermes.startProfile(profileId);
      return true;
    }
  } catch (error) {
    console.warn("[perf] Hermes profiling could not start", error);
    return false;
  }
  return false;
};

const stopHermesProfiling = (hermes: HermesProfiler, profileId: string) => {
  try {
    let payload: unknown;
    if (typeof hermes.stopProfiling === "function") {
      payload = hermes.stopProfiling(profileId);
    } else if (typeof hermes.stopProfile === "function") {
      payload = hermes.stopProfile(profileId);
    }
    hermes.disableProfiling?.();
    return payload;
  } catch (error) {
    console.warn("[perf] Hermes profiling could not stop cleanly", error);
    return undefined;
  }
};

const persistProfile = async (payload: unknown, targetPath: string) => {
  try {
    if (typeof payload === "string") {
      if (payload.startsWith("file://")) {
        await FileSystem.copyAsync({ from: payload, to: targetPath });
        return targetPath;
      }
      await FileSystem.writeAsStringAsync(targetPath, payload);
      return targetPath;
    }

    const serialised = JSON.stringify(payload, null, 2);
    await FileSystem.writeAsStringAsync(targetPath, serialised);
    return targetPath;
  } catch (error) {
    console.warn("[perf] Failed to persist Hermes profile", error);
    return null;
  }
};

export const useHermesStartupTrace = ({
  destination = "cache",
  flushDelayMs = 6000,
  label = "startup",
}: UseHermesStartupTraceOptions = {}) => {
  useEffect(() => {
    if (!isProfilingEnabled(PROFILE_FLAG)) {
      return;
    }

    if (Platform.OS !== "ios" && Platform.OS !== "android") {
      console.info("[perf] Hermes profiling skipped: non-native platform");
      return;
    }

    const hermes = getHermesInternal();
    if (!hermes) {
      console.info("[perf] Hermes profiling skipped: Hermes runtime inactive");
      return;
    }

    const directory = resolveDirectory(destination);
    if (!directory) {
      console.warn("[perf] Hermes profiling skipped: no writable directory available");
      return;
    }

    const profileId = `${label}-${Date.now()}`;
    if (!startHermesProfiling(hermes, profileId)) {
      console.warn(
        "[perf] Hermes profiling API unavailable; use `npx react-native profile-hermes` to collect traces."
      );
      return;
    }

    console.info(`[perf] Hermes profiling '${profileId}' started…`);
    let flushed = false;

    const flush = async () => {
      if (flushed) {
        return;
      }
      flushed = true;

      const payload = stopHermesProfiling(hermes, profileId);
      if (!payload) {
        console.info(
          "[perf] Hermes profiling finished without payload; run `npx react-native profile-hermes` if you need a trace file."
        );
        return;
      }

      const outputPath = `${directory.replace(/\/?$/, "/")}${profileId}.cpuprofile`;
      const persistedPath = await persistProfile(payload, outputPath);
      if (persistedPath) {
        console.info(`[perf] Hermes profile saved to ${persistedPath}`);
      }
    };

    const timeout = setTimeout(() => {
      void flush();
    }, flushDelayMs);

    return () => {
      clearTimeout(timeout);
      void flush();
    };
  }, [destination, flushDelayMs, label]);
};
