import * as React from "react";

type PointerEventHandler<T extends HTMLElement> = React.PointerEventHandler<T>;

export interface PressRippleOptions {
  color?: string;
  opacity?: number;
  duration?: number;
  centered?: boolean;
}

const defaultOptions: Required<PressRippleOptions> = {
  color: "rgba(255, 255, 255, 0.35)",
  opacity: 0.35,
  duration: 450,
  centered: false,
};

export function usePressRipple<T extends HTMLElement = HTMLElement>(
  options: PressRippleOptions = {},
): {
  bind: {
    ref: React.RefCallback<T>;
    onPointerDown: PointerEventHandler<T>;
  };
  onPointerDown: PointerEventHandler<T>;
  setRef: React.RefCallback<T>;
} {
  const settings = { ...defaultOptions, ...options };
  const hostRef = React.useRef<T | null>(null);

  const setRef = React.useCallback((node: T | null) => {
    hostRef.current = node;
  }, []);

  const createRipple = React.useCallback(
    (event: React.PointerEvent<T>) => {
      const host = hostRef.current ?? (event.currentTarget as T | null);
      if (!host) {
        return;
      }

      if (hostRef.current === null) {
        hostRef.current = host;
      }

      const rect = host.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement("span");

      ripple.setAttribute("data-ui-ripple", "");
      ripple.style.position = "absolute";
      ripple.style.pointerEvents = "none";
      ripple.style.borderRadius = "9999px";
      ripple.style.backgroundColor = settings.color;
      ripple.style.opacity = settings.opacity.toString();
      ripple.style.width = ripple.style.height = `${size * 2}px`;

      const x = settings.centered ? rect.width / 2 : event.clientX - rect.left;
      const y = settings.centered ? rect.height / 2 : event.clientY - rect.top;
      ripple.style.left = `${x - size}px`;
      ripple.style.top = `${y - size}px`;
      ripple.style.transform = "scale(0)";
      ripple.style.transition = `transform ${settings.duration}ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity ${settings.duration}ms ease-out`;

      const computed = window.getComputedStyle(host);
      if (computed.position === "static" && !host.dataset.uiRipplePositioned) {
        host.dataset.uiRipplePositioned = host.style.position || "static";
        host.style.position = "relative";
      }
      if (computed.overflow !== "hidden" && !host.dataset.uiRippleOverflow) {
        host.dataset.uiRippleOverflow = host.style.overflow || "";
        host.style.overflow = "hidden";
      }

      host.appendChild(ripple);

      requestAnimationFrame(() => {
        ripple.style.transform = "scale(1)";
        ripple.style.opacity = "0";
      });

      window.setTimeout(() => {
        ripple.remove();
        if (!host.querySelector('[data-ui-ripple]')) {
          if (host.dataset.uiRipplePositioned) {
            const originalPosition = host.dataset.uiRipplePositioned;
            host.style.position = originalPosition === "static" ? "" : originalPosition;
            delete host.dataset.uiRipplePositioned;
          }
          if (host.dataset.uiRippleOverflow !== undefined) {
            host.style.overflow = host.dataset.uiRippleOverflow;
            delete host.dataset.uiRippleOverflow;
          }
        }
      }, settings.duration);
    },
    [settings],
  );

  const onPointerDown = React.useCallback<PointerEventHandler<T>>(
    (event) => {
      createRipple(event);
    },
    [createRipple],
  );

  return React.useMemo(
    () => ({
      bind: {
        ref: setRef,
        onPointerDown,
      },
      onPointerDown,
      setRef,
    }),
    [onPointerDown, setRef],
  );
}
