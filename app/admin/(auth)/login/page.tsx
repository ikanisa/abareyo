
'use client';

import { type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

const supabaseAdminClient = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!supabaseAdminClient) {
      setError('Supabase configuration is missing.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error: supabaseError } = await supabaseAdminClient.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (supabaseError) {
        setError(supabaseError.message || 'Unable to sign in with Supabase.');
        setIsSubmitting(false);
        return;
      }

      const accessToken = data.session?.access_token;
      if (!accessToken) {
        setError('Supabase did not return an access token.');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`${BACKEND_BASE}/admin/auth/supabase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accessToken }),
      });

      if (!response.ok) {
        let message = 'Failed to establish an admin session.';
        try {
          const payload = (await response.json()) as { message?: string };
          if (payload?.message) {
            message = payload.message;
          }
        } catch (_error) {
          // Ignore JSON parsing errors.
        }
        setError(message);
        setIsSubmitting(false);
        return;
      }

      await supabaseAdminClient.auth.signOut();
      router.replace('/admin');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unexpected error during login.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-neutral-950 px-4 py-12 text-neutral-100">
      <Card className="w-full max-w-md border-neutral-800 bg-neutral-900 text-neutral-100 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Admin Panel Login</CardTitle>
          <CardDescription className="text-neutral-400">
            Sign in with your Supabase admin credentials to manage the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                disabled={isSubmitting}
              />
            </div>
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Login failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Button
              type="submit"
              className="w-full bg-indigo-500 text-white hover:bg-indigo-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
