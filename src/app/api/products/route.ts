import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const factory = searchParams.get("factory");
  const all = searchParams.get("all");

  if (all === "true") {
    // Return all products with BOM and factory info
    const products = await prisma.product.findMany({
      include: {
        factory: { select: { name: true } },
        bomItems: {
          include: { rawMaterial: true },
        },
      },
    });
    return NextResponse.json(products);
  }

  let factoryFilter: any = {};
  if (factory === "cardboard") {
    const cardboardFactory = await prisma.factory.findFirst({
      where: { marketType: "B2B" },
    });
    if (cardboardFactory) {
      factoryFilter = { factoryId: cardboardFactory.id };
    }
  }

  const products = await prisma.product.findMany({
    where: factoryFilter,
    include: {
      bomItems: {
        include: { rawMaterial: true },
      },
    },
  });

  const cardboardFactory = await prisma.factory.findFirst({
    where: { marketType: "B2B" },
  });

  const lines = cardboardFactory
    ? await prisma.line.findMany({
        where: { factoryId: cardboardFactory.id },
      })
    : [];

  return NextResponse.json({ products, lines });
}
