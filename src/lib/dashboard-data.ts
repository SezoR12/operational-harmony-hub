import { prisma } from "./prisma";

export interface DashboardData {
  factories: Array<{
    id: string;
    name: string;
    marketType: string;
    status: "green" | "yellow" | "red";
    reason: string;
    salesAchievement?: number;
    deliveryCompliance?: number;
  }>;
  decisions: Array<{
    id: string;
    priority: string;
    title: string;
    description: string;
    status: string;
    factoryName?: string;
  }>;
  risks: Array<{
    id: string;
    classification: string;
    description: string;
    category: string;
  }>;
}

export async function getDashboardData(): Promise<DashboardData> {
  const factories = await prisma.factory.findMany({
    include: { products: true, lines: true },
  });

  const decisions = await prisma.decisionItem.findMany({
    where: { status: "open" },
    include: { factory: { select: { name: true } } },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    take: 5,
  });

  const risks = await prisma.risk.findMany({
    where: { status: "active", classification: { in: ["مرتفع", "حرج"] } },
    orderBy: [{ classification: "desc" }],
    take: 3,
  });

  const factoriesWithStatus = await Promise.all(
    factories.map(async (f) => {
      let status: "green" | "yellow" | "red" = "green";
      let reason = "";

      const hasCriticalRisk = risks.some(r => r.classification === "حرج");
      const hasHighRisk = risks.some(r => r.classification === "مرتفع");

      if (f.marketType === "B2B") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentOrders = await prisma.order.findMany({
          where: {
            product: { factoryId: f.id },
            createdAt: { gte: thirtyDaysAgo },
            status: { in: ["confirmed", "delivered"] },
          },
        });
        const onTime = recentOrders.filter(o => o.promisedDate && o.requestedDate && o.promisedDate <= o.requestedDate);
        const compliance = recentOrders.length > 0 ? Math.round((onTime.length / recentOrders.length) * 100) : 100;

        if (compliance >= 95) { status = "green"; reason = `التزام مواعيد ${compliance}%`; }
        else if (compliance >= 85) { status = "yellow"; reason = `التزام مواعيد ${compliance}%`; }
        else { status = "red"; reason = `التزام مواعيد ${compliance}% (أقل من 85%)`; }

        if (hasCriticalRisk) { reason += " + خطر حرج"; if (status === "green") { status = "yellow"; } }

        return { id: f.id, name: f.name, marketType: f.marketType, status, reason, deliveryCompliance: compliance };
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const salesEntries = await prisma.dailyEntry.findMany({
          where: { factoryId: f.id, department: "sales", date: { gte: startOfMonth } },
        });

        let totalPlanned = 0, totalActual = 0;
        for (const entry of salesEntries) {
          try { const d = JSON.parse(entry.dataJson); totalPlanned += d.planned || 0; totalActual += d.actual || 0; } catch {}
        }

        const achievement = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : null;

        if (hasCriticalRisk || (achievement !== null && achievement < 75)) {
          status = "red";
          reason = hasCriticalRisk ? "يوجد خطر حرج" : `تحقيق مبيعات ${achievement}% (أقل من 75%)`;
        } else if (hasHighRisk || (achievement !== null && achievement < 90)) {
          status = "yellow";
          reason = hasHighRisk ? "يوجد خطر مرتفع" : `تحقيق مبيعات ${achievement}%`;
        } else {
          reason = achievement !== null ? `تحقيق مبيعات ${achievement}%` : "لا توجد بيانات مبيعات";
        }

        return { id: f.id, name: f.name, marketType: f.marketType, status, reason, salesAchievement: achievement ?? undefined };
      }
    })
  );

  return {
    factories: factoriesWithStatus,
    decisions: decisions.map(d => ({
      id: d.id,
      priority: d.priority,
      title: d.title,
      description: d.description,
      status: d.status,
      factoryName: d.factory?.name,
    })),
    risks: risks.map(r => ({
      id: r.id,
      classification: r.classification,
      description: r.description,
      category: r.category,
    })),
  };
}
