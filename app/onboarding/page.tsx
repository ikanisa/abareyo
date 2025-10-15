'use client';

import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageShell from '@/app/_components/shell/PageShell';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { dispatchTelemetryEvent } from '@/lib/observability';

type MemberProfile = {
  id: string;
  name: string | null;
  display_name: string | null;
  region: string | null;
  fan_club: string | null;
  public_profile: boolean | null;
  language: string | null;
  momo_number: string | null;
  joined_at: string | null;
  avatar_url: string | null;
};

type MeResponse = { me: MemberProfile | null };
type SaveResponse = { ok?: boolean; id?: string; error?: string };

type Step = 1 | 2 | 3;

const REGIONS = [
  'Kigali',
  'Huye',
  'Musanze',
  'Rubavu',
  'Rusizi',
  'Nyagatare',
  'Rwamagana',
  'Bugesera',
  'Muhanga',
  'Karongi',
];

const FAN_CLUBS = [
  'Rayon SC Kigali',
  'Rayon SC Huye',
  'Rayon SC Rubavu',
  'Rayon SC Musanze',
  'Rayon SC Rusizi',
  'Rayon SC Diaspora',
];

export default function OnboardingWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [language, setLanguage] = useState<'rw' | 'en'>('rw');
  const [region, setRegion] = useState('');
  const [fanClub, setFanClub] = useState('');
  const [publicProfile, setPublicProfile] = useState(true);
  const [momoNumber, setMomoNumber] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinueStep1 = useMemo(() => fullName.trim().length >= 2, [fullName]);
  const canContinueStep2 = useMemo(() => region.trim().length > 0, [region]);
  const canSubmit = useMemo(
    () => canContinueStep1 && canContinueStep2 && consent && !submitting,
    [canContinueStep1, canContinueStep2, consent, submitting],
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/me', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('failed_to_load');
        }
        const json = (await response.json()) as MeResponse;
        if (!cancelled && json.me) {
          const me = json.me;
          setFullName(me.name ?? '');
          setDisplayName(me.display_name ?? '');
          setRegion(me.region ?? '');
          setFanClub(me.fan_club ?? '');
          setPublicProfile(Boolean(me.public_profile ?? false));
          setLanguage(me.language === 'en' ? 'en' : 'rw');
          setMomoNumber(me.momo_number ?? '');
          setConsent(true);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError('We could not load your saved details. You can still continue.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();
    void dispatchTelemetryEvent({ type: 'onboarding_started' });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    setError(null);

    const payload = {
      fullName,
      displayName,
      language,
      region,
      fanClub,
      publicProfile,
      momoNumber: momoNumber.trim() ? momoNumber.trim() : null,
      consent: true,
    };

    try {
      const response = await fetch('/api/me/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await response.json().catch(() => ({}))) as SaveResponse;
      if (!response.ok || !json.ok) {
        throw new Error(json.error ?? 'save_failed');
      }

      toast({
        title: 'Profile saved',
        description: publicProfile
          ? 'Welcome to the public directory. You can hide anytime from settings.'
          : 'Your profile is private. Update it later from Settings.',
      });

      void dispatchTelemetryEvent({
        type: 'onboarding_completed',
        public_profile: publicProfile,
        region: region || '—',
        fan_club: fanClub || '—',
      });

      router.push('/members');
    } catch (saveError) {
      console.error('Failed to save onboarding profile', saveError);
      setError('We could not save your profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    if (loading) {
      return (
        <div className="space-y-4" aria-busy="true">
          <div className="h-5 w-36 animate-pulse rounded bg-white/15" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-white/10" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-white/10" />
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="space-y-4">
          <div>
            <label htmlFor="full-name" className="muted text-sm">
              Full name
            </label>
            <input
              id="full-name"
              className="w-full rounded-xl bg-black/25 px-3 py-3 text-white outline-none"
              placeholder="Your full name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="display-name" className="muted text-sm">
              Preferred display name (optional)
            </label>
            <input
              id="display-name"
              className="w-full rounded-xl bg-black/25 px-3 py-3 text-white outline-none"
              placeholder="What should others see?"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
          <div>
            <span className="muted text-sm">Language</span>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {[
                { value: 'rw' as const, label: 'Kinyarwanda' },
                { value: 'en' as const, label: 'English' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={clsx(
                    'tile min-h-[48px] text-sm font-semibold',
                    language === option.value && 'bg-white/30 text-black',
                  )}
                  onClick={() => setLanguage(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="btn-primary min-h-[44px] px-6"
              disabled={!canContinueStep1}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          <div>
            <label htmlFor="region" className="muted text-sm">
              Region / City
            </label>
            <select
              id="region"
              className="w-full rounded-xl bg-black/25 px-3 py-3 text-white outline-none"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
            >
              <option value="" disabled>
                Select your region
              </option>
              {REGIONS.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fan-club" className="muted text-sm">
              Fan Club (optional)
            </label>
            <select
              id="fan-club"
              className="w-full rounded-xl bg-black/25 px-3 py-3 text-white outline-none"
              value={fanClub}
              onChange={(event) => setFanClub(event.target.value)}
            >
              <option value="">No fan club yet</option>
              {FAN_CLUBS.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
              <option value="Other">
                Request new club…
              </option>
            </select>
          </div>
          <div className="flex items-center justify-between gap-3">
            <button type="button" className="btn min-h-[44px] px-5" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              type="button"
              className="btn-primary min-h-[44px] px-6"
              disabled={!canContinueStep2}
              onClick={() => setStep(3)}
            >
              Next
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-white/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-white/90 font-semibold">Show me in the Member Directory</div>
              <p className="muted text-xs">You control what is public. You can hide anytime.</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="public-profile"
                aria-label="Show me in the Member Directory"
                checked={publicProfile}
                onCheckedChange={(value) => setPublicProfile(value)}
              />
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="momo" className="muted text-sm">
            MoMo number (optional)
          </label>
          <input
            id="momo"
            className="w-full rounded-xl bg-black/25 px-3 py-3 text-white outline-none"
            placeholder="07xxxxxxxx"
            inputMode="tel"
            value={momoNumber}
            onChange={(event) => setMomoNumber(event.target.value)}
          />
          <p className="muted mt-1 text-xs">Add it for future perks. Payments stay offline for now.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-black/20 px-4 py-3">
          <input
            id="consent"
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="h-5 w-5 rounded border border-white/30 bg-black/40"
          />
          <label htmlFor="consent" className="muted text-sm">
            I agree to share these details with GIKUNDIRO for membership services.
          </label>
        </div>
        <div className="flex items-center justify-between gap-3">
          <button type="button" className="btn min-h-[44px] px-5" onClick={() => setStep(2)}>
            Back
          </button>
          <button
            type="button"
            className="btn-primary min-h-[44px] px-6"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {submitting ? 'Saving…' : 'Finish'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <PageShell>
      <section className="card space-y-5" aria-labelledby="onboarding-title">
        <div>
          <p className="muted text-sm">Step {step} of 3</p>
          <h1 id="onboarding-title" className="mt-1 text-white">
            Join GIKUNDIRO Members
          </h1>
          <p className="muted text-sm">Set your profile in under a minute. We’ll keep it safe.</p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
            {error}
          </div>
        ) : null}

        {renderStep()}
      </section>
    </PageShell>
  );
}
