export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type Color = 'blue' | 'white' | 'black';

export type Variant = {
  id: string;
  size: Size;
  color: Color;
  sku: string;
  stock: number;
  price: number;
  compareAt?: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: 'jerseys' | 'training' | 'lifestyle' | 'accessories' | 'kids' | 'bundles';
  images: string[];
  variants: Variant[];
  badges?: ('official' | 'new' | 'sale' | 'limited')[];
  description?: string;
  rating?: number;
  reviewsCount?: number;
};

export const FEATURED_SLUG = 'home-jersey-24-25';

export const PRODUCTS: Product[] = [
  {
    id: 'p-home-kit',
    slug: 'home-jersey-24-25',
    name: 'Home Jersey 24/25',
    category: 'jerseys',
    description:
      'Official 24/25 home kit with breathable mesh and crest embroidery. Built for matchday performance and daily wear.',
    images: ['/shop/home-front.svg', '/shop/home-back.svg'],
    badges: ['official', 'new', 'limited'],
    variants: [
      { id: 'p-home-xs-blue', size: 'XS', color: 'blue', sku: 'RS-HM-XS', stock: 3, price: 49000 },
      { id: 'p-home-s-blue', size: 'S', color: 'blue', sku: 'RS-HM-S', stock: 8, price: 49000 },
      { id: 'p-home-m-blue', size: 'M', color: 'blue', sku: 'RS-HM-M', stock: 12, price: 49000 },
      { id: 'p-home-l-blue', size: 'L', color: 'blue', sku: 'RS-HM-L', stock: 6, price: 49000 },
      { id: 'p-home-xl-blue', size: 'XL', color: 'blue', sku: 'RS-HM-XL', stock: 4, price: 49000 },
      { id: 'p-home-xxl-blue', size: 'XXL', color: 'blue', sku: 'RS-HM-XXL', stock: 2, price: 49000 },
    ],
    rating: 4.9,
    reviewsCount: 128,
  },
  {
    id: 'p-away-kit',
    slug: 'away-jersey-24-25',
    name: 'Away Jersey 24/25',
    category: 'jerseys',
    description: 'Crisp white kit with royal accents. Lightweight fabric keeps you cool at the stadium or in town.',
    images: ['/shop/away-front.svg', '/shop/away-back.svg'],
    badges: ['official'],
    variants: [
      { id: 'p-away-xs-white', size: 'XS', color: 'white', sku: 'RS-AW-XS', stock: 0, price: 47000 },
      { id: 'p-away-s-white', size: 'S', color: 'white', sku: 'RS-AW-S', stock: 6, price: 47000 },
      { id: 'p-away-m-white', size: 'M', color: 'white', sku: 'RS-AW-M', stock: 10, price: 47000 },
      { id: 'p-away-l-white', size: 'L', color: 'white', sku: 'RS-AW-L', stock: 9, price: 47000 },
      { id: 'p-away-xl-white', size: 'XL', color: 'white', sku: 'RS-AW-XL', stock: 5, price: 47000 },
      { id: 'p-away-xxl-white', size: 'XXL', color: 'white', sku: 'RS-AW-XXL', stock: 1, price: 47000 },
    ],
    rating: 4.7,
    reviewsCount: 92,
  },
  {
    id: 'p-third-kit',
    slug: 'heritage-third-jersey',
    name: 'Heritage Third Jersey',
    category: 'jerseys',
    description: 'Limited third kit celebrating club legends with gold crest foil and drop-tail hem.',
    images: ['/shop/third-front.svg', '/shop/third-back.svg'],
    badges: ['official', 'limited', 'sale'],
    variants: [
      { id: 'p-third-s-blue', size: 'S', color: 'blue', sku: 'RS-TH-S', stock: 4, price: 52000, compareAt: 56000 },
      { id: 'p-third-m-blue', size: 'M', color: 'blue', sku: 'RS-TH-M', stock: 4, price: 52000, compareAt: 56000 },
      { id: 'p-third-l-blue', size: 'L', color: 'blue', sku: 'RS-TH-L', stock: 2, price: 52000, compareAt: 56000 },
    ],
    rating: 4.8,
    reviewsCount: 64,
  },
  {
    id: 'p-training-top',
    slug: 'pro-training-top',
    name: 'Pro Training Top',
    category: 'training',
    description: 'Quarter-zip performance top with thumbholes and reflective piping for evening drills.',
    images: ['/shop/training-top.svg'],
    badges: ['new'],
    variants: [
      { id: 'p-train-s-blue', size: 'S', color: 'blue', sku: 'RS-TRN-S', stock: 7, price: 38000 },
      { id: 'p-train-m-blue', size: 'M', color: 'blue', sku: 'RS-TRN-M', stock: 8, price: 38000 },
      { id: 'p-train-l-blue', size: 'L', color: 'blue', sku: 'RS-TRN-L', stock: 5, price: 38000 },
      { id: 'p-train-xl-black', size: 'XL', color: 'black', sku: 'RS-TRN-XL', stock: 4, price: 38000 },
    ],
  },
  {
    id: 'p-lifestyle-hoodie',
    slug: 'everyday-crest-hoodie',
    name: 'Everyday Crest Hoodie',
    category: 'lifestyle',
    description: 'Ultra-soft fleece hoodie with oversized crest embroidery. Perfect for cool evenings.',
    images: ['/shop/hoodie-front.svg', '/shop/hoodie-back.svg'],
    badges: ['sale'],
    variants: [
      { id: 'p-hoodie-s-blue', size: 'S', color: 'blue', sku: 'RS-HD-S', stock: 9, price: 32000, compareAt: 36000 },
      { id: 'p-hoodie-m-blue', size: 'M', color: 'blue', sku: 'RS-HD-M', stock: 11, price: 32000, compareAt: 36000 },
      { id: 'p-hoodie-l-blue', size: 'L', color: 'blue', sku: 'RS-HD-L', stock: 6, price: 32000, compareAt: 36000 },
      { id: 'p-hoodie-xl-black', size: 'XL', color: 'black', sku: 'RS-HD-XL', stock: 3, price: 32000, compareAt: 36000 },
    ],
  },
  {
    id: 'p-accessory-scarf',
    slug: 'matchday-scarf',
    name: 'Matchday Scarf',
    category: 'accessories',
    description: 'Double-sided jacquard scarf with rallying fringe to wave high on matchday.',
    images: ['/shop/scarf.svg'],
    badges: ['sale'],
    variants: [{ id: 'p-scarf-os-blue', size: 'M', color: 'blue', sku: 'RS-SCARF', stock: 44, price: 15000, compareAt: 18000 }],
  },
  {
    id: 'p-accessory-cap',
    slug: 'sunset-cap',
    name: 'Sunset Cap',
    category: 'accessories',
    description: 'Six-panel cap with embroidered crest and gradient underbill.',
    images: ['/shop/cap.svg'],
    badges: ['new'],
    variants: [
      { id: 'p-cap-os-blue', size: 'M', color: 'blue', sku: 'RS-CAP', stock: 18, price: 18000 },
      { id: 'p-cap-os-black', size: 'M', color: 'black', sku: 'RS-CAP-BLK', stock: 12, price: 18000 },
    ],
  },
  {
    id: 'p-kids-kit',
    slug: 'kids-home-kit',
    name: 'Kids Home Kit',
    category: 'kids',
    description: 'Scaled-down home jersey for the next generation of supporters.',
    images: ['/shop/kids-kit.svg'],
    badges: ['official'],
    variants: [
      { id: 'p-kids-xs-blue', size: 'XS', color: 'blue', sku: 'RS-KID-XS', stock: 6, price: 36000 },
      { id: 'p-kids-s-blue', size: 'S', color: 'blue', sku: 'RS-KID-S', stock: 8, price: 36000 },
      { id: 'p-kids-m-blue', size: 'M', color: 'blue', sku: 'RS-KID-M', stock: 5, price: 36000 },
    ],
  },
  {
    id: 'p-bundle',
    slug: 'matchday-bundle',
    name: 'Matchday Bundle',
    category: 'bundles',
    description: 'Bundle with jersey, scarf and cap ready for kickoff.',
    images: ['/shop/bundle.svg'],
    badges: ['sale', 'limited'],
    variants: [
      { id: 'p-bundle-mix', size: 'M', color: 'blue', sku: 'RS-BDL', stock: 10, price: 89000, compareAt: 98000 },
    ],
  },
];

export const ALL_CATEGORIES: Product['category'][] = [
  'jerseys',
  'training',
  'lifestyle',
  'accessories',
  'kids',
  'bundles',
];
