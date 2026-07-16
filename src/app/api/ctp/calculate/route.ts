import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { productId, quantity, requestedDate, lines } = await request.json();

    if (!productId || !quantity || !requestedDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Load product with BOM and raw materials
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        bomItems: {
          include: { rawMaterial: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const qty = parseFloat(quantity);
    const requestDate = new Date(requestedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysAvailable = Math.max(
      1,
      Math.ceil((requestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Get suitable lines for this product
    const suitableLines = lines.filter((line: any) => {
      try {
        const suitableIds = JSON.parse(line.suitableProductIds || "[]");
        return suitableIds.includes(productId);
      } catch {
        return false;
      }
    });

    const dailyCapacity: Array<{
      lineName: string;
      capacityPerDay: number;
      availablePerDay: number;
      daysNeeded: number;
      setupLoss: number;
      notes: string;
    }> = [];

    let totalAvailableCapacity = 0;
    let totalSetupLoss = 0;

    for (const line of suitableLines) {
      const capacityPerDay = line.capacityPerHour * line.hoursPerDay;
      let setupLoss = 0;

      // Check if line is running a different product
      if (line.currentProductId && line.currentProductId !== productId) {
        // Calculate setup time loss in units
        const setupHours = product.setupTimeMinutes / 60;
        setupLoss = Math.ceil(setupHours * line.capacityPerHour);
      }

      const availablePerDay = capacityPerDay;
      const totalAvailable = availablePerDay * daysAvailable - setupLoss;
      const daysNeeded = qty / Math.max(1, availablePerDay);

      totalAvailableCapacity += totalAvailable;
      totalSetupLoss += setupLoss;

      dailyCapacity.push({
        lineName: line.name,
        capacityPerDay,
        availablePerDay,
        daysNeeded,
        setupLoss,
        notes: setupLoss > 0 ? `يوجد تبديل منتج (فقد ${setupLoss} وحدة)` : "جاهز",
      });
    }

    // Check raw materials
    const materials: Array<{
      name: string;
      required: number;
      available: number;
      sufficient: boolean;
      safetyStockAfter: number;
      notes: string;
    }> = [];

    let allMaterialsSufficient = true;

    for (const bomItem of product.bomItems) {
      const rm = bomItem.rawMaterial;
      // Calculate required raw material for the full quantity
      const requiredPerBatch = (bomItem.quantity / bomItem.batchSize) * qty;
      const available = rm.currentStock;
      const remainingAfterUse = available - requiredPerBatch;
      const safetyStock = rm.safetyStockDays * (requiredPerBatch / daysAvailable);
      const sufficient = remainingAfterUse >= safetyStock;

      if (!sufficient) allMaterialsSufficient = false;

      materials.push({
        name: rm.name,
        required: Math.round(requiredPerBatch * 100) / 100,
        available,
        sufficient,
        safetyStockAfter: Math.round(remainingAfterUse * 100) / 100,
        notes: sufficient
          ? `المخزون كافي (${Math.round(remainingAfterUse)} متبقي)`
          : `غير كافٍ! المخزون بعد الاستخدام (${Math.round(
              remainingAfterUse
            )}) أقل من مخزون الأمان (${Math.round(safetyStock)})`,
      });
    }

    // Determine overall status
    const capacitySufficient = totalAvailableCapacity >= qty;
    let status: "green" | "yellow" | "red";
    let summary = "";
    let suggestedDate: string | null = null;

    if (capacitySufficient && allMaterialsSufficient) {
      status = "green";
      summary = `🟢 الطاقة والمواد الخام كافية لتلبية الطلب خلال ${daysAvailable} يوم.`;
    } else if (capacitySufficient || allMaterialsSufficient) {
      status = "yellow";
      summary = `🟡 ${!capacitySufficient ? "الطاقة غير كافية. " : ""}${
        !allMaterialsSufficient ? "المواد الخام غير كافية. " : ""
      }قد تحتاج إلى أوفرتايم أو إعادة ترتيب.`;
      // Suggest a later date
      const extraDays = Math.ceil(
        (!capacitySufficient
          ? (qty - totalAvailableCapacity) /
            (totalAvailableCapacity / daysAvailable)
          : 0) +
          (!allMaterialsSufficient ? 7 : 0)
      );
      const suggested = new Date(today);
      suggested.setDate(suggested.getDate() + daysAvailable + extraDays);
      suggestedDate = suggested.toISOString().split("T")[0];
    } else {
      status = "red";
      // Find earliest possible date
      let earliestDays = daysAvailable;
      if (!capacitySufficient && totalAvailableCapacity > 0) {
        const daysNeededTotal = Math.ceil(qty / (totalAvailableCapacity / daysAvailable));
        earliestDays = Math.max(earliestDays, daysNeededTotal);
      }
      if (!allMaterialsSufficient) {
        // Find max lead time for insufficient materials
        let maxLeadTime = 0;
        for (const m of materials) {
          if (!m.sufficient) {
            const mat = product.bomItems.find(
              (b) => b.rawMaterial.name === m.name
            )?.rawMaterial;
            if (mat && mat.leadTimeDays > maxLeadTime) {
              maxLeadTime = mat.leadTimeDays;
            }
          }
        }
        earliestDays += maxLeadTime;
      }
      const suggested = new Date(today);
      suggested.setDate(suggested.getDate() + earliestDays);
      suggestedDate = suggested.toISOString().split("T")[0];

      summary = `🔴 غير ممكن في الموعد المطلوب. أقرب موعد بديل: ${suggested.toLocaleDateString(
        "ar-IQ"
      )}.`;
    }

    return NextResponse.json({
      status,
      details: {
        dailyCapacity,
        materials,
        suggestedDate,
        summary,
      },
    });
  } catch (error) {
    console.error("CTP calculation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
