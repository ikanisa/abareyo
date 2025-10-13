"use client";

const ProductSkeleton = () => (
  <div className="card break-words whitespace-normal h-full animate-pulse space-y-3 bg-white/5">
    <div className="aspect-square w-full rounded-2xl bg-white/10" />
    <div className="h-4 w-24 rounded-full bg-white/10" />
    <div className="h-4 w-32 rounded-full bg-white/10" />
    <div className="h-10 w-full rounded-xl bg-white/10" />
  </div>
);

export default ProductSkeleton;
