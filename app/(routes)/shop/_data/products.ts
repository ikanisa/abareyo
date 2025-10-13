export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type Color = 'blue' | 'white' | 'black';

import type { LocalizedField } from "./locales";

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
  alt: LocalizedField;
};

export type Product = {
  id: string;
  name: LocalizedField;
  slug: string;
  category: 'jerseys' | 'training' | 'lifestyle' | 'accessories' | 'bundles';
  description: LocalizedField;
  heroCopy?: LocalizedField;
  images: ProductImage[];
  variants: Variant[];
  badges?: ProductBadge[];
  tags?: ('Official' | 'Replica' | 'Kids')[];
  materials?: LocalizedField;
  care?: LocalizedField;
  fit?: LocalizedField;
  shipping?: LocalizedField;
  returnPolicy?: LocalizedField;
  bundleItems?: LocalizedField[];
};

export const PRODUCTS: Product[] = [
  {
    id: 'p-home-kit',
    name: {
      en: 'Home Jersey 24/25',
      rw: "Umwambaro wo mu Rugo 24/25",
    },
    slug: 'home-jersey-24-25',
    category: 'jerseys',
    description: {
      en: 'Official 24/25 home kit with AeroCool mesh and sponsor detail. Designed for match-day performance and everyday comfort.',
      rw: "Umwambaro wo mu rugo w'umwaka wa 24/25 ufite imiyuki ya AeroCool n'ibirango by'abaterankunga. Wateguwe ku mikino no ku bw'ihumure ry'umunsi ku munsi.",
    },
    heroCopy: {
      en: 'Limited drop — player-issue crest, sponsor print included.',
      rw: "Icyinjijwe gike — ikirangantego cy'abakinnyi n'icapiro cy'umuterankunga birimo.",
    },
    images: [
      {
        src: '/shop/home-front.svg',
        alt: {
          en: 'Front view of the Rayon Sports 24/25 home jersey in royal blue.',
          rw: "Imbere y'umwambaro wo mu rugo wa Rayon Sports 24/25 w'ubururu bukeye.",
        },
      },
      {
        src: '/shop/home-back.svg',
        alt: {
          en: 'Back print of the Rayon Sports 24/25 home jersey with sponsor space.',
          rw: "Inyuma y'umwambaro wo mu rugo wa Rayon Sports 24/25 ifite umwanya w'icapiro ry'umuterankunga.",
        },
      },
    ],
    badges: ['official', 'new', 'limited'],
    tags: ['Official'],
    materials: {
      en: '100% recycled polyester (AeroCool mesh panels).',
      rw: '100% polyester yongerewe gukoreshwa (panels za AeroCool).',
    },
    care: {
      en: 'Machine wash cold, tumble dry low, do not iron crest.',
      rw: "Kwoza mu mashini n'amazi akonje, kumisha ku bushyuhe bucye, ntukaraze ku kirangantego.",
    },
    fit: {
      en: 'Athletic fit — size up for a relaxed feel.',
      rw: "Ifashe nk'iy'abakinnyi — hitamo ingano niniho gato kugira ngo wumve worohewe.",
    },
    shipping: {
      en: 'Pickup free at Amahoro Stadium shop; delivery city-wide available for 2,000 RWF.',
      rw: 'Kubikuza ku iduka rya Stade Amahoro ni ubuntu; kohereza mu mujyi wose biboneka ku 2,000 RWF.',
    },
    returnPolicy: {
      en: 'Returns within 7 days for unworn items with tags.',
      rw: 'Gusubiza birashoboka mu minsi 7 ku bicuruzwa bitambaye kandi bifite tagi.',
    },
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
    name: {
      en: 'Away Jersey 24/25',
      rw: 'Umwambaro wo Hanze 24/25',
    },
    slug: 'away-jersey-24-25',
    category: 'jerseys',
    description: {
      en: 'Crisp white kit with royal accents. Lightweight fabric keeps you cool — ready for stadium roars or city strolls.',
      rw: "Umwambaro w'umweru usukuye ufite udushushanyo tw'ubururu. Umwenda woroshye ugufasha kuguma ukonje — witeguye gutera indimu kuri sitade cyangwa gutembera mu mujyi.",
    },
    images: [
      {
        src: '/shop/away-front.svg',
        alt: {
          en: 'Front view of the crisp white Rayon Sports away jersey with royal trims.',
          rw: "Imbere y'umwambaro wo hanze wa Rayon Sports w'umweru ufite imipaka y'ubururu.",
        },
      },
      {
        src: '/shop/away-back.svg',
        alt: {
          en: 'Back of the Rayon Sports away jersey ready for player name printing.',
          rw: "Inyuma y'umwambaro wo hanze wa Rayon Sports witeguye kwakira izina ry'umukinnyi.",
        },
      },
    ],
    badges: ['official'],
    tags: ['Official'],
    materials: {
      en: 'AeroDry polyester with sweat-wicking micro-perf vents.',
      rw: 'Polyester ya AeroDry ifite utwobo dufasha gukurura ibyuya.',
    },
    care: {
      en: 'Wash inside-out, air dry, avoid bleach.',
      rw: 'Kwoza usubitsemo, kumisha mu kirere, wirinde imiti irimo chlorine.',
    },
    fit: {
      en: 'Classic fit — true to size.',
      rw: "Ifashe bisanzwe — ingano ihuye neza n'iyo usanzwe wambara.",
    },
    shipping: {
      en: 'Pickup next-day; district delivery 48h.',
      rw: 'Kubikuza bukeye; kohereza mu turere mu masaha 48.',
    },
    returnPolicy: {
      en: 'Exchange sizing within 7 days.',
      rw: 'Guhindura ingano birashoboka mu minsi 7.',
    },
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
    name: {
      en: 'Heritage Third Jersey',
      rw: "Umwambaro wa Gatatu w'Umurage",
    },
    slug: 'heritage-third-jersey',
    category: 'jerseys',
    description: {
      en: 'Limited-edition third kit celebrating club legends. Subtle gold foil crest and drop-tail hem.',
      rw: "Umwambaro wa gatatu wihariye wizihiza ibyamamare by'ikipe. Ufite ikirangantego cya zahabu n'umupfundikizo urambuye inyuma.",
    },
    images: [
      {
        src: '/shop/third-front.svg',
        alt: {
          en: 'Front detail of the heritage third jersey with gold crest highlights.',
          rw: "Imbere y'umwambaro wa gatatu w'umurage ifite ibiranga bya zahabu.",
        },
      },
      {
        src: '/shop/third-back.svg',
        alt: {
          en: 'Back view of the heritage third jersey showing drop tail hem.',
          rw: "Inyuma y'umwambaro wa gatatu yerekana igice cyinyuma kirambuye.",
        },
      },
    ],
    badges: ['official', 'limited', 'sale'],
    tags: ['Official'],
    materials: {
      en: 'Recycled polyester blend with stretch rib collar.',
      rw: 'Ikivange cya polyester yongerewe gukoreshwa gifite urunigi rworoshye rwo ku ijosi.',
    },
    care: {
      en: 'Gentle cycle, hang dry, cool iron reverse side only.',
      rw: "Kwoza mu cyiciro cyoroshye, kumisha kumanitse, kuraza ku bushyuhe bucye ku ruhande rw'imbere gusa.",
    },
    fit: {
      en: 'Slim fit — fans often size up.',
      rw: 'Ifashe yegeranye — abakunzi benshi biyongerera ingano.',
    },
    shipping: {
      en: 'Pickup only for launch weekend.',
      rw: 'Kubikuza gusa mu mpera z\'icyumweru cyo kumurika.',
    },
    returnPolicy: {
      en: 'Limited drop — exchange only if sealed.',
      rw: 'Icyinjijwe gike — guhinduranya birakunda gusa iyo bipfunyitse.',
    },
    variants: [
      { id: 'p-third-s-blue', size: 'S', color: 'blue', sku: 'RS-TH-S', stock: 4, price: 52000, compareAt: 56000 },
      { id: 'p-third-m-blue', size: 'M', color: 'blue', sku: 'RS-TH-M', stock: 4, price: 52000, compareAt: 56000 },
      { id: 'p-third-l-blue', size: 'L', color: 'blue', sku: 'RS-TH-L', stock: 2, price: 52000, compareAt: 56000 },
    ],
  },
  {
    id: 'p-training-top',
    name: {
      en: 'Pro Training Top',
      rw: "Umwenda wo Kwitoza w'Ababigize Umwuga",
    },
    slug: 'pro-training-top',
    category: 'training',
    description: {
      en: 'Quarter-zip performance top with thumbholes and reflective piping for evening drills.',
      rw: "Agafubiko ko kwitoza gafite zipper igera hagati, utwobo tw'intoki n'imirongo yerekana umucyo ku myitozo yo nimugoroba.",
    },
    images: [
      {
        src: '/shop/training-top.svg',
        alt: {
          en: 'Pro training quarter-zip top with reflective piping.',
          rw: "Agafubiko ko kwitoza gafite zipper igera hagati n'imirongo yerekana umucyo.",
        },
      },
    ],
    badges: ['new'],
    tags: ['Replica'],
    materials: {
      en: 'Poly-elastane blend with brushed interior.',
      rw: 'Ikivange cya poly na elastane gifite imbere yorohereye.',
    },
    care: {
      en: 'Machine wash warm, line dry.',
      rw: 'Kwoza mu mashini n\'amazi ashushe gato, kumisha kumanitse.',
    },
    fit: {
      en: 'Slim fit with stretch.',
      rw: 'Ifashe yegeranye kandi yoroshye kwirambura.',
    },
    shipping: {
      en: 'Pickup or delivery within Kigali.',
      rw: 'Kubikuza cyangwa koherezwa muri Kigali biraboneka.',
    },
    returnPolicy: {
      en: '30-day returns for unused gear.',
      rw: 'Gusubiza ibikoresho bitakozweho birashoboka mu minsi 30.',
    },
    variants: [
      { id: 'p-train-s-blue', size: 'S', color: 'blue', sku: 'RS-TRN-S', stock: 7, price: 38000 },
      { id: 'p-train-m-blue', size: 'M', color: 'blue', sku: 'RS-TRN-M', stock: 8, price: 38000 },
      { id: 'p-train-l-blue', size: 'L', color: 'blue', sku: 'RS-TRN-L', stock: 5, price: 38000 },
      { id: 'p-train-xl-black', size: 'XL', color: 'black', sku: 'RS-TRN-XL', stock: 4, price: 38000 },
    ],
  },
  {
    id: 'p-lifestyle-hoodie',
    name: {
      en: 'Everyday Crest Hoodie',
      rw: "Hoodie y'Ikirangantego cya Buri Munsi",
    },
    slug: 'everyday-crest-hoodie',
    category: 'lifestyle',
    description: {
      en: 'Ultra-soft fleece hoodie with oversized crest embroidery. Perfect for match build-up and cool evenings.',
      rw: "Hoodie ya fleece yoroshye cyane ifite ikirangantego kinini kidasanzwe. Ikwiriye imyiteguro y'umukino n'amajoro akonje.",
    },
    images: [
      {
        src: '/shop/hoodie-front.svg',
        alt: {
          en: 'Front of the everyday crest hoodie in deep blue.',
          rw: "Imbere ya hoodie y'ikirangantego cya buri munsi y'ubururu bwinshi.",
        },
      },
      {
        src: '/shop/hoodie-back.svg',
        alt: {
          en: 'Back of the everyday crest hoodie showing embossed crest.',
          rw: "Inyuma ya hoodie y'ikirangantego yerekana ikirango cyabyimbye.",
        },
      },
    ],
    badges: ['sale'],
    tags: ['Replica'],
    materials: {
      en: 'Cotton-poly fleece, lined hood, kangaroo pocket.',
      rw: 'Fleece ya coton na polyester, ingofero ifite lining n\'umufuka mugari.',
    },
    care: {
      en: 'Wash cold with similar colours, tumble dry low.',
      rw: 'Kwoza mu mazi akonje n\'amabara asa, kumisha ku bushyuhe bucye.',
    },
    fit: {
      en: 'Relaxed fit — size down for snug look.',
      rw: 'Ifashe itanga umudendezo — hitamo ingano nto kugira ngo yomeke neza.',
    },
    shipping: {
      en: 'Available for pickup or same-day delivery (fee applies).',
      rw: 'Kubikuza cyangwa koherezwa uwo munsi biraboneka (hari amafaranga make).',
    },
    returnPolicy: {
      en: '30-day easy returns.',
      rw: 'Gusubiza byoroshye mu minsi 30.',
    },
    variants: [
      { id: 'p-hoodie-s-blue', size: 'S', color: 'blue', sku: 'RS-HD-S', stock: 9, price: 32000, compareAt: 36000 },
      { id: 'p-hoodie-m-blue', size: 'M', color: 'blue', sku: 'RS-HD-M', stock: 11, price: 32000, compareAt: 36000 },
      { id: 'p-hoodie-l-blue', size: 'L', color: 'blue', sku: 'RS-HD-L', stock: 6, price: 32000, compareAt: 36000 },
      { id: 'p-hoodie-xl-black', size: 'XL', color: 'black', sku: 'RS-HD-XL', stock: 3, price: 32000, compareAt: 36000 },
    ],
  },
  {
    id: 'p-accessory-scarf',
    name: {
      en: 'Matchday Scarf',
      rw: "Echarpe y'Umunsi w'Umukino",
    },
    slug: 'matchday-scarf',
    category: 'accessories',
    description: {
      en: 'Double-sided jacquard scarf with rallying cry fringe. Keeps you warm and waving high.',
      rw: "Echarpe ya jacquard impande zombi ifite imisusire y'amagambo ashishikaza. Igufasha kuguma ushishikaye no gukoma amashyi hejuru.",
    },
    images: [
      {
        src: '/shop/scarf.svg',
        alt: {
          en: 'Rayon Sports matchday scarf with rallying stripes.',
          rw: "Echarpe ya Rayon Sports y'umunsi w'umukino ifite imirongo ishishikaza.",
        },
      },
    ],
    badges: ['sale'],
    tags: ['Official'],
    materials: {
      en: 'Acrylic knit.',
      rw: 'Ubudodo bwa acrylique.',
    },
    care: {
      en: 'Hand wash cold, dry flat.',
      rw: 'Kwoza intoki mu mazi akonje, kumisha uyicomeka hasi.',
    },
    fit: {
      en: 'One size.',
      rw: 'Ingano imwe ihuza bose.',
    },
    shipping: {
      en: 'Pickup instantly; delivery available.',
      rw: 'Kubikuza ako kanya; koherezwa nabyo biraboneka.',
    },
    returnPolicy: {
      en: '14-day returns.',
      rw: 'Gusubiza mu minsi 14.',
    },
    variants: [
      { id: 'p-scarf-os-blue', size: 'M', color: 'blue', sku: 'RS-SCARF', stock: 44, price: 15000, compareAt: 18000 },
    ],
  },
  {
    id: 'p-accessory-cap',
    name: {
      en: 'Sunset Cap',
      rw: 'Casquette y\'Umuseke',
    },
    slug: 'sunset-cap',
    category: 'accessories',
    description: {
      en: 'Six-panel cap with adjustable strap and sunset gradient underbill.',
      rw: "Casquette y'ibice bitandatu ifite umukandara uhinduka n'amabara y'izuba rirengera munsi y'urugori.",
    },
    images: [
      {
        src: '/shop/cap.svg',
        alt: {
          en: 'Sunset gradient cap with embroidered crest.',
          rw: "Casquette y'amabara y'izuba afite ikirango cyaboshywe.",
        },
      },
    ],
    badges: ['new'],
    tags: ['Replica'],
    materials: {
      en: 'Cotton twill with moisture-wicking band.',
      rw: 'Ubudodo bwa coton twill bufite umugozi ukurura ibyuya.',
    },
    care: {
      en: 'Spot clean.',
      rw: 'Gusukura ahabonetse umwanda gusa.',
    },
    fit: {
      en: 'One size with adjustable strap.',
      rw: 'Ingano imwe ifite umukandara uhinduka.',
    },
    shipping: {
      en: 'Pickup or courier delivery.',
      rw: 'Kubikuza cyangwa koherezwa n\'umukozi wa courier.',
    },
    returnPolicy: {
      en: '30-day returns.',
      rw: 'Gusubiza mu minsi 30.',
    },
    variants: [
      { id: 'p-cap-os-blue', size: 'M', color: 'blue', sku: 'RS-CAP-BL', stock: 20, price: 18000 },
      { id: 'p-cap-os-black', size: 'M', color: 'black', sku: 'RS-CAP-BK', stock: 12, price: 18000 },
    ],
  },
  {
    id: 'p-bundle-kit',
    name: {
      en: 'Match Ready Bundle',
      rw: 'Igipfunyika cyiteguye Umukino',
    },
    slug: 'match-ready-bundle',
    category: 'bundles',
    description: {
      en: 'Bundle and save — includes home jersey, scarf, and socks. Perfect gift for new fans.',
      rw: 'Pfunga ugabanye igiciro — birimo umwambaro wo mu rugo, echarpe n\'amasogisi. Impano nziza ku bafana bashya.',
    },
    images: [
      {
        src: '/shop/bundle.svg',
        alt: {
          en: 'Match ready bundle including jersey, scarf, and socks.',
          rw: "Igipfunyika cyiteguye umukino kirimo umwambaro, echarpe n'amasogisi.",
        },
      },
    ],
    badges: ['sale', 'limited'],
    tags: ['Official'],
    materials: {
      en: 'See individual items.',
      rw: 'Reba buri gicuruzwa ku giti cyacyo.',
    },
    care: {
      en: 'Follow product labels.',
      rw: 'Kurikiza amabwiriza ari kuri buri gicuruzwa.',
    },
    fit: {
      en: 'Select jersey size; accessories are one size.',
      rw: 'Hitamo ingano y\'umwambaro; ibikoresho byunganira bifite ingano imwe.',
    },
    shipping: {
      en: 'Pickup at club store; courier delivery next-day.',
      rw: 'Kubikuza ku iduka ry\'ikipe; koherezwa na courier bukeye.',
    },
    returnPolicy: {
      en: 'Bundle exchange within 7 days.',
      rw: 'Guhinduranya igipfunyika birashoboka mu minsi 7.',
    },
    bundleItems: [
      {
        en: 'Home Jersey',
        rw: "Umwambaro wo mu Rugo",
      },
      {
        en: 'Matchday Scarf',
        rw: "Echarpe y'Umunsi w'Umukino",
      },
      {
        en: 'Crest Socks',
        rw: "Amasogisi y'Ikirangantego",
      },
    ],
    variants: [
      { id: 'p-bundle-s-blue', size: 'S', color: 'blue', sku: 'RS-BDL-S', stock: 5, price: 82000, compareAt: 89000 },
      { id: 'p-bundle-m-blue', size: 'M', color: 'blue', sku: 'RS-BDL-M', stock: 7, price: 82000, compareAt: 89000 },
      { id: 'p-bundle-l-blue', size: 'L', color: 'blue', sku: 'RS-BDL-L', stock: 4, price: 82000, compareAt: 89000 },
    ],
  },
];

export const FEATURED_SLUG = 'home-jersey-24-25';
