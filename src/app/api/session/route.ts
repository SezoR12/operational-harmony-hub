import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const role = await getSession();
  return NextResponse.json({ role });
}
