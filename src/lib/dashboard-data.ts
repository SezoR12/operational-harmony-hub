import { prisma } from "./prisma";

export interface DashboardData {
  factories: Array<{
    id: string;
    name: string;
    marketType: string;
    status: "green" | "yellow" | "red";
    salesAchievement?: number;
    deliveryCompliance?: number;
  }>;
  decisions: Array<{
    id: string;
    priority: string;
    title: string;
    description: string;
    status: string;
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
    include: {
      products: true,
      lines: true,
    },
  });

  const decisions = await prisma.decisionItem.findMany({
    where: { status: "open" },
    orderBy: [{ priority: "asc" }],
    take: 5,
  });

  const risks = await prisma.risk.findMany({
    where: {
      status: "active",
      classification: { in: ["مرتفع", "حرج"] },
    },
    orderBy: [{ classification: "desc" }],
    take: 3,
  });

  // Compute factory status
  const factoriesWithStatus = await Promise.all(
    factories.map(async (f) => {
      let status: "green" | "yellow" | "red" = "green";

      if (f.marketType === "B2B") {
        // Cardboard: based on delivery compliance
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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

        // Check critical risks
        const hasCriticalRisk = risks.some(
          (r) => r.classification === "حرج"
        );
        if (hasCriticalRisk && status === "green") status = "yellow";

        return {
          id: f.id,
          name: f.name,
          marketType: f.marketType,
          status,
          deliveryCompliance: compliance,
        };
      } else {
        // B2C: based on sales achievement
        // Check for active critical or high risks
        const hasCriticalRisk = risks.some((r) => r.classification === "حرج");
        const hasHighRisk = risks.some((r) => r.classification === "مرتفع");

        // For now, get sales data from daily entries
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const salesEntries = await prisma.dailyEntry.findMany({
          where: {
            factoryId: f.id,
            department: "sales",
            date: { gte: startOfMonth },
          },
        });

        // Sum daily sales quantities
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

        if (hasCriticalRisk || (achievement !== null && achievement < 75)) {
          status = "red";
        } else if (hasHighRisk || (achievement !== null && achievement < 90)) {
          status = "yellow";
        }

        return {
          id: f.id,
          name: f.name,
          marketType: f.marketType,
          status,
          salesAchievement: achievement ?? undefined,
        };
      }
    })
  );

  return {
    factories: factoriesWithStatus,
    decisions: decisions.map((d) => ({
      id: d.id,
      priority: d.priority,
      title: d.title,
      description: d.description,
      status: d.status,
    })),
    risks: risks.map((r) => ({
      id: r.id,
      classification: r.classification,
      description: r.description,
      category: r.category,
    })),
  };
}
