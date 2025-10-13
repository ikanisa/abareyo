
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Track errors as a string or null.  Without this type annotation,
  // assigning a string to setError would cause a TypeScript error.
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Hard‑coded admin credentials.  Replace with real logic in production.
    if (email === 'info@ikanisa.com' && password === 'MoMo!!0099') {
      // Redirect to the admin dashboard if credentials match.
      router.push('/admin');
    } else {
      // Otherwise show a generic error message.
      setError('Invalid credentials');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-neutral-950 text-neutral-100">
      <div className="mx-4 w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h1 className="mb-4 text-2xl font-bold">Admin Console</h1>
        <p className="mb-4 text-sm text-neutral-400">Sign in with your admin credentials to continue.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-800 p-2 text-neutral-100"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-800 p-2 text-neutral-100"
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 py-2 text-center font-semibold text-white hover:bg-blue-700"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
