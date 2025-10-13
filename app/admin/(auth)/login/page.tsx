
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  useEffect(() => {
    // Immediately navigate to the admin dashboard on page load.
    router.push('/admin');
  }, [router]);
  return (
    <div className="flex h-screen w-full items-center justify-center bg-neutral-950 text-neutral-100">
      <p className="text-lg font-medium">Redirecting to the admin panel...</p>
    </div>
  );
}
