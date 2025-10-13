import { NextResponse, type NextRequest } from "next/server";

export type MarketplaceEventPayload = {
  event: string;
  locale?: string;
  timestamp: string;
  payload?: Record<string, unknown>;
};

type MarketplaceEventStore = {
  events: MarketplaceEventPayload[];
};

declare global {
  // eslint-disable-next-line no-var
  var __marketplaceEventStore: MarketplaceEventStore | undefined;
}

const getStore = (): MarketplaceEventStore => {
  if (!globalThis.__marketplaceEventStore) {
    globalThis.__marketplaceEventStore = { events: [] };
  }
  return globalThis.__marketplaceEventStore;
};

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<MarketplaceEventPayload>;
    if (!body.event) {
      return NextResponse.json({ error: "Missing event name" }, { status: 400 });
    }
    const entry: MarketplaceEventPayload = {
      event: body.event,
      locale: body.locale,
      payload: body.payload ?? {},
      timestamp: body.timestamp ?? new Date().toISOString(),
    };
    const store = getStore();
    store.events.unshift(entry);
    store.events = store.events.slice(0, 50);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
}

export async function GET() {
  const store = getStore();
  return NextResponse.json({ events: store.events });
}
