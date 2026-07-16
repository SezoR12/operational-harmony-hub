import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const materials = await prisma.rawMaterial.findMany({
    include: { _count: { select: { bomItems: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(materials);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rm = await prisma.rawMaterial.create({
      data: {
        name: body.name,
        unit: body.unit || "كغم",
        unitCost: body.unitCost || 0,
        currentStock: body.currentStock || 0,
        safetyStockDays: body.safetyStockDays || 7,
        leadTimeDays: body.leadTimeDays || 7,
        supplier: body.supplier || null,
        backupSupplier: body.backupSupplier || null,
        riskNote: body.riskNote || null,
      },
    });
    return NextResponse.json({ success: true, rawMaterial: rm });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, ...fields } = await request.json();
    const rm = await prisma.rawMaterial.update({ where: { id }, data: fields });
    return NextResponse.json({ success: true, rawMaterial: rm });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.bomItem.deleteMany({ where: { rawMaterialId: id } });
    await prisma.rawMaterial.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
