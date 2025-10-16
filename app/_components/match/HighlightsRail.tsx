'use client'
import useSWR from 'swr';
export default function HighlightsRail({ matchId }:{ matchId:string }){
  const { data } = useSWR(`/api/media/highlights/${matchId}`,(u)=>fetch(u).then(r=>r.json()));
  const items = data?.items||[];
  if(!items.length) return null;
  return (<section className="card"><h2 className="section-title">Highlights</h2><div className="grid gap-2">{items.map((v:any)=><div key={v.id} className="tile">{v.title}</div>)}</div></section>);
}
