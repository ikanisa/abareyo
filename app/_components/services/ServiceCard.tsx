"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

import QuoteForm from "./insurance/QuoteForm";
import DepositForm from "./sacco/DepositForm";
import type { Partner } from "@/app/_data/services";

type Props = {
  partner: Partner;
  anchorId?: string;
};

const ServiceCard = ({ partner, anchorId }: Props) => {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const isInsurance = partner.id === "ins";
  const isSacco = partner.id === "sacco";

  const handleToggle = () => setOpen((value) => !value);

  return (
    <article
      id={anchorId}
      data-partner-id={partner.id}
      className="card space-y-4"
      aria-labelledby={`${contentId}-title`}
      role="listitem"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
          {partner.logo ? (
            <Image
              alt={`${partner.name} logo`}
              src={partner.logo}
              width={56}
              height={56}
              className="h-14 w-14 object-contain"
            />
          ) : null}
        </div>
        <div className="flex-1 space-y-1">
          <p id={`${contentId}-title`} className="text-base font-semibold text-white">
            {partner.name}
          </p>
          <p className="text-sm text-white/70">{partner.benefit}</p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={clsx("btn-primary whitespace-nowrap", open && "bg-blue-600")}
          aria-expanded={open}
          aria-controls={contentId}
        >
          {isInsurance ? "Get Quote" : isSacco ? "Deposit Now" : "Explore"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={contentId}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.33, 1, 0.68, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-3">
              {isInsurance ? <QuoteForm onClose={() => setOpen(false)} partnerId={partner.id} /> : null}
              {isSacco ? <DepositForm onClose={() => setOpen(false)} /> : null}
              {!isInsurance && !isSacco ? (
                <p className="muted text-sm">Coming soon. Partner experience will launch here.</p>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
};

export default ServiceCard;
