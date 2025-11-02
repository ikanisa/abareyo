'use client';
import type { FormEvent } from "react";

import { useCallback, useEffect, useMemo, useState } from 'react';

import useFlags from '@/app/_components/flags/useFlags';
import { track } from '@/lib/analytics';

type Favorite = {
  id: string;
  entity_type: 'team' | 'player' | 'competition';
  entity_id: string;
  created_at?: string;
};

type Notifications = {
  goals: boolean;
  kickoff: boolean;
  final: boolean;
  club: boolean;
  expoPushToken?: string | null;
};

type Prefs = {
  language: string;
  notifications: Notifications;
};

const DEFAULT_PREFS: Prefs = {
  language: 'rw',
  notifications: { goals: true, kickoff: true, final: true, club: true, expoPushToken: null },
};

const languages = [
  { value: 'rw', label: 'Kinyarwanda' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
];

export default function PersonalizedRail() {
  const flags = useFlags();
  const enabled = flags['features.personalization'];

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  const [entityType, setEntityType] = useState<Favorite['entity_type']>('team');
  const [entityId, setEntityId] = useState('');

  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [submittingFavorite, setSubmittingFavorite] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmitFavorite = useMemo(
    () => Boolean(entityId.trim()) && !submittingFavorite,
    [entityId, submittingFavorite],
  );

  const loadFavorites = useCallback(async () => {
    setLoadingFavorites(true);
    setError(null);
    try {
      const response = await fetch('/api/me/favorites');
      if (!response.ok) {
        throw new Error('Failed to load favorites');
      }
      const payload = await response.json();
      setFavorites(payload.items ?? []);
    } catch (err) {
      console.error(err);
      setError('Imyirondoro ntiyabonetse.');
      setFavorites([]);
    } finally {
      setLoadingFavorites(false);
    }
  }, []);

  const loadPrefs = useCallback(async () => {
    setLoadingPrefs(true);
    setError(null);
    try {
      const response = await fetch('/api/me/prefs');
      if (!response.ok) {
        throw new Error('Failed to load preferences');
      }
      const payload = await response.json();
      setPrefs(payload.prefs ?? DEFAULT_PREFS);
    } catch (err) {
      console.error(err);
      setError("Imyanya y'ubumenyi ntiyabonetse.");
      setPrefs(DEFAULT_PREFS);
    } finally {
      setLoadingPrefs(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    loadFavorites();
    loadPrefs();
  }, [enabled, loadFavorites, loadPrefs]);

  const handleFavoriteSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!entityId.trim()) {
        return;
      }
      setSubmittingFavorite(true);
      setMessage(null);
      setError(null);
      try {
        const response = await fetch('/api/me/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity_type: entityType, entity_id: entityId.trim() }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(payload.error ?? 'Failed to save favorite');
        }
        track('favorite.added', { entityType, entityId: entityId.trim() });
        setEntityId('');
        setMessage('Favorite saved');
        await loadFavorites();
      } catch (err) {
        console.error(err);
        setError('Ntibishobotse kubika icyo ukunda.');
      } finally {
        setSubmittingFavorite(false);
      }
    },
    [entityId, entityType, loadFavorites],
  );

  const handleFavoriteDelete = useCallback(
    async (id: string) => {
      setError(null);
      setMessage(null);
      try {
        const response = await fetch(`/api/me/favorites?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(payload.error ?? 'Failed to delete favorite');
        }
        track('favorite.removed', { id });
        setFavorites((current) => current.filter((favorite) => favorite.id !== id));
      } catch (err) {
        console.error(err);
        setError('Ntibishobotse gukuraho icyiciro wahisemo.');
      }
    },
    [],
  );

  const handlePrefToggle = useCallback(
    (name: keyof Notifications) => {
      setPrefs((current) => ({
        ...current,
        notifications: {
          ...current.notifications,
          [name]: !current.notifications[name],
        },
      }));
    },
    [],
  );

  const handlePrefsSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSavingPrefs(true);
      setMessage(null);
      setError(null);
      try {
        const response = await fetch('/api/me/prefs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prefs),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(payload.error ?? 'Failed to save preferences');
        }
        track('preferences.updated', prefs);
        setMessage('Preferences updated');
      } catch (err) {
        console.error(err);
        setError('Ntibishobotse kuvugurura uburyo bwo kukumenyesha.');
      } finally {
        setSavingPrefs(false);
      }
    },
    [prefs],
  );

  if (!enabled) {
    return null;
  }

  return (
    <section className="card space-y-4" data-testid="personalized-rail">
      <div>
        <h2 className="section-title">For You</h2>
        <p className="muted text-sm">Customize match alerts and keep track of the teams you love.</p>
      </div>

      {error && <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
      {message && <div className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{message}</div>}

      <form className="grid gap-2 rounded-2xl bg-black/20 p-3" onSubmit={handleFavoriteSubmit}>
        <span className="font-semibold">Add a favorite</span>
        <div className="grid grid-cols-3 gap-2">
          <select
            className="col-span-1 rounded-xl bg-black/40 px-3 py-2 text-sm"
            value={entityType}
            onChange={(event) => setEntityType(event.target.value as Favorite['entity_type'])}
          >
            <option value="team">Team</option>
            <option value="player">Player</option>
            <option value="competition">Competition</option>
          </select>
          <input
            className="col-span-2 rounded-xl bg-black/40 px-3 py-2 text-sm"
            placeholder="Enter name or ID"
            value={entityId}
            onChange={(event) => setEntityId(event.target.value)}
            aria-label="Favorite identifier"
          />
        </div>
        <button className="btn-primary justify-self-start" disabled={!canSubmitFavorite} type="submit">
          {submittingFavorite ? 'Saving…' : 'Save favorite'}
        </button>
      </form>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Your favorites</span>
          {loadingFavorites && <span className="text-xs text-white/60">Loading…</span>}
        </div>
        {favorites.length === 0 && !loadingFavorites && (
          <p className="muted text-sm">Add clubs, players, or competitions to receive tailored updates.</p>
        )}
        <ul className="grid gap-2">
          {favorites.map((favorite) => (
            <li
              key={favorite.id}
              className="flex items-center justify-between rounded-2xl bg-black/25 px-3 py-2 text-sm"
            >
              <div>
                <span className="uppercase tracking-wide text-white/60">{favorite.entity_type}</span>
                <div className="font-semibold text-white">{favorite.entity_id}</div>
              </div>
              <button
                className="text-xs text-red-300 hover:text-red-200"
                onClick={() => handleFavoriteDelete(favorite.id)}
                type="button"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <form className="grid gap-3 rounded-2xl bg-black/20 p-3" onSubmit={handlePrefsSubmit}>
        <div className="flex items-center justify-between">
          <span className="font-semibold">Match alerts</span>
          {loadingPrefs && <span className="text-xs text-white/60">Loading…</span>}
        </div>
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-white/60">Language</span>
          <select
            className="rounded-xl bg-black/40 px-3 py-2 text-sm"
            value={prefs.language}
            onChange={(event) => setPrefs((current) => ({ ...current, language: event.target.value }))}
          >
            {languages.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-2 text-sm">
          {Object.entries(prefs.notifications).map(([key, value]) => (
            <label key={key} className="flex items-center justify-between rounded-xl bg-black/25 px-3 py-2">
              <span className="capitalize">{key}</span>
              <input
                checked={value}
                onChange={() => handlePrefToggle(key as keyof Notifications)}
                type="checkbox"
              />
            </label>
          ))}
        </div>

        <button className="btn-primary justify-self-start" disabled={savingPrefs} type="submit">
          {savingPrefs ? 'Saving…' : 'Save preferences'}
        </button>
      </form>
    </section>
  );
}
