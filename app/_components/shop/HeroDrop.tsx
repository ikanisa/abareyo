"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { Product } from "@/app/_data/shop_v2";

const getTimeParts = (target: Date) => {
  const now = new Date();
  const diff = Math.max(target.getTime() - now.getTime(), 0);
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: hours.toString().padStart(2, "0"),
    minutes: minutes.toString().padStart(2, "0"),
    seconds: seconds.toString().padStart(2, "0"),
  };
};

type HeroDropProps = {
  product: Product;
  releaseDate: string;
  ctaLabel: string;
  ctaHref: string;
  subheadline: string;
  fallbackImage?: string;
  headline?: string;
};

const HeroDrop = ({
  product,
  releaseDate,
  ctaLabel,
  ctaHref,
  subheadline,
  fallbackImage,
  headline,
}: HeroDropProps) => {
  const release = useMemo(() => new Date(releaseDate), [releaseDate]);
  const [timeLeft, setTimeLeft] = useState(() => getTimeParts(release));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeLeft(getTimeParts(release));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [release]);

  const isLive = release.getTime() <= Date.now();

  return (
    <section className="relative overflow-hidden rounded-3xl bg-white/5 p-[1px] text-white">
      <div className="relative flex flex-col gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 p-6 md:flex-row md:items-center">
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-blue-500/40 blur-3xl" />
          <div className="absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-amber-400/30 blur-3xl" />
          {fallbackImage ? (
            <Image
              src={fallbackImage}
              alt="Hero drop backdrop"
              fill
              sizes="100vw"
              className="object-contain opacity-10"
              priority
            />
          ) : null}
        </div>
        <div className="space-y-4 md:flex-1">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs uppercase tracking-wide">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
            {isLive ? "Live now" : "Drop incoming"}
          </span>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold md:text-4xl">{headline ?? product.name}</h1>
            <p className="text-sm text-white/80 md:text-base">{subheadline}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div
              className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3"
              aria-live="polite"
              aria-label={isLive ? "Drop is live" : `Countdown ${timeLeft.hours}:${timeLeft.minutes}:${timeLeft.seconds}`}
            >
              <span className="text-xs uppercase tracking-[0.2em] text-white/60">{isLive ? "Live" : "Drops in"}</span>
              {isLive ? (
                <span className="text-lg font-semibold text-emerald-300">Ready</span>
              ) : (
                <span className="font-mono text-lg font-semibold">
                  {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
                </span>
              )}
            </div>
            <Link className="btn-primary w-full sm:w-auto" href={ctaHref} prefetch>
              {ctaLabel}
            </Link>
          </div>
        </div>
        <div className="relative grid place-items-center md:flex-1">
          <div className="relative aspect-[3/4] w-48 overflow-hidden rounded-3xl bg-white/5 p-4 backdrop-blur">
            <Image
              src={product.images[0] ?? fallbackImage ?? "/shop/home-front.svg"}
              alt={`${product.name} limited drop`}
              width={320}
              height={420}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          {product.badges && product.badges.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs uppercase text-white/80">
              {product.badges.map((badge) => (
                <span key={badge} className="chip bg-white/20 backdrop-blur">
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroDrop;
