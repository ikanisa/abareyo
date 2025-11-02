import type { ReactNode } from "react";

export default function Empty({
  title,
  desc,
  cta,
}: {
  title: string;
  desc?: string;
  cta?: ReactNode;
}) {
  return (
    <div className="card text-center">
      <div className="text-white/90 font-semibold">{title}</div>
      {desc ? <div className="muted mt-1">{desc}</div> : null}
      {cta ? <div className="mt-3">{cta}</div> : null}
    </div>
  );
}
