import { NextResponse } from "next/server";
import { ff } from "@/lib/flags";

export async function POST(req: Request) {
  const { amount, method } = await req.json();

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
