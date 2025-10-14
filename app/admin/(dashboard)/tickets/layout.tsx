import type { ReactNode } from 'react';

import { TicketsNav } from './_components/TicketsNav';

const TicketsLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-100">Ticketing Console</h1>
        <p className="text-sm text-slate-400">Manage orders, passes, and gate throughput in real-time.</p>
      </div>
      <TicketsNav />
      <div className="space-y-6">{children}</div>
    </div>
  );
};

export default TicketsLayout;
