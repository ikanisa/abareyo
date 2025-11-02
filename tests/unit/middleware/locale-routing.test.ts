import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { middleware } from "../../../middleware";

const originalCors = process.env.CORS_ALLOWED_ORIGINS;
const originalNodeEnv = process.env.NODE_ENV;

beforeEach(() => {
  process.env.CORS_ALLOWED_ORIGINS = "https://app.rayon.rw";
  process.env.NODE_ENV = "test";
});

afterEach(() => {
  process.env.CORS_ALLOWED_ORIGINS = originalCors;
  process.env.NODE_ENV = originalNodeEnv;
});

describe("middleware locale routing", () => {
  it("rewrites locale-prefixed routes to their canonical path", () => {
    const request = new NextRequest("https://rayon.local/en/shop?utm=test");

    const response = middleware(request);

    const rewrite = response.headers.get("x-middleware-rewrite");
    expect(rewrite).not.toBeNull();
    const url = new URL(rewrite ?? "", "https://rayon.local");
    expect(url.pathname).toBe("/shop");
  });

  it("redirects users back into their locale when a trusted referer is provided", () => {
    const headers = new Headers({ Referer: "https://app.rayon.rw/fr" });
    const request = new NextRequest("https://rayon.local/tickets", { headers });

    const response = middleware(request);

    expect(response.headers.get("location")).toBe("https://rayon.local/fr/tickets");
  });

  it("ignores untrusted referers and keeps default locale", () => {
    const headers = new Headers({ Referer: "https://spoofed.dev/fr" });
    const request = new NextRequest("https://rayon.local/tickets", { headers });

    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
  });
});
