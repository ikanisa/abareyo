"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

import useDialogFocusTrap from "../_hooks/useDialogFocusTrap";

export type SizeGuideModalProps = {
  open: boolean;
  onClose: () => void;
};

const SizeGuideModal = ({ open, onClose }: SizeGuideModalProps) => {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useDialogFocusTrap<HTMLDivElement>(open, { onClose });

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="size-guide-title">
          <button type="button" className="absolute inset-0" aria-label="Close size guide" onClick={onClose} />
          <motion.div
            ref={containerRef}
            className="card max-w-sm rounded-3xl bg-white/95 p-6 text-slate-900"
            initial={{ opacity: prefersReducedMotion ? 1 : 0, scale: prefersReducedMotion ? 1 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: prefersReducedMotion ? 1 : 0, scale: prefersReducedMotion ? 1 : 0.96 }}
            transition={{ duration: prefersReducedMotion ? 0.15 : 0.25 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="size-guide-title" className="text-lg font-semibold text-slate-900">
                Size Guide
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-slate-700"
                aria-label="Close size guide"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-slate-700">
              <li>
                <strong>Fata igipimo cya garama.</strong> Use a tape measure across your chest at the fullest point.
              </li>
              <li>
                Compare with chart: XS 84cm, S 89cm, M 97cm, L 104cm, XL 112cm, XXL 122cm.
              </li>
              <li>
                Want relaxed fit? Choose one size up. For match fit, stay true to size.
              </li>
            </ol>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SizeGuideModal;
