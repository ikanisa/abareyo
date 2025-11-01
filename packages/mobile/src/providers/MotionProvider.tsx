import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AccessibilityInfo } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { motionTokens } from "@rayon/design-tokens";

const STORAGE_KEY = `${motionTokens.reduced.key}:mobile`;

type MotionContextValue = {
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
  toggleMotion: () => void;
};

const MotionPreferenceContext = createContext<MotionContextValue | undefined>(undefined);

export const MotionProvider = ({ children }: { children: ReactNode }) => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const readPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          const parsed = JSON.parse(stored) as boolean;
          if (isMounted) {
            setReducedMotion(parsed);
          }
          return;
        }
      } catch (error) {
        console.warn("[motion] Unable to read stored preference", error);
      }

      try {
        const osPrefersReducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
        if (isMounted) {
          setReducedMotion(osPrefersReducedMotion);
        }
      } catch (error) {
        console.warn("[motion] Failed to read accessibility preference", error);
      }
    };

    void readPreference();

    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
      setReducedMotion(enabled);
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
    });

    return () => {
      isMounted = false;
      listener.remove();
    };
  }, []);

  const setPreference = useCallback((value: boolean) => {
    setReducedMotion(value);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }, []);

  const toggleMotion = useCallback(() => {
    setReducedMotion((current) => {
      const next = !current;
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const contextValue: MotionContextValue = {
    reducedMotion,
    setReducedMotion: setPreference,
    toggleMotion,
  };

  return <MotionPreferenceContext.Provider value={contextValue}>{children}</MotionPreferenceContext.Provider>;
};

export const useMotionPreference = () => {
  const context = useContext(MotionPreferenceContext);
  if (!context) {
    throw new Error("useMotionPreference must be used within MotionProvider");
  }

  return context;
};
