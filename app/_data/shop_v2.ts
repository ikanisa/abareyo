export type ProductBadge = "official" | "new" | "sale" | "exclusive";

export type Product = {
  id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  compareAt?: number;
  badges?: ProductBadge[];
  colors?: string[];
  memberOnly?: boolean;
  bundleOf?: string[];
  description?: string;
  category: string;
};

export type Bundle = {
  id: string;
  title: string;
  items: string[];
  price: number;
  savingsLabel?: string;
};

export type OrderStatus = "ordered" | "paid" | "ready" | "pickedup";

export type Order = {
  id: string;
  items: string[];
  total: number;
  status: OrderStatus;
  pointsUsed: number;
  pickupWindow: string;
};

type ViewerProfile = {
  name: string;
  tier: "Gikundiro" | "Gikundiro+" | "Legends";
  walletBalance: number;
  points: number;
  preferredCategory: string;
  lastPurchase: string;
};

const currency = "RWF";

export const viewerProfile: ViewerProfile = {
  name: "Aline",
  tier: "Gikundiro+",
  walletBalance: 82000,
  points: 5400,
  preferredCategory: "Jerseys",
  lastPurchase: "2024-02-18",
};

export const heroDrop = {
  releaseDate: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
  ctaLabel: "Shop the drop",
  ctaHref: "/shop/home-jersey-24-25",
  headline: "Heritage Third Jersey",
  subheadline: "Legends night drop — numbered 1 of 500",
  backgroundImage: "/shop/third-front.svg",
  productId: "p-third",
};

export const categories = [
  "All",
  "Jerseys",
  "Training",
  "Lifestyle",
  "Accessories",
  "Kids",
  "Bundles",
];

export const products: Product[] = [
  {
    id: "p-home",
    name: "Home Jersey 24/25",
    slug: "home-jersey-24-25",
    images: ["/shop/home-front.svg", "/shop/home-back.svg"],
    price: 49000,
    badges: ["official", "new"],
    colors: ["#0047FF", "#FFFFFF"],
    description: "AeroCool mesh with heat-transfer crest and sponsor.",
    category: "Jerseys",
    bundleOf: ["bundle-jersey-scarf"],
  },
  {
    id: "p-away",
    name: "Away Jersey 24/25",
    slug: "away-jersey-24-25",
    images: ["/shop/away-front.svg"],
    price: 47000,
    badges: ["official"],
    colors: ["#FFFFFF", "#0047FF"],
    description: "Crisp white base with royal side panel taping.",
    category: "Jerseys",
  },
  {
    id: "p-third",
    name: "Heritage Third Jersey",
    slug: "heritage-third-jersey",
    images: ["/shop/third-front.svg"],
    price: 52000,
    compareAt: 56000,
    badges: ["official", "exclusive"],
    colors: ["#00245F", "#CFAE5B"],
    memberOnly: true,
    description: "Numbered collector badge stitched inside collar.",
    category: "Jerseys",
  },
  {
    id: "p-training",
    name: "Pro Training Top",
    slug: "pro-training-top",
    images: ["/shop/training-top.svg"],
    price: 38000,
    badges: ["new"],
    colors: ["#001F4D", "#1E96FC"],
    description: "Quarter-zip thermal knit with reflective piping.",
    category: "Training",
    bundleOf: ["bundle-training"],
  },
  {
    id: "p-hoodie",
    name: "Everyday Crest Hoodie",
    slug: "everyday-crest-hoodie",
    images: ["/shop/hoodie-front.svg"],
    price: 32000,
    compareAt: 36000,
    badges: ["sale"],
    colors: ["#00245F", "#111827"],
    description: "Ultra-soft fleece with oversized crest embroidery.",
    category: "Lifestyle",
  },
  {
    id: "p-scarf",
    name: "Matchday Scarf",
    slug: "matchday-scarf",
    images: ["/shop/scarf.svg"],
    price: 15000,
    compareAt: 18000,
    badges: ["sale"],
    colors: ["#0047FF", "#FAD201"],
    description: "Double-sided jacquard scarf with rallying cry fringe.",
    category: "Accessories",
    bundleOf: ["bundle-jersey-scarf"],
  },
  {
    id: "p-cap",
    name: "Sunset Cap",
    slug: "sunset-cap",
    images: ["/shop/cap.svg"],
    price: 19000,
    badges: ["new"],
    colors: ["#001F3F", "#F97316"],
    description: "Six-panel cap with gradient underbill and crest.",
    category: "Accessories",
    bundleOf: ["bundle-training"],
  },
  {
    id: "p-kids",
    name: "Junior Home Kit",
    slug: "junior-home-kit",
    images: ["/shop/kids-kit.svg"],
    price: 35000,
    badges: ["official"],
    colors: ["#0047FF", "#FFFFFF"],
    description: "Scaled-down home kit with velcro crest for safety.",
    category: "Kids",
  },
];

export const bundles: Bundle[] = [
  {
    id: "bundle-jersey-scarf",
    title: "Matchday Start Pack",
    items: ["p-home", "p-scarf"],
    price: 60000,
    savingsLabel: "Save 4,000 RWF",
  },
  {
    id: "bundle-training",
    title: "Training Morning Combo",
    items: ["p-training", "p-cap"],
    price: 52000,
    savingsLabel: "Save 5%",
  },
];

export const featuredCollections = [
  {
    id: "collection-2425",
    title: "Season 24/25 Kit",
    products: ["p-home", "p-away", "p-third"],
    description: "Player issue tech direct from Amahoro tunnel.",
  },
  {
    id: "collection-lifestyle",
    title: "Fan Lifestyle",
    products: ["p-hoodie", "p-cap"],
    description: "Layered looks for downtown Kigali nights.",
  },
  {
    id: "collection-training",
    title: "Training Gear",
    products: ["p-training", "p-cap"],
    description: "Dial in your sessions with breathable fabrics.",
  },
];

export const recommendationReasons = [
  {
    productId: "p-training",
    reason: "Because you booked the dawn drills session",
  },
  {
    productId: "p-hoodie",
    reason: "Paired with your match tickets for rainy season",
  },
  {
    productId: "p-cap",
    reason: "Members saving 10% on lifestyle accessories",
  },
];

export const exclusiveSkus = products.filter((product) => product.memberOnly);

export const sampleOrders: Order[] = [
  {
    id: "RS-1024",
    items: ["Home Jersey 24/25", "Matchday Scarf"],
    total: 64000,
    status: "ready",
    pointsUsed: 2000,
    pickupWindow: "Pick up today 16:00 - 19:00 at Kigali Arena",
  },
  {
    id: "RS-1025",
    items: ["Pro Training Top"],
    total: 38000,
    status: "paid",
    pointsUsed: 0,
    pickupWindow: "Processing — ready in 1h",
  },
];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("rw-RW", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

export const findProduct = (id: string) => products.find((product) => product.id === id);

export const findProductById = (catalog: Product[], id: string) =>
  catalog.find((product) => product.id === id);

export type ShopData = {
  viewer: ViewerProfile;
  hero: typeof heroDrop;
  categories: string[];
  products: Product[];
  bundles: Bundle[];
  featuredCollections: typeof featuredCollections;
  recommendations: typeof recommendationReasons;
  exclusive: Product[];
  orders: Order[];
};

export const shopData: ShopData = {
  viewer: viewerProfile,
  hero: heroDrop,
  categories,
  products,
  bundles,
  featuredCollections,
  recommendations: recommendationReasons,
  exclusive: exclusiveSkus,
  orders: sampleOrders,
};
