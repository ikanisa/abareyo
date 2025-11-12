import * as React from "react";

import {
  Modal as BaseDialog,
  ModalClose as BaseDialogClose,
  ModalContent as BaseDialogContent,
  ModalDescription as BaseDialogDescription,
  ModalFooter as BaseDialogFooter,
  ModalHeader as BaseDialogHeader,
  ModalOverlay as BaseDialogOverlay,
  ModalPortal as BaseDialogPortal,
  ModalTitle as BaseDialogTitle,
  ModalTrigger as BaseDialogTrigger,
} from "@rayon/ui/components";

type DialogContentProps = React.ComponentPropsWithoutRef<typeof BaseDialogContent> & {
  focusFirstSelector?: string;
};

const DEFAULT_FOCUS_SELECTOR = '[data-autofocus], button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const DialogContent = React.forwardRef<React.ElementRef<typeof BaseDialogContent>, DialogContentProps>(
  ({ focusFirstSelector = DEFAULT_FOCUS_SELECTOR, onOpenAutoFocus, onCloseAutoFocus, ...props }, forwardedRef) => {
    const contentRef = React.useRef<React.ElementRef<typeof BaseDialogContent>>(null);
    const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);

    const setRefs = React.useCallback(
      (node: React.ElementRef<typeof BaseDialogContent> | null) => {
        contentRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef && typeof forwardedRef === "object") {
          (forwardedRef as React.MutableRefObject<React.ElementRef<typeof BaseDialogContent> | null>).current = node;
        }
      },
      [forwardedRef],
    );

    return (
      <BaseDialogContent
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
DialogContent.displayName = BaseDialogContent.displayName ?? "DialogContent";

const Dialog = BaseDialog;
const DialogClose = BaseDialogClose;
const DialogDescription = BaseDialogDescription;
const DialogFooter = BaseDialogFooter;
const DialogHeader = BaseDialogHeader;
const DialogOverlay = BaseDialogOverlay;
const DialogPortal = BaseDialogPortal;
const DialogTitle = BaseDialogTitle;
const DialogTrigger = BaseDialogTrigger;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
