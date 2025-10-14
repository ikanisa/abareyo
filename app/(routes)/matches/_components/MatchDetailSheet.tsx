'use client'
import { useEffect, useState } from 'react';

export default function MatchDetailSheet({ id, onClose }:{ id:string; onClose:()=>void }){
  const [data,setData]=useState<any>(null);
  useEffect(()=>{ // simple client fetch; replace with /api/match/:id if available
    (async()=>{
      setData({ timeline:[{min:12, text:'Goal!'}], lineups:{home:[],away:[]}, stats:{possession:[52,48]} });
    })();
  },[id]);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
      <div className="card w-full max-w-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Match Centre</h3>
          <button className="btn" onClick={onClose}>✖</button>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="tile"><div className="muted text-xs">Timeline</div><div className="text-white/90">{data?.timeline?.[0]?.text||'—'}</div></div>
          <div className="tile"><div className="muted text-xs">Lineups</div><div className="text-white/90">Tap players</div></div>
          <div className="tile"><div className="muted text-xs">Stats</div><div className="text-white/90">Possession 52–48</div></div>
        </div>
      </div>
    </div>
  );
}
