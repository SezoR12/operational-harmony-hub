import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: any = {};
  if (status) where.status = status;

  const risks = await prisma.risk.findMany({
    where,
    orderBy: [{ status: "asc" }, { classification: "desc" }],
  });
  return NextResponse.json(risks);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const classification = calculateClassification(body.probability, body.impact);

    const risk = await prisma.risk.create({
      data: {
        category: body.category,
        description: body.description,
        probability: body.probability,
        impact: body.impact,
        classification,
        mitigationPlan: body.mitigationPlan || null,
        status: "active",
      },
    });

    return NextResponse.json({ success: true, risk });
  } catch (error) {
    console.error("Risk creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status, mitigationPlan, description, category, probability, impact } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (mitigationPlan !== undefined) updateData.mitigationPlan = mitigationPlan;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (probability) updateData.probability = probability;
    if (impact) updateData.impact = impact;
    if (probability || impact) {
      const current = await prisma.risk.findUnique({ where: { id } });
      updateData.classification = calculateClassification(
        probability || current?.probability || "ممكن",
        impact || current?.impact || "متوسط"
      );
    }

    const risk = await prisma.risk.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, risk });
  } catch (error) {
    console.error("Risk update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.risk.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Risk delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function calculateClassification(probability: string, impact: string): string {
  const matrix: Record<string, Record<string, string>> = {
    "نادراً": { "طفيف": "منخفض", "متوسط": "منخفض", "كبير": "متوسط", "كارثي": "مرتفع" },
    "ممكن": { "طفيف": "منخفض", "متوسط": "متوسط", "كبير": "مرتفع", "كارثي": "حرج" },
    "محتمل": { "طفيف": "متوسط", "متوسط": "مرتفع", "كبير": "حرج", "كارثي": "حرج" },
    "شبه مؤكد": { "طفيف": "متوسط", "متوسط": "مرتفع", "كبير": "حرج", "كارثي": "حرج" },
  };
  return matrix[probability]?.[impact] || "متوسط";
}
