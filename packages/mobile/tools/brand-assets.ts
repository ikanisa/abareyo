import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { PNG } from "pngjs";

type GradientStop = {
  offset: number;
  color: string;
};

type Rgba = {
  r: number;
  g: number;
  b: number;
  a?: number;
};

const ASSET_DIR = path.join(__dirname, "..", "assets");

const BRAND_ASSET_FILES = {
  icon: "icon.png",
  adaptiveIcon: "adaptive-icon.png",
  splash: "splash.png",
} as const;

type AssetKey = keyof typeof BRAND_ASSET_FILES;

const DEFAULT_STOPS: GradientStop[] = [
  { offset: 0, color: "#06102b" },
  { offset: 0.55, color: "#0b183f" },
  { offset: 1, color: "#142a67" },
];

const HIGHLIGHT_STOPS: GradientStop[] = [
  { offset: 0, color: "#1a3e8b" },
  { offset: 1, color: "#1c4cb8" },
];

function hexToRgba(hex: string): Rgba {
  const normalized = hex.replace("#", "");
  if (![3, 4, 6, 8].includes(normalized.length)) {
    throw new Error(`Unsupported hex color: ${hex}`);
  }

  if (normalized.length === 3 || normalized.length === 4) {
    const chars = normalized.split("");
    const doubled = chars.map((ch) => ch + ch).join("");
    return hexToRgba(`#${doubled}`);
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const a = normalized.length === 8 ? parseInt(normalized.slice(6, 8), 16) : 255;
  return { r, g, b, a };
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

function mixColors(from: Rgba, to: Rgba, t: number): Rgba {
  return {
    r: Math.round(lerp(from.r, to.r, t)),
    g: Math.round(lerp(from.g, to.g, t)),
    b: Math.round(lerp(from.b, to.b, t)),
    a: Math.round(lerp(from.a ?? 255, to.a ?? 255, t)),
  };
}

function sampleGradient(stops: GradientStop[], t: number): Rgba {
  const clamped = Math.max(0, Math.min(1, t));
  const [first, last] = [stops[0], stops[stops.length - 1]];
  if (clamped <= first.offset) {
    return hexToRgba(first.color);
  }
  if (clamped >= last.offset) {
    return hexToRgba(last.color);
  }

  const nextIndex = stops.findIndex((stop) => stop.offset >= clamped);
  const prevIndex = nextIndex <= 0 ? 0 : nextIndex - 1;
  const prevStop = stops[prevIndex];
  const nextStop = stops[nextIndex];
  const span = nextStop.offset - prevStop.offset || 1;
  const spanT = (clamped - prevStop.offset) / span;

  return mixColors(hexToRgba(prevStop.color), hexToRgba(nextStop.color), spanT);
}

function setPixel(png: PNG, x: number, y: number, color: Rgba) {
  const idx = (png.width * y + x) << 2;
  png.data[idx] = color.r;
  png.data[idx + 1] = color.g;
  png.data[idx + 2] = color.b;
  png.data[idx + 3] = color.a ?? 255;
}

function fillVerticalGradient(png: PNG, stops: GradientStop[]) {
  for (let y = 0; y < png.height; y += 1) {
    const t = png.height <= 1 ? 0 : y / (png.height - 1);
    const color = sampleGradient(stops, t);
    for (let x = 0; x < png.width; x += 1) {
      setPixel(png, x, y, color);
    }
  }
}

function paintCircle(png: PNG, cx: number, cy: number, radius: number, color: Rgba) {
  const radiusSq = radius * radius;
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(png.width - 1, Math.ceil(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(png.height - 1, Math.ceil(cy + radius));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radiusSq) {
        setPixel(png, x, y, color);
      }
    }
  }
}

function paintDiagonalSheen(png: PNG, stops: GradientStop[]) {
  const diagLength = Math.sqrt(png.width ** 2 + png.height ** 2);
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const t = (x + y) / diagLength;
      const overlay = sampleGradient(stops, t);
      const idx = (png.width * y + x) << 2;
      const base = {
        r: png.data[idx],
        g: png.data[idx + 1],
        b: png.data[idx + 2],
        a: png.data[idx + 3],
      } satisfies Rgba;
      const mixed = mixColors(base, overlay, 0.18);
      png.data[idx] = mixed.r;
      png.data[idx + 1] = mixed.g;
      png.data[idx + 2] = mixed.b;
      png.data[idx + 3] = mixed.a ?? 255;
    }
  }
}

function createIconPng(size: number) {
  const png = new PNG({ width: size, height: size });
  fillVerticalGradient(png, DEFAULT_STOPS);
  paintDiagonalSheen(png, HIGHLIGHT_STOPS);

  const crestRadius = Math.floor(size * 0.32);
  const crestColor = hexToRgba("#f4f7fb");
  paintCircle(png, size / 2, size / 2, crestRadius, { ...crestColor, a: 230 });

  const innerRadius = Math.floor(size * 0.24);
  const innerColor = hexToRgba("#0b183f");
  paintCircle(png, size / 2, size / 2, innerRadius, { ...innerColor, a: 255 });

  const sparkRadius = Math.floor(size * 0.08);
  const sparkColor = hexToRgba("#4fc3ff");
  paintCircle(png, size / 2, Math.floor(size * 0.38), sparkRadius, {
    ...sparkColor,
    a: 255,
  });

  return png;
}

function createSplashPng(width: number, height: number) {
  const png = new PNG({ width, height });
  fillVerticalGradient(png, DEFAULT_STOPS);
  paintDiagonalSheen(png, HIGHLIGHT_STOPS);

  const crestColor = hexToRgba("#f4f7fb");
  paintCircle(png, Math.floor(width / 2), Math.floor(height * 0.4), Math.floor(width * 0.2), {
    ...crestColor,
    a: 220,
  });

  return png;
}

function writePng(targetPath: string, png: PNG) {
  const buffer = PNG.sync.write(png, { colorType: 6 });
  writeFileSync(targetPath, buffer);
}

function ensureDirectory(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

const relativePathFor = (asset: AssetKey) => `./assets/${BRAND_ASSET_FILES[asset]}`;

const absolutePathFor = (asset: AssetKey) => path.join(ASSET_DIR, BRAND_ASSET_FILES[asset]);

export function ensureBrandAssets(options: { force?: boolean } = {}) {
  ensureDirectory(ASSET_DIR);

  const force = options.force ?? process.env.GIKUNDIRO_FORCE_BRAND_ASSET_REBUILD === "1";

  const absolute: Record<AssetKey, string> = {
    icon: absolutePathFor("icon"),
    adaptiveIcon: absolutePathFor("adaptiveIcon"),
    splash: absolutePathFor("splash"),
  };

  if (force || !existsSync(absolute.icon)) {
    writePng(absolute.icon, createIconPng(1024));
  }

  if (force || !existsSync(absolute.adaptiveIcon)) {
    writePng(absolute.adaptiveIcon, createIconPng(432));
  }

  if (force || !existsSync(absolute.splash)) {
    writePng(absolute.splash, createSplashPng(1242, 2688));
  }

  return {
    icon: relativePathFor("icon"),
    adaptiveIcon: relativePathFor("adaptiveIcon"),
    splash: relativePathFor("splash"),
  } satisfies Record<AssetKey, string>;
}

export function getBrandAssetPath(asset: AssetKey, options: { absolute?: boolean } = {}) {
  ensureBrandAssets();
  if (options.absolute) {
    return absolutePathFor(asset);
  }
  return relativePathFor(asset);
}

export const brandAssetPaths: Record<AssetKey, string> = {
  icon: relativePathFor("icon"),
  adaptiveIcon: relativePathFor("adaptiveIcon"),
  splash: relativePathFor("splash"),
};

