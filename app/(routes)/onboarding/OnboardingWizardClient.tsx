'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageShell from '@/app/_components/shell/PageShell';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useAnonymousSupabaseUser } from '@/hooks/useAnonymousSupabaseUser';
import { dispatchTelemetryEvent } from '@/lib/observability';

type MemberProfile = {
  id: string;
  display_name: string | null;
  phone: string | null;
  momo_number: string | null;
  public_profile: boolean | null;
  user_code: string | null;
};

type MeResponse = { me: MemberProfile | null };
type SaveResponse = { ok?: boolean; id?: string; error?: string; code?: string };

const deriveMomoPreview = (whatsapp: string) => {
  const digits = whatsapp.replace(/[^0-9+]/g, '');
  if (!digits) return '';
  if (digits.startsWith('+2507')) {
    return `0${digits.slice(4)}`;
  }
  if (digits.startsWith('2507')) {
    return `0${digits.slice(3)}`;
  }
  if (digits.startsWith('07')) {
    return digits;
  }
  return digits;
};

export default function OnboardingWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAnonymousSupabaseUser();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [useSameMomo, setUseSameMomo] = useState(true);
  const [momoNumber, setMomoNumber] = useState('');
  const [publicProfile, setPublicProfile] = useState(true);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          setWhatsapp(me.phone ?? '');
          setUserCode(me.user_code ?? null);
          setPublicProfile(Boolean(me.public_profile ?? true));
          if (me.momo_number) {
            setMomoNumber(me.momo_number);
            setUseSameMomo(deriveMomoPreview(me.phone ?? '') === me.momo_number);
          }
        }
      } catch (_fetchError) {
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

  const momoPreview = useMemo(() => deriveMomoPreview(whatsapp), [whatsapp]);
  const canSubmit = useMemo(() => {
    if (!whatsapp.trim()) return false;
    if (!useSameMomo && !momoNumber.trim()) return false;
    return !submitting && auth.status !== 'loading';
  }, [auth.status, momoNumber, submitting, useSameMomo, whatsapp]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      user_id: auth.session?.user.id,
      whatsappNumber: whatsapp,
      useWhatsappForMomo: useSameMomo,
      momoNumber: useSameMomo ? undefined : momoNumber,
      publicProfile,
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

      if (json.code) {
        setUserCode(json.code);
      }

      toast({
        title: 'Profile synced',
        description: publicProfile
          ? 'Your WhatsApp number now powers the live fan directory.'
          : 'You are hidden for now. Rejoin anytime from settings.',
      });

      void dispatchTelemetryEvent({
        type: 'onboarding_completed',
        public_profile: publicProfile,
      });

      router.push('/members');
    } catch (saveError) {
      console.error('Failed to save onboarding profile', saveError);
      setError('We could not save your profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatus = () => {
    if (auth.status === 'loading') {
      return 'Securing connection…';
    }
    if (auth.status === 'error') {
      return 'Offline mode';
    }
    return 'Ready';
  };

  return (
    <PageShell>
      <section className="space-y-6" aria-labelledby="onboarding-title">
        <div className="rounded-[32px] bg-gradient-to-br from-[#0EA5E9]/20 via-[#1D4ED8]/20 to-[#312E81]/40 p-[1px]">
          <div className="rounded-[30px] bg-slate-950/80 p-6 backdrop-blur">
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Step 1</p>
              <h1 id="onboarding-title" className="text-3xl font-semibold text-white">
                Light up the fan registry
              </h1>
              <p className="text-sm text-white/70">
                We only need your WhatsApp contact and MoMo readiness. Names are optional—your six-digit fan code is how the
                crew recognises you.
              </p>
            </div>
            <div
              className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]"
              aria-busy={loading ? 'true' : 'false'}
            >
              <div className="space-y-5">
                <div>
                  <label htmlFor="whatsapp" className="muted text-sm">
                    WhatsApp number (with country code)
                  </label>
                  <input
                    id="whatsapp"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                    placeholder="e.g. +2507xxxxxxx"
                    value={whatsapp}
                    onChange={(event) => setWhatsapp(event.target.value)}
                    autoComplete="tel"
                    inputMode="tel"
                    disabled={loading || submitting}
                  />
                  <p className="muted mt-2 text-xs">
                    Tip: fans outside Rwanda can share any country code—your MoMo hint adapts instantly.
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">MoMo matches my WhatsApp</p>
                    <p className="muted text-xs">
                      {useSameMomo ? `Will use ${momoPreview || 'your WhatsApp digits'}` : 'Add a different MoMo number below.'}
                    </p>
                  </div>
                  <Switch
                    checked={useSameMomo}
                    onCheckedChange={setUseSameMomo}
                    aria-label="Use same number for MoMo"
                    disabled={loading || submitting}
                  />
                </div>
                {!useSameMomo ? (
                  <div>
                    <label htmlFor="momo" className="muted text-sm">
                      MoMo number
                    </label>
                    <input
                      id="momo"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                      placeholder="07xxxxxxxx"
                      value={momoNumber}
                      onChange={(event) => setMomoNumber(event.target.value)}
                      autoComplete="tel"
                      inputMode="tel"
                      disabled={loading || submitting}
                    />
                  </div>
                ) : null}
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">Show me in the fan directory</p>
                    <p className="muted text-xs">Toggle anytime after onboarding.</p>
                  </div>
                  <Switch
                    checked={publicProfile}
                    onCheckedChange={setPublicProfile}
                    aria-label="Public profile"
                    disabled={loading || submitting}
                  />
                </div>
                {error ? (
                  <div className="rounded-2xl border border-red-400/60 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
                    {error}
                  </div>
                ) : null}
                <button
                  type="button"
                  className="btn-primary min-h-[48px] w-full justify-center"
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                >
                  {submitting ? 'Syncing…' : 'Save & join directory'}
                </button>
              </div>
              <div className="space-y-4 rounded-3xl border border-white/10 bg-black/40 p-5">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/60">Your fan code</p>
                  <p className="mt-3 text-4xl font-semibold text-white">{userCode ?? '••••••'}</p>
                  <p className="muted mt-2 text-xs">
                    Each new supporter gets six random digits. Share it when joining fan clubs or redeeming perks.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/60">Session</p>
                  <p className="mt-2 text-sm font-semibold text-white">{renderStatus()}</p>
                  {auth.error ? <p className="muted mt-1 text-xs">{auth.error}</p> : null}
                  <button
                    type="button"
                    className="btn mt-3 w-full justify-center"
                    onClick={() => auth.refresh()}
                    disabled={auth.status === 'loading'}
                  >
                    Refresh connection
                  </button>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                  <p className="font-semibold">Why WhatsApp?</p>
                  <p className="muted mt-1 text-xs">
                    It lets us coordinate match-day pushes, reward drops, and MoMo confirmations instantly—no extra passwords.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
