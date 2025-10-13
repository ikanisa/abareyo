"use client";

import Image from "next/image";

import type { Product } from "../_data/products";

type PDPGalleryProps = {
  product: Product;
};

const PDPGallery = ({ product }: PDPGalleryProps) => {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {product.images.map((src) => (
        <div key={src} className="relative aspect-square overflow-hidden rounded-2xl bg-white/10">
          <Image src={src} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
      ))}
    </div>
  );
};

export default PDPGallery;
