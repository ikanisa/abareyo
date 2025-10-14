export type ApiOk<T = unknown> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string };

export function successResponse<T = unknown>(data: T, status = 200) {
  return new Response(
    JSON.stringify({ ok: true, data } satisfies ApiOk<T>),
    {
      status,
      headers: { "content-type": "application/json" },
    },
  );
}

export function errorResponse(message: string, status = 400) {
  return new Response(
    JSON.stringify({ ok: false, error: message } satisfies ApiErr),
    {
      status,
      headers: { "content-type": "application/json" },
    },
  );
}
