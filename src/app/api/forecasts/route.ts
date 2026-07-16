import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const where: any = {};
  if (productId) where.productId = productId;
  const forecasts = await prisma.forecast.findMany({
    where,
    include: { product: { select: { name: true, code: true, factory: { select: { name: true } } } } },
    orderBy: [{ period: "asc" }],
  });
  return NextResponse.json(forecasts);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const forecast = await prisma.forecast.create({
      data: {
        productId: body.productId,
        period: body.period,
        horizon: body.horizon || "monthly",
        optimistic: body.optimistic || 0,
        likely: body.likely || 0,
        pessimistic: body.pessimistic || 0,
      },
    });
    return NextResponse.json({ success: true, forecast });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, ...fields } = await request.json();
    const forecast = await prisma.forecast.update({ where: { id }, data: fields });
    return NextResponse.json({ success: true, forecast });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.forecast.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
