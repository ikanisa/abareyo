import type { Metadata } from "next";

import { consumerNavigationByHref, type ConsumerNavigationItem } from "@/app/navigation";

type MetadataFallback = {
  title?: string;
  description?: string;
  canonical?: string;
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
  const title = fallbackTitle ?? 'GIKUNDIRO';

  return {
    title,
    description,
    alternates: canonical
      ? {
          canonical,
        }
      : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
    },
  } satisfies Metadata;
};
