import PageShell from '@/app/_components/shell/PageShell';
import CommunityClient from './_components/CommunityClient';
export default function Community(){ return (<PageShell><section className="card"><h1>Community</h1><p className="muted">Pre-match talk and fan polls.</p></section><CommunityClient/></PageShell>); }
