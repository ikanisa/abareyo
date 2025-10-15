"use client";

import Image, { type ImageProps } from "next/image";
import { memo } from "react";

export type OptimizedImageProps = ImageProps;

export const OptimizedImage = memo(function OptimizedImage(props: OptimizedImageProps) {
  return <Image {...props} />;
});
