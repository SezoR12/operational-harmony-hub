import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  green: "🟢",
  yellow: "🟡",
  red: "🔴",
};

const STATUS_LABELS: Record<string, string> = {
  green: "جيد",
  yellow: "محتاج متابعة",
  red: "حرج",
};

export default async function GmReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const config = await prisma.appConfig.findFirst();
  const { token } = await params;

  if (!config || config.gmReportToken !== token) {
    notFound();
  }

  // Get latest snapshot or generate on the fly
  const latestSnapshot = await prisma.gmReportSnapshot.findFirst({
    orderBy: { generatedAt: "desc" },
  });

  let reportData: any = null;

  if (latestSnapshot) {
    reportData = JSON.parse(latestSnapshot.dataJson);
  } else {
    // Generate basic report from live data
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
            metric: achievement !== null ? `${achievement}% مبيعات` : "لا توجد بيانات",
          };
        }
      })
    );

    reportData = {
      generatedAt: new Date().toISOString(),
      factories: factoryStatuses,
      risks: activeRisks.map((r) => ({
        description: r.description,
        classification: r.classification,
      })),
      note: "",
    };
  }

  const generatedDate = reportData.generatedAt
    ? new Date(reportData.generatedAt).toLocaleDateString("ar-IQ", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>تقرير المدير العام — AI-EOS</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'IBM Plex Sans Arabic', system-ui, sans-serif;
            background: #f8fafc;
            color: #0f172a;
            direction: rtl;
            padding: 1rem;
          }
          .container { max-width: 480px; margin: 0 auto; }
          h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.25rem; }
          .date { font-size: 0.75rem; color: #64748b; margin-bottom: 1rem; }
          .card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 0.75rem;
          }
          .factory-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
          }
          .factory-row:not(:last-child) { border-bottom: 1px solid #f1f5f9; }
          .factory-name { font-weight: 500; font-size: 0.875rem; }
          .factory-status { font-size: 0.875rem; }
          .risk-item {
            font-size: 0.8125rem;
            padding: 0.375rem 0;
            border-bottom: 1px solid #f1f5f9;
          }
          .risk-item:last-child { border-bottom: none; }
          .badge {
            display: inline-block;
            border-radius: 9999px;
            padding: 0.125rem 0.5rem;
            font-size: 0.6875rem;
            font-weight: 600;
          }
          .badge-red { background: #fee2e2; color: #991b1b; }
          .badge-yellow { background: #fef9c3; color: #854d0e; }
          .note { font-size: 0.8125rem; color: #475569; line-height: 1.5; }
          .footer { font-size: 0.6875rem; color: #94a3b8; text-align: center; margin-top: 1.5rem; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="text-center mb-4">
            <h1>📊 تقرير المدير العام</h1>
            <p className="date">آخر تحديث: {generatedDate}</p>
          </div>

          <div className="card">
            <h2 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              حالة المصانع
            </h2>
            {reportData.factories.map((f: any, i: number) => (
              <div key={i} className="factory-row">
                <span className="factory-name">{f.name}</span>
                <span className="factory-status">
                  {STATUS_COLORS[f.status] || "⚪"}{" "}
                  {STATUS_LABELS[f.status] || f.status}{" "}
                  <span style={{ color: "#64748b" }}>({f.metric})</span>
                </span>
              </div>
            ))}
          </div>

          {reportData.risks && reportData.risks.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                ⚠ المخاطر النشطة
              </h2>
              {reportData.risks.map((r: any, i: number) => (
                <div key={i} className="risk-item">
                  <span
                    className={`badge ${
                      r.classification === "حرج" ? "badge-red" : "badge-yellow"
                    }`}
                  >
                    {r.classification}
                  </span>{" "}
                  {r.description}
                </div>
              ))}
            </div>
          )}

          {reportData.note && (
            <div className="card">
              <h2 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                📝 ملاحظة المدير
              </h2>
              <p className="note">{reportData.note}</p>
            </div>
          )}

          <div className="footer">
            AI-EOS — نظام التنسيق التشغيلي بين المصانع
          </div>
        </div>
      </body>
    </html>
  );
}
