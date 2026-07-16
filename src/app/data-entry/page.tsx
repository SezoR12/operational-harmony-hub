"use client";

import { useState, useEffect } from "react";

interface Factory { id: string; name: string; }

const DEPARTMENTS = [
  { id: "production", label: "الإنتاج" },
  { id: "inventory", label: "المخزون" },
  { id: "sales", label: "المبيعات" },
  { id: "purchasing", label: "المشتريات" },
  { id: "maintenance", label: "الصيانة" },
  { id: "logistics", label: "اللوجستيك" },
  { id: "marketing", label: "التسويق" },
];

const DEPT_FIELDS: Record<string, Array<{ key: string; label: string; type: string }>> = {
  production: [
    { key: "produced", label: "الكمية المنتجة", type: "number" },
    { key: "defective", label: "التالف", type: "number" },
    { key: "efficiency", label: "نسبة الكفاءة (%)", type: "number" },
  ],
  inventory: [
    { key: "finishedGoods", label: "مخزون المنتج النهائي", type: "number" },
    { key: "rawMaterialReceived", label: "المواد الخام الواردة", type: "number" },
  ],
  sales: [
    { key: "planned", label: "المبيعات المخططة", type: "number" },
    { key: "actual", label: "المبيعات الفعلية", type: "number" },
  ],
  purchasing: [
    { key: "ordersPlaced", label: "طلبات شراء جديدة", type: "number" },
    { key: "ordersReceived", label: "وارد مشتريات", type: "number" },
  ],
  maintenance: [
    { key: "breakdowns", label: "أعطال اليوم", type: "number" },
    { key: "scheduled", label: "صيانة مجدولة", type: "number" },
  ],
  logistics: [
    { key: "shipmentsOut", label: "شحنات صادرة", type: "number" },
    { key: "shipmentsIn", label: "شحنات واردة", type: "number" },
  ],
  marketing: [
    { key: "promotions", label: "حملات ترويجية", type: "number" },
    { key: "newListings", label: "منافذ جديدة", type: "number" },
  ],
};

export default function DataEntryPage() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [selectedFactory, setSelectedFactory] = useState("");
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
    fetch("/api/factories").then(r => r.json()).then(data => {
      setFactories(data);
      if (data.length > 0) setSelectedFactory(data[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedFactory && date) loadEntry();
  }, [selectedFactory, date, activeTab]);

  async function loadEntry() {
    try {
      const res = await fetch(`/api/daily-entry?factoryId=${selectedFactory}&date=${date}&department=${activeTab}`);
      const data = await res.json();
      if (data.entry) { setFormData(data.entry.dataJson || {}); setNotes(data.entry.notes || ""); }
      else { setFormData({}); setNotes(""); }
    } catch { setFormData({}); }
  }

  async function handleSave() {
    if (!selectedFactory) return;
    setSaving(true); setMessage("");
    try {
      const res = await fetch("/api/daily-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factoryId: selectedFactory, date, department: activeTab, dataJson: formData, notes, analyzeNow: false }),
      });
      setMessage(res.ok ? "✓ تم الحفظ" : "✗ خطأ في الحفظ");
    } catch { setMessage("✗ خطأ في الاتصال"); }
    finally { setSaving(false); setTimeout(() => setMessage(""), 3000); }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[var(--background)]"><p className="text-[var(--muted-foreground)]">جاري التحميل...</p></div>;

  return (
    <div className="min-h-screen bg-[var(--background)]" dir="rtl">
      <header className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold">AI-EOS — إدخال بيانات</span>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="label">المصنع</label>
              <select className="input min-w-[200px]" value={selectedFactory} onChange={e => setSelectedFactory(e.target.value)}>
                {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">التاريخ</label>
              <input type="date" className="input" value={date} max={new Date().toISOString().split("T")[0]} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          <div className="tabs flex-wrap">
            {DEPARTMENTS.map(dept => (
              <button key={dept.id} className={`tab ${activeTab === dept.id ? "active" : ""} ${dept.id === "marketing" && !isSunday && !showMarketing ? "opacity-40" : ""}`}
                onClick={() => {
                  if (dept.id === "marketing" && !isSunday && !showMarketing) { setShowMarketing(true); return; }
                  setActiveTab(dept.id);
                }}>
                {dept.label}
                {dept.id === "marketing" && !isSunday && !showMarketing && " (أحد فقط)"}
              </button>
            ))}
          </div>

          {activeTab === "marketing" && !isSunday && !showMarketing && (
            <div className="card text-center">
              <p className="text-sm text-[var(--muted-foreground)] mb-3">تبويب التسويق يظهر تلقائياً يوم الأحد.</p>
              <button onClick={() => { setShowMarketing(true); setActiveTab("marketing"); }} className="btn btn-secondary">إظهار على أي حال</button>
            </div>
          )}

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">{DEPARTMENTS.find(d => d.id === activeTab)?.label}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(DEPT_FIELDS[activeTab] || []).map(field => (
                <div key={field.key}>
                  <label className="label">{field.label}</label>
                  <input type={field.type} className="input" value={formData[field.key] || ""} onChange={e => setFormData(prev => ({...prev, [field.key]: e.target.value}))} placeholder="0" />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className="label">ملاحظات</label>
              <textarea className="input min-h-[80px]" value={notes} onChange={e => setNotes(e.target.value)} placeholder="أي ملاحظات إضافية..." />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving ? "جاري الحفظ..." : "حفظ"}</button>
              {message && <span className="text-sm text-[var(--muted-foreground)] self-center">{message}</span>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
