import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const latestSnapshot = await prisma.gmReportSnapshot.findFirst({
    orderBy: { generatedAt: "desc" },
  });

  const config = await prisma.appConfig.findFirst();

  let currentNote = "";
  if (latestSnapshot) {
    try {
      const data = JSON.parse(latestSnapshot.dataJson);
      currentNote = data.note || "";
    } catch {}
  }

  return NextResponse.json({
    snapshot: latestSnapshot
      ? {
          id: latestSnapshot.id,
          generatedAt: latestSnapshot.generatedAt,
          dataJson: JSON.parse(latestSnapshot.dataJson),
        }
      : null,
    gmReportToken: config?.gmReportToken || "",
    reportUrl: config
      ? `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/report/${config.gmReportToken}`
      : "",
  });
}

export async function POST(request: Request) {
  try {
    const { note } = await request.json();

    // Gather live data for the snapshot
    const factories = await prisma.factory.findMany({
      include: { products: true },
    });

    const activeRisks = await prisma.risk.findMany({
      where: { status: "active", classification: { in: ["مرتفع", "حرج"] } },
      take: 3,
      orderBy: { classification: "desc" },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const factoryStatuses = await Promise.all(
      factories.map(async (f) => {
        let status = "green";

        if (f.marketType === "B2B") {
          const recentOrders = await prisma.order.findMany({
            where: {
              product: { factoryId: f.id },
              createdAt: { gte: thirtyDaysAgo },
              status: { in: ["confirmed", "delivered"] },
            },
          });
          const onTime = recentOrders.filter(
            (o) => o.promisedDate && o.requestedDate && o.promisedDate <= o.requestedDate
          );
          const compliance =
            recentOrders.length > 0
              ? Math.round((onTime.length / recentOrders.length) * 100)
              : 100;

          if (compliance >= 95) status = "green";
          else if (compliance >= 85) status = "yellow";
          else status = "red";

          return { name: f.name, status, metric: `${compliance}% التزام` };
        } else {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const salesEntries = await prisma.dailyEntry.findMany({
            where: {
              factoryId: f.id,
              department: "sales",
              date: { gte: startOfMonth },
            },
          });

          let totalPlanned = 0;
          let totalActual = 0;
          for (const entry of salesEntries) {
            try {
              const data = JSON.parse(entry.dataJson);
              totalPlanned += data.planned || 0;
              totalActual += data.actual || 0;
            } catch {}
          }

          const achievement =
            totalPlanned > 0
              ? Math.round((totalActual / totalPlanned) * 100)
              : null;

          if (achievement !== null && achievement >= 90) status = "green";
          else if (achievement !== null && achievement >= 75) status = "yellow";
          else status = "red";

          return {
            name: f.name,
            status,
            metric:
              achievement !== null ? `${achievement}% مبيعات` : "لا توجد بيانات",
          };
        }
      })
    );

    const dataJson = JSON.stringify({
      generatedAt: new Date().toISOString(),
      factories: factoryStatuses,
      risks: activeRisks.map((r) => ({
        description: r.description,
        classification: r.classification,
      })),
      note: note || "",
    });

    await prisma.gmReportSnapshot.create({
      data: { dataJson },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("GM report generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
