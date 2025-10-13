"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState, type TouchEvent as ReactTouchEvent, type WheelEvent as ReactWheelEvent } from "react";
import { motion, useReducedMotion, type PanInfo } from "framer-motion";

import type { Product } from "../_data/products";

const PDPGallery = ({ product }: { product: Product }) => {
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const prefersReducedMotion = useReducedMotion();
  const pinchDistance = useRef<number | null>(null);
  const pinchScale = useRef(1);
  const images = useMemo(() => (product.images.length ? product.images : DEFAULT_FALLBACK), [product.images]);
  const active = images[index] ?? images[0];

  const resetZoom = useCallback(() => {
    pinchDistance.current = null;
    pinchScale.current = 1;
    setScale(1);
  }, []);

  const clampScale = useCallback((value: number) => Math.min(Math.max(value, 1), 2.6), []);

  const handlePinchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (event.touches.length !== 2) return;
      const distance = getTouchDistance(event.touches[0], event.touches[1]);
      pinchDistance.current = distance;
      pinchScale.current = scale;
    },
    [scale],
  );

  const handlePinchMove = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2 || pinchDistance.current == null) return;
    event.preventDefault();
    const distance = getTouchDistance(event.touches[0], event.touches[1]);
    const ratio = distance / pinchDistance.current;
    const next = clampScale(pinchScale.current * ratio);
    setScale(next);
  }, [clampScale]);

  const handlePinchEnd = useCallback(() => {
    if (pinchDistance.current == null) return;
    if (scale <= 1.05) {
      resetZoom();
    } else {
      pinchDistance.current = null;
    }
  }, [resetZoom, scale]);

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const delta = event.deltaY < 0 ? 0.1 : -0.1;
      setScale((current) => clampScale(current + delta));
    },
    [clampScale],
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (scale > 1.05) return;
      if (info.offset.x > 70) {
        resetZoom();
        setIndex((current) => (current - 1 + images.length) % images.length);
      } else if (info.offset.x < -70) {
        resetZoom();
        setIndex((current) => (current + 1) % images.length);
      }
    },
    [images.length, resetZoom, scale],
  );

  const handleSelect = useCallback(
    (nextIndex: number) => {
      setIndex(nextIndex);
      resetZoom();
    },
    [resetZoom],
  );

  const toggleZoom = useCallback(() => {
    setScale((current) => {
      const next = current > 1.1 ? 1 : 2;
      pinchDistance.current = null;
      pinchScale.current = next;
      return next;
    });
  }, []);

  return (
    <section aria-label={`${product.name} gallery`} className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl bg-white/10">
        <motion.div
          key={active.src}
          initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: prefersReducedMotion ? 0.12 : 0.3 }}
          className="relative aspect-square"
        >
          <motion.div
            className="relative h-full w-full"
            drag={scale > 1.05 ? true : "x"}
            dragElastic={scale > 1.05 ? 0.4 : 0.25}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            style={{ scale }}
            onTouchStart={handlePinchStart}
            onTouchMove={handlePinchMove}
            onTouchEnd={handlePinchEnd}
            onWheel={handleWheel}
            onDoubleClick={toggleZoom}
          >
            <Image
              src={active.src}
              alt={active.alt}
              fill
              sizes="(max-width: 768px) 88vw, 480px"
              className="object-cover"
              priority={index === 0}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          </motion.div>
          {scale > 1.05 && (
            <button
              type="button"
              onClick={resetZoom}
              className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white"
            >
              Reset zoom
            </button>
          )}
        </motion.div>
      </div>
      <div className="flex gap-2">
        {images.map((image, thumbIndex) => {
          const isActive = thumbIndex === index;
          return (
            <button
              key={image.src}
              type="button"
              onClick={() => handleSelect(thumbIndex)}
              className={`relative flex h-16 flex-1 overflow-hidden rounded-2xl border ${
                isActive ? "border-white bg-white/20" : "border-transparent bg-white/10"
              }`}
              aria-label={`Show image ${thumbIndex + 1}`}
              aria-pressed={isActive}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 768px) 24vw, 96px"
                className="object-cover opacity-90"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default PDPGallery;

const DEFAULT_FALLBACK = [{ src: "/placeholder.svg", alt: "Product photography placeholder" }];

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCAxMCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjMUUzQThBIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMzhCREY4Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+";

type TouchPoint = { clientX: number; clientY: number };

const getTouchDistance = (a: TouchPoint, b: TouchPoint) => {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};
