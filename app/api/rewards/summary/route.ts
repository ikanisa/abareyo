import { NextResponse } from "next/server";

export async function GET(){ return NextResponse.json({ user:{ points:1250, tier:'fan' }, latestPerk:null }); }
