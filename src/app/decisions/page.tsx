"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout";

interface Decision {
  id: string;
  priority: string;
  title: string;
  description: string;
  status: string;
  factoryId: string | null;
  createdAt: string;
  resolutionNote: string | null;
}

const PRIORITY_ORDER: Record<string, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: "badge-red",
  P1: "badge-yellow",
  P2: "badge-green",
  P3: "badge-gray",
};

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("open");
  const [resolveNote, setResolveNote] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDecisions();
  }, [filterStatus]);

  async function fetchDecisions() {
    setLoading(true);
    try {
      const res = await fetch(`/api/decisions?status=${filterStatus}`);
      const data = await res.json();
      setDecisions(data);
    } catch {
      console.error("Failed to load decisions");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "resolve" | "dismiss") {
    try {
      const res = await fetch("/api/decisions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
          resolutionNote: resolveNote[id] || null,
        }),
      });

      if (res.ok) {
        fetchDecisions();
      }
    } catch {
      console.error("Failed to update decision");
    }
  }

  const sorted = [...decisions].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              قائمة القرارات
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              إدارة ومتابعة القرارات التشغيلية
            </p>
          </div>
          <div className="flex gap-2">
            {["open", "resolved", "dismissed"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`btn btn-sm ${
                  filterStatus === s ? "btn-primary" : "btn-secondary"
                }`}
              >
                {s === "open"
                  ? "مفتوحة"
                  : s === "resolved"
                  ? "محلولة"
                  : "متجاهلة"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            جاري التحميل...
          </div>
        ) : sorted.length === 0 ? (
          <div className="card text-center py-12 text-[var(--muted-foreground)]">
            لا توجد قرارات {filterStatus === "open" ? "مفتوحة" : ""}
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الأولوية</th>
                    <th>العنوان</th>
                    <th>الوصف</th>
                    <th>التاريخ</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <span
                          className={`badge ${
                            PRIORITY_COLORS[d.priority] || "badge-gray"
                          }`}
                        >
                          {d.priority}
                        </span>
                      </td>
                      <td className="font-medium">{d.title}</td>
                      <td className="text-sm text-[var(--muted-foreground)] max-w-xs truncate">
                        {d.description}
                      </td>
                      <td className="text-sm text-[var(--muted-foreground)]">
                        {new Date(d.createdAt).toLocaleDateString("ar-IQ")}
                      </td>
                      <td>
                        {d.status === "open" && (
                          <div className="flex gap-1">
                            <button
                              onClick={() =>
                                document
                                  .getElementById(`resolve-${d.id}`)
                                  ?.classList.remove("hidden")
                              }
                              className="btn btn-sm btn-primary"
                            >
                              حل
                            </button>
                            <button
                              onClick={() => handleAction(d.id, "dismiss")}
                              className="btn btn-sm btn-secondary"
                            >
                              تجاهل
                            </button>
                            <div
                              id={`resolve-${d.id}`}
                              className="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                              onClick={(e) => {
                                if (e.target === e.currentTarget)
                                  e.currentTarget.classList.add("hidden");
                              }}
                            >
                              <div className="card max-w-sm w-full space-y-3">
                                <h4 className="font-semibold">حل القرار</h4>
                                <p className="text-sm text-[var(--muted-foreground)]">
                                  {d.title}
                                </p>
                                <textarea
                                  className="input min-h-[80px]"
                                  placeholder="ملاحظة عن سبب القرار..."
                                  value={resolveNote[d.id] || ""}
                                  onChange={(e) =>
                                    setResolveNote((prev) => ({
                                      ...prev,
                                      [d.id]: e.target.value,
                                    }))
                                  }
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      handleAction(d.id, "resolve");
                                      document
                                        .getElementById(`resolve-${d.id}`)
                                        ?.classList.add("hidden");
                                    }}
                                    className="btn btn-primary flex-1"
                                  >
                                    تأكيد الحل
                                  </button>
                                  <button
                                    onClick={() =>
                                      document
                                        .getElementById(`resolve-${d.id}`)
                                        ?.classList.add("hidden")
                                    }
                                    className="btn btn-secondary"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {d.status === "resolved" && d.resolutionNote && (
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {d.resolutionNote}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
