"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { getExpoPushToken, requestPermissions } from "@/lib/mobile/expo-notifications";

const DEFAULT_NOTIFICATIONS = {
  kickoff: true,
  goals: true,
  final: true,
  club: true,
};

const notificationLabels: Record<keyof typeof DEFAULT_NOTIFICATIONS, string> = {
  kickoff: "Kick-off alerts",
  goals: "Goal vibrations",
  final: "Full-time result",
  club: "Club announcements",
};

export function MatchReminderToggles() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [expoToken, setExpoToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => !loading && !saving, [loading, saving]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch("/api/me/prefs", { cache: "no-store", signal: controller.signal });
        if (!response.ok) {
          throw new Error("failed_to_load");
        }
        const payload = await response.json();
        if (!cancelled) {
          const prefs = payload.prefs ?? {};
          setNotifications({ ...DEFAULT_NOTIFICATIONS, ...(prefs.notifications ?? {}) });
          setExpoToken(prefs.notifications?.expoPushToken ?? null);
        }
      } catch (loadError) {
        if (!cancelled) {
          console.warn("Unable to load match reminder prefs", loadError);
          setError("We could not load your notification settings. You can still make changes.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const handleToggle = useCallback((key: keyof typeof DEFAULT_NOTIFICATIONS) => {
    setNotifications((current) => ({ ...current, [key]: !current[key] }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);

    let pushToken = expoToken;
    if (!pushToken) {
      const permission = await requestPermissions();
      if (permission?.status === "granted") {
        pushToken = await getExpoPushToken();
        if (pushToken) {
          setExpoToken(pushToken);
        }
      }
    }

    try {
      const response = await fetch("/api/me/prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifications: {
            ...notifications,
            expoPushToken: pushToken ?? null,
          },
        }),
      });
      if (!response.ok) {
        throw new Error("failed_to_save");
      }

      toast({
        title: "Match reminders updated",
        description: pushToken
          ? "We will send alerts through Expo push notifications."
          : "Preferences saved. Enable notifications on your device for live alerts.",
      });
    } catch (saveError) {
      console.error("Failed to save match reminders", saveError);
      setError("We couldn't save your preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [canSave, expoToken, notifications, toast]);

  return (
    <section className="space-y-4" aria-labelledby="match-reminders-heading">
      <div>
        <h2 id="match-reminders-heading" className="text-lg font-semibold text-white">
          Match reminders
        </h2>
        <p className="text-sm text-white/70">
          Choose which moments trigger push alerts. We'll use Expo notifications when available.
        </p>
      </div>
      {error ? <p className="text-sm text-rwanda-yellow">{error}</p> : null}
      <ul className="space-y-3">
        {(Object.keys(DEFAULT_NOTIFICATIONS) as (keyof typeof DEFAULT_NOTIFICATIONS)[]).map((key) => (
          <li key={key} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white/90">{notificationLabels[key]}</p>
              <p className="text-xs text-white/60">
                {key === "club"
                  ? "Club-wide announcements and ticket drops."
                  : key === "goals"
                    ? "Buzz for every Rayon Sports goal."
                    : key === "final"
                      ? "Instant final whistle result."
                      : "Line-ups and kick-off reminders."}
              </p>
            </div>
            <Switch
              checked={notifications[key]}
              onCheckedChange={() => handleToggle(key)}
              disabled={saving}
              aria-label={`Toggle ${notificationLabels[key]}`}
            />
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        className="inline-flex items-center justify-center rounded-full bg-rwanda-yellow px-5 py-2 text-sm font-semibold text-slate-900 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save preferences"}
      </button>
    </section>
  );
}
