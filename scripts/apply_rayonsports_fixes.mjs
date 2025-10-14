import fs from "node:fs";

function editFile(path, transform) {
  if (!fs.existsSync(path)) {
    console.log(`SKIP: ${path} not found`);
    return;
  }
  const prev = fs.readFileSync(path, "utf8");
  const next = transform(prev);
  if (next !== prev) {
    fs.writeFileSync(path, next, "utf8");
    console.log(`UPDATED: ${path}`);
  } else {
    console.log(`OK (no change needed): ${path}`);
  }
}

// 1) TopAppBar: add Image import + logo image
editFile("app/_components/ui/TopAppBar.tsx", (src) => {
  let out = src;

  if (!out.includes('import Image from "next/image"')) {
    out = out.replace(
      /import type \{ ReactNode \} from "react";/,
      'import type { ReactNode } from "react";\nimport Image from "next/image";'
    );
  }

  out = out.replace(
    /<div aria-label="Rayon logo" className="h-8 w-8 rounded-xl bg-white\/90" \/>/,
    `<Image
          src="/rayon-logo.png"
          alt="Rayon Sports logo"
          width={32}
          height={32}
          className="h-8 w-8 rounded-xl"
          priority
        />`
  );

  return out;
});

// 2) PWA Install Prompt: move above bottom nav (bottom-4 -> bottom-24)
editFile("app/_components/pwa/PwaHelpers.tsx", (src) =>
  src.replace(
    /className="card fixed inset-x-0 bottom-4 /,
    'className="card fixed inset-x-0 bottom-24 '
  )
);

// 3) HybridPayModal: set default MoMo USSD to *182*8*1*008000#
editFile("app/_components/shop/HybridPayModal.tsx", (src) =>
  src.replace(
    /ussdCode\s*=\s*"\*182\*7\*1#"/,
    'ussdCode = "*182*8*1*008000#"'
  )
);

// 4) ProductCard: guard invalid slugs (disable link if no slug)
editFile("app/(routes)/shop/_components/ProductCard.tsx", (src) => {
  // only change if the simple version is present
  if (!src.includes('href={`/shop/${product.slug}`}')) return src;

  return src.replace(
    /<Link href={`\/shop\/\$\{product\.slug\}`}\s+className="group flex flex-col gap-3[^>]*">/,
    `{/* Build a safe link: disable navigation if product.slug is missing */}
           <Link
             href={product.slug ? \`/shop/\${product.slug}\` : "#"}
             aria-disabled={!product.slug}
             onClick={product.slug ? undefined : (e) => e.preventDefault()}
             className="group flex flex-col gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">`
  );
});

console.log("All done. If any file says UPDATED, that change was applied.");
