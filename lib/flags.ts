export function ff(key: string, fallback = false) {
  try {
    const map = JSON.parse(process.env.NEXT_PUBLIC_FEATURE_FLAGS || "{}");
    return Boolean(map[key]);
  } catch {
    return fallback;
  }
}
