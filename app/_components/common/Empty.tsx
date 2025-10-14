import type { ReactNode } from "react";

type EmptyProps = {
  title: string;
  desc?: string;
  cta?: ReactNode;
};

export default function Empty({ title, desc, cta }: EmptyProps) {
  return (
    <div className="card space-y-2 text-center">
      <div className="text-white/90 font-semibold">{title}</div>
      {desc ? <div className="muted text-sm">{desc}</div> : null}
      {cta ? <div>{cta}</div> : null}
    </div>
  );
}
