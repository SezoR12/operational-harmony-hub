"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout";

interface Factory {
  id: string;
  name: string;
}

const DEPARTMENTS = [
  { id: "production", label: "الإنتاج" },
  { id: "inventory", label: "المخزون" },
  { id: "sales", label: "المبيعات" },
  { id: "purchasing", label: "المشتريات" },
  { id: "maintenance", label: "الصيانة" },
  { id: "logistics", label: "اللوجستيك" },
  { id: "marketing", label: "التسويق" },
];

// Form schemas per department
const DEPARTMENT_FIELDS: Record<string, Array<{ key: string; label: string; type: string }>> = {
  production: [
    { key: "produced", label: "الكمية المنتجة", type: "number" },
    { key: "defective", label: "التالف", type: "number" },
    { key: "efficiency", label: "نسبة الكفاءة (%)", type: "number" },
    { key: "downtimeMinutes", label: "وقت التوقف (دقيقة)", type: "number" },
  ],
  inventory: [
    { key: "finishedGoods", label: "مخزون المنتج النهائي", type: "number" },
    { key: "rawMaterialReceived", label: "المواد الخام الواردة", type: "number" },
    { key: "damagedStock", label: "المخزون التالف", type: "number" },
  ],
  sales: [
    { key: "planned", label: "المبيعات المخططة", type: "number" },
    { key: "actual", label: "المبيعات الفعلية", type: "number" },
    { key: "returns", label: "المرتجعات", type: "number" },
    { key: "newCustomers", label: "عملاء جدد", type: "number" },
  ],
  purchasing: [
    { key: "ordersPlaced", label: "طلبات شراء جديدة", type: "number" },
    { key: "ordersReceived", label: "وارد مشتريات", type: "number" },
    { key: "pendingOrders", label: "طلبات قيد الانتظار", type: "number" },
  ],
  maintenance: [
    { key: "breakdowns", label: "أعطال اليوم", type: "number" },
    { key: "scheduled", label: "صيانة مجدولة", type: "number" },
    { key: "pendingIssues", label: "مشاكل معلقة", type: "number" },
  ],
  logistics: [
    { key: "shipmentsOut", label: "شحنات صادرة", type: "number" },
    { key: "shipmentsIn", label: "شحنات واردة", type: "number" },
    { key: "delays", label: "تأخير (ساعة)", type: "number" },
    { key: "fuelStatus", label: "حالة الوقود (%)", type: "number" },
  ],
  marketing: [
    { key: "promotions", label: "حملات ترويجية", type: "number" },
    { key: "newListings", label: "منافذ جديدة", type: "number" },
    { key: "socialMediaPosts", label: "منشورات تواصل اجتماعي", type: "number" },
  ],
};

export default function DailyInputPage() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [selectedFactory, setSelectedFactory] = useState<string>("");
  const [activeTab, setActiveTab] = useState("production");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showMarketing, setShowMarketing] = useState(false);

  const today = new Date();
  const isSunday = today.getDay() === 0;

  useEffect(() => {
    fetchFactories();
  }, []);

  async function fetchFactories() {
    try {
      const res = await fetch("/api/factories");
      const data = await res.json();
      setFactories(data);
      if (data.length > 0) setSelectedFactory(data[0].id);
    } catch (err) {
      console.error("Failed to load factories", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadExistingEntry() {
    if (!selectedFactory || !date) return;
    try {
      const res = await fetch(
        `/api/daily-entry?factoryId=${selectedFactory}&date=${date}&department=${activeTab}`
      );
      const data = await res.json();
      if (data.entry) {
        setFormData(data.entry.dataJson || {});
        setNotes(data.entry.notes || "");
      } else {
        setFormData({});
        setNotes("");
      }
    } catch {
      setFormData({});
    }
  }

  useEffect(() => {
    if (selectedFactory && date) {
      loadExistingEntry();
    }
  }, [selectedFactory, date, activeTab]);

  function handleFieldChange(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(analyzeNow = false) {
    if (!selectedFactory) return;
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/daily-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factoryId: selectedFactory,
          date,
          department: activeTab,
          dataJson: formData,
          notes,
          analyzeNow,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        setMessage(analyzeNow ? "✓ تم الحفظ والتحليل" : "✓ تم الحفظ");
      } else {
        setMessage("✗ " + (result.error || "خطأ في الحفظ"));
      }
    } catch {
      setMessage("✗ خطأ في الاتصال");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function copyYesterdayData() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yDate = yesterday.toISOString().split("T")[0];

    try {
      const res = await fetch(
        `/api/daily-entry?factoryId=${selectedFactory}&date=${yDate}&department=${activeTab}`
      );
      const data = await res.json();
      if (data.entry) {
        setFormData(data.entry.dataJson || {});
        setNotes(data.entry.notes || "");
        setMessage("✓ تم نسخ بيانات الأمس");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("! لا توجد بيانات للأمس");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch {
      setMessage("✗ خطأ في تحميل بيانات الأمس");
    }
  }

  const todayStr = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-[var(--muted-foreground)]">جاري التحميل...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">الإدخال اليومي</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            إدخال بيانات التشغيل اليومية لكل مصنع وقسم
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">المصنع</label>
            <select
              className="input min-w-[200px]"
              value={selectedFactory}
              onChange={(e) => setSelectedFactory(e.target.value)}
            >
              {factories.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">التاريخ</label>
            <input
              type="date"
              className="input"
              value={date}
              max={todayStr}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <button
            onClick={copyYesterdayData}
            className="btn btn-sm btn-secondary"
          >
            نسخ بيانات الأمس
          </button>
        </div>

        {/* Department Tabs */}
        <div className="tabs flex-wrap">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept.id}
              className={`tab ${activeTab === dept.id ? "active" : ""} ${dept.id === "marketing" && !isSunday && !showMarketing ? "opacity-40" : ""}`}
              onClick={() => {
                if (dept.id === "marketing" && !isSunday && !showMarketing) { setShowMarketing(true); return; }
                setActiveTab(dept.id);
              }}
            >
              {dept.label}
              {dept.id === "marketing" && !isSunday && !showMarketing && " (أحد فقط)"}
            </button>
          ))}
        </div>

        {/* Marketing notice */}
        {activeTab === "marketing" && !isSunday && !showMarketing && (
          <div className="card text-center">
            <p className="text-sm text-[var(--muted-foreground)] mb-3">تبويب التسويق يظهر تلقائياً يوم الأحد.</p>
            <button onClick={() => { setShowMarketing(true); setActiveTab("marketing"); }} className="btn btn-secondary">إظهار على أي حال</button>
          </div>
        )}

        {/* Form */}
        <div className="card">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            {DEPARTMENTS.find((d) => d.id === activeTab)?.label}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(DEPARTMENT_FIELDS[activeTab] || []).map((field) => (
              <div key={field.key}>
                <label className="label">{field.label}</label>
                <input
                  type={field.type}
                  className="input"
                  value={formData[field.key] || ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="label">ملاحظات</label>
            <textarea
              className="input min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات إضافية..."
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="btn btn-secondary"
            >
              {saving ? "جاري..." : "حفظ وتحليل الآن"}
            </button>
            {message && (
              <span className="text-sm text-[var(--muted-foreground)] self-center">
                {message}
              </span>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
