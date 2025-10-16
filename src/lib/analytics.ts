export function track(name: string, props?: Record<string, unknown>) {
  try {
    window.dispatchEvent(new CustomEvent('analytics', { detail: { name, props } }));
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Analytics dispatch failed', error);
    }
  }
}
