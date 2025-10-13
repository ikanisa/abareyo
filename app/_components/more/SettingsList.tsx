"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Bell, ChevronRight, HelpCircle, Info, Languages, LogOut, MoonStar, ShieldQuestion } from "lucide-react";

import type { SettingGroup, SettingIcon } from "@/app/_data/more";
import { Switch } from "@/components/ui/switch";

const settingIcons: Record<SettingIcon, LucideIcon> = {
  languages: Languages,
  "moon-star": MoonStar,
  notifications: Bell,
  "help-circle": HelpCircle,
  "shield-question": ShieldQuestion,
  info: Info,
  "log-out": LogOut,
};

export type SettingsListProps = {
  groups: SettingGroup[];
  onToggle?: (id: string, value: boolean) => void;
  onAction?: (id: string) => void;
};

export function SettingsList({ groups, onToggle, onAction }: SettingsListProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const initialValues = useMemo(() => {
    const defaults: Record<string, boolean> = {};
    groups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.type === "toggle") {
          defaults[item.id] = item.defaultValue ?? false;
        }
      });
    });
    return defaults;
  }, [groups]);

  const [toggleState, setToggleState] = useState<Record<string, boolean>>(initialValues);

  useEffect(() => {
    setToggleState(initialValues);
  }, [initialValues]);

  const handleToggle = (id: string, value: boolean) => {
    setToggleState((prev) => ({ ...prev, [id]: value }));
    onToggle?.(id, value);
  };

  const handleNavigate = (href: string | undefined) => {
    if (!href) return;
    router.push(href);
  };

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`${group.id}-heading`} className="space-y-3">
          <h3 id={`${group.id}-heading`} className="text-sm font-semibold uppercase tracking-wide text-white/70">
            {group.title}
          </h3>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {group.items.map((item) => {
                const Icon = settingIcons[item.icon] ?? Info;
                if (item.type === "toggle") {
                  const checked = toggleState[item.id] ?? item.defaultValue ?? false;
                  const labelId = `setting-${item.id}-label`;
                  const descriptionId = item.description ? `setting-${item.id}-description` : undefined;
                  return (
                    <motion.li
                      key={item.id}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <motion.button
                        type="button"
                        className="card flex w-full items-center gap-3 bg-white/5 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                        whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                        onClick={() => handleToggle(item.id, !checked)}
                        aria-label={item.ariaLabel}
                        aria-labelledby={labelId}
                        aria-describedby={descriptionId}
                        aria-pressed={checked}
                      >
                        <span className="rounded-2xl bg-white/15 p-3 text-white">
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <div className="flex-1 text-left">
                          <p id={labelId} className="text-sm font-semibold text-white">
                            {item.label}
                          </p>
                          {item.description ? (
                            <p id={descriptionId} className="text-xs text-white/70">
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                        <Switch
                          id={`setting-${item.id}`}
                          checked={checked}
                          onClick={(event) => event.stopPropagation()}
                          onCheckedChange={(value) => handleToggle(item.id, value)}
                          aria-labelledby={labelId}
                          aria-describedby={descriptionId}
                        />
                      </motion.button>
                    </motion.li>
                  );
                }

                return (
                  <motion.li
                    key={item.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <motion.button
                      type="button"
                      onClick={() => {
                        if (item.type === "link") {
                          handleNavigate(item.href);
                        } else {
                          onAction?.(item.id);
                        }
                      }}
                      className="card flex w-full items-center gap-3 bg-white/5 p-4 text-left text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                      whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                      aria-label={item.ariaLabel}
                    >
                      <span className="rounded-2xl bg-white/15 p-3 text-white">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="flex-1">
                        <p className="text-sm font-semibold">{item.label}</p>
                        {item.description ? (
                          <span className="text-xs text-white/70">{item.description}</span>
                        ) : null}
                      </span>
                      <ChevronRight className="h-4 w-4 text-white/70" aria-hidden />
                    </motion.button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </section>
      ))}
    </div>
  );
}
