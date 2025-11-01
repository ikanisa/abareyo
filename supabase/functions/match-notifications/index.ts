import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { chunk } from "https://deno.land/std@0.223.0/collections/chunk.ts";

import { getServiceRoleClient } from "../_shared/client.ts";
import { json, jsonError, parseJsonBody, requireMethod } from "../_shared/http.ts";

const supabase = getServiceRoleClient();

const VAPID_PUBLIC_KEY =
  Deno.env.get("NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY") ?? Deno.env.get("WEB_PUSH_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("WEB_PUSH_PRIVATE_KEY");
const VAPID_CONTACT = Deno.env.get("WEB_PUSH_CONTACT");
const EXPO_ACCESS_TOKEN = Deno.env.get("EXPO_PUSH_ACCESS_TOKEN");

const expoEndpoint = "https://exp.host/--/api/v2/push/send";
let webpushModule: typeof import("https://deno.land/x/webpush@1.1.0/mod.ts") | null = null;
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_CONTACT) {
  webpushModule = await import("https://deno.land/x/webpush@1.1.0/mod.ts");
  webpushModule.setVapidDetails(`mailto:${VAPID_CONTACT}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const DEFAULT_PREFERENCES = { goals: true, kickoff: true, final: true, club: true };

type JobRecord = {
  id: string;
  match_id: string;
  event_type: "kickoff" | "goal" | "full_time";
  payload: Record<string, unknown> | null;
};

type MatchRecord = {
  id: string;
  title: string | null;
  home_team: string | null;
  away_team: string | null;
  venue: string | null;
  status: string | null;
  kickoff: string | null;
};

type NotificationPreference = {
  goals?: boolean;
  kickoff?: boolean;
  final?: boolean;
  club?: boolean;
};

type DeviceRecord = {
  id: string;
  user_id: string | null;
  platform: "expo" | "web";
  expo_token: string | null;
  web_endpoint: string | null;
  subscription: Record<string, unknown> | null;
};

type JobResult = {
  delivered: number;
  errors: string[];
};

const preferenceKeyForEvent = (event: JobRecord["event_type"]): keyof NotificationPreference => {
  switch (event) {
    case "goal":
      return "goals";
    case "full_time":
      return "final";
    default:
      return "kickoff";
  }
};

const buildNotificationCopy = (job: JobRecord, match: MatchRecord | undefined) => {
  const baseTitle = match?.title || `${match?.home_team ?? "Rayon"} vs ${match?.away_team ?? ""}`.trim();
  const payload = job.payload ?? {};
  const scoreline = typeof payload.scoreline === "string" ? payload.scoreline : undefined;
  const minute = typeof payload.minute === "number" ? payload.minute : undefined;
  const player = typeof payload.player === "string" ? payload.player : undefined;
  const venue = match?.venue ? ` at ${match.venue}` : "";

  if (job.event_type === "goal") {
    const minuteLabel = minute ? ` (${minute}')` : "";
    const scorer = player ? `${player}${minuteLabel}` : "Goal";
    const title = scoreline ? `Goal: ${scoreline}` : `Goal for Rayon`;
    const body = `${scorer} ${scoreline ? `→ ${scoreline}` : "for Rayon Sports"}. Tap for live updates.`;
    return { title: title || baseTitle || "Goal!", body, url: `/matchday?openNative=1` };
  }

  if (job.event_type === "full_time") {
    const title = baseTitle ? `Full-time: ${baseTitle}` : "Full-time";
    const body = scoreline ? `Final score ${scoreline}. See stats in the app.` : `Match complete${venue}.`;
    return { title, body, url: `/matchday?openNative=1` };
  }

  const title = baseTitle ? `Kickoff: ${baseTitle}` : "Kickoff";
  const body = `We are underway${venue}. Follow the match centre for live updates.`;
  return { title, body, url: `/matchday?openNative=1` };
};

const sendExpoMessages = async (messages: Array<Record<string, unknown>>) => {
  if (messages.length === 0) {
    return [] as Array<{ status: string; details?: unknown }>;
  }

  const chunks = chunk(messages, 95);
  const responses: Array<{ status: string; details?: unknown }> = [];
  for (const batch of chunks) {
    const response = await fetch(expoEndpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${EXPO_ACCESS_TOKEN}` } : {}),
      },
      body: JSON.stringify(batch),
    });
    if (!response.ok) {
      responses.push(...batch.map(() => ({ status: 'error', details: { status: response.status } })));
      continue;
    }
    const body = await response.json().catch(() => null);
    if (body?.data && Array.isArray(body.data)) {
      responses.push(...body.data);
    } else {
      responses.push(...batch.map(() => ({ status: 'ok' })));
    }
  }
  return responses;
};

const sendWebPushMessages = async (
  notifications: Array<{ subscription: Record<string, unknown>; payload: Record<string, unknown> }>,
) => {
  if (!webpushModule || notifications.length === 0) {
    return [] as Array<{ status: 'ok' | 'error'; reason?: string }>;
  }
  const results: Array<{ status: 'ok' | 'error'; reason?: string }> = [];
  for (const entry of notifications) {
    try {
      await webpushModule!.sendNotification(entry.subscription as PushSubscriptionJSON, JSON.stringify(entry.payload));
      results.push({ status: 'ok' });
    } catch (error) {
      results.push({ status: 'error', reason: error instanceof Error ? error.message : String(error) });
    }
  }
  return results;
};

serve(async (req) => {
  const methodError = requireMethod(req, 'POST');
  if (methodError) {
    return methodError;
  }

  const parsed = await parseJsonBody<{ limit?: number }>(req);
  if (parsed.error) {
    return parsed.error;
  }

  const limit = Math.min(Math.max(parsed.data?.limit ?? 25, 1), 100);

  const { data: jobs, error: jobsError } = await supabase
    .from('match_notification_jobs')
    .select('id, match_id, event_type, payload, status')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (jobsError) {
    return jsonError(jobsError.message, 500);
  }

  if (!jobs || jobs.length === 0) {
    return json({ ok: true, processed: 0, delivered: 0 });
  }

  const matchIds = Array.from(new Set(jobs.map((job) => job.match_id).filter(Boolean)));
  const { data: matchesData } = await supabase
    .from('matches')
    .select('id, title, home_team, away_team, venue, status, kickoff')
    .in('id', matchIds);
  const matchMap = new Map<string, MatchRecord>();
  matchesData?.forEach((match) => {
    matchMap.set(match.id, match as MatchRecord);
  });

  const { data: devicesData } = await supabase
    .from('notification_devices')
    .select('id, user_id, platform, expo_token, web_endpoint, subscription, enabled')
    .eq('enabled', true);

  const deviceList = (devicesData ?? []).filter(
    (device): device is DeviceRecord =>
      !!device &&
      ((device.platform === 'expo' && device.expo_token) || (device.platform === 'web' && device.web_endpoint)),
  );

  const userIds = Array.from(new Set(deviceList.map((device) => device.user_id).filter((id): id is string => !!id)));
  const { data: prefsData } = await supabase
    .from('user_prefs')
    .select('user_id, notifications')
    .in('user_id', userIds);

  const prefMap = new Map<string, NotificationPreference>();
  prefsData?.forEach((row) => {
    prefMap.set(row.user_id, (row.notifications as NotificationPreference) ?? DEFAULT_PREFERENCES);
  });

  const jobResults = new Map<string, JobResult>();
  const expoMessages: Array<Record<string, unknown> & { jobId: string }> = [];
  const webMessages: Array<{ jobId: string; subscription: Record<string, unknown>; payload: Record<string, unknown> }> = [];

  for (const job of jobs as JobRecord[]) {
    jobResults.set(job.id, { delivered: 0, errors: [] });
    const match = job.match_id ? matchMap.get(job.match_id) : undefined;
    const notification = buildNotificationCopy(job, match);
    const prefKey = preferenceKeyForEvent(job.event_type);

    for (const device of deviceList) {
      if (!device.user_id) {
        continue;
      }
      const prefs = prefMap.get(device.user_id) ?? DEFAULT_PREFERENCES;
      if (prefs[prefKey] === false) {
        continue;
      }

      if (device.platform === 'expo' && device.expo_token) {
        expoMessages.push({
          jobId: job.id,
          to: device.expo_token,
          sound: 'default',
          title: notification.title,
          body: notification.body,
          data: { url: notification.url, eventType: job.event_type, matchId: job.match_id },
        });
      } else if (device.platform === 'web' && device.subscription) {
        webMessages.push({
          jobId: job.id,
          subscription: device.subscription,
          payload: {
            title: notification.title,
            body: notification.body,
            data: { url: notification.url, eventType: job.event_type, matchId: job.match_id },
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
          },
        });
      }
    }
  }

  const expoResults = await sendExpoMessages(expoMessages);
  expoMessages.forEach((message, index) => {
    const result = jobResults.get(message.jobId);
    if (!result) return;
    const response = expoResults[index];
    if (response?.status === 'ok') {
      result.delivered += 1;
    } else {
      result.errors.push(JSON.stringify(response?.details ?? response));
    }
  });

  const webResults = await sendWebPushMessages(
    webMessages.map((entry) => ({ subscription: entry.subscription, payload: entry.payload })),
  );
  webMessages.forEach((entry, index) => {
    const result = jobResults.get(entry.jobId);
    if (!result) return;
    const response = webResults[index];
    if (response?.status === 'ok') {
      result.delivered += 1;
    } else if (response) {
      result.errors.push(response.reason ?? 'web_push_failed');
    }
  });

  const updates = Array.from(jobResults.entries()).map(([jobId, result]) => {
    const hasErrors = result.errors.length > 0;
    const status = result.delivered > 0 ? 'sent' : hasErrors ? 'error' : 'skipped';
    return {
      id: jobId,
      status,
      processed_at: new Date().toISOString(),
      error: hasErrors ? result.errors.slice(0, 3).join('; ').slice(0, 250) : null,
    };
  });

  await supabase.from('match_notification_jobs').upsert(updates, { onConflict: 'id' });

  const delivered = updates.filter((update) => update.status === 'sent').length;
  return json({ ok: true, processed: jobs.length, delivered });
});
