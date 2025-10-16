export function ff(key: string, fallback = false) {
  try {
    const parsed = JSON.parse(process.env.NEXT_PUBLIC_FEATURE_FLAGS || '{}');
    return Boolean(parsed[key]);
  } catch {
    return fallback;
  }
}
