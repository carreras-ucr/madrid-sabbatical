import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

export async function GET() {
  const visits = (await redis.get("sabbatical-visits")) || [];
  return NextResponse.json(visits);
}

export async function POST(request: Request) {
  const visits = await request.json();
  await redis.set("sabbatical-visits", visits);
  return NextResponse.json({ ok: true });
}
