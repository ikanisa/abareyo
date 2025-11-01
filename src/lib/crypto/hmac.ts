import { createHmac, randomUUID } from 'crypto';

type CanonicalInput = {
  merchantId: string;
  transactionId: string;
  status: string;
  amountCents: number | null;
  currency: string | null;
  nonce: string;
  issuedAt: number;
};

const base64Url = (input: Buffer | Uint8Array): string =>
  Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export const signHmacSha256 = (payload: string, secret: string): string => {
  const digest = createHmac('sha256', secret).update(payload).digest();
  return base64Url(digest);
};

const normalizeCurrency = (currency: string | null): string => (currency ? currency.toUpperCase() : '');

const normalizeAmount = (amountCents: number | null): string =>
  amountCents === null || amountCents === undefined ? '' : Math.trunc(amountCents).toString();

export const buildMerchantCanonical = ({
  merchantId,
  transactionId,
  status,
  amountCents,
  currency,
  nonce,
  issuedAt,
}: CanonicalInput): string =>
  [
    merchantId,
    transactionId,
    status,
    normalizeAmount(amountCents),
    normalizeCurrency(currency),
    nonce,
    issuedAt.toString(),
  ].join(':');

export const generateNonce = () => randomUUID();
