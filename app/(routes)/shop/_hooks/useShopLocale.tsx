"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ShopLocale = "en" | "rw";

type LocalizedString = { en: string; rw: string };

type BilingualString = { primary: string; secondary: string };
type ReplacementValue = string | number | BilingualString;
type CopyReplacements = Record<string, ReplacementValue>;

const SHOP_COPY = {
  "header.tagline": {
    en: "Official store — discover team merchandise.",
    rw: "Official Store — Shakisha ibicuruzwa by'Ikipe.",
  },
  "header.title": {
    en: "Discover merch",
    rw: "Menya ibicuruzwa",
  },
  "header.summary": {
    en: "All merchandise",
    rw: "Ibicuruzwa byose",
  },
  "header.searchPlaceholder": {
    en: "Search kits, hoodies, accessories…",
    rw: "Shakisha imyambaro, amapantalo, ibikoresho…",
  },
  "header.sort": {
    en: "Sort",
    rw: "Tondeka",
  },
  "header.filter": {
    en: "Filter products",
    rw: "Seba ibicuruzwa",
  },
  "header.localeToggle": {
    en: "Switch language",
    rw: "Hindura ururimi",
  },
  "tabs.featured.label": {
    en: "Featured",
    rw: "Byatoranyijwe",
  },
  "tabs.featured.description": {
    en: "Drops and highlights",
    rw: "Ibicuruzwa by'ingenzi",
  },
  "tabs.jerseys.label": {
    en: "Jerseys",
    rw: "Imyambaro",
  },
  "tabs.jerseys.description": {
    en: "Match kits",
    rw: "Imyambaro yo mu mukino",
  },
  "tabs.training.label": {
    en: "Training",
    rw: "Gutoza",
  },
  "tabs.training.description": {
    en: "Drill-ready gear",
    rw: "Ibikoresho byo kwitoza",
  },
  "tabs.lifestyle.label": {
    en: "Lifestyle",
    rw: "Imyambarire",
  },
  "tabs.lifestyle.description": {
    en: "Everyday fits",
    rw: "Imyambaro yo gukomeza",
  },
  "tabs.accessories.label": {
    en: "Accessories",
    rw: "Ibikoresho",
  },
  "tabs.accessories.description": {
    en: "Match extras",
    rw: "Ibindi byiyongera",
  },
  "tabs.bundles.label": {
    en: "Bundles",
    rw: "Ibipfunyika",
  },
  "tabs.bundles.description": {
    en: "Gift-ready combos",
    rw: "Ibyegeranijwe byo guha impano",
  },
  "hero.badge": {
    en: "Hero drop",
    rw: "Igicuruzwa gishya",
  },
  "hero.trustOne": {
    en: "Genuine product",
    rw: "Ibicuruzwa byemewe",
  },
  "hero.trustTwo": {
    en: "Anti-counterfeit badge",
    rw: "Ikirango kirinda ibihimbano",
  },
  "hero.trustThree": {
    en: "Returns within 7 days",
    rw: "Garura mu minsi 7",
  },
  "hero.ctaPrimary": {
    en: "View drop",
    rw: "Reba igicuruzwa",
  },
  "hero.ctaSecondary": {
    en: "Checkout",
    rw: "Gura ubu",
  },
  "product.sizePeek.show": {
    en: "Size quick peek",
    rw: "Reba ingano vuba",
  },
  "product.sizePeek.hide": {
    en: "Hide sizes",
    rw: "Hisha ingano",
  },
  "product.addToCart": {
    en: "Add to cart",
    rw: "Shyira mu gikapu",
  },
  "product.outOfStock": {
    en: "Out of stock",
    rw: "Byarangiye",
  },
  "product.view": {
    en: "View",
    rw: "Reba",
  },
  "product.genuine": {
    en: "Genuine",
    rw: "Byemewe",
  },
  "product.limited": {
    en: "Limited",
    rw: "Bicye",
  },
  "product.new": {
    en: "New",
    rw: "Bishya",
  },
  "color.blue": {
    en: "Blue",
    rw: "Ubururu",
  },
  "color.white": {
    en: "White",
    rw: "Umweru",
  },
  "color.black": {
    en: "Black",
    rw: "Umukara",
  },
  "tag.Official": {
    en: "Official",
    rw: "Byemewe",
  },
  "tag.Replica": {
    en: "Replica",
    rw: "Ibyigana",
  },
  "tag.Kids": {
    en: "Kids",
    rw: "Abana",
  },
  "pdp.subtitle": {
    en: "Official Rayon merchandise",
    rw: "Ibicuruzwa byemewe bya Rayon",
  },
  "pdp.subtitleSecondary": {
    en: "Genuine product",
    rw: "Ibicuruzwa byemewe",
  },
  "pdp.membersSave": {
    en: "Members save 10%",
    rw: "Abanyamuryango bazigama 10%",
  },
  "pdp.trustOne": {
    en: "Genuine product",
    rw: "Ibicuruzwa byemewe",
  },
  "pdp.trustTwo": {
    en: "Anti-counterfeit seal",
    rw: "Ikimenyetso kirinda ibihimbano",
  },
  "pdp.trustThree": {
    en: "Pickup & delivery available",
    rw: "Kujyana no kwakira birahari",
  },
  "pdp.sizeGuide": {
    en: "Size guide",
    rw: "Igenamiterere",
  },
  "pdp.addToCart": {
    en: "Add to cart",
    rw: "Shyira mu gikapu",
  },
  "pdp.complete": {
    en: "Complete the look",
    rw: "Uzuza imyambaro",
  },
  "pdp.completeCaption": {
    en: "Shorts, socks and accessories",
    rw: "Amapantalo, amasogisi n'ibindi bikoresho",
  },
  "pdp.recent": {
    en: "Recently viewed",
    rw: "Wabitangaje vuba",
  },
  "pdp.recentCaption": {
    en: "Picked up on your last visit",
    rw: "Byasuwe mu rugendo ruheruka",
  },
  "ussd.title": {
    en: "Pay via USSD",
    rw: "Ishura ukoresheje USSD",
  },
  "ussd.titleSecondary": {
    en: "Ishura ukoresheje USSD",
    rw: "Pay via USSD",
  },
  "ussd.description": {
    en: "Choose your network, then dial with one tap.",
    rw: "Hitamo umurongo ukoresha, uhite uhamagara ako kanya.",
  },
  "ussd.buttonIdle": {
    en: "Dial via USSD",
    rw: "Hamagara ukoresheje USSD",
  },
  "ussd.buttonWaiting": {
    en: "Waiting for confirmation…",
    rw: "Gutegereza kwemezwa…",
  },
  "ussd.hint": {
    en: "After dialling, wait for the SMS confirmation. Keep this tab open so we can capture the reference automatically.",
    rw: "Nyuma yo guhamagara, tegereza SMS yemeza. Tegereza kuri uru rupapuro kugira ngo dufate numero y'inyemezabwishyu.",
  },
  "ussd.overlayTitle": {
    en: "Waiting for confirmation…",
    rw: "Gutegereza kwemezwa…",
  },
  "ussd.overlayDescription": {
    en: "Watch for the SMS and keep the code handy.",
    rw: "Tegereza SMS kandi wizigame kode yawe.",
  },
  "ussd.referenceLabel": {
    en: "Enter payment reference (optional)",
    rw: "Shyiramo kode yawe (si ngombwa)",
  },
  "ussd.referenceError": {
    en: "Enter the reference from your payment SMS.",
    rw: "Shyiramo kode iboneka kuri SMS y'ubwishyu.",
  },
  "ussd.enterLater": {
    en: "I'll enter later",
    rw: "Nzayishyiramo nyuma",
  },
  "ussd.saveReference": {
    en: "Save reference",
    rw: "Bika kode",
  },
  "ussd.referenceSaved": {
    en: "Reference saved",
    rw: "Kode ibitswe",
  },
  "cart.title": {
    en: "Your cart",
    rw: "Igikapu cyawe",
  },
  "cart.continue": {
    en: "Continue shopping",
    rw: "Komeza ugure",
  },
  "cart.empty": {
    en: "Your cart is empty. Add a jersey or bundle to begin checkout.",
    rw: "Igikapu cyawe kirimo ubusa. Shyiramo umupira cyangwa igipfunyika kugira utangire kwishyura.",
  },
  "cart.remove": {
    en: "Remove",
    rw: "Kuraho",
  },
  "cart.subtotal": {
    en: "Subtotal",
    rw: "Igiteranyo cy'ibanze",
  },
  "cart.clear": {
    en: "Clear cart",
    rw: "Siba igikapu",
  },
  "cart.promoTitle": {
    en: "Promo & savings",
    rw: "Kode n'ubwizigame",
  },
  "cart.promoDescription": {
    en: "Members can unlock matchday deals with promo codes.",
    rw: "Abanyamuryango babona imigabane y'igiciro bakoresheje kode z'ingirakamaro.",
  },
  "cart.apply": {
    en: "Apply",
    rw: "Shyira mu bikorwa",
  },
  "cart.promoPlaceholder": {
    en: "Enter promo code",
    rw: "Andika kode y'igabanyirizwa",
  },
  "cart.promoErrorEmpty": {
    en: "Enter a promo code to apply savings.",
    rw: "Shyiramo kode kugira ngo ubone igabanyirizwa.",
  },
  "cart.promoErrorInvalid": {
    en: "Promo code not valid for this collection.",
    rw: "Iyi kode ntikora kuri ibi bicuruzwa.",
  },
  "cart.promoApplied": {
    en: "Members save",
    rw: "Abanyamuryango bazigama",
  },
  "cart.promoRemove": {
    en: "Remove",
    rw: "Kuraho",
  },
  "cart.summaryTitle": {
    en: "Order summary",
    rw: "Incamake y'itegeko",
  },
  "cart.summaryDescription": {
    en: "Review totals before tapping pay.",
    rw: "Subiza amaso ku giteranyo mbere yo kwishyura.",
  },
  "cart.variantLabel": {
    en: "Size & colour",
    rw: "Ingano n'ibara",
  },
  "cart.variantAria": {
    en: "Change variant for {{product}}",
    rw: "Hindura ubwoko bwa {{product}}",
  },
  "cart.totalDue": {
    en: "Total due",
    rw: "Igiteranyo ugomba kwishyura",
  },
  "cart.pickupTitle": {
    en: "Pickup details",
    rw: " yo kwakira",
  },
  "cart.pickupDescription": {
    en: "Optional: add the number we should use to trigger USSD.",
    rw: "Si ngombwa: shyiramo nimero tuzakoresha mu guhamagara USSD.",
  },
  "cart.pickupNumber": {
    en: "Mobile number",
    rw: "Nimero ya telefone",
  },
  "cart.pickupHint": {
    en: "We'll text pickup instructions once SMS confirmation arrives. Bring an ID and the payment reference.",
    rw: "Tuzakohereza ubutumwa bukwereka uko wakira ibicuruzwa nyuma yo kubona SMS yemeza. Fata indangamuntu na kode y'ubwishyu.",
  },
  "cart.phonePlaceholder": {
    en: "078xxxxxxx",
    rw: "078xxxxxxx",
  },
  "cart.stockIn": {
    en: "{{count}} in stock",
    rw: "{{count}} bihari",
  },
  "cart.stockLow": {
    en: "Low stock — {{count}} in stock",
    rw: "Biri hafi gushira — {{count}} bihari",
  },
  "cart.stockOut": {
    en: "Out of stock",
    rw: "Byarangiye",
  },
  "cart.variantOption": {
    en: "{{size}} • {{color}}",
    rw: "{{size}} • {{color}}",
  },
  "cart.variantOptionOut": {
    en: "{{size}} • {{color}} — {{stock}}",
    rw: "{{size}} • {{color}} — {{stock}}",
  },
  "cart.referenceNotice": {
    en: "Manual reference captured",
    rw: "Kode yanditswe intoki",
  },
  "cart.referenceClear": {
    en: "Clear reference",
    rw: "Siba kode",
  },
  "cart.checkoutNoteOne": {
    en: "After dialling, stay on the confirmation screen. Our SMS parser will tag your order automatically. If it fails, enter the reference manually in the receipts tab.",
    rw: "Nyuma yo guhamagara, komeza kuri ecran yemeza. Ubutumwa bwa SMS buzahita buhuza n'itegeko ryawe. Nibirangira nabi, shyiramo kode mu gice cy'inyemezabwishyu ukoresheje intoki.",
  },
  "cart.checkoutNoteTwo": {
    en: "Need help? Call the club hotline or visit the fan desk for manual verification.",
    rw: "Ukeneye ubufasha? Hamagara umurongo wa telefoni w'ikipe cyangwa sugira ku biro by'abakunzi kugira ngo bagufashe kugenzura.",
  },
  "cart.referenceSaved": {
    en: "Reference saved",
    rw: "Kode ibitswe",
  },
  "filter.title": {
    en: "Filters",
    rw: "Amasezerano yo gushungura",
  },
  "filter.category": {
    en: "Category",
    rw: "Icyiciro",
  },
  "filter.size": {
    en: "Size",
    rw: "Ingano",
  },
  "filter.color": {
    en: "Colour",
    rw: "Ibara",
  },
  "filter.tags": {
    en: "Tags",
    rw: "Ibirango",
  },
  "filter.price": {
    en: "Price (RWF)",
    rw: "Igiciro (RWF)",
  },
  "filter.min": {
    en: "Min",
    rw: "Ntoya",
  },
  "filter.max": {
    en: "Max",
    rw: "Nkuru",
  },
  "filter.inStock": {
    en: "Only show in-stock items",
    rw: "Erekana gusa ibicuruzwa bihari",
  },
  "filter.on": {
    en: "On",
    rw: "Yego",
  },
  "filter.off": {
    en: "Off",
    rw: "Oya",
  },
  "filter.clear": {
    en: "Clear all",
    rw: "Siba byose",
  },
  "filter.done": {
    en: "Done",
    rw: "Birarangiye",
  },
  "chip.category": {
    en: "Category: {{value}}",
    rw: "Icyiciro: {{value}}",
  },
  "chip.size": {
    en: "Size {{value}}",
    rw: "Ingano {{value}}",
  },
  "chip.color": {
    en: "Colour: {{value}}",
    rw: "Ibara: {{value}}",
  },
  "chip.tag": {
    en: "Tag: {{value}}",
    rw: "Ikirango: {{value}}",
  },
  "chip.price": {
    en: "Price {{from}} {{to}}",
    rw: "Igiciro {{from}} {{to}}",
  },
  "chip.stock": {
    en: "In stock",
    rw: "Bihari",
  },
  "chip.search": {
    en: "Search: {{query}}",
    rw: "Shakisha: {{query}}",
  },
  "chip.clear": {
    en: "Clear filters",
    rw: "Siba amasezerano",
  },
  "sort.title": {
    en: "Sort",
    rw: "Tondeka",
  },
  "sort.done": {
    en: "Done",
    rw: "Birarangiye",
  },
  "sort.recommended": {
    en: "Recommended",
    rw: "Byahiswemo",
  },
  "sort.priceAsc": {
    en: "Price ↑",
    rw: "Igiciro ↑",
  },
  "sort.priceDesc": {
    en: "Price ↓",
    rw: "Igiciro ↓",
  },
  "sort.newest": {
    en: "Newest",
    rw: "Bishya",
  },
  "sort.popular": {
    en: "Popular",
    rw: "Bikunzwe",
  },
  "onboarding.title": {
    en: "Welcome to the official Rayon Sports shop",
    rw: "Murakaza neza mu iduka rya Rayon Sports",
  },
  "onboarding.subtitle": {
    en: "Browse, filter and pay via USSD without creating an account.",
    rw: "Sura, shungura kandi wishyure ukoresheje USSD utangije konti.",
  },
  "onboarding.skip": {
    en: "Skip for now",
    rw: "Bireke ubu",
  },
  "onboarding.cta": {
    en: "Get started",
    rw: "Tangira nonaha",
  },
  "onboarding.stepOne.title": {
    en: "Swipe the rails",
    rw: "Sunika imirongo",
  },
  "onboarding.stepOne.body": {
    en: "Discover featured drops, new arrivals and bundles in one place.",
    rw: "Menya ibicuruzwa byatoranyijwe, ibishya n'ibipfunyika ahantu hamwe.",
  },
  "onboarding.stepTwo.title": {
    en: "Tap filters",
    rw: "Kanda amasezerano",
  },
  "onboarding.stepTwo.body": {
    en: "Pick sizes, colours and tags to narrow to official merch.",
    rw: "Hitamo ingano, amabara n'ibirango kugira ngo ubone ibicuruzwa byemewe.",
  },
  "onboarding.stepThree.title": {
    en: "Pay your way",
    rw: "Ishura uko ubishaka",
  },
  "onboarding.stepThree.body": {
    en: "Dial MTN MoMo or Airtel Money via USSD and capture the reference.",
    rw: "Hamagara MTN MoMo cyangwa Airtel Money ukoresheje USSD maze ubike kode y'ubwishyu.",
  },
  "trust.bannerTitle": {
    en: "Trust & Support",
    rw: "Kwizera n'Ubufasha",
  },
  "trust.rowOne": {
    en: "Official Store — discover sponsor-approved merchandise.",
    rw: "Iduka ry'umwimerere — ibicuruzwa byemejwe n'abaterankunga.",
  },
  "trust.rowTwo": {
    en: "Every item tagged \"Genuine product\" ships with tamper-proof hologram.",
    rw: "Buri gicuruzwa gifite ikirango \"Ibicuruzwa byemewe\" kiza gifite hologram idashobora kwangizwa.",
  },
  "trust.rowThree": {
    en: "Pickup or delivery: see product notes for lead time. Returns/exchanges accepted within 7 days.",
    rw: "Kujyana cyangwa gutanga: reba ibisobanuro by'igicuruzwa urebe igihe bitwara. Gusubizwa/kungurana byemewe mu minsi 7.",
  },
  "trust.rowFour": {
    en: "Need help? Dial the club hotline and our stewards will guide the USSD flow.",
    rw: "Ukeneye ubufasha? Hamagara umurongo wa telefoni w'ikipe hanyuma abakozi bacu bakuyobore mu USSD.",
  },
  "section.topPicks.title": {
    en: "Top picks",
    rw: "Ibyatoranyijwe",
  },
  "section.topPicks.caption": {
    en: "Bestsellers loved by fans",
    rw: "Ibicuruzwa bikunzwe n'abakunzi",
  },
  "section.newArrivals.title": {
    en: "New arrivals",
    rw: "Ibishya",
  },
  "section.newArrivals.caption": {
    en: "Fresh drops from this week",
    rw: "Ibisohotse muri iki cyumweru",
  },
  "section.deals.title": {
    en: "Deals",
    rw: "Imigabane",
  },
  "section.deals.caption": {
    en: "Strikethrough price and bundles",
    rw: "Ibiciriritse n'ibipfunyika",
  },
  "section.fanFavorites.title": {
    en: "Fan favourites",
    rw: "Ibyakunzwe n'abafana",
  },
  "section.fanFavorites.caption": {
    en: "Social proof from the terraces",
    rw: "Ubuhamya bw'abafana ku kibuga",
  },
  "section.shopAll.title": {
    en: "Shop all",
    rw: "Reba byose",
  },
  "section.shopAll.description": {
    en: "Browse every category with live filters, search and sort.",
    rw: "Sura ibyiciro byose ukoresheje amasezerano, gushakisha no gutondeka ako kanya.",
  },
  "rail.viewAll": {
    en: "View all",
    rw: "Reba byose",
  },
  "grid.empty": {
    en: "No products match these filters yet.",
    rw: "Nta bicuruzwa bihuye n'ayo masezerano ubu.",
  },
  "product.badgeFallback": {
    en: "Merch",
    rw: "Ibicuruzwa",
  },
  "product.saleBadge": {
    en: "Sale",
    rw: "Igurishwa",
  },
  "product.savePercent": {
    en: "Save {{percent}}%",
    rw: "Bika {{percent}}%",
  },
  "product.availableSizesTitle": {
    en: "Available sizes",
    rw: "Ingero zihari",
  },
  "product.colorwayAria": {
    en: "{{color}} colourway",
    rw: "Ibara rya {{color}}",
  },
  "product.viewAria": {
    en: "View {{product}}",
    rw: "Reba {{product}}",
  },
  "hero.limitedTag": {
    en: "Limited",
    rw: "Bicye",
  },
  "variant.color": {
    en: "Colour",
    rw: "Ibara",
  },
  "variant.size": {
    en: "Size",
    rw: "Ingano",
  },
  "variant.sku": {
    en: "SKU",
    rw: "SKU",
  },
  "variant.stockReady": {
    en: "Ready to ship",
    rw: "Biteguye koherezwa",
  },
  "variant.stockLow": {
    en: "{{count}} left",
    rw: "Hasigaye {{count}}",
  },
  "variant.stockOut": {
    en: "Out of stock",
    rw: "Byarangiye",
  },
  "pdp.back": {
    en: "← Back to shop",
    rw: "← Subira mu iduka",
  },
  "pdp.detailsTitle": {
    en: "Details",
    rw: "Ibisobanuro",
  },
  "pdp.bundleIncludes": {
    en: "Bundle includes",
    rw: "Ibiri mu gipfunyika",
  },
} satisfies Record<string, LocalizedString>;

type CopyKey = keyof typeof SHOP_COPY;

const formatTemplate = (
  template: string,
  replacements: CopyReplacements | undefined,
  variant: "primary" | "secondary",
) => {
  if (!replacements) return template;
  return template.replace(/{{\s*(.*?)\s*}}/g, (_, token: string) => {
    const key = token.trim();
    const value = replacements[key];
    if (value == null) return "";
    if (typeof value === "object" && "primary" in value && "secondary" in value) {
      return String(value[variant] ?? "");
    }
    return String(value);
  });
};

const readLocaleCookie = (): ShopLocale | undefined => {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|; )gikundiro:shop-locale=([^;]+)/);
  const value = match ? decodeURIComponent(match[1]) : undefined;
  if (value === "en" || value === "rw") return value;
  return undefined;
};

const writeLocaleCookie = (value: ShopLocale) => {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365; // one year
  document.cookie = `gikundiro:shop-locale=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

const resolveInitialLocale = (initialLocale?: ShopLocale): ShopLocale => {
  if (initialLocale === "en" || initialLocale === "rw") return initialLocale;
  const cookieLocale = readLocaleCookie();
  if (cookieLocale) return cookieLocale;
  if (typeof navigator !== "undefined") {
    const language = navigator.language?.toLowerCase?.();
    if (language?.startsWith("rw")) return "rw";
  }
  return "en";
};

type ShopLocaleContextValue = {
  locale: ShopLocale;
  setLocale: (next: ShopLocale) => void;
  t: (key: CopyKey, replacements?: CopyReplacements) => BilingualString;
};

const ShopLocaleContext = createContext<ShopLocaleContextValue | undefined>(undefined);

const LOCALE_KEY = "gikundiro:shop-locale";
const ShopLocaleProvider = ({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: ShopLocale;
}) => {
  const [locale, setLocaleState] = useState<ShopLocale>(() => resolveInitialLocale(initialLocale));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(LOCALE_KEY);
    if (stored === "en" || stored === "rw") {
      setLocaleState(stored);
      writeLocaleCookie(stored);
      return;
    }
    const cookieLocale = readLocaleCookie();
    if (cookieLocale) {
      setLocaleState(cookieLocale);
    }
  }, [initialLocale]);

  const setLocale = useCallback((next: ShopLocale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_KEY, next);
    }
    writeLocaleCookie(next);
  }, []);

  const value = useMemo<ShopLocaleContextValue>(() => {
    return {
      locale,
      setLocale,
      t: (key, replacements) => {
        const entry = SHOP_COPY[key];
        if (!entry) return { primary: key, secondary: key };
        const primary = formatTemplate(entry[locale], replacements, "primary");
        const secondaryLocale = locale === "en" ? "rw" : "en";
        const secondary = formatTemplate(entry[secondaryLocale], replacements, "secondary");
        return { primary, secondary };
      },
    };
  }, [locale, setLocale]);

  return <ShopLocaleContext.Provider value={value}>{children}</ShopLocaleContext.Provider>;
};

export { ShopLocaleProvider };

export const useShopLocale = () => {
  const context = useContext(ShopLocaleContext);
  if (!context) {
    throw new Error("useShopLocale must be used within a ShopLocaleProvider");
  }
  return context;
};

export type { CopyKey, ShopLocale, BilingualString, CopyReplacements };
