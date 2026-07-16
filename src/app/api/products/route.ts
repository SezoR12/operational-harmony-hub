import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const factory = searchParams.get("factory");
  const all = searchParams.get("all");

  if (all === "true") {
    const products = await prisma.product.findMany({
      include: {
        factory: { select: { name: true } },
        bomItems: { include: { rawMaterial: true } },
        _count: { select: { orders: true } },
      },
    });
    return NextResponse.json(products);
  }

  let factoryFilter: any = {};
  if (factory === "cardboard") {
    const cardboardFactory = await prisma.factory.findFirst({ where: { marketType: "B2B" } });
    if (cardboardFactory) factoryFilter = { factoryId: cardboardFactory.id };
  } else if (factory) {
    factoryFilter = { factoryId: factory };
  }

  const products = await prisma.product.findMany({
    where: factoryFilter,
    include: { bomItems: { include: { rawMaterial: true } } },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const product = await prisma.product.create({
      data: {
        factoryId: body.factoryId,
        name: body.name,
        code: body.code,
        unit: body.unit || "حبة",
        priceCustomer: body.priceCustomer || null,
        priceWholesale: body.priceWholesale || null,
        priceSupermarket: body.priceSupermarket || null,
        moq: body.moq || 1,
        setupTimeMinutes: body.setupTimeMinutes || 0,
        contributionMargin: body.contributionMargin || null,
        seasonality: body.seasonality || null,
      },
    });
    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Product create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, ...fields } = await request.json();
    const product = await prisma.product.update({ where: { id }, data: fields });
    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.bomItem.deleteMany({ where: { productId: id } });
    await prisma.order.deleteMany({ where: { productId: id } });
    await prisma.forecast.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
