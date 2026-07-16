import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const lines = await prisma.line.findMany({
    include: { factory: { select: { name: true } } },
    orderBy: [{ factoryId: "asc" }, { name: "asc" }],
  });
  const factories = await prisma.factory.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ lines, factories });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const line = await prisma.line.create({
      data: {
        factoryId: body.factoryId,
        name: body.name,
        type: body.type || "إنتاج",
        capacityPerHour: body.capacityPerHour || 0,
        hoursPerDay: body.hoursPerDay || 8,
        suitableProductIds: JSON.stringify(body.suitableProductIds || []),
        currentProductId: body.currentProductId || null,
      },
    });
    return NextResponse.json({ success: true, line });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, ...fields } = await request.json();
    const data: any = { ...fields };
    if (fields.suitableProductIds) data.suitableProductIds = JSON.stringify(fields.suitableProductIds);
    const line = await prisma.line.update({ where: { id }, data });
    return NextResponse.json({ success: true, line });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.line.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
