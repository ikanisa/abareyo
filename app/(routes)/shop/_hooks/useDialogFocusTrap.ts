"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

type Options = {
  onClose?: () => void;
};

const useDialogFocusTrap = <T extends HTMLElement>(open: boolean, options: Options = {}) => {
  const containerRef = useRef<T | null>(null);
  const { onClose } = options;

  useEffect(() => {
    if (!open) return;
    const node = containerRef.current;
    if (!node) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusFirstElement = () => {
      const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
        (element) => element.getAttribute("aria-hidden") !== "true" && !element.hasAttribute("disabled"),
      );
      const first = focusable[0];
      first?.focus({ preventScroll: true });
    };

    focusFirstElement();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!node.contains(event.target as Node)) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
        (element) => element.getAttribute("aria-hidden") !== "true" && !element.hasAttribute("disabled"),
      );
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (current === first || !node.contains(current)) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else if (current === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (node.contains(event.target as Node)) return;
      focusFirstElement();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  return containerRef;
};

export default useDialogFocusTrap;
