'use client'
import { useEffect, useState } from 'react';
import PageShell from '@/app/_components/shell/PageShell';

export default function RewardsPage(){
  const [data,setData]=useState<any>(null);
  useEffect(()=>{ fetch('/api/rewards/events').then(r=>r.json()).then(setData).catch(()=>setData(null)); },[]);
  if(!data) return (<PageShell><div className="card"><div className="muted">Loading rewards…</div></div></PageShell>);
  const user = data.user||{ points:0, tier:'fan' }; const perk = data.freeTickets?.[0]||null;
  return (
    <PageShell>
      <section className="card">
        <h1>Rewards</h1>
        <div className="flex items-center justify-between mt-2">
          <div><div className="text-white/90 font-semibold">{user.points} pts</div><div className="muted text-xs">Tier: {user.tier||'fan'}</div></div>
          <div>{perk ? <a className="btn-primary" href="/tickets">Redeem Free Ticket</a> : <a className="btn" href="/shop">Redeem in Shop</a>}</div>
        </div>
      </section>

      <section className="grid gap-3">
        <div className="card">
          <h2 className="section-title">Latest Perk</h2>
          <div className="muted">{perk ? `Free BLUE ticket for match ${perk.match_id}` : 'No active perk yet'}</div>
        </div>
        <div className="card">
          <h2 className="section-title">History</h2>
          <div className="muted text-xs">Recent reward events appear here.</div>
        </div>
      </section>
    </PageShell>
  );
}
