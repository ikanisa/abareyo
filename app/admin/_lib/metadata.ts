import type { Metadata } from "next";

const buildLocaleAlternates = (href: string) => {
  const basePath = href.startsWith("/") ? href : `/${href}`;
  const normalized = basePath === "/" ? "" : basePath;

  return {
    en: normalized || "/",
    fr: normalized ? `/fr${normalized}` : "/fr",
    rw: normalized ? `/rw${normalized}` : "/rw",
  };
};

export const buildAdminRouteMetadata = (
  href: string,
  fallback: { title?: string; description?: string } = {},
): Metadata => {
  const languages = buildLocaleAlternates(href);
  const canonical = href.startsWith("/") ? href : `/${href}`;
  const title = fallback.title ?? "Rayon Sports Admin";
  const description =
    fallback.description ??
    "Monitor match operations, manage membership, and moderate community content for Rayon Sports.";

  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonical,
    },
  } satisfies Metadata;
};
