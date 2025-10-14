import Link from 'next/link';

const CartNotFound = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 text-center">
      <div className="glass space-y-4 rounded-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Cart empty</h1>
        <p className="text-white/80">
          The cart you were looking for is cleared. Head back to the shop to add kits or grab match tickets below.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn-primary">
            Browse shop
          </Link>
          <Link href="/tickets" className="btn">
            Buy tickets
          </Link>
          <Link href="/" className="btn">
            Home
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default CartNotFound;
