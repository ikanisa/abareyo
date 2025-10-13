import Link from 'next/link';

const ProductNotFound = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
      <div className="glass space-y-4 rounded-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Product not found</h1>
        <p className="text-white/80">
          The product you&apos;re after is sold out or moved. Explore the latest drops or return to the cart to review your items.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn-primary">
            Shop all merch
          </Link>
          <Link href="/cart" className="btn">
            View cart
          </Link>
          <Link href="/" className="btn">
            Home
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default ProductNotFound;
