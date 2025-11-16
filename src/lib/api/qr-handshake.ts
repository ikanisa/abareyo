import { z } from "zod";

import { createApiFetcher } from "@rayon/api/http";

import { getCorrelationId } from "@/lib/observability/correlation";

const handshakeSchema = z.object({
  id: z.string(),
  status: z.enum(["pending", "confirmed", "completed", "expired"]),
  expiresAt: z.number(),
  userId: z.string().optional(),
  completedAt: z.number().optional(),
});

const qrPayloadSchema = z.object({
  id: z.string(),
  secret: z.string(),
  kind: z.literal("qr_login"),
  expiresAt: z.number(),
});

const createResponseSchema = z.object({
  data: z.object({
    handshake: handshakeSchema,
    qrPayload: qrPayloadSchema,
  }),
});

const statusResponseSchema = z.object({
  data: z.object({
    handshake: handshakeSchema.optional(),
    session: z.any().optional(),
  }).or(z.object({ handshake: handshakeSchema })),
});

const simpleStatusSchema = z.object({ data: handshakeSchema });

const fetcher = createApiFetcher({ getCorrelationId });

export type Handshake = z.infer<typeof handshakeSchema>;
export type QrPayload = z.infer<typeof qrPayloadSchema>;

export const requestHandshake = async (): Promise<{ handshake: Handshake; qrPayload: QrPayload }> => {
  const response = await fetcher("/auth/qr", createResponseSchema, { method: "POST", cache: "no-store" });
  return response.data;
};

export const pollHandshakeStatus = async (
  handshakeId: string,
  waitMs = 0,
): Promise<{ handshake: Handshake; session?: unknown }> => {
  const response = await fetcher(`/auth/qr/${handshakeId}${waitMs > 0 ? `?wait=${waitMs}` : ""}`, statusResponseSchema, {
    cache: "no-store",
  });
  const { data } = response;
  if ("handshake" in data && data.handshake) {
    return { handshake: data.handshake, session: (data as { session?: unknown }).session };
  }
  return { handshake: (data as { handshake: Handshake }).handshake };
};

export const consumeHandshake = async (payload: {
  handshakeId: string;
  secret: string;
  accessToken: string;
  refreshToken?: string | null;
}): Promise<Handshake> => {
  const response = await fetcher("/auth/qr/consume", simpleStatusSchema, {
    method: "POST",
    body: payload,
    cache: "no-store",
  });
  return response.data;
};
