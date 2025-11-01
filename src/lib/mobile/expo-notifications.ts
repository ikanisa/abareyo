/**
 * Lightweight facade around Expo Notifications so web builds can gracefully
 * degrade while native apps still import the actual SDK via module aliasing.
 */

type ExpoModule = {
  requestPermissionsAsync: () => Promise<{ status: string }>;
  getExpoPushTokenAsync: () => Promise<{ data: string }>;
};

type ModuleLoader = () => Promise<ExpoModule | null>;

let loader: ModuleLoader | null = null;

/**
 * Allows mobile bundles to register a runtime loader for the Expo module.
 */
export const registerExpoNotificationsLoader = (factory: ModuleLoader) => {
  loader = factory;
};

const loadModule = async (): Promise<ExpoModule | null> => {
  if (loader) {
    try {
      return await loader();
    } catch (error) {
      console.warn("Expo notifications loader failed", error);
      return null;
    }
  }

  if (typeof window === "undefined") {
    return null;
  }

  const globalLoader = (globalThis as typeof globalThis & { __expoNotifications__?: ModuleLoader }).__expoNotifications__;
  if (!globalLoader) {
    return null;
  }

  try {
    return await globalLoader();
  } catch (error) {
    console.warn("Expo notifications global loader failed", error);
    return null;
  }
};

export const requestPermissions = async (): Promise<{ status: string } | null> => {
  const module = await loadModule();
  if (!module?.requestPermissionsAsync) {
    return null;
  }
  return module.requestPermissionsAsync();
};

export const getExpoPushToken = async (): Promise<string | null> => {
  const module = await loadModule();
  if (!module?.getExpoPushTokenAsync) {
    return null;
  }
  try {
    const result = await module.getExpoPushTokenAsync();
    return result?.data ?? null;
  } catch (error) {
    console.warn("Unable to fetch Expo push token", error);
    return null;
  }
};
