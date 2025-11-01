import { Capacitor } from "@capacitor/core";

export type CapacitorEventPayload = Record<string, unknown>;
export type CapacitorEventHandler = (payload: CapacitorEventPayload) => void;

const listeners = new Map<string, Set<CapacitorEventHandler>>();

type WindowWithCapacitor = Window & {
  capacitorListeners?: Map<string, Set<CapacitorEventHandler>>;
};

const hasWindow = () => typeof window !== "undefined";

export const registerCapacitorEvent = (
  event: string,
  handler: CapacitorEventHandler,
) => {
  if (!hasWindow() || !Capacitor.isNativePlatform()) {
    return () => {};
  }

  const store = getOrCreateListenerStore();
  let handlers = store.get(event);
  if (!handlers) {
    handlers = new Set();
    store.set(event, handlers);
    window.addEventListener(event, onCapacitorEvent as EventListener);
  }
  handlers.add(handler);

  return () => {
    handlers?.delete(handler);
    if (handlers && handlers.size === 0) {
      store.delete(event);
      window.removeEventListener(event, onCapacitorEvent as EventListener);
    }
  };
};

const getOrCreateListenerStore = () => {
  if (!hasWindow()) {
    return listeners;
  }
  const win = window as WindowWithCapacitor;
  if (!win.capacitorListeners) {
    win.capacitorListeners = listeners;
  }
  return win.capacitorListeners;
};

const onCapacitorEvent = (event: Event) => {
  if (!(event instanceof CustomEvent)) {
    return;
  }
  const store = getOrCreateListenerStore();
  const handlers = store.get(event.type);
  if (!handlers) {
    return;
  }
  const detail = parseEventDetail(event.detail);
  handlers.forEach((handler) => {
    try {
      handler(detail);
    } catch (error) {
      console.warn(`Capacitor event handler failed for ${event.type}`, error);
    }
  });
};

const parseEventDetail = (detail: unknown): CapacitorEventPayload => {
  if (!detail) {
    return {};
  }
  if (typeof detail === "string") {
    try {
      const parsed = JSON.parse(detail);
      if (parsed && typeof parsed === "object") {
        return parsed as CapacitorEventPayload;
      }
    } catch (error) {
      console.warn("Failed to parse Capacitor event payload", error);
    }
    return { raw: detail };
  }
  if (typeof detail === "object") {
    return detail as CapacitorEventPayload;
  }
  return { value: detail } as CapacitorEventPayload;
};
