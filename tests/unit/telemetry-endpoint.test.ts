import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildTelemetryCorsHeaders,
  processTelemetryRequest,
} from "@/lib/telemetry/app-state-handler";

const captureException = vi.hoisted(() => vi.fn());

vi.mock("@/lib/observability", () => ({
  captureException,
}));

const loggerInfo = vi.fn();
const loggerWith = vi.fn(() => ({ info: loggerInfo }));

const buildRequest = (init?: RequestInit & { url?: string }) =>
  new Request(init?.url ?? "https://rayon.example/api/telemetry/app-state", init);

const buildContext = (overrides?: Partial<{ ip: string | null; headers: Headers }>) => ({
  logger: { with: loggerWith },
  ip: overrides && "ip" in overrides ? overrides.ip ?? null : "203.0.113.5",
  headers: overrides?.headers ?? new Headers(),
});


describe("processTelemetryRequest", () => {
beforeEach(() => {
  vi.clearAllMocks();
});

  it("handles OPTIONS preflight requests", async () => {
    const response = await processTelemetryRequest(buildRequest({ method: "OPTIONS" }), buildContext());

    expect(response.status).toBe(204);
    const expectedOrigin = buildTelemetryCorsHeaders(null)["Access-Control-Allow-Origin"];
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(expectedOrigin);
    expect(loggerWith).not.toHaveBeenCalled();
  });

  it("rejects non-POST methods", async () => {
    const response = await processTelemetryRequest(buildRequest({ method: "GET" }), buildContext());

    expect(response.status).toBe(405);
    expect(await response.json()).toEqual({ error: "method_not_allowed" });
  });

  it("returns 400 when payload is invalid JSON", async () => {
    const response = await processTelemetryRequest(
      buildRequest({ method: "POST", body: "{", headers: { "content-type": "application/json" } }),
      buildContext(),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_json" });
  });

  it("returns 400 when payload type is missing", async () => {
    const response = await processTelemetryRequest(
      buildRequest({
        method: "POST",
        body: JSON.stringify({ description: "missing type" }),
        headers: { "content-type": "application/json" },
      }),
      buildContext(),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_payload" });
  });

  it("records telemetry events and forwards client errors", async () => {
    const payload = { type: "client-error", description: "boom" };
    const response = await processTelemetryRequest(
      buildRequest({ method: "POST", body: JSON.stringify(payload) }),
      buildContext({ headers: new Headers({ "x-forwarded-for": "198.51.100.10" }), ip: null }),
    );

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ received: true });

    expect(loggerWith).toHaveBeenCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({
          type: "client-error",
          description: "boom",
          ip: "198.51.100.10",
        }),
      }),
    );
    expect(loggerInfo).toHaveBeenCalledWith("telemetry_event");
    expect(captureException).toHaveBeenCalledWith(expect.any(Error), {
      extra: { telemetry: expect.objectContaining(payload) },
    });
  });
});
