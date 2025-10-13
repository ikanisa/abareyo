"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

type SegmentedTabsProps = {
  tabs: string[];
  children: React.ReactNode;
  onTabChange?: (tab: string) => void;
  initialTab?: string;
};

const SegmentedTabs = ({
  tabs,
  children,
  onTabChange,
  initialTab,
}: SegmentedTabsProps) => {
  const [activeIndex, setActiveIndex] = useState(() => {
    if (initialTab) {
      const initialIndex = tabs.findIndex(
        (tab) => tab.toLowerCase() === initialTab.toLowerCase(),
      );
      if (initialIndex >= 0) {
        return initialIndex;
      }
    }
    return 0;
  });
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useEffect(() => {
    const activeTab = tabRefs.current[activeIndex];
    const indicator = indicatorRef.current;

    if (!activeTab || !indicator) {
      return;
    }

    const { offsetLeft, offsetWidth } = activeTab;
    indicator.style.setProperty("--indicator-left", `${offsetLeft}px`);
    indicator.style.setProperty("--indicator-width", `${offsetWidth}px`);
  }, [activeIndex, tabs.length]);

  useEffect(() => {
    onTabChange?.(tabs[activeIndex]);
  }, [activeIndex, onTabChange, tabs]);

  const panels = useMemo(
    () => (Array.isArray(children) ? children : [children]),
    [children],
  );

  return (
    <div className="mt-6">
      <div
        role="tablist"
        aria-label="Match insights navigation"
        className="relative flex gap-2 rounded-full bg-white/10 p-1 backdrop-blur supports-[backdrop-filter]:bg-white/5"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            role="tab"
            type="button"
            aria-selected={activeIndex === index}
            aria-controls={`tab-panel-${index}`}
            id={`tab-${index}`}
            onClick={() => setActiveIndex(index)}
            className={clsx(
              "relative flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              activeIndex === index
                ? "text-slate-950"
                : "text-white/70 hover:text-white",
            )}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span>{tab}</span>
            </span>
          </button>
        ))}
        <span
          ref={indicatorRef}
          aria-hidden="true"
          className={clsx(
            "pointer-events-none absolute top-1 h-[calc(100%-0.5rem)] rounded-full bg-white text-slate-950 shadow-lg transition-all",
            prefersReducedMotion ? "transition-none" : "duration-200 ease-out",
          )}
          style={{
            width: "var(--indicator-width, 0px)",
            left: "var(--indicator-left, 0px)",
          }}
        />
      </div>
      <div className="mt-4">
        {panels.map((child, index) => (
          <div
            key={`tab-panel-${index}`}
            role="tabpanel"
            id={`tab-panel-${index}`}
            aria-labelledby={`tab-${index}`}
            hidden={index !== activeIndex}
            className="focus:outline-none"
            tabIndex={index === activeIndex ? 0 : -1}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SegmentedTabs;
