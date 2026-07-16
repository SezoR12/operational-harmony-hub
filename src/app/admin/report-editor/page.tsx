"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout";

export default function ReportEditorPage() {
  const [note, setNote] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => { fetchReportData(); }, []);

  async function fetchReportData() {
    try {
      const res = await fetch("/api/gm-report");
      const data = await res.json();
      setReportUrl(data.reportUrl);
      setNote(data.snapshot?.dataJson?.note || "");
      setLastGenerated(data.snapshot?.generatedAt ? new Date(data.snapshot.generatedAt).toLocaleString("ar-IQ") : null);
    } catch {}
  }

  async function handleGenerate() {
    setGenerating(true); setMessage("");
    try {
      const res = await fetch("/api/gm-report", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (res.ok) { setMessage("✓ تم تحديث التقرير بنجاح"); fetchReportData(); }
      else setMessage("✗ خطأ في تحديث التقرير");
    } catch { setMessage("✗ خطأ في الاتصال"); }
    finally { setGenerating(false); setTimeout(() => setMessage(""), 5000); }
  }

  async function handleRegenerateToken() {
    if (!confirm("هل أنت متأكد؟ الرابط القديم سيتعطل نهائياً.")) return;
    setRegenerating(true); setMessage("");
    try {
      const res = await fetch("/api/gm-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate-token" }),
      });
      const data = await res.json();
      if (res.ok) { setReportUrl(data.reportUrl); setMessage("✓ تم تجديد الرابط"); }
      else setMessage("✗ خطأ");
    } catch { setMessage("✗ خطأ في الاتصال"); }
    finally { setRegenerating(false); setTimeout(() => setMessage(""), 5000); }
  }

  async function copyUrl() {
    try { await navigator.clipboard.writeText(reportUrl); setMessage("✓ تم نسخ الرابط"); setTimeout(() => setMessage(""), 3000); }
    catch { setMessage("✗ فشل النسخ"); }
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">تحرير تقرير المدير العام</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">أنشئ وحدّث التقرير الذي يراه المدير العام عبر الرابط العام</p>
        </div>

        <div className="card">
          <h3 className="font-semibold text-[var(--foreground)] mb-2">رابط التقرير العام</h3>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 rounded bg-[var(--muted)] text-sm text-[var(--foreground)] overflow-x-auto">{reportUrl}</code>
            <button onClick={copyUrl} className="btn btn-sm btn-secondary">نسخ</button>
            <button onClick={handleRegenerateToken} disabled={regenerating} className="btn btn-sm btn-danger">
              {regenerating ? "..." : "تجديد"}
            </button>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">هذا الرابط لا يتطلب تسجيل دخول. تجديد الرابط يعطل القديم.</p>
        </div>

        <div className="card">
          <h3 className="font-semibold text-[var(--foreground)] mb-2">ملاحظة المدير</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">أضف ملاحظة نصية تظهر في التقرير (اختياري)</p>
          <textarea className="input min-h-[120px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="اكتب ملاحظة للمدير العام هنا..." />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleGenerate} disabled={generating} className="btn btn-primary">
            {generating ? "جاري التوليد..." : "تحديث التقرير الآن"}
          </button>
          {message && <span className="text-sm text-[var(--muted-foreground)]">{message}</span>}
        </div>

        {lastGenerated && <p className="text-xs text-[var(--muted-foreground)]">آخر تحديث: {lastGenerated}</p>}
      </div>
    </AppLayout>
  );
}
