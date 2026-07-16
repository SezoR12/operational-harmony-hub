import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const risks = await prisma.risk.findMany({
    orderBy: [{ status: "asc" }, { classification: "desc" }],
  });
  return NextResponse.json(risks);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Auto-classify based on probability x impact matrix
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

function calculateClassification(probability: string, impact: string): string {
  const matrix: Record<string, Record<string, string>> = {
    "نادراً": { "طفيف": "منخفض", "متوسط": "منخفض", "كبير": "متوسط", "كارثي": "مرتفع" },
    "ممكن": { "طفيف": "منخفض", "متوسط": "متوسط", "كبير": "مرتفع", "كارثي": "حرج" },
    "محتمل": { "طفيف": "متوسط", "متوسط": "مرتفع", "كبير": "حرج", "كارثي": "حرج" },
    "شبه مؤكد": { "طفيف": "متوسط", "متوسط": "مرتفع", "كبير": "حرج", "كارثي": "حرج" },
  };

  return matrix[probability]?.[impact] || "متوسط";
}
