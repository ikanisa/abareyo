"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { motionTokens } from "@rayon/design-tokens";

const STORAGE_KEY = `${motionTokens.reduced.key}:web`;

type MotionContextValue = {
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
  toggleMotion: () => void;
};

const MotionContext = createContext<MotionContextValue | undefined>(undefined);

const applyDocumentPreference = (reduced: boolean) => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.motion = reduced ? "reduced" : "normal";
};

export const MotionProvider = ({ children }: { children: ReactNode }) => {
  const [reducedMotion, setReducedMotionState] = useState(false);

  useEffect(() => {
    const loadPreference = () => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          const parsed = JSON.parse(stored) as boolean;
          setReducedMotionState(parsed);
          applyDocumentPreference(parsed);
          return;
        }
      } catch (error) {
        console.warn("[motion] Unable to read stored motion preference", error);
      }

      const mediaQuery = window.matchMedia?.(motionTokens.reduced.mediaQuery);
      const prefersReduced = Boolean(mediaQuery?.matches);
      setReducedMotionState(prefersReduced);
      applyDocumentPreference(prefersReduced);

      const handleChange = (event: MediaQueryListEvent) => {
        setReducedMotionState(event.matches);
        applyDocumentPreference(event.matches);
      };

      mediaQuery?.addEventListener("change", handleChange);
      return () => mediaQuery?.removeEventListener("change", handleChange);
    };

    return loadPreference();
  }, []);

  const persistPreference = useCallback((value: boolean) => {
    setReducedMotionState(value);
    applyDocumentPreference(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
      console.warn("[motion] Unable to persist preference", error);
    }
  }, []);

  const toggleMotion = useCallback(() => {
    persistPreference(!reducedMotion);
  }, [persistPreference, reducedMotion]);

  const value = useMemo<MotionContextValue>(
    () => ({ reducedMotion, setReducedMotion: persistPreference, toggleMotion }),
    [persistPreference, reducedMotion, toggleMotion]
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
};

export const useMotionPreference = () => {
  const context = useContext(MotionContext);
  if (!context) {
    throw new Error("useMotionPreference must be used within MotionProvider");
  }

  return context;
};
