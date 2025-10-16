import { NextResponse } from 'next/server';
// MVP stub – replace with provider later; returns a fake live score/timeline
export async function GET(){
  return NextResponse.json({ matchId:'demo', home:'Rayon', away:'APR', score:'1-0', minute: 35, timeline:[{min:12, event:'Goal Rayon'}] });
}
