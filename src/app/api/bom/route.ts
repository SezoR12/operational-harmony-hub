import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const where: any = {};
  if (productId) where.productId = productId;
  const bomItems = await prisma.bomItem.findMany({
    where,
    include: { product: { select: { name: true, code: true } }, rawMaterial: true },
  });
  return NextResponse.json(bomItems);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bom = await prisma.bomItem.create({
      data: {
        productId: body.productId,
        rawMaterialId: body.rawMaterialId,
        quantity: body.quantity || 0,
        batchSize: body.batchSize || 1000,
      },
    });
    return NextResponse.json({ success: true, bomItem: bom });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, ...fields } = await request.json();
    const bom = await prisma.bomItem.update({ where: { id }, data: fields });
    return NextResponse.json({ success: true, bomItem: bom });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.bomItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
