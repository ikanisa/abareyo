import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildCorsHeaders,
  getAllowedHosts,
  getAllowedOrigins,
  selectCorsOrigin,
} from "@/lib/server/origins";

const originalEnv = { ...process.env };

const resetEnv = () => {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
};

beforeEach(() => {
  resetEnv();
  delete process.env.CORS_ALLOWED_ORIGINS;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.SITE_SUPABASE_URL;
});

afterEach(() => {
  resetEnv();
});

describe("origin helpers", () => {
  it("includes default local development origins", () => {
    const origins = getAllowedOrigins();
    expect(origins).toContain("http://localhost:3000");
    expect(origins).toContain("http://127.0.0.1:5173");
  });

  it("prefers matching request origins from the allow list", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://fan.rayon.example";
    process.env.CORS_ALLOWED_ORIGINS = "https://partners.rayon.example, http://localhost:4000";

    const origin = selectCorsOrigin("https://partners.rayon.example");
    expect(origin).toBe("https://partners.rayon.example");

    const headers = buildCorsHeaders({ requestOrigin: "https://partners.rayon.example", allowedMethods: "POST" });
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://partners.rayon.example");
    expect(headers.Vary).toBe("Origin");

    const hosts = getAllowedHosts();
    expect(hosts).toContain("fan.rayon.example");
    expect(hosts).toContain("partners.rayon.example");
  });

  it("falls back to wildcard when configured", () => {
    process.env.CORS_ALLOWED_ORIGINS = "*";

    expect(getAllowedOrigins()).toEqual(["*"]);
    const headers = buildCorsHeaders({ requestOrigin: "https://unlisted.example" });
    expect(headers["Access-Control-Allow-Origin"]).toBe("*");
    expect(headers.Vary).toBeUndefined();
    expect(getAllowedHosts()).toEqual([]);
  });
});
