'use client'
import useSWR from 'swr';
export default function LiveTicker({ id }:{ id:string }){
  const { data } = useSWR(`/api/live/match/${id}`, (u)=>fetch(u).then(r=>r.json()));
  return (<div className="tile"><div className="muted text-xs">Live</div><div>{data?.timeline?.[0]?.text || '—'}</div></div>);
}
