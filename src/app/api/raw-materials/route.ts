import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const materials = await prisma.rawMaterial.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(materials);
}
