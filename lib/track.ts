export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.dispatchEvent(new CustomEvent("trk", { detail: { event, props } }));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("track event skipped", event, props, error);
    }
  }
}
