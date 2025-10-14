'use client'
import { useState } from 'react';
import MatchDetailSheet from './MatchDetailSheet';

export default function MatchesList({ matches }:{ matches:any[] }){
  const [open, setOpen] = useState<{id:string}|null>(null);
  if(!matches.length){
    return <div className="card text-center"><div className="text-white/90 font-semibold">No fixtures</div><div className="muted">We’ll refresh this list soon.</div></div>;
  }
  return (
    <>
      <div className="grid gap-3">
        {matches.map(m=>{
          const kickoff = m.kickoff ? new Date(m.kickoff) : null;
          const kickoffLabel = kickoff && !Number.isNaN(kickoff.valueOf()) ? kickoff.toLocaleString() : 'TBC';
          const venueLabel = m.venue || '—';
          return (
            <div key={m.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white/90 font-semibold">{m.opponent}</div>
                  <div className="muted text-sm">{kickoffLabel} · {venueLabel}</div>
                </div>
                <div className="flex gap-2">
                  {m.status==='upcoming' && <a className="btn-primary" href={`/tickets/${m.id}`}>Buy Ticket</a>}
                  {m.status!=='upcoming' && <button className="btn" onClick={()=>setOpen({id:m.id})}>Match Centre</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {open && <MatchDetailSheet id={open.id} onClose={()=>setOpen(null)}/>}
    </>
  );
}
