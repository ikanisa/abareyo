import { Agent } from "undici";

const resolveUpstreamBase = () => {
  const candidates = [
    process.env.INTERNAL_BACKEND_BASE_URL,
    process.env.BACKEND_BASE_URL,
    process.env.NEXT_PUBLIC_BACKEND_URL,
  ].filter((value): value is string => Boolean(value && value.trim().length > 0));

  if (candidates.length === 0) {
    if (process.env.NODE_ENV !== "production") {
      return "http://localhost:5000/api";
    }
    throw new Error("INTERNAL_BACKEND_BASE_URL must be configured for the backend proxy.");
  }

  let base = candidates[0]!.trim();
  if (!/^https?:\/\//iu.test(base)) {
    const origin =
      typeof process.env.NEXT_PUBLIC_SITE_URL === "string" && process.env.NEXT_PUBLIC_SITE_URL
        ? process.env.NEXT_PUBLIC_SITE_URL
        : "http://localhost:3000";
    base = base.startsWith("/") ? `${origin}${base}` : `https://${base}`;
  }
  return base.replace(/\/+$/, "");
};

const upstreamUrl = new URL(resolveUpstreamBase());
const sniHost =
  process.env.INTERNAL_BACKEND_SNI_HOST && process.env.INTERNAL_BACKEND_SNI_HOST.trim().length > 0
    ? process.env.INTERNAL_BACKEND_SNI_HOST.trim()
    : upstreamUrl.hostname;

const dispatcher = new Agent({
  connect: { servername: sniHost },
});

const hopByHopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

type RouteParams = { params: { path?: string[] } };

const buildUpstreamUrl = (request: Request, segments: string[] | undefined) => {
  const url = new URL(upstreamUrl);
  const baseSegments = upstreamUrl.pathname.split("/").filter(Boolean);
  const nextSegments = segments?.filter((segment) => segment.length > 0) ?? [];
  const pathnameSegments = [...baseSegments, ...nextSegments];
  url.pathname = pathnameSegments.length > 0 ? `/${pathnameSegments.join("/")}` : "/";
  const incoming = new URL(request.url);
  if (incoming.search) {
    url.search = incoming.search;
  }
  return url;
};

async function handler(request: Request, { params }: RouteParams) {
  const target = buildUpstreamUrl(request, params.path);

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (hopByHopHeaders.has(key.toLowerCase())) return;
    if (key.toLowerCase() === "host") {
      headers.set(key, upstreamUrl.host);
      return;
    }
    headers.set(key, value);
  });

  const init: RequestInit & { duplex?: "half"; dispatcher?: Agent } = {
    method: request.method,
    headers,
    redirect: "manual",
    dispatcher,
  };

  if (request.body && request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(target, init);
  } catch (error) {
    console.error("Backend proxy request failed", error);
    return new Response(JSON.stringify({ message: "Backend service unavailable" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  const responseHeaders = new Headers();
  upstreamResponse.headers.forEach((value, key) => {
    if (hopByHopHeaders.has(key.toLowerCase())) return;
    responseHeaders.set(key, value);
  });

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
