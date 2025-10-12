export const PWA_OPT_IN_KEY = "rayon-pwa-opt-in";
export const PWA_OPT_IN_EVENT = "pwa-opt-in";

export type PwaOptInDetail = {
  reason: "install" | "settings";
};

export const recordPwaOptIn = (detail: PwaOptInDetail) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PWA_OPT_IN_KEY, "true");
  } catch (error) {
    console.warn("Unable to persist PWA opt-in choice", error);
  }

  window.dispatchEvent(new CustomEvent(PWA_OPT_IN_EVENT, { detail }));
};
