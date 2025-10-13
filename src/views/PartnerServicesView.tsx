"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Gift,
  Loader2,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  X,
} from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { launchUssdDialer } from "@/lib/ussd";
import { fanProfile } from "@/app/_data/fanProfile";
import { jsonFetch } from "@/app/_lib/api";
import {
  activePolicy,
  bankInsights,
  depositUssdTemplate,
  depositsHistory,
  insuranceQuoteTemplate,
  insuranceUssdTemplate,
  partnerPerks,
  partnerServices,
  partnerServicesHero,
  rewardRules,
  saccoDirectory,
  servicesHistory,
  latestDeposit,
} from "@/app/_config/services";

const MotionSection = motion.section;

const fadeUp = (shouldReduceMotion: boolean) => ({
  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.24, ease: "easeOut" } },
});

const formatCurrency = (value: number) => `${value.toLocaleString()} RWF`;

const getDepositPoints = (amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  const base = Math.floor(amount / 500);
  const multiplier = amount >= 10000 ? 2 : 1;
  return base * multiplier;
};

const getTicketEligibility = (total: number) => ({
  eligible: total >= 25000,
  helper: total >= 25000
    ? "Congrats! A Blue Zone ticket is ready once payment clears."
    : `Add ${formatCurrency(25000 - total)} more to unlock a free Blue Zone ticket.`,
});

const InsuranceStatus = ({
  status,
  quoteId,
}: {
  status: "idle" | "pending" | "confirmed";
  quoteId?: string | null;
}) => {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-2 text-sm text-white/80" aria-live="polite" role="status">
          <Loader2 className="h-4 w-4 animate-spin" /> Waiting for SMS confirmation…
          {quoteId ? (
            <span className="text-xs text-white/60">Quote {quoteId.slice(0, 8).toUpperCase()}</span>
          ) : null}
        </span>
      );
    case "confirmed":
      return (
        <span className="inline-flex items-center gap-2 text-sm text-emerald-200" aria-live="polite" role="status">
          <CheckCircle2 className="h-4 w-4" /> Payment confirmed. Policy is being issued.
        </span>
      );
    default:
      return (
        <span className="text-sm text-white/70" aria-live="polite" role="status">
          Dial the USSD code to complete payment.
        </span>
      );
  }
};

const DepositStatus = ({
  status,
  reference,
}: {
  status: "idle" | "pending" | "confirmed";
  reference?: string | null;
}) => {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-2 text-sm text-white/80" aria-live="polite" role="status">
          <Loader2 className="h-4 w-4 animate-spin" /> Waiting for mobile money confirmation…
        </span>
      );
    case "confirmed":
      return (
        <span className="inline-flex items-center gap-2 text-sm text-emerald-200" aria-live="polite" role="status">
          <CheckCircle2 className="h-4 w-4" /> Deposit confirmed. Points have been credited.
          {reference ? <span className="text-xs text-emerald-100/80">Ref {reference}</span> : null}
        </span>
      );
    default:
      return (
        <span className="text-sm text-white/70" aria-live="polite" role="status">
          Start the USSD flow to make a deposit.
        </span>
      );
  }
};

const InfoChip = ({ icon: Icon, label }: { icon: ComponentType<{ className?: string }>; label: string }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
    <Icon className="h-3.5 w-3.5" /> {label}
  </span>
);

const ussdNetworks = [
  { id: "mtn", name: "MTN MoMo", description: "Use your MTN wallet", accent: "from-yellow-400/30 to-orange-400/20" },
  { id: "airtel", name: "Airtel Money", description: "Use your Airtel wallet", accent: "from-red-400/30 to-rose-400/20" },
] as const;

const PaymentOverlay = ({
  open,
  title,
  description,
  onDismiss,
  actionLabel,
}: {
  open: boolean;
  title: string;
  description: string;
  onDismiss: () => void;
  actionLabel: string;
}) => {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-10 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <GlassCard className="relative w-full max-w-sm space-y-5 p-6 text-center">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-4 top-4 text-white/60 transition hover:text-white"
        >
          <span className="sr-only">Dismiss waiting overlay</span>
          <X className="h-4 w-4" />
        </button>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm text-white/70">{description}</p>
        </div>
        <Button variant="secondary" className="w-full" onClick={onDismiss}>
          {actionLabel}
        </Button>
      </GlassCard>
    </div>
  );
};

const PerkBanner = ({
  badge,
  message,
  description,
  href,
}: {
  badge: string;
  message: string;
  description: string;
  href: string;
}) => (
  <Link
    href={href}
    className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/10 p-5 text-white transition hover:border-white/25"
  >
    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
      {badge}
    </span>
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl" aria-hidden="true">
        <Gift className="h-5 w-5" />
      </span>
      <div className="space-y-1">
        <p className="text-lg font-semibold leading-tight">{message}</p>
        <p className="text-sm text-white/70">{description}</p>
      </div>
    </div>
    <span className="text-sm font-semibold text-white/80">View details →</span>
  </Link>
);

const FlowStepIndicator = ({
  currentStep,
}: {
  currentStep: 0 | 1 | 2;
}) => {
  const steps = [
    { id: "quote", title: "Quote", description: "Add moto details" },
    { id: "pay", title: "Pay", description: "Dial USSD" },
    { id: "claim", title: "Claim", description: "Unlock perks" },
  ] as const;

  return (
    <ol className="grid gap-3 sm:grid-cols-3" aria-label="Insurance progress">
      {steps.map((step, index) => {
        const isActive = index <= currentStep;
        return (
          <li
            key={step.id}
            className={`rounded-2xl border p-3 ${
              isActive ? "border-emerald-400/60 bg-emerald-500/10" : "border-white/10 bg-white/5"
            }`}
          >
            <p className="text-sm font-semibold text-white">{step.title}</p>
            <p className="text-xs text-white/70">{step.description}</p>
          </li>
        );
      })}
    </ol>
  );
};

const UssdNetworkTiles = ({ ussdCode }: { ussdCode: string }) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="USSD network options">
    {ussdNetworks.map((network) => (
      <div
        key={network.id}
        className={`rounded-2xl bg-gradient-to-br ${network.accent} p-3 text-sm text-white/80`}
      >
        <p className="font-semibold text-white">{network.name}</p>
        <p className="text-xs text-white/70">{network.description}</p>
        <p className="mt-2 rounded-xl bg-black/20 px-3 py-1 text-xs font-mono text-white/80">
          {ussdCode}
        </p>
      </div>
    ))}
  </div>
);

const PartnerServicesView = () => {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [plateNumber, setPlateNumber] = useState("");
  const [motoType, setMotoType] = useState<"moto" | "car">(insuranceQuoteTemplate.motoType);
  const [coverageMonths, setCoverageMonths] = useState<number>(insuranceQuoteTemplate.periodMonths);
  const defaultAddons = insuranceQuoteTemplate.addons.length ? [insuranceQuoteTemplate.addons[0].id] : [];
  const [selectedAddons, setSelectedAddons] = useState<string[]>(defaultAddons);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [insuranceStatus, setInsuranceStatus] = useState<"idle" | "pending" | "confirmed">("idle");
  const [insuranceQuoteRecord, setInsuranceQuoteRecord] = useState<{ id: string; premium: number } | null>(null);
  const [insuranceSaving, setInsuranceSaving] = useState(false);
  const [isClaimingTicket, setIsClaimingTicket] = useState(false);
  const [manualInsuranceRef, setManualInsuranceRef] = useState("");
  const [showInsuranceFallback, setShowInsuranceFallback] = useState(false);
  const [dismissedInsuranceOverlay, setDismissedInsuranceOverlay] = useState(false);

  const [selectedSacco, setSelectedSacco] = useState<string>(
    latestDeposit.saccoId ?? saccoDirectory[0]?.id ?? "",
  );
  const [depositAmount, setDepositAmount] = useState<number>(latestDeposit.amount);
  const [depositStatus, setDepositStatus] = useState<"idle" | "pending" | "confirmed">("idle");
  const [depositSaving, setDepositSaving] = useState(false);
  const [manualDepositRef, setManualDepositRef] = useState("");
  const [showDepositFallback, setShowDepositFallback] = useState(false);
  const [dismissedDepositOverlay, setDismissedDepositOverlay] = useState(false);
  const [saccoSearchTerm, setSaccoSearchTerm] = useState("");
  const [depositReceipt, setDepositReceipt] = useState(latestDeposit);

  const addonPrices = useMemo(() => {
    return insuranceQuoteTemplate.addons.reduce<Record<string, number>>((acc, addon) => {
      acc[addon.id] = addon.price;
      return acc;
    }, {});
  }, []);

  const addonDetails = useMemo(() => {
    return insuranceQuoteTemplate.addons.reduce<
      Record<string, (typeof insuranceQuoteTemplate.addons)[number]>
    >((acc, addon) => {
      acc[addon.id] = addon;
      return acc;
    }, {});
  }, []);

  const baseMonthlyPremium: Record<"moto" | "car", number> = {
    moto: 3000,
    car: 9000,
  } as const;

  const basePremium = baseMonthlyPremium[motoType] * coverageMonths;

  const addonsTotal = selectedAddons.reduce((total, addonId) => total + (addonPrices[addonId] ?? 0), 0);

  const insuranceTotal = basePremium + addonsTotal;

  const ticketEligibility = getTicketEligibility(insuranceTotal);

  const insuranceUssdCode = insuranceUssdTemplate.shortcode.replace("{amount}", String(insuranceTotal));

  const depositUssdCode = depositUssdTemplate.shortcode.replace("{amount}", String(depositAmount));

  const formatUssdDisplay = (code: string) => code.replace(/^tel:/, "").replace(/%23/g, "#");

  const insuranceStep: 0 | 1 | 2 = insuranceStatus === "idle" ? 0 : insuranceStatus === "pending" ? 1 : 2;

  const saccoRecents = useMemo(() => {
    const seen = new Set<string>();
    return depositsHistory
      .map((deposit) => deposit.saccoId)
      .filter((id) => {
        if (seen.has(id)) {
          return false;
        }
        seen.add(id);
        return Boolean(id);
      });
  }, []);

  const filteredSaccos = useMemo(() => {
    const query = saccoSearchTerm.trim().toLowerCase();
    if (!query) {
      return saccoDirectory;
    }
    return saccoDirectory.filter((sacco) => {
      const haystack = `${sacco.name} ${sacco.branch ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [saccoSearchTerm]);

  const selectedSaccoDetails = useMemo(
    () => saccoDirectory.find((sacco) => sacco.id === selectedSacco),
    [selectedSacco],
  );

  const receiptSaccoDetails = useMemo(
    () => saccoDirectory.find((sacco) => sacco.id === depositReceipt.saccoId),
    [depositReceipt.saccoId],
  );

  useEffect(() => {
    const focus = searchParams?.get("focus");
    if (!focus) {
      return;
    }

    const sectionMap: Record<string, string> = {
      insurance: "motor-insurance",
      sacco: "sacco-deposit",
      bank: "bank-offers",
    };

    const targetId = sectionMap[focus];
    if (targetId && typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (insuranceStatus !== "pending") {
      setDismissedInsuranceOverlay(false);
    }
  }, [insuranceStatus]);

  useEffect(() => {
    if (depositStatus !== "pending") {
      setDismissedDepositOverlay(false);
    }
  }, [depositStatus]);

  useEffect(() => {
    if (depositStatus !== "confirmed" || !depositAmount || depositAmount <= 0) {
      return;
    }

    const now = new Date();
    const autoRef = manualDepositRef.trim() || `USSD${now.getTime().toString().slice(-6)}`;
    setDepositReceipt((current) => ({
      id: current?.id ?? `receipt-${now.getTime()}`,
      saccoId: selectedSacco,
      amount: depositAmount,
      status: "confirmed",
      ref: autoRef,
      pointsEarned: getDepositPoints(depositAmount),
      createdAt: now.toISOString(),
    }));
  }, [depositAmount, depositStatus, manualDepositRef, selectedSacco]);

  const handleToggleAddon = (addonId: string) => {
    setSelectedAddons((current) => {
      if (current.includes(addonId)) {
        return current.filter((item) => item !== addonId);
      }
      return [...current, addonId];
    });
  };

  const handleStartInsurancePayment = async () => {
    if (!insuranceTotal || insuranceTotal <= 0) {
      toast({
        title: "Missing premium",
        description: "Add your moto details to calculate the premium before paying.",
        variant: "destructive",
      });
      return;
    }
    const sanitizedPhone = (phoneNumber || fanProfile.phone).replace(/[^0-9+]/g, "");
    try {
      setInsuranceSaving(true);
      const response = await jsonFetch<{
        ok: boolean;
        quote: { id: string; premium: number };
      }>("/api/insurance/quote", {
        method: "POST",
        body: JSON.stringify({
          moto_type: motoType,
          plate: plateNumber || null,
          period_months: coverageMonths,
          premium: insuranceTotal,
          user: {
            name: fullName || fanProfile.name,
            phone: sanitizedPhone,
            momo_number: fanProfile.momo ?? sanitizedPhone,
          },
        }),
      });
      setInsuranceQuoteRecord(response.quote);
      setInsuranceStatus("pending");
      setShowInsuranceFallback(false);
      setDismissedInsuranceOverlay(false);
      launchUssdDialer(insuranceUssdCode, {
        onFallback: () => setShowInsuranceFallback(true),
      });
      toast({
        title: "USSD session started",
        description: "Complete the steps on your phone to confirm the insurance payment.",
      });
    } catch (error) {
      toast({
        title: "Could not start payment",
        description: error instanceof Error ? error.message : "Failed to create insurance quote.",
        variant: "destructive",
      });
    } finally {
      setInsuranceSaving(false);
    }
  };

  const handleSubmitInsuranceReference = () => {
    if (!manualInsuranceRef.trim()) {
      toast({
        title: "Enter the reference",
        description: "Add the mobile money reference number so we can verify your policy.",
        variant: "destructive",
      });
      return;
    }
    setInsuranceStatus("confirmed");
    toast({
      title: "Reference received",
      description: "We will match the reference to your quote and issue the policy shortly.",
    });
  };

  const handleClaimTicket = async () => {
    if (!activePolicy || isClaimingTicket) {
      return;
    }

    setIsClaimingTicket(true);
    try {
      const response = await fetch("/api/rewards/claimTicket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy_id: activePolicy.id, user_id: null }),
      });

      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; already?: boolean; error?: string | null }
        | null;

      if (!response.ok || (!result?.ok && !result?.already)) {
        const message = result?.error ? result.error.replace(/_/g, " ") : "Could not claim the ticket.";
        throw new Error(message);
      }

      setIsClaimingTicket(false);
      window.location.href = "/tickets?claimed=1";
    } catch (error) {
      console.error("claim_ticket_failed", error);
      const message = error instanceof Error ? error.message : "Could not claim the free ticket.";
      toast({
        title: "Ticket claim failed",
        description: message,
        variant: "destructive",
      });
      setIsClaimingTicket(false);
    }
  };

  const handleStartDepositPayment = async () => {
    if (!depositAmount || depositAmount <= 0) {
      toast({
        title: "Enter deposit amount",
        description: "Add the amount you would like to save before starting the USSD flow.",
        variant: "destructive",
      });
      return;
    }
    const sanitizedPhone = (phoneNumber || fanProfile.phone).replace(/[^0-9+]/g, "");
    const saccoName = selectedSaccoDetails?.name ?? selectedSacco;
    try {
      setDepositSaving(true);
      const response = await jsonFetch<{
        ok: boolean;
        deposit: { id: string; amount: number; status: "pending" | "confirmed"; ref: string | null; created_at: string };
      }>("/api/sacco/deposit", {
        method: "POST",
        body: JSON.stringify({
          sacco_name: saccoName,
          amount: depositAmount,
          user: {
            name: fullName || fanProfile.name,
            phone: sanitizedPhone,
            momo_number: fanProfile.momo ?? sanitizedPhone,
          },
        }),
      });
      setDepositReceipt({
        id: response.deposit.id,
        saccoId: selectedSacco,
        amount: response.deposit.amount,
        status: response.deposit.status,
        ref: response.deposit.ref ?? undefined,
        pointsEarned: getDepositPoints(response.deposit.amount),
        createdAt: response.deposit.created_at,
      });
      setDepositStatus(response.deposit.status);
      setShowDepositFallback(false);
      setDismissedDepositOverlay(false);
      launchUssdDialer(depositUssdCode, {
        onFallback: () => setShowDepositFallback(true),
      });
      toast({
        title: "Deposit in progress",
        description: "Confirm the payment on your phone to grow your Ibimina savings.",
      });
    } catch (error) {
      toast({
        title: "Could not start deposit",
        description: error instanceof Error ? error.message : "Failed to register the deposit request.",
        variant: "destructive",
      });
    } finally {
      setDepositSaving(false);
    }
  };

  const handleSubmitDepositReference = () => {
    if (!manualDepositRef.trim()) {
      toast({
        title: "Add the reference",
        description: "Enter the SMS reference so our team can reconcile the deposit.",
        variant: "destructive",
      });
      return;
    }
    setDepositStatus("confirmed");
    toast({
      title: "Reference saved",
      description: "We will confirm the savings deposit within a few minutes.",
    });
  };

  const handleDismissInsuranceOverlay = () => {
    setDismissedInsuranceOverlay(true);
    setShowInsuranceFallback(true);
  };

  const handleDismissDepositOverlay = () => {
    setDismissedDepositOverlay(true);
    setShowDepositFallback(true);
  };

  const depositPoints = getDepositPoints(depositAmount);

  const ticketPerkUnlocked =
    ticketEligibility.eligible || (activePolicy && !activePolicy.ticketPerkIssued);

  const doublePointsActive =
    depositStatus === "confirmed"
      ? depositAmount >= 10000
      : depositReceipt.status === "confirmed" && depositReceipt.amount >= 10000;

  const pagePerkBanner = ticketPerkUnlocked
    ? {
        badge: "Ticket perk",
        message: "Free Blue Zone ticket ready to claim",
        description: "Your latest Akili Insurance policy unlocked a complimentary seat.",
        href: "#policy-card",
      }
    : doublePointsActive
      ? {
          badge: "Fan points boost",
          message: "Double points active on SACCO deposits",
          description: "Save at least 10,000 RWF today to continue earning 2× loyalty points.",
          href: "#sacco-deposit",
        }
      : null;

  return (
    <div className="min-h-screen bg-rs-gradient pb-24 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-16 pt-10">
        <MotionSection
          initial="hidden"
          animate="visible"
          variants={fadeUp(shouldReduceMotion)}
          className="space-y-6"
        >
          <GlassCard className="relative overflow-hidden bg-white/5 p-6 md:p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-white/10" aria-hidden="true" />
            <div className="relative space-y-6">
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-white/70">
                <span className="rounded-full bg-white/10 px-3 py-1">New</span>
                <span className="rounded-full bg-white/10 px-3 py-1">Super-app hub</span>
              </div>
              <div className="space-y-4">
                <h1 className="text-3xl font-bold md:text-4xl">{partnerServicesHero.title}</h1>
                <p className="max-w-2xl text-base text-white/80 md:text-lg">{partnerServicesHero.subtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-white/70" aria-label="Partner sponsors">
                {partnerServicesHero.sponsors.map((sponsor) => (
                  <span
                    key={sponsor.id}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> {sponsor.name}
                  </span>
                ))}
              </div>
            </div>
          </GlassCard>
        </MotionSection>

        {pagePerkBanner ? (
          <MotionSection
            initial="hidden"
            animate="visible"
            variants={fadeUp(shouldReduceMotion)}
            aria-live="polite"
          >
            <PerkBanner {...pagePerkBanner} />
          </MotionSection>
        ) : null}

        <MotionSection
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp(shouldReduceMotion)}
          className="space-y-4"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-semibold">Featured services</h2>
            <p className="text-sm text-white/70">
              Tap a card to launch the flow inside the Rayon app.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {partnerServices.map((service) => (
              <GlassCard key={service.id} className="flex h-full flex-col justify-between gap-5 p-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl" aria-hidden="true">
                      {service.logo}
                    </span>
                    <div>
                      <p className="text-sm uppercase tracking-wide text-white/70">{service.name}</p>
                      <h3 className="text-xl font-semibold">{service.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-white/75">{service.benefit}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button asChild variant="hero" className="w-full">
                    <Link href={service.href}>{service.ctaLabel}</Link>
                  </Button>
                  <Link className="text-xs text-white/70 underline" href={service.termsHref}>
                    T&Cs
                  </Link>
                  {service.link ? (
                    <Link className="text-xs text-white/60" href={service.link}>
                      Suggest a partner →
                    </Link>
                  ) : null}
                </div>
              </GlassCard>
            ))}
          </div>
        </MotionSection>

        <MotionSection
          id="motor-insurance"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp(shouldReduceMotion)}
          className="space-y-4"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Motor insurance (Akili Insurance)</h2>
              <p className="text-sm text-white/70">Quote, customise, and pay via USSD to receive your policy instantly.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <InfoChip icon={ShieldCheck} label="Licensed insurer" />
              <InfoChip icon={Ticket} label="Free ticket perk" />
            </div>
          </div>
          <FlowStepIndicator currentStep={insuranceStep} />
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <GlassCard className="space-y-5 p-5">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Quote details</h3>
                <p className="text-sm text-white/70">Enter your moto details and customise optional add-ons.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plate">Plate number (optional)</Label>
                  <Input
                    id="plate"
                    placeholder={insuranceQuoteTemplate.plate}
                    value={plateNumber}
                    onChange={(event) => setPlateNumber(event.target.value.toUpperCase())}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="moto-type">Moto type</Label>
                    <Select value={motoType} onValueChange={(value: "moto" | "car") => setMotoType(value)}>
                      <SelectTrigger id="moto-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="moto">Moto</SelectItem>
                        <SelectItem value="car">Car</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coverage">Coverage period</Label>
                    <Select
                      value={String(coverageMonths)}
                      onValueChange={(value) => setCoverageMonths(Number(value))}
                    >
                      <SelectTrigger id="coverage">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 3, 6, 12].map((month) => (
                          <SelectItem key={month} value={String(month)}>
                            {month} {month === 1 ? "month" : "months"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Add-ons</Label>
                    <div className="space-y-3">
                      {insuranceQuoteTemplate.addons.map((addon) => {
                        const checked = selectedAddons.includes(addon.id);
                        return (
                          <label key={addon.id} className="flex items-start gap-3">
                            <Checkbox
                              id={`addon-${addon.id}`}
                              checked={checked}
                              onCheckedChange={() => handleToggleAddon(addon.id)}
                            />
                            <div className="space-y-1">
                              <span className="font-medium">{addon.title}</span>
                              <p className="text-xs text-white/70">{addon.description}</p>
                              <span className="text-xs text-white/60">+{formatCurrency(addon.price)}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full name</Label>
                    <Input
                      id="full-name"
                      placeholder="Fan name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone-number">Mobile number</Label>
                    <Input
                      id="phone-number"
                      inputMode="tel"
                      placeholder="07xx xxx xxx"
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                    />
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="flex h-full flex-col justify-between gap-5 p-5">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Quote summary</h3>
                  <p className="text-sm text-white/70">Review your premium before starting USSD payment.</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-white/80">
                    <span>Base premium</span>
                    <span>{formatCurrency(basePremium)}</span>
                  </div>
                  <div className="space-y-2">
                    {selectedAddons.map((addonId) => (
                      <div key={addonId} className="flex items-center justify-between text-sm text-white/80">
                        <span>{addonDetails[addonId]?.title ?? "Addon"}</span>
                        <span>{formatCurrency(addonPrices[addonId] ?? 0)}</span>
                      </div>
                    ))}
                    {selectedAddons.length === 0 ? (
                      <p className="text-sm text-white/60">No add-ons selected</p>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold">
                    <span>Total due</span>
                    <span>{formatCurrency(insuranceTotal)}</span>
                  </div>
                  {insuranceQuoteTemplate.ticketPerk ? (
                    <div className="space-y-2 rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-100">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4" />
                        <span>{insuranceQuoteTemplate.ticketPerk.ruleText}</span>
                      </div>
                      <p className="text-emerald-100/80">{ticketEligibility.helper}</p>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="space-y-4">
                <Button className="w-full" variant="hero" onClick={handleStartInsurancePayment}>
                  <PhoneCall className="h-4 w-4" /> Dial {formatUssdDisplay(insuranceUssdCode)}
                </Button>
                <UssdNetworkTiles ussdCode={formatUssdDisplay(insuranceUssdCode)} />
                {insuranceStatus === "confirmed" ? (
                  <div className="card space-y-3 bg-emerald-500/10 text-emerald-50">
                    <div className="text-base font-semibold text-white">Payment received</div>
                    <p className="text-sm text-emerald-100/80">
                      Your policy will be issued shortly. Claim your free ticket from My Tickets.
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setInsuranceStatus("idle");
                          setShowInsuranceFallback(false);
                          setManualInsuranceRef("");
                        }}
                      >
                        Done
                      </Button>
                      <Button asChild variant="hero">
                        <Link href="/tickets">Go to Tickets</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <InsuranceStatus status={insuranceStatus} />
                    {showInsuranceFallback ? (
                      <div className="space-y-3">
                        <p className="text-sm text-white/70">
                          Didn’t receive the SMS? Enter the mobile money reference and we will verify manually.
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            placeholder="MM reference"
                            value={manualInsuranceRef}
                            onChange={(event) => setManualInsuranceRef(event.target.value)}
                          />
                          <Button variant="secondary" onClick={handleSubmitInsuranceReference}>
                            Submit
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
                <p className="text-xs text-white/60" id="motor-insurance-terms">
                  Payments processed via MTN MoMo & Airtel Money. Provide accurate details to avoid policy delays.
                </p>
              </div>
            </GlassCard>
          </div>

          <GlassCard id="policy-card" className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Active policy</h3>
                <p className="text-sm text-white/70">Reference the policy card to claim perks or support.</p>
              </div>
              {ticketEligibility.eligible || !activePolicy.ticketPerkIssued ? (
                <Badge className="bg-emerald-500/20 text-emerald-100" variant="outline">
                  Free ticket unlocked
                </Badge>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-white/60">Policy number</p>
                <p className="text-lg font-semibold">{activePolicy.number}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-white/60">Validity</p>
                <p className="text-sm text-white/80">
                  {new Date(activePolicy.validFrom).toLocaleDateString()} – {new Date(activePolicy.validTo).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="w-full sm:w-auto"
                variant="glass"
                onClick={handleClaimTicket}
                disabled={isClaimingTicket}
              >
                <Ticket className="h-4 w-4" />
                {isClaimingTicket ? "Claiming…" : "Claim free ticket"}
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/tickets">
                  <ArrowUpRight className="h-4 w-4" /> Go to tickets
                </Link>
              </Button>
            </div>
          </GlassCard>
        </MotionSection>

        <MotionSection
          id="sacco-deposit"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp(shouldReduceMotion)}
          className="space-y-4"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">SACCO / Ibimina deposit</h2>
              <p className="text-sm text-white/70">Save with partner cooperatives and boost your fan points instantly.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <InfoChip icon={Banknote} label="Double points" />
              <InfoChip icon={CalendarClock} label="Instant receipts" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <GlassCard className="space-y-5 p-5">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Deposit form</h3>
                <p className="text-sm text-white/70">Choose your SACCO and enter the amount you want to save.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sacco-search">Search SACCO</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Input
                      id="sacco-search"
                      placeholder="Search by name or branch"
                      value={saccoSearchTerm}
                      onChange={(event) => setSaccoSearchTerm(event.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {saccoRecents.length ? (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {saccoRecents.map((saccoId) => {
                        const sacco = saccoDirectory.find((entry) => entry.id === saccoId);
                        if (!sacco) {
                          return null;
                        }
                        const isActive = selectedSacco === sacco.id;
                        return (
                          <Button
                            key={sacco.id}
                            type="button"
                            variant={isActive ? "hero" : "glass"}
                            size="sm"
                            onClick={() => setSelectedSacco(sacco.id)}
                          >
                            {sacco.name}
                          </Button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sacco">SACCO</Label>
                  <Select value={selectedSacco} onValueChange={setSelectedSacco}>
                    <SelectTrigger id="sacco">
                      <SelectValue placeholder="Select SACCO" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSaccos.length === 0 ? (
                        <SelectItem disabled value="__no-results">
                          No partners found
                        </SelectItem>
                      ) : null}
                      {filteredSaccos.map((sacco) => (
                        <SelectItem key={sacco.id} value={sacco.id}>
                          {sacco.name}
                          {sacco.branch ? ` • ${sacco.branch}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSaccoDetails?.branch ? (
                    <p className="text-xs text-white/60">Branch: {selectedSaccoDetails.branch}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit-amount">Amount</Label>
                  <Input
                    id="deposit-amount"
                    inputMode="numeric"
                    value={depositAmount ? String(depositAmount) : ""}
                    onChange={(event) => setDepositAmount(Number(event.target.value.replace(/[^\d]/g, "")))}
                    placeholder="10,000"
                  />
                  <p className="text-xs text-white/60">Deposit ≥ 10,000 RWF today to double your fan points.</p>
                </div>
                <div className="rounded-2xl bg-blue-500/15 p-4 text-sm text-blue-100">
                  <p>Estimated fan points: <strong>{depositPoints}</strong></p>
                  <p className="text-blue-100/80">Points reflect instantly in your wallet.</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="flex h-full flex-col justify-between gap-5 p-5">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">USSD payment</h3>
                  <p className="text-sm text-white/70">Complete the deposit using MTN or Airtel USSD.</p>
                </div>
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    variant="hero"
                    onClick={handleStartDepositPayment}
                    disabled={depositSaving}
                  >
                    {depositSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PhoneCall className="h-4 w-4" />
                    )}
                    {depositSaving
                      ? "Registering deposit…"
                      : `Dial ${formatUssdDisplay(depositUssdCode)}`}
                  </Button>
                  <UssdNetworkTiles ussdCode={formatUssdDisplay(depositUssdCode)} />
                  <DepositStatus status={depositStatus} reference={depositReceipt.ref} />
                  {showDepositFallback ? (
                    <div className="space-y-3">
                      <p className="text-sm text-white/70">
                        Enter the SMS reference if the payment is pending so our SACCO partners can reconcile it.
                      </p>
                      {depositReceipt.ref ? (
                        <p className="text-xs text-white/50">Current ref: {depositReceipt.ref}</p>
                      ) : null}
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          placeholder="Reference"
                          value={manualDepositRef}
                          onChange={(event) => setManualDepositRef(event.target.value)}
                        />
                        <Button variant="secondary" onClick={handleSubmitDepositReference}>
                          Submit
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  <div className="rounded-2xl bg-white/10 p-4 text-sm text-white/80">
                    <p className="font-semibold">Latest receipt</p>
                    <p>
                      {formatCurrency(depositReceipt.amount)} • {depositReceipt.pointsEarned} fan points
                    </p>
                    <p className="text-xs text-white/60">
                      {receiptSaccoDetails?.name ?? "Partner"} — {new Date(depositReceipt.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-white/50">Ref: {depositReceipt.ref}</p>
                  </div>
                </div>
                <p className="text-xs text-white/60" id="sacco-terms">
                  Deposits processed by partner SACCOs. Airtime or mobile money fees may apply.
                </p>
              </div>
            </GlassCard>
          </div>
        </MotionSection>

        <MotionSection
          id="bank-offers"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp(shouldReduceMotion)}
          className="space-y-4"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Bank & partner offers</h2>
              <p className="text-sm text-white/70">Plan upcoming savings and financing tailored for Rayon fans.</p>
            </div>
            <Button asChild variant="glass">
              <Link href="#future-services">
                <ArrowUpRight className="h-4 w-4" /> Notify me when new offers launch
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {bankInsights.map((insight) => (
              <GlassCard key={insight.id} className="space-y-3 p-5">
                <h3 className="text-lg font-semibold">{insight.title}</h3>
                <p className="text-sm text-white/70">{insight.description}</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/support">
                    Learn more <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </GlassCard>
            ))}
          </div>
          <p className="text-xs text-white/60" id="bank-terms">
            Banking offers provided by Umuhinzi Bank. Eligibility subject to credit review and savings history.
          </p>
        </MotionSection>

        <MotionSection
          id="future-services"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp(shouldReduceMotion)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Rewards & perks</h2>
            <p className="text-sm text-white/70">Stay on top of the bonuses you unlock with partner transactions.</p>
          </div>
          <GlassCard className="space-y-6 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Your benefits</h3>
                <ul className="space-y-2 text-sm text-white/80">
                  {partnerPerks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <BadgeCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Rules</h3>
                <ul className="space-y-2 text-sm text-white/80">
                  {rewardRules.map((rule) => (
                    <li key={rule.id} className="rounded-2xl bg-white/10 p-3">
                      <p className="font-medium">{rule.title}</p>
                      <p className="text-xs text-white/70">{rule.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </GlassCard>
        </MotionSection>

        <MotionSection
          id="services-history"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp(shouldReduceMotion)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">My services</h2>
            <p className="text-sm text-white/70">Track recent quotes, issued policies, and SACCO deposits in one place.</p>
          </div>
          <div className="space-y-3">
            {servicesHistory.map((item) => (
              <GlassCard key={item.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{item.title}</p>
                  <span className="text-xs uppercase tracking-wide text-white/60">{item.type.replace("-", " ")}</span>
                </div>
                <p className="text-sm text-white/75">{item.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                  <span>{item.status}</span>
                  <span>•</span>
                  <span>{item.timestamp}</span>
                  {item.href ? (
                    <Link href={item.href} className="text-white/70 underline">
                      View
                    </Link>
                  ) : null}
                </div>
              </GlassCard>
            ))}
          </div>
        </MotionSection>
      </div>
      <PaymentOverlay
        open={insuranceStatus === "pending" && !dismissedInsuranceOverlay}
        title="Waiting for insurance payment"
        description="Complete the USSD steps on your phone. If it fails, enter the reference manually."
        onDismiss={handleDismissInsuranceOverlay}
        actionLabel="Enter reference manually"
      />
      <PaymentOverlay
        open={depositStatus === "pending" && !dismissedDepositOverlay}
        title="Awaiting SACCO confirmation"
        description="Stay on the call until the network confirms the deposit. You can also submit the SMS reference."
        onDismiss={handleDismissDepositOverlay}
        actionLabel="Add reference"
      />
    </div>
  );
};

export default PartnerServicesView;
