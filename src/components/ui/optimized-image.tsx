"use client";

import Image, { type ImageProps } from "next/image";
import { memo } from "react";

export type OptimizedImageProps = ImageProps;

export const OptimizedImage = memo(function OptimizedImage({
  loading,
  priority,
  decoding = "async",
  ...props
}: OptimizedImageProps) {
  const resolvedLoading = priority ? loading ?? "eager" : loading ?? "lazy";
  const fetchPriority = priority ? "high" : "auto";

  return (
    <Image
      loading={resolvedLoading}
      priority={priority}
      decoding={decoding}
      fetchPriority={fetchPriority}
      {...props}
    />
  );
});
