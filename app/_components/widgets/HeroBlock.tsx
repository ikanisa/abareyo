"use client";

import type { ReactNode } from "react";

type HeroBlockProps = {
  title: string;
  subtitle?: string;
  ctas?: ReactNode;
};

const HeroBlock = ({ title, subtitle, ctas }: HeroBlockProps) => (
  <section className="card overflow-hidden">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle ? <p className="muted mt-1 text-sm md:text-base">{subtitle}</p> : null}
      </div>
      {ctas ? <div className="flex flex-wrap items-center gap-2">{ctas}</div> : null}
    </div>
  </section>
);

export default HeroBlock;
