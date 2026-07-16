import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const factoryId = searchParams.get("factoryId");
  const status = searchParams.get("status");

  const where: any = {};
  if (factoryId) where.factoryId = factoryId;
  if (status) where.status = status;

  const decisions = await prisma.decisionItem.findMany({
    where,
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(decisions);
}

export async function PATCH(request: Request) {
  try {
    const { id, action, resolutionNote } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (action === "resolve") {
      await prisma.decisionItem.update({
        where: { id },
        data: {
          status: "resolved",
          resolutionNote: resolutionNote || null,
          resolvedAt: new Date(),
        },
      });
    } else if (action === "dismiss") {
      await prisma.decisionItem.update({
        where: { id },
        data: { status: "dismissed" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Decision update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
