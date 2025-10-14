'use client'
export default function WalletPasses({ items }:{ items:any[] }){
  if(!items.length) return (<div className="card text-center"><div className="text-white/90 font-semibold">No passes yet</div><a className="btn mt-2" href="/tickets">Buy Tickets</a></div>);
  return (
    <div className="grid gap-3">
      {items.map(p=>(
        <div className="card" key={p.id} data-ticket-free={p?.order_id ? 0 : 1}>
          <div className="text-white/90 font-semibold">{p.match?.opponent||'Match'} — {p.zone}</div>
          <div className="muted text-xs">{p.state||'active'} · Gate {p.gate||'—'} · {p.qr_token_hash ? 'QR ready' : '—'}</div>
        </div>
      ))}
    </div>
  );
}
