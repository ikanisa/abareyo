import type { Metadata } from "next";

import { consumerNavigationByHref, type ConsumerNavigationItem } from "@/app/navigation";

type MetadataFallback = {
  title?: string;
  description?: string;
  canonical?: string;
};

const SUPPORTED_LOCALES = ["en", "fr", "rw"] as const;

const buildLocaleAlternates = (href: string) => {
  const basePath = href.startsWith("/") ? href : `/${href}`;
  const normalized = basePath === "/" ? "" : basePath;

  return {
    en: normalized || "/",
    fr: normalized ? `/fr${normalized}` : "/fr",
    rw: normalized ? `/rw${normalized}` : "/rw",
  } satisfies Record<(typeof SUPPORTED_LOCALES)[number], string>;
};

export const getConsumerNavigation = (href: string): ConsumerNavigationItem | undefined =>
  consumerNavigationByHref.get(href);

export const buildRouteMetadata = (
  href: string,
  fallback: MetadataFallback = {},
): Metadata => {
  const item = getConsumerNavigation(href);
  const fallbackTitle = fallback.title ?? item?.meta.title ?? item?.title;
  const description = fallback.description ?? item?.meta.description ?? item?.description;
  const canonical = fallback.canonical ?? item?.href ?? href;
  const title = fallbackTitle ?? 'Rayon Sports';

  const languages = buildLocaleAlternates(href);

  return {
    title,
    description,
    alternates: {
      canonical: canonical ?? href,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonical ?? href,
      locale: SUPPORTED_LOCALES[0],
      alternateLocale: SUPPORTED_LOCALES.slice(1),
    },
  } satisfies Metadata;
};
