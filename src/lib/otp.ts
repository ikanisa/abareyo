import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto';

const base64UrlEncode = (input: Buffer | string): string => {
  const buffer = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const generateNumericOtp = (length = 6): string => {
  const safeLength = Math.max(4, Math.min(length, 10));
  const min = 10 ** (safeLength - 1);
  const max = 10 ** safeLength;
  return randomInt(min, max).toString().padStart(safeLength, '0');
};

export const hashOtp = (otp: string, secret: string, salt: string): string =>
  createHash('sha256').update(`${otp}:${secret}:${salt}`).digest('hex');

export const verifyOtpHash = (otp: string, secret: string, salt: string, expected: string): boolean => {
  const actual = hashOtp(otp, secret, salt);
  const actualBuffer = Buffer.from(actual, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
};

type JwtPayload = {
  phone: string;
  sub: string;
  iat: number;
  exp: number;
};

export const signWhatsappJwt = (phone: string, secret: string, ttlSeconds: number): string => {
  if (!secret || secret.length < 16) {
    throw new Error('jwt_secret_missing');
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    phone,
    sub: phone,
    iat: issuedAt,
    exp: issuedAt + Math.max(1, Math.floor(ttlSeconds)),
  };

  const headerEncoded = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac('sha256', secret).update(`${headerEncoded}.${payloadEncoded}`).digest();
  const signatureEncoded = base64UrlEncode(signature);

  return `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
};
