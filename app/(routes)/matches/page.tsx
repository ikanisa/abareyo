import PageShell from '@/app/_components/shell/PageShell';
import MatchesList from './_components/MatchesList';

export const dynamic = 'force-dynamic';

export default async function MatchesPage(){
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL||''}/api/matches`, { cache:'no-store' }).catch(()=>null);
  const j = await res?.json().catch(()=>null);
  const matches = Array.isArray(j?.matches) ? j.matches : [];
  const normalized = matches.map((match:any, index:number)=>{
    const kickoff = match.kickoff || match.date || null;
    const venue = match.venue || match.stadium || null;
    const status = match.status || (match.score ? 'live' : 'upcoming');
    const opponent = match.opponent || (()=>{
      if(typeof match.home === 'string' && match.home.toLowerCase().includes('rayon')){
        return match.away || 'Opponent';
      }
      if(typeof match.away === 'string' && match.away.toLowerCase().includes('rayon')){
        return match.home || 'Opponent';
      }
      return match.home && match.away ? `${match.home} vs ${match.away}` : match.home || match.away || 'Opponent';
    })();
    return {
      id: match.id?.toString() || `fixture-${index}`,
      opponent,
      kickoff,
      venue,
      status,
    };
  });
  return (
    <PageShell>
      <section className="card">
        <h1>Matches</h1>
        <p className="muted">Pick a game. One tap to buy or view live centre.</p>
      </section>
      <MatchesList matches={normalized}/>
    </PageShell>
  );
}
