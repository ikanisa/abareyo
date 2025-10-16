import { NextResponse } from "next/server";
import { ff } from "@/lib/flags";

type CheckoutPayload = {
  amount?: number | string;
  method?: string;
  meta?: unknown;
};

async function parseBody(req: Request): Promise<CheckoutPayload> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await req.json()) as CheckoutPayload;
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    const amount = form.get("amount");
    const method = form.get("method");
    const meta = form.get("meta");
    return {
      amount: typeof amount === "string" ? amount : undefined,
      method: typeof method === "string" ? method : undefined,
      meta: typeof meta === "string" ? meta : undefined,
    };
  }
  return {};
}

export async function POST(req: Request) {
  const body = await parseBody(req);
  const amount = Number(body.amount ?? 0) || 0;
  const method = (body.method ?? "ussd") as string;

  if (method === "ussd") {
    return NextResponse.json({ href: `tel:*182*1*1*07xxxxxxx*${amount}%23` });
  }
  if (!ff("payments.multi", false)) {
    return NextResponse.json({ error: "payments_disabled" }, { status: 503 });
  }
  switch (method) {
    case "mtn":
      return NextResponse.json({ ok: true, status: "initiated", provider: "mtn" });
    case "airtel":
      return NextResponse.json({ ok: true, status: "initiated", provider: "airtel" });
    case "card":
      return NextResponse.json({ ok: true, status: "requires_redirect", redirect: "/pay/card/session" });
    case "apple":
    case "google":
      return NextResponse.json({ ok: true, status: "sheet" });
    default:
      return NextResponse.json({ error: "unknown_method" }, { status: 400 });
  }
}
