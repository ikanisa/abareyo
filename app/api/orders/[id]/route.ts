import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ order: { id: params.id, status: 'paid', items: [{ name: 'Jersey', qty: 1 }] } });
}
