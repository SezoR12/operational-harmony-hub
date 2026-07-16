import AppLayout from "@/components/layout";
import { getDashboardData } from "@/lib/dashboard-data";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  green: "جيد",
  yellow: "محتاج متابعة",
  red: "حرج",
};

const STATUS_COLORS: Record<string, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
};

const STATUS_BG: Record<string, string> = {
  green: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900",
  yellow:
    "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900",
  red: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900",
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: "badge-red",
  P1: "badge-yellow",
  P2: "badge-green",
  P3: "badge-gray",
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            لوحة الحالة
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            نظرة عامة على المصانع والقرارات العاجلة
          </p>
        </div>

        {/* Factory Cards */}
        <section>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
            المصانع
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data.factories.map((f) => (
              <div
                key={f.id}
                className={`card border-2 ${STATUS_BG[f.status]}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-[var(--foreground)]">
                    {f.name}
                  </h3>
                  <span
                    className={`h-3 w-3 rounded-full ${STATUS_COLORS[f.status]} shrink-0`}
                    title={STATUS_LABELS[f.status]}
                  />
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mb-3">
                  {f.marketType === "B2C" ? "استهلاكي" : "بين الشركات"}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`badge ${
                      f.status === "green"
                        ? "badge-green"
                        : f.status === "yellow"
                        ? "badge-yellow"
                        : "badge-red"
                    }`}
                  >
                    {STATUS_LABELS[f.status]}
                  </span>
                  {f.salesAchievement !== undefined && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      تحقيق المبيعات: {f.salesAchievement}%
                    </span>
                  )}
                  {f.deliveryCompliance !== undefined && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      التزام المواعيد: {f.deliveryCompliance}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Decisions & Risks */}
        <section className="grid gap-4 lg:grid-cols-2">
          {/* Decisions */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                أهم القرارات
              </h2>
              <Link
                href="/decisions"
                className="text-xs text-[var(--primary)] hover:underline"
              >
                عرض الكل
              </Link>
            </div>
            {data.decisions.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                لا توجد قرارات مفتوحة حالياً.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.decisions.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-[var(--accent)]"
                  >
                    <span className={`badge ${PRIORITY_COLORS[d.priority] || "badge-gray"}`}>
                      {d.priority}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {d.title}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] line-clamp-1">
                        {d.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Risks */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                المخاطر النشطة
              </h2>
              <Link
                href="/risks"
                className="text-xs text-[var(--primary)] hover:underline"
              >
                عرض الكل
              </Link>
            </div>
            {data.risks.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                لا توجد مخاطر مرتفعة أو حرجة.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.risks.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-[var(--accent)]"
                  >
                    <span
                      className={`badge ${
                        r.classification === "حرج" ? "badge-red" : "badge-yellow"
                      }`}
                    >
                      {r.classification}
                    </span>
                    <div>
                      <p className="text-sm text-[var(--foreground)]">
                        {r.description}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {r.category}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
