'use client'
import useSWR from 'swr';
export default function CommunityStrip(){
  const { data } = useSWR('/api/community/posts?format=object', (u)=>fetch(u).then(r=>r.json()));
  const posts = Array.isArray(data) ? data : data?.posts || [];
  if(!posts.length) return null;
  return (<section className="card"><h2 className="section-title">Community</h2><div className="muted">{posts[0].text||posts[0].title||'Allez Gikundiro!'}</div></section>);
}
