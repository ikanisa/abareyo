'use client'
import useSWR from 'swr';
export default function RewardsWidget(){
  const { data } = useSWR('/api/rewards/summary',(u)=>fetch(u).then(r=>r.json()));
  const pts = data?.user?.points||0, perk = data?.latestPerk;
  return (<section className="card"><div className="flex items-center justify-between">
    <div><div className="text-white/90 font-semibold">Rewards</div><div className="muted text-xs">{pts} pts</div></div>
    <div className="flex gap-2"><a className="btn-primary" href={perk?'/tickets':'/shop'}>{perk?'Redeem Ticket':'Redeem in Shop'}</a><a className="btn" href="/more/rewards">Details</a></div>
  </div></section>);
}
