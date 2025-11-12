import * as React from "react";

import {
  Sheet as BaseSheet,
  SheetClose as BaseSheetClose,
  SheetContent as BaseSheetContent,
  SheetDescription as BaseSheetDescription,
  SheetFooter as BaseSheetFooter,
  SheetHeader as BaseSheetHeader,
  SheetOverlay as BaseSheetOverlay,
  SheetPortal as BaseSheetPortal,
  SheetTitle as BaseSheetTitle,
  SheetTrigger as BaseSheetTrigger,
} from "@rayon/ui/components";

type SheetContentProps = React.ComponentPropsWithoutRef<typeof BaseSheetContent> & {
  focusFirstSelector?: string;
};

const DEFAULT_FOCUS_SELECTOR = '[data-autofocus], button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SheetContent = React.forwardRef<React.ElementRef<typeof BaseSheetContent>, SheetContentProps>(
  ({ focusFirstSelector = DEFAULT_FOCUS_SELECTOR, onOpenAutoFocus, onCloseAutoFocus, ...props }, forwardedRef) => {
    const contentRef = React.useRef<React.ElementRef<typeof BaseSheetContent>>(null);
    const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);

    const setRefs = React.useCallback(
      (node: React.ElementRef<typeof BaseSheetContent> | null) => {
        contentRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef && typeof forwardedRef === "object") {
          (forwardedRef as React.MutableRefObject<React.ElementRef<typeof BaseSheetContent> | null>).current = node;
        }
      },
      [forwardedRef],
    );

    return (
      <BaseSheetContent
        {...props}
        ref={setRefs}
        onOpenAutoFocus={(event) => {
          previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
          onOpenAutoFocus?.(event);
          if (event.defaultPrevented) {
            return;
          }
          const focusable = contentRef.current?.querySelector<HTMLElement>(focusFirstSelector);
          if (focusable) {
            focusable.focus();
            event.preventDefault();
          }
        }}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          if (event.defaultPrevented) {
            return;
          }
          const previous = previouslyFocusedRef.current;
          if (previous) {
            event.preventDefault();
            previous.focus();
          }
        }}
      />
    );
  },
);
SheetContent.displayName = BaseSheetContent.displayName ?? "SheetContent";

const Sheet = BaseSheet;
const SheetClose = BaseSheetClose;
const SheetDescription = BaseSheetDescription;
const SheetFooter = BaseSheetFooter;
const SheetHeader = BaseSheetHeader;
const SheetOverlay = BaseSheetOverlay;
const SheetPortal = BaseSheetPortal;
const SheetTitle = BaseSheetTitle;
const SheetTrigger = BaseSheetTrigger;

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
