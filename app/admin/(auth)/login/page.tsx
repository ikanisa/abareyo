'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

const AdminLoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_BASE}/admin/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(body?.message ?? 'Unable to sign in with the supplied credentials.');
        setIsSubmitting(false);
        return;
      }

      const nextTarget = searchParams?.get('next') ?? '/admin';
      router.replace(nextTarget);
      router.refresh();
    } catch (err) {
      console.error('Admin login failed', err);
      setError('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-12">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
        <div>
          <Link href="/" className="text-sm uppercase tracking-wide text-primary/80">
            Rayon Sports
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-100">Admin Console</h1>
          <p className="text-sm text-slate-400">Sign in with your admin credentials to continue.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={isSubmitting}
              className="bg-white/5 text-slate-100 placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isSubmitting}
              className="bg-white/5 text-slate-100 placeholder:text-slate-500"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="text-xs text-slate-500">
          Need access? Contact a system administrator to be provisioned and to receive your one-time activation link.
        </p>
      </div>
    </div>
  );
};

const AdminLoginPage = () => (
  <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-slate-200">Loading…</div>}>
    <AdminLoginForm />
  </Suspense>
);

export default AdminLoginPage;
