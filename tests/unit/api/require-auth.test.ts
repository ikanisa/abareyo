import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetSupabase } = vi.hoisted(() => ({
  mockGetSupabase: vi.fn<() => SupabaseClient | null>(() => null),
}));

vi.mock("@/app/api/_lib/supabase", () => ({
  getSupabase: mockGetSupabase,
}));

import { requireAuthUser } from "@/app/api/_lib/auth";

type SupabaseAuthResult = {
  data: { user: { id: string } | null };
  error: { message: string } | null;
};

const createRequest = (init?: { headers?: Record<string, string> }) => {
  const headers = new Headers(init?.headers);
  return new NextRequest("https://rayon.example/api/test", { headers });
};

const createSupabaseStub = (
  getUser: (token: string) => Promise<SupabaseAuthResult> | SupabaseAuthResult,
) => ({ auth: { getUser } } as unknown as SupabaseClient);

beforeEach(() => {
  mockGetSupabase.mockReturnValue(null);
});

describe("requireAuthUser", () => {
  it("returns 500 when Supabase client is unavailable", async () => {
    const response = await requireAuthUser(
      createRequest({ headers: { Authorization: "Bearer offline-token" } }),
      null,
    );
    expect(response.response?.status).toBe(500);
  });

  it("short-circuits when no access token is present", async () => {
    const getUser = vi.fn();
    const supabase = createSupabaseStub(getUser);

    const result = await requireAuthUser(createRequest(), supabase);
    expect(result.response?.status).toBe(401);
    expect(getUser).not.toHaveBeenCalled();
  });

  it("extracts bearer tokens from the Authorization header", async () => {
    const getUser = vi.fn(async (): Promise<SupabaseAuthResult> => ({
      data: { user: { id: "123" } },
      error: null,
    }));
    const supabase = createSupabaseStub(getUser);

    const request = createRequest({ headers: { Authorization: "Bearer test-token" } });
    const result = await requireAuthUser(request, supabase);

    expect(result.user?.id).toBe("123");
    expect(getUser).toHaveBeenCalledWith("test-token");
  });

  it("parses tokens from supabase-auth-token cookies", async () => {
    const getUser = vi.fn(async (token: string): Promise<SupabaseAuthResult> => ({
      data: { user: { id: `user-${token}` } },
      error: null,
    }));
    const supabase = createSupabaseStub(getUser);

    const payload = encodeURIComponent(JSON.stringify({ currentSession: { access_token: "cookie-token" } }));
    const request = createRequest({ headers: { cookie: `supabase-auth-token=${payload}` } });

    const result = await requireAuthUser(request, supabase);
    expect(result.user?.id).toBe("user-cookie-token");
    expect(getUser).toHaveBeenCalledWith("cookie-token");
  });
});
