"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout";

interface ExtendedProduct {
  id: string;
  name: string;
  code: string;
  unit: string;
  priceCustomer: number | null;
  priceWholesale: number | null;
  contributionMargin: number | null;
  factory: { name: string };
  bomItems: Array<{
    rawMaterial: { name: string; unitCost: number };
    quantity: number;
    batchSize: number;
  }>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products/all");
      const data = await res.json();
      setProducts(data);
    } catch {
      console.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  function calculateCost(product: ExtendedProduct): number {
    let totalCost = 0;
    for (const bom of product.bomItems) {
      totalCost += (bom.quantity / bom.batchSize) * bom.rawMaterial.unitCost;
    }
    return Math.round(totalCost * 100) / 100;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            المنتجات و BOM
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            إدارة المنتجات والمواد الخام وهياكل التصنيع
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            جاري التحميل...
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th>الكود</th>
                    <th>المصنع</th>
                    <th>الوحدة</th>
                    <th>سعر البيع</th>
                    <th>تكلفة التصنيع</th>
                    <th>الهامش (%)</th>
                    <th>الملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const cost = calculateCost(p);
                    const margin = p.contributionMargin;
                    const expectedPrice =
                      margin ? cost / (1 - margin / 100) : null;
                    const hasDiscrepancy =
                      expectedPrice &&
                      p.priceCustomer &&
                      Math.abs(expectedPrice - p.priceCustomer) /
                        p.priceCustomer >
                        0.2;

                    return (
                      <tr key={p.id}>
                        <td className="font-medium">{p.name}</td>
                        <td className="text-sm text-[var(--muted-foreground)]">
                          {p.code}
                        </td>
                        <td className="text-sm">{p.factory.name}</td>
                        <td className="text-sm">{p.unit}</td>
                        <td className="text-sm">
                          {p.priceCustomer
                            ? `${p.priceCustomer.toFixed(2)} د.ع`
                            : "-"}
                        </td>
                        <td className="text-sm">{cost.toFixed(2)}</td>
                        <td>
                          <span
                            className={`badge ${
                              margin && margin >= 25
                                ? "badge-green"
                                : margin && margin >= 15
                                ? "badge-yellow"
                                : "badge-red"
                            }`}
                          >
                            {margin ? `${margin}%` : "-"}
                          </span>
                        </td>
                        <td className="text-xs">
                          {hasDiscrepancy && (
                            <span className="text-amber-600 dark:text-amber-400">
                              ⚠ تناقض محتمل: السعر المتوقع {expectedPrice?.toFixed(2)} للهامش {margin}%
                            </span>
                          )}
                          {!hasDiscrepancy && margin && (
                            <span className="text-[var(--muted-foreground)]">
                              متوافق مع الهامش
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Raw Materials Summary */}
        <RawMaterialsSummary />
      </div>
    </AppLayout>
  );
}

function RawMaterialsSummary() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/raw-materials")
      .then((r) => r.json())
      .then((data) => setMaterials(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
        المواد الخام
      </h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>المادة</th>
              <th>الوحدة</th>
              <th>المخزون الحالي</th>
              <th>تكلفة الوحدة</th>
              <th>مخزون الأمان (أيام)</th>
              <th>المورد</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m: any) => (
              <tr key={m.id}>
                <td className="font-medium">{m.name}</td>
                <td className="text-sm">{m.unit}</td>
                <td>
                  <span
                    className={`font-medium ${
                      m.currentStock < m.safetyStockDays * 10
                        ? "text-red-600 dark:text-red-400"
                        : ""
                    }`}
                  >
                    {m.currentStock}
                  </span>
                </td>
                <td className="text-sm">{m.unitCost.toFixed(2)}</td>
                <td className="text-sm">{m.safetyStockDays}</td>
                <td className="text-sm text-[var(--muted-foreground)]">
                  {m.supplier || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
