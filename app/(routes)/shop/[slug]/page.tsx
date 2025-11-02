import type { Metadata } from 'next';

import PageShell from '@/app/_components/shell/PageShell';
import UssdPayButton from '@/app/_components/payments/UssdPayButton';
import { buildRouteMetadata } from '@/app/_lib/navigation';

import { PRODUCTS } from '../_data/products';

export default async function PDP({ params }: { params: { slug: string } }) {
  const product = PRODUCTS.find((item) => item.slug === params.slug) ?? PRODUCTS[0];
  const price = product?.variants[0]?.price ?? 25000;
  return (
    <PageShell>
      <section className="card">
        <div className="h-52 rounded-2xl bg-white/10 mb-3" />
        <h1>{product?.name ?? 'Shop item'}</h1>
        <div className="muted">{product?.description ?? 'Official merchandise'}</div>

        <div className="mt-2 grid grid-cols-6 gap-2" role="radiogroup" aria-label="Size">
          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
            <button key={size} className="tile text-center" role="radio" aria-checked={size === 'M'}>
              {size}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <UssdPayButton amount={price} />
        </div>
      </section>
    </PageShell>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = PRODUCTS.find((item) => item.slug === params.slug);

  if (!product) {
    return buildRouteMetadata('/shop', {
      title: 'Shop item',
      description: 'Browse official Rayon Sports merchandise and accessories.',
    });
  }

  return buildRouteMetadata(`/shop/${product.slug}`, {
    title: `${product.name} — Rayon Sports shop`,
    description: product.description,
  });
}
