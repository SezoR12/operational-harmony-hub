import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const factories = await prisma.factory.findMany({
    include: {
      _count: { select: { lines: true, products: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(factories);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const factory = await prisma.factory.create({
      data: {
        name: body.name,
        marketType: body.marketType || "B2C",
        planningStage: body.planningStage || "market-led",
      },
    });
    return NextResponse.json({ success: true, factory });
  } catch (error) {
    console.error("Factory create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, name, marketType, planningStage } = await request.json();
    const data: any = {};
    if (name) data.name = name;
    if (marketType) data.marketType = marketType;
    if (planningStage) data.planningStage = planningStage;
    const factory = await prisma.factory.update({ where: { id }, data });
    return NextResponse.json({ success: true, factory });
  } catch (error) {
    console.error("Factory update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.factory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Factory delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
