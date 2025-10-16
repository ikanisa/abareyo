import PageShell from '@/app/_components/shell/PageShell';
import NewsClient from './_components/NewsClient';
export const dynamic = 'force-dynamic';
export default async function News(){ return (<PageShell><section className="card"><h1>News & Media</h1><p className="muted">Articles and videos for your favorites.</p></section><NewsClient/></PageShell>); }
