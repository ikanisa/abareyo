export function track(event: string, props?: Record<string, any>) {
  try {
    window.dispatchEvent(new CustomEvent('trk', { detail: { event, props } }));
  } catch {
    // no-op when analytics bus is unavailable
  }
}
