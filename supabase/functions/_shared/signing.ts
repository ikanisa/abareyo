const encoder = new TextEncoder();

const isBrowser = typeof window !== "undefined";

type BufferLike = {
  from: (input: string, encoding?: string) => { toString: (encoding: string) => string };
};

const resolveBuffer = (): BufferLike | undefined => {
  const globalBuffer = (globalThis as { Buffer?: BufferLike }).Buffer;
  return globalBuffer;
};

const toBase64 = (binary: string): string => {
  if (typeof btoa === "function") {
    return btoa(binary);
  }
  const buffer = resolveBuffer();
  if (buffer) {
    return buffer.from(binary, "binary").toString("base64");
  }
  throw new Error("Base64 encoding not available in this runtime");
};

const fromBase64 = (base64: string): string => {
  if (typeof atob === "function") {
    return atob(base64);
  }
  const buffer = resolveBuffer();
  if (buffer) {
    return buffer.from(base64, "base64").toString("binary");
  }
  throw new Error("Base64 decoding not available in this runtime");
};

const getCrypto = (): Crypto => {
  const cryptoRef = typeof globalThis !== "undefined" ? (globalThis as { crypto?: Crypto }).crypto : undefined;
  if (!cryptoRef) {
    throw new Error("Web Crypto API is not available in this runtime");
  }
  return cryptoRef;
};

const subtle = () => {
  const cryptoRef = getCrypto();
  if (!cryptoRef.subtle) {
    throw new Error("SubtleCrypto API is not available");
  }
  return cryptoRef.subtle;
};

const toBase64Url = (input: ArrayBuffer): string => {
  const bytes = new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return toBase64(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (value: string): Uint8Array => {
  const padding = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  const normalised = value.replace(/-/g, "+").replace(/_/g, "/") + padding;
  const binary = fromBase64(normalised);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

export const TOKEN_TTL_SECONDS = 5 * 60;

export type SignedTokenResult = {
  token: string;
  signature: string;
  payload: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
};

export const importSigningKey = async (secret: string, usages: KeyUsage[] = ["sign", "verify"]): Promise<CryptoKey> => {
  const keyData = encoder.encode(secret);
  return subtle().importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, usages);
};

export const signPayload = async (secret: string, payload: string): Promise<string> => {
  const key = await importSigningKey(secret, ["sign"]);
  const signature = await subtle().sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(signature);
};

export const verifySignature = async (secret: string, payload: string, signature: string): Promise<boolean> => {
  const key = await importSigningKey(secret, ["verify"]);
  const signatureBytes = fromBase64Url(signature);
  return subtle().verify("HMAC", key, signatureBytes, encoder.encode(payload));
};

export const createPayload = (passId: string, issuedAt: number, nonce: string): string => `${passId}:${issuedAt}:${nonce}`;

export const issueSignedToken = async (
  secret: string,
  passId: string,
  issuedAt = Math.floor(Date.now() / 1000),
): Promise<SignedTokenResult> => {
  const nonce = getCrypto().randomUUID();
  const payload = createPayload(passId, issuedAt, nonce);
  const signature = await signPayload(secret, payload);
  const token = `${payload}.${signature}`;
  return {
    token,
    signature,
    payload,
    nonce,
    issuedAt,
    expiresAt: issuedAt + TOKEN_TTL_SECONDS,
  };
};

export const parseSignedToken = (token: string) => {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const [passId, issuedAtRaw, nonce] = payload.split(":");
  if (!passId || !issuedAtRaw || !nonce) {
    return null;
  }

  const issuedAt = Number.parseInt(issuedAtRaw, 10);
  if (!Number.isFinite(issuedAt)) {
    return null;
  }

  return { passId, issuedAt, nonce, signature };
};

export const isTokenExpired = (issuedAt: number, nowSeconds = Math.floor(Date.now() / 1000)): boolean => issuedAt + TOKEN_TTL_SECONDS < nowSeconds;

export const ensureTokenFresh = (issuedAt: number, nowSeconds = Math.floor(Date.now() / 1000)): boolean => nowSeconds - issuedAt <= TOKEN_TTL_SECONDS;

export const isBrowserEnvironment = () => isBrowser;
