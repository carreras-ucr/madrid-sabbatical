import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

export async function GET() {
  const trips = (await redis.get("sabbatical-trips")) || [];
  return NextResponse.json(trips);
}

export async function POST(request: Request) {
  const trips = await request.json();
  await redis.set("sabbatical-trips", trips);
  return NextResponse.json({ ok: true });
}
