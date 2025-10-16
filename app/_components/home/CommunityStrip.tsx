"use client";

import useSWR from "swr";

export default function CommunityStrip() {
  const { data } = useSWR("/api/community/posts", (url: string) => fetch(url).then((res) => res.json()));
  const posts = data?.posts ?? [];

  if (!posts.length) {
    return null;
  }

  return (
    <section className="card">
      <h2 className="section-title">Community</h2>
      <div className="muted">{posts[0].text}</div>
    </section>
  );
}
