import { describe, expect, it } from "vitest";

import {
  createPayload,
  ensureTokenFresh,
  issueSignedToken,
  parseSignedToken,
  signPayload,
  TOKEN_TTL_SECONDS,
  verifySignature,
} from "../../../supabase/functions/_shared/signing.ts";

export const runSigningSuite = (label: string, secret: string) => {
  describe(`${label} HMAC signing`, () => {
    it("signs and verifies payloads", async () => {
      const payload = createPayload("pass-123", 1700000000, "nonce-xyz");
      const signature = await signPayload(secret, payload);
      expect(signature).toMatch(/^[A-Za-z0-9_-]+$/);

      await expect(verifySignature(secret, payload, signature)).resolves.toBe(true);
      await expect(verifySignature(secret, payload, signature.replace(/.$/, "A"))).resolves.toBe(false);
    });

    it("issues tokens with TTL and nonce", async () => {
      const result = await issueSignedToken(secret, "pass-abc", 1700000000);
      expect(result.token).toContain(result.signature);
      expect(result.nonce).toHaveLength(36);
      expect(result.expiresAt - result.issuedAt).toBe(TOKEN_TTL_SECONDS);
      expect(ensureTokenFresh(result.issuedAt, result.issuedAt + TOKEN_TTL_SECONDS - 1)).toBe(true);

      const parsed = parseSignedToken(result.token);
      expect(parsed).not.toBeNull();
      expect(parsed?.passId).toBe("pass-abc");
      expect(parsed?.nonce).toBe(result.nonce);
    });
  });
};
