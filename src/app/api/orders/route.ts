import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { productId, customerName, quantity, requestedDate, ctpStatus, ctpDetailsJson, promisedDate } = await request.json();

    if (!productId || !customerName || !quantity || !requestedDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        productId,
        customerName,
        quantity: parseFloat(quantity),
        requestedDate: new Date(requestedDate),
        ctpStatus,
        ctpDetailsJson: ctpDetailsJson ? JSON.stringify(ctpDetailsJson) : null,
        promisedDate: promisedDate ? new Date(promisedDate) : null,
        status: "confirmed",
      },
    });

    // Auto-generate decision if yellow or red
    if (ctpStatus === "yellow" || ctpStatus === "red") {
      await prisma.decisionItem.create({
        data: {
          priority: "P0",
          title: `طلب ${customerName} يحتاج قرار — CTP: ${ctpStatus}`,
          description: `المنتج: ${productId}, الكمية: ${quantity}, الموعد: ${requestedDate}. التصنيف: ${
            ctpStatus === "yellow" ? "أصفر (أوفرتايم)" : "أحمر (موعد بديل)"
          }.`,
          status: "open",
        },
      });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const orders = await prisma.order.findMany({
    include: {
      product: {
        select: { name: true, code: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(orders);
}
