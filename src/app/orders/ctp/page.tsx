"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout";

interface Product {
  id: string;
  name: string;
  code: string;
  unit: string;
  moq: number;
  setupTimeMinutes: number;
}

interface Line {
  id: string;
  name: string;
  capacityPerHour: number;
  hoursPerDay: number;
  currentProductId: string | null;
}

interface RawMat {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  safetyStockDays: number;
  leadTimeDays: number;
}

interface BomItemData {
  rawMaterialId: string;
  rawMaterial: RawMat;
  quantity: number;
  batchSize: number;
}

interface CtpResult {
  status: "green" | "yellow" | "red";
  details: {
    dailyCapacity: Array<{
      lineName: string;
      capacityPerDay: number;
      availablePerDay: number;
      daysNeeded: number;
      setupLoss: number;
      notes: string;
    }>;
    materials: Array<{
      name: string;
      required: number;
      available: number;
      sufficient: boolean;
      safetyStockAfter: number;
      notes: string;
    }>;
    suggestedDate: string | null;
    summary: string;
  };
}

export default function CtpCalculatorPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<CtpResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products?factory=cardboard");
      const data = await res.json();
      setProducts(data.products || []);
      setLines(data.lines || []);
    } catch (err) {
      console.error("Failed to load products", err);
    }
  }

  async function handleCalculate() {
    if (!selectedProduct || !quantity || !requestedDate) {
      setMessage("! الرجاء إكمال جميع الحقول");
      return;
    }

    setCalculating(true);
    setResult(null);
    setMessage("");

    try {
      const res = await fetch("/api/ctp/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct,
          quantity: parseFloat(quantity),
          requestedDate,
          lines,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setMessage("✗ " + (data.error || "خطأ في الحساب"));
      }
    } catch {
      setMessage("✗ خطأ في الاتصال");
    } finally {
      setCalculating(false);
    }
  }

  async function handleConfirmOrder() {
    if (!result || !selectedProduct || !customerName || !quantity || !requestedDate) return;

    setConfirming(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct,
          customerName,
          quantity: parseFloat(quantity),
          requestedDate,
          ctpStatus: result.status,
          ctpDetailsJson: result.details,
          promisedDate: result.details.suggestedDate || requestedDate,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✓ تم تأكيد الطلب بنجاح");
        // Reset form
        setCustomerName("");
        setQuantity("");
        setRequestedDate("");
        setSelectedProduct("");
        setResult(null);
      } else {
        setMessage("✗ " + (data.error || "خطأ"));
      }
    } catch {
      setMessage("✗ خطأ في تأكيد الطلب");
    } finally {
      setConfirming(false);
    }
  }

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            حاسبة CTP — استقبال طلبات الكرتون
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            حساب القدرة على التعهد (CTP) بناءً على الطاقة والمواد الخام
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Form */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-[var(--foreground)]">بيانات الطلب</h3>

            <div>
              <label className="label">اسم العميل</label>
              <input
                type="text"
                className="input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="اسم العميل"
              />
            </div>

            <div>
              <label className="label">المنتج</label>
              <select
                className="input"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">اختر المنتج...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">الكمية ({products.find(p => p.id === selectedProduct)?.unit || "وحدة"})</label>
              <input
                type="number"
                className="input"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="الكمية المطلوبة"
                min="1"
              />
              {selectedProduct && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  الحد الأدنى: {products.find((p) => p.id === selectedProduct)?.moq || 0}
                </p>
              )}
            </div>

            <div>
              <label className="label">الموعد المطلوب</label>
              <input
                type="date"
                className="input"
                value={requestedDate}
                min={minDate}
                onChange={(e) => setRequestedDate(e.target.value)}
              />
            </div>

            <button
              onClick={handleCalculate}
              disabled={calculating || !selectedProduct || !quantity || !requestedDate}
              className="btn btn-primary w-full"
            >
              {calculating ? "جاري الحساب..." : "احسب CTP"}
            </button>

            {message && (
              <p className="text-sm text-[var(--muted-foreground)] text-center">{message}</p>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="card space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-[var(--foreground)]">نتيجة CTP</h3>
                <span
                  className={`badge ${
                    result.status === "green"
                      ? "badge-green"
                      : result.status === "yellow"
                      ? "badge-yellow"
                      : "badge-red"
                  } text-sm px-3 py-1`}
                >
                  {result.status === "green"
                    ? "🟢 أخضر"
                    : result.status === "yellow"
                    ? "🟡 أصفر"
                    : "🔴 أحمر"}
                </span>
              </div>

              <p className="text-sm text-[var(--foreground)]">{result.details.summary}</p>

              {result.details.suggestedDate && (
                <div className="bg-[var(--accent)] p-3 rounded-md">
                  <span className="text-sm font-medium">الموعد البديل المقترح: </span>
                  <span className="text-sm">
                    {new Date(result.details.suggestedDate).toLocaleDateString("ar-IQ")}
                  </span>
                </div>
              )}

              {/* Daily Capacity Table */}
              <div>
                <h4 className="text-sm font-semibold mb-2">الطاقة اليومية لكل خط</h4>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>الخط</th>
                        <th>الطاقة/يوم</th>
                        <th>المتاح/يوم</th>
                        <th>أيام مطلوبة</th>
                        <th>فقد التبديل</th>
                        <th>ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.details.dailyCapacity.map((dc, i) => (
                        <tr key={i}>
                          <td>{dc.lineName}</td>
                          <td>{dc.capacityPerDay}</td>
                          <td>{dc.availablePerDay}</td>
                          <td>{dc.daysNeeded.toFixed(1)}</td>
                          <td>{dc.setupLoss}</td>
                          <td className="text-xs">{dc.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Materials Table */}
              <div>
                <h4 className="text-sm font-semibold mb-2">المواد الخام</h4>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>المادة</th>
                        <th>المطلوب</th>
                        <th>المتوفر</th>
                        <th>الحالة</th>
                        <th>ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.details.materials.map((m, i) => (
                        <tr key={i}>
                          <td>{m.name}</td>
                          <td>{m.required}</td>
                          <td>{m.available}</td>
                          <td>
                            <span
                              className={`badge ${
                                m.sufficient ? "badge-green" : "badge-red"
                              }`}
                            >
                              {m.sufficient ? "كافي" : "غير كاف"}
                            </span>
                          </td>
                          <td className="text-xs">{m.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirmOrder}
                disabled={confirming || !customerName}
                className={`btn w-full ${
                  result.status === "green" ? "btn-primary" : "btn-secondary"
                }`}
              >
                {confirming
                  ? "جاري التأكيد..."
                  : result.status === "green"
                  ? "تأكيد الطلب"
                  : "تأكيد الطلب مع علم بالمخاطرة"}
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
