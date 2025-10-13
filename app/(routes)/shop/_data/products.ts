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

export type ProductBadge = 'official' | 'new' | 'sale' | 'limited';

export type ProductImage = {
  src: string;
  alt: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: 'jerseys' | 'training' | 'lifestyle' | 'accessories' | 'bundles';
  description: string;
  heroCopy?: string;
  images: ProductImage[];
  variants: Variant[];
  badges?: ProductBadge[];
  tags?: ('Official' | 'Replica' | 'Kids')[];
  materials?: string;
  care?: string;
  fit?: string;
  shipping?: string;
  returnPolicy?: string;
  bundleItems?: string[];
};

export const PRODUCTS: Product[] = [
  {
    id: 'p-home-kit',
    name: 'Home Jersey 24/25',
    slug: 'home-jersey-24-25',
    category: 'jerseys',
    description:
      'Official 24/25 home kit with AeroCool mesh and sponsor detail. Designed for match-day performance and everyday comfort.',
    heroCopy: 'Limited drop — player-issue crest, sponsor print included.',
    images: [
      { src: '/shop/home-front.svg', alt: 'Front view of the Rayon Sports 24/25 home jersey in royal blue.' },
      { src: '/shop/home-back.svg', alt: 'Back print of the Rayon Sports 24/25 home jersey with sponsor space.' },
    ],
    badges: ['official', 'new', 'limited'],
    tags: ['Official'],
    materials: '100% recycled polyester (AeroCool mesh panels).',
    care: 'Machine wash cold, tumble dry low, do not iron crest.',
    fit: 'Athletic fit — size up for a relaxed feel.',
    shipping: 'Pickup free at Amahoro Stadium shop; delivery city-wide available for 2,000 RWF.',
    returnPolicy: 'Returns within 7 days for unworn items with tags.',
    variants: [
      { id: 'p-home-xs-blue', size: 'XS', color: 'blue', sku: 'RS-HM-XS', stock: 3, price: 49000 },
      { id: 'p-home-s-blue', size: 'S', color: 'blue', sku: 'RS-HM-S', stock: 8, price: 49000 },
      { id: 'p-home-m-blue', size: 'M', color: 'blue', sku: 'RS-HM-M', stock: 12, price: 49000 },
      { id: 'p-home-l-blue', size: 'L', color: 'blue', sku: 'RS-HM-L', stock: 6, price: 49000 },
      { id: 'p-home-xl-blue', size: 'XL', color: 'blue', sku: 'RS-HM-XL', stock: 4, price: 49000 },
      { id: 'p-home-xxl-blue', size: 'XXL', color: 'blue', sku: 'RS-HM-XXL', stock: 2, price: 49000 },
    ],
  },
  {
    id: 'p-away-kit',
    name: 'Away Jersey 24/25',
    slug: 'away-jersey-24-25',
    category: 'jerseys',
    description:
      'Crisp white kit with royal accents. Lightweight fabric keeps you cool — ready for stadium roars or city strolls.',
    images: [
      { src: '/shop/away-front.svg', alt: 'Front view of the crisp white Rayon Sports away jersey with royal trims.' },
      { src: '/shop/away-back.svg', alt: 'Back of the Rayon Sports away jersey ready for player name printing.' },
    ],
    badges: ['official'],
    tags: ['Official'],
    materials: 'AeroDry polyester with sweat-wicking micro-perf vents.',
    care: 'Wash inside-out, air dry, avoid bleach.',
    fit: 'Classic fit — true to size.',
    shipping: 'Pickup next-day; district delivery 48h.',
    returnPolicy: 'Exchange sizing within 7 days.',
    variants: [
      { id: 'p-away-xs-white', size: 'XS', color: 'white', sku: 'RS-AW-XS', stock: 0, price: 47000 },
      { id: 'p-away-s-white', size: 'S', color: 'white', sku: 'RS-AW-S', stock: 6, price: 47000 },
      { id: 'p-away-m-white', size: 'M', color: 'white', sku: 'RS-AW-M', stock: 10, price: 47000 },
      { id: 'p-away-l-white', size: 'L', color: 'white', sku: 'RS-AW-L', stock: 9, price: 47000 },
      { id: 'p-away-xl-white', size: 'XL', color: 'white', sku: 'RS-AW-XL', stock: 5, price: 47000 },
      { id: 'p-away-xxl-white', size: 'XXL', color: 'white', sku: 'RS-AW-XXL', stock: 1, price: 47000 },
    ],
  },
  {
    id: 'p-third-kit',
    name: 'Heritage Third Jersey',
    slug: 'heritage-third-jersey',
    category: 'jerseys',
    description:
      'Limited-edition third kit celebrating club legends. Subtle gold foil crest and drop-tail hem.',
    images: [
      { src: '/shop/third-front.svg', alt: 'Front detail of the heritage third jersey with gold crest highlights.' },
      { src: '/shop/third-back.svg', alt: 'Back view of the heritage third jersey showing drop tail hem.' },
    ],
    badges: ['official', 'limited', 'sale'],
    tags: ['Official'],
    materials: 'Recycled polyester blend with stretch rib collar.',
    care: 'Gentle cycle, hang dry, cool iron reverse side only.',
    fit: 'Slim fit — fans often size up.',
    shipping: 'Pickup only for launch weekend.',
    returnPolicy: 'Limited drop — exchange only if sealed.',
    variants: [
      { id: 'p-third-s-blue', size: 'S', color: 'blue', sku: 'RS-TH-S', stock: 4, price: 52000, compareAt: 56000 },
      { id: 'p-third-m-blue', size: 'M', color: 'blue', sku: 'RS-TH-M', stock: 4, price: 52000, compareAt: 56000 },
      { id: 'p-third-l-blue', size: 'L', color: 'blue', sku: 'RS-TH-L', stock: 2, price: 52000, compareAt: 56000 },
    ],
  },
  {
    id: 'p-training-top',
    name: 'Pro Training Top',
    slug: 'pro-training-top',
    category: 'training',
    description:
      'Quarter-zip performance top with thumbholes and reflective piping for evening drills.',
    images: [{ src: '/shop/training-top.svg', alt: 'Pro training quarter-zip top with reflective piping.' }],
    badges: ['new'],
    tags: ['Replica'],
    materials: 'Poly-elastane blend with brushed interior.',
    care: 'Machine wash warm, line dry.',
    fit: 'Slim fit with stretch.',
    shipping: 'Pickup or delivery within Kigali.',
    returnPolicy: '30-day returns for unused gear.',
    variants: [
      { id: 'p-train-s-blue', size: 'S', color: 'blue', sku: 'RS-TRN-S', stock: 7, price: 38000 },
      { id: 'p-train-m-blue', size: 'M', color: 'blue', sku: 'RS-TRN-M', stock: 8, price: 38000 },
      { id: 'p-train-l-blue', size: 'L', color: 'blue', sku: 'RS-TRN-L', stock: 5, price: 38000 },
      { id: 'p-train-xl-black', size: 'XL', color: 'black', sku: 'RS-TRN-XL', stock: 4, price: 38000 },
    ],
  },
  {
    id: 'p-lifestyle-hoodie',
    name: 'Everyday Crest Hoodie',
    slug: 'everyday-crest-hoodie',
    category: 'lifestyle',
    description:
      'Ultra-soft fleece hoodie with oversized crest embroidery. Perfect for match build-up and cool evenings.',
    images: [
      { src: '/shop/hoodie-front.svg', alt: 'Front of the everyday crest hoodie in deep blue.' },
      { src: '/shop/hoodie-back.svg', alt: 'Back of the everyday crest hoodie showing embossed crest.' },
    ],
    badges: ['sale'],
    tags: ['Replica'],
    materials: 'Cotton-poly fleece, lined hood, kangaroo pocket.',
    care: 'Wash cold with similar colours, tumble dry low.',
    fit: 'Relaxed fit — size down for snug look.',
    shipping: 'Available for pickup or same-day delivery (fee applies).',
    returnPolicy: '30-day easy returns.',
    variants: [
      { id: 'p-hoodie-s-blue', size: 'S', color: 'blue', sku: 'RS-HD-S', stock: 9, price: 32000, compareAt: 36000 },
      { id: 'p-hoodie-m-blue', size: 'M', color: 'blue', sku: 'RS-HD-M', stock: 11, price: 32000, compareAt: 36000 },
      { id: 'p-hoodie-l-blue', size: 'L', color: 'blue', sku: 'RS-HD-L', stock: 6, price: 32000, compareAt: 36000 },
      { id: 'p-hoodie-xl-black', size: 'XL', color: 'black', sku: 'RS-HD-XL', stock: 3, price: 32000, compareAt: 36000 },
    ],
  },
  {
    id: 'p-accessory-scarf',
    name: 'Matchday Scarf',
    slug: 'matchday-scarf',
    category: 'accessories',
    description:
      'Double-sided jacquard scarf with rallying cry fringe. Keeps you warm and waving high.',
    images: [{ src: '/shop/scarf.svg', alt: 'Rayon Sports matchday scarf with rallying stripes.' }],
    badges: ['sale'],
    tags: ['Official'],
    materials: 'Acrylic knit.',
    care: 'Hand wash cold, dry flat.',
    fit: 'One size.',
    shipping: 'Pickup instantly; delivery available.',
    returnPolicy: '14-day returns.',
    variants: [
      { id: 'p-scarf-os-blue', size: 'M', color: 'blue', sku: 'RS-SCARF', stock: 44, price: 15000, compareAt: 18000 },
    ],
  },
  {
    id: 'p-accessory-cap',
    name: 'Sunset Cap',
    slug: 'sunset-cap',
    category: 'accessories',
    description:
      'Six-panel cap with adjustable strap and sunset gradient underbill.',
    images: [{ src: '/shop/cap.svg', alt: 'Sunset gradient cap with embroidered crest.' }],
    badges: ['new'],
    tags: ['Replica'],
    materials: 'Cotton twill with moisture-wicking band.',
    care: 'Spot clean.',
    fit: 'One size with adjustable strap.',
    shipping: 'Pickup or courier delivery.',
    returnPolicy: '30-day returns.',
    variants: [
      { id: 'p-cap-os-blue', size: 'M', color: 'blue', sku: 'RS-CAP-BL', stock: 20, price: 18000 },
      { id: 'p-cap-os-black', size: 'M', color: 'black', sku: 'RS-CAP-BK', stock: 12, price: 18000 },
    ],
  },
  {
    id: 'p-bundle-kit',
    name: 'Match Ready Bundle',
    slug: 'match-ready-bundle',
    category: 'bundles',
    description:
      'Bundle and save — includes home jersey, scarf, and socks. Perfect gift for new fans.',
    images: [{ src: '/shop/bundle.svg', alt: 'Match ready bundle including jersey, scarf, and socks.' }],
    badges: ['sale', 'limited'],
    tags: ['Official'],
    materials: 'See individual items.',
    care: 'Follow product labels.',
    fit: 'Select jersey size; accessories are one size.',
    shipping: 'Pickup at club store; courier delivery next-day.',
    returnPolicy: 'Bundle exchange within 7 days.',
    bundleItems: ['Home Jersey', 'Matchday Scarf', 'Crest Socks'],
    variants: [
      { id: 'p-bundle-s-blue', size: 'S', color: 'blue', sku: 'RS-BDL-S', stock: 5, price: 82000, compareAt: 89000 },
      { id: 'p-bundle-m-blue', size: 'M', color: 'blue', sku: 'RS-BDL-M', stock: 7, price: 82000, compareAt: 89000 },
      { id: 'p-bundle-l-blue', size: 'L', color: 'blue', sku: 'RS-BDL-L', stock: 4, price: 82000, compareAt: 89000 },
    ],
  },
];

export const FEATURED_SLUG = 'home-jersey-24-25';
