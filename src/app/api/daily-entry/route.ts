import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const factoryId = searchParams.get("factoryId");
  const date = searchParams.get("date");
  const department = searchParams.get("department");

  if (!factoryId || !date || !department) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  const nextDay = new Date(dateObj);
  nextDay.setDate(nextDay.getDate() + 1);

  const entry = await prisma.dailyEntry.findFirst({
    where: {
      factoryId,
      date: { gte: dateObj, lt: nextDay },
      department,
    },
  });

  if (!entry) {
    return NextResponse.json({ entry: null });
  }

  return NextResponse.json({
    entry: {
      ...entry,
      dataJson: JSON.parse(entry.dataJson),
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { factoryId, date, department, dataJson, notes, analyzeNow } = body;

    if (!factoryId || !date || !department || !dataJson) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    // Upsert daily entry
    const existing = await prisma.dailyEntry.findFirst({
      where: {
        factoryId,
        date: { gte: dateObj, lt: nextDay },
        department,
      },
    });

    if (existing) {
      await prisma.dailyEntry.update({
        where: { id: existing.id },
        data: {
          dataJson: JSON.stringify(dataJson),
          notes: notes || null,
        },
      });
    } else {
      await prisma.dailyEntry.create({
        data: {
          factoryId,
          date: dateObj,
          department,
          dataJson: JSON.stringify(dataJson),
          notes: notes || null,
        },
      });
    }

    // If analyzeNow, trigger auto-generation of decisions
    if (analyzeNow) {
      await generateAutoDecisions(factoryId, department, dataJson);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Daily entry error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function generateAutoDecisions(factoryId: string, department: string, dataJson: any) {
  try {
    // 1. Production deviation > 10%
    if (department === "production" && dataJson.produced && dataJson.efficiency) {
      const efficiency = parseFloat(dataJson.efficiency);
      if (efficiency < 90) {
        const existing = await prisma.decisionItem.findFirst({
          where: {
            factoryId,
            title: { contains: "انحراف إنتاج" },
            status: "open",
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });
        if (!existing) {
          await prisma.decisionItem.create({
            data: {
              priority: "P1",
              title: `⚠️ انحراف إنتاج في ${factoryId}`,
              description: `نسبة الكفاءة ${efficiency}% (أقل من 90%).`,
              factoryId,
              status: "open",
            },
          });
        }
      }
    }

    // 2. Raw material stock below safety stock
    if (department === "inventory") {
      const factory = await prisma.factory.findUnique({
        where: { id: factoryId },
        include: {
          products: {
            include: {
              bomItems: { include: { rawMaterial: true } },
            },
          },
        },
      });
      if (factory) {
        const checkedMaterials = new Set<string>();
        for (const product of factory.products) {
          for (const bom of product.bomItems) {
            const rm = bom.rawMaterial;
            if (checkedMaterials.has(rm.id)) continue;
            checkedMaterials.add(rm.id);

            const dailyUsage = bom.quantity / bom.batchSize * 100; // estimate
            const minStock = rm.safetyStockDays * dailyUsage;

            if (rm.currentStock < minStock) {
              const existing = await prisma.decisionItem.findFirst({
                where: {
                  title: { contains: rm.name },
                  status: "open",
                },
              });
              if (!existing) {
                await prisma.decisionItem.create({
                  data: {
                    priority: "P0",
                    title: `🚨 مادة خام منخفضة: ${rm.name}`,
                    description: `المخزون (${rm.currentStock} ${rm.unit}) أقل من مخزون الأمان (${Math.round(minStock)}). المهلة: ${rm.leadTimeDays} يوم.`,
                    factoryId,
                    status: "open",
                  },
                });
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Auto decision generation error:", error);
  }
}
