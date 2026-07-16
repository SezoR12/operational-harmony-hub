"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout";

interface Risk {
  id: string;
  category: string;
  description: string;
  probability: string;
  impact: string;
  classification: string;
  mitigationPlan: string | null;
  status: string;
}

const PROBABILITIES = ["نادراً", "ممكن", "محتمل", "شبه مؤكد"];
const IMPACTS = ["طفيف", "متوسط", "كبير", "كارثي"];
const CATEGORIES = ["تشغيلي", "مالي", "سلسلة توريد", "استراتيجي"];

const CLASS_COLORS: Record<string, string> = {
  منخفض: "badge-green",
  متوسط: "badge-yellow",
  مرتفع: "badge-yellow",
  حرج: "badge-red",
};

const CELL_COLORS: Record<string, Record<string, string>> = {
  "نادراً": {
    "طفيف": "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200",
    "متوسط": "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200",
    "كبير": "bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200",
    "كارثي": "bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200",
  },
  "ممكن": {
    "طفيف": "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200",
    "متوسط": "bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200",
    "كبير": "bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200",
    "كارثي": "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200",
  },
  "محتمل": {
    "طفيف": "bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200",
    "متوسط": "bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200",
    "كبير": "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200",
    "كارثي": "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200",
  },
  "شبه مؤكد": {
    "طفيف": "bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200",
    "متوسط": "bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200",
    "كبير": "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200",
    "كارثي": "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200",
  },
};

export default function RisksPage() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: "تشغيلي",
    description: "",
    probability: "ممكن",
    impact: "متوسط",
    mitigationPlan: "",
  });

  useEffect(() => {
    fetchRisks();
  }, []);

  async function fetchRisks() {
    try {
      const res = await fetch("/api/risks");
      const data = await res.json();
      setRisks(data);
    } catch {
      console.error("Failed to load risks");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description) return;

    try {
      const res = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowForm(false);
        setForm({
          category: "تشغيلي",
          description: "",
          probability: "ممكن",
          impact: "متوسط",
          mitigationPlan: "",
        });
        fetchRisks();
      }
    } catch {
      console.error("Failed to create risk");
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              سجل المخاطر
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              إدارة وتصنيف المخاطر التشغيلية
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? "إلغاء" : "إضافة خطر"}
          </button>
        </div>

        {/* Risk Matrix */}
        <div className="card">
          <h3 className="font-semibold text-[var(--foreground)] mb-3">
            مصفوفة المخاطر
          </h3>
          <div className="table-wrap">
            <table className="text-center">
              <thead>
                <tr>
                  <th>الاحتمال ↓ \ التأثير →</th>
                  {IMPACTS.map((imp) => (
                    <th key={imp}>{imp}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROBABILITIES.map((prob) => (
                  <tr key={prob}>
                    <td className="font-medium">{prob}</td>
                    {IMPACTS.map((imp) => {
                      const cl = CELL_COLORS[prob]?.[imp] || "";
                      return (
                        <td key={imp} className={`text-sm font-medium ${cl}`}>
                          {prob === "نادراً" && imp === "طفيف"
                            ? "منخفض"
                            : prob === "نادراً" && imp === "متوسط"
                            ? "منخفض"
                            : prob === "نادراً" && imp === "كبير"
                            ? "متوسط"
                            : prob === "نادراً" && imp === "كارثي"
                            ? "مرتفع"
                            : prob === "ممكن" && imp === "طفيف"
                            ? "منخفض"
                            : prob === "ممكن" && imp === "متوسط"
                            ? "متوسط"
                            : prob === "ممكن" && imp === "كبير"
                            ? "مرتفع"
                            : prob === "ممكن" && imp === "كارثي"
                            ? "حرج"
                            : prob === "محتمل" && imp === "طفيف"
                            ? "متوسط"
                            : prob === "محتمل" && imp === "متوسط"
                            ? "مرتفع"
                            : prob === "محتمل" && imp === "كبير"
                            ? "حرج"
                            : prob === "محتمل" && imp === "كارثي"
                            ? "حرج"
                            : prob === "شبه مؤكد" && imp === "طفيف"
                            ? "متوسط"
                            : prob === "شبه مؤكد" && imp === "متوسط"
                            ? "مرتفع"
                            : prob === "شبه مؤكد" && imp === "كبير"
                            ? "حرج"
                            : prob === "شبه مؤكد" && imp === "كارثي"
                            ? "حرج"
                            : ""}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Risk Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="card space-y-4">
            <h3 className="font-semibold text-[var(--foreground)]">
              إضافة خطر جديد
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">التصنيف</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">الاحتمال</label>
                <select
                  className="input"
                  value={form.probability}
                  onChange={(e) =>
                    setForm({ ...form, probability: e.target.value })
                  }
                >
                  {PROBABILITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">التأثير</label>
                <select
                  className="input"
                  value={form.impact}
                  onChange={(e) =>
                    setForm({ ...form, impact: e.target.value })
                  }
                >
                  {IMPACTS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">وصف الخطر</label>
              <textarea
                className="input min-h-[80px]"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="وصف المخطر..."
                required
              />
            </div>

            <div>
              <label className="label">خطة التخفيف</label>
              <textarea
                className="input min-h-[80px]"
                value={form.mitigationPlan}
                onChange={(e) =>
                  setForm({ ...form, mitigationPlan: e.target.value })
                }
                placeholder="الإجراءات المقترحة للتخفيف..."
              />
            </div>

            <button type="submit" className="btn btn-primary">
              إضافة الخطر
            </button>
          </form>
        )}

        {/* Risks List */}
        {loading ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            جاري التحميل...
          </div>
        ) : risks.length === 0 ? (
          <div className="card text-center py-12 text-[var(--muted-foreground)]">
            لا توجد مخاطر مسجلة
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الوصف</th>
                    <th>التصنيف</th>
                    <th>الاحتمال</th>
                    <th>التأثير</th>
                    <th>التقييم</th>
                    <th>خطة التخفيف</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {risks.map((r) => (
                    <tr key={r.id}>
                      <td className="font-medium">{r.description}</td>
                      <td className="text-sm">{r.category}</td>
                      <td className="text-sm">{r.probability}</td>
                      <td className="text-sm">{r.impact}</td>
                      <td>
                        <span
                          className={`badge ${
                            CLASS_COLORS[r.classification] || "badge-gray"
                          }`}
                        >
                          {r.classification}
                        </span>
                      </td>
                      <td className="text-sm text-[var(--muted-foreground)] max-w-xs">
                        {r.mitigationPlan || "-"}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            r.status === "active" ? "badge-yellow" : "badge-green"
                          }`}
                        >
                          {r.status === "active" ? "نشط" : "تم الحل"}
                        </span>
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
