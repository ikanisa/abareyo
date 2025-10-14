export function track(event: string, props?: Record<string, unknown>) {
  try {
    window.dispatchEvent(new CustomEvent("trk", { detail: { event, props } }));
  } catch {
    // noop: keep analytics quiet when unavailable
  }
}
