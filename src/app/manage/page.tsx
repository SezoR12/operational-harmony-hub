"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout";

interface Tab {
  id: string;
  label: string;
}

const TABS: Tab[] = [
  { id: "factories", label: "المصانع" },
  { id: "lines", label: "خطوط الإنتاج" },
  { id: "products", label: "المنتجات" },
  { id: "materials", label: "المواد الخام" },
  { id: "bom", label: "BOM" },
  { id: "orders", label: "الطلبات" },
  { id: "forecasts", label: "التنبؤات" },
];

export default function ManagePage() {
  const [activeTab, setActiveTab] = useState("factories");

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">إدارة النظام</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">إدارة كاملة للمصانع، الخطوط، المنتجات، المواد الخام، و BOM</p>
        </div>

        <div className="tabs flex-wrap">
          {TABS.map(tab => (
            <button key={tab.id} className={`tab ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "factories" && <FactoriesTab />}
        {activeTab === "lines" && <LinesTab />}
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "materials" && <MaterialsTab />}
        {activeTab === "bom" && <BomTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "forecasts" && <ForecastsTab />}
      </div>
    </AppLayout>
  );
}

// ---------- Factories ----------
function FactoriesTab() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", marketType: "B2C", planningStage: "market-led" });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    const res = await fetch("/api/factories");
    setItems(await res.json());
    setLoading(false);
  }

  async function save() {
    if (editId) {
      await fetch("/api/factories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...form }) });
    } else {
      await fetch("/api/factories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setForm({ name: "", marketType: "B2C", planningStage: "market-led" });
    setEditId(null);
    fetchItems();
  }

  async function remove(id: string) {
    if (!confirm("حذف المصنع؟")) return;
    await fetch("/api/factories", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchItems();
  }

  if (loading) return <div className="text-center py-8 text-[var(--muted-foreground)]">جاري التحميل...</div>;

  return (
    <div className="space-y-4">
      <div className="card grid gap-4 sm:grid-cols-3">
        <input className="input" placeholder="اسم المصنع" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <select className="input" value={form.marketType} onChange={e => setForm({...form, marketType: e.target.value})}>
          <option value="B2C">B2C (استهلاكي)</option><option value="B2B">B2B (بين الشركات)</option>
        </select>
        <button onClick={save} className="btn btn-primary">{editId ? "تحديث" : "إضافة"}</button>
      </div>
      <div className="card p-0 overflow-hidden">
        <table>
          <thead><tr><th>الاسم</th><th>النوع</th><th>خطوط</th><th>منتجات</th><th></th></tr></thead>
          <tbody>{items.map((i: any) => (
            <tr key={i.id}>
              <td>{i.name}</td>
              <td>{i.marketType === "B2C" ? "استهلاكي" : "B2B"}</td>
              <td>{i._count?.lines || 0}</td>
              <td>{i._count?.products || 0}</td>
              <td>
                <button onClick={() => { setForm(i); setEditId(i.id); }} className="btn btn-sm btn-secondary ml-2">تعديل</button>
                <button onClick={() => remove(i.id)} className="btn btn-sm btn-danger">حذف</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Lines ----------
function LinesTab() {
  const [lines, setLines] = useState<any[]>([]);
  const [factories, setFactories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ factoryId: "", name: "", type: "إنتاج", capacityPerHour: "0", hoursPerDay: "16", currentProductId: "", suitableProductIds: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const [lRes, pRes] = await Promise.all([fetch("/api/lines"), fetch("/api/products?all=true")]);
    const lData = await lRes.json();
    const pData = await pRes.json();
    setLines(lData.lines || []);
    setFactories(lData.factories || []);
    setProducts(pData);
    setLoading(false);
  }

  async function save() {
    const body = { ...form, capacityPerHour: parseFloat(form.capacityPerHour), hoursPerDay: parseFloat(form.hoursPerDay), suitableProductIds: form.suitableProductIds ? JSON.parse(form.suitableProductIds) : [], currentProductId: form.currentProductId || null };
    if (editId) {
      await fetch("/api/lines", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...body }) });
    } else {
      await fetch("/api/lines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setForm({ factoryId: "", name: "", type: "إنتاج", capacityPerHour: "0", hoursPerDay: "16", currentProductId: "", suitableProductIds: "" });
    setEditId(null);
    fetchData();
  }

  async function remove(id: string) {
    if (!confirm("حذف الخط؟")) return;
    await fetch("/api/lines", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchData();
  }

  if (loading) return <div className="text-center py-8">جاري التحميل...</div>;

  return (
    <div className="space-y-4">
      <div className="card grid gap-4 sm:grid-cols-4">
        <select className="input" value={form.factoryId} onChange={e => setForm({...form, factoryId: e.target.value})}>
          <option value="">المصنع...</option>
          {factories.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <input className="input" placeholder="اسم الخط" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <input className="input" placeholder="الطاقة/ساعة" type="number" value={form.capacityPerHour} onChange={e => setForm({...form, capacityPerHour: e.target.value})} />
        <input className="input" placeholder="ساعات/يوم" type="number" value={form.hoursPerDay} onChange={e => setForm({...form, hoursPerDay: e.target.value})} />
        <button onClick={save} className="btn btn-primary">{editId ? "تحديث" : "إضافة"}</button>
      </div>
      <div className="card p-0 overflow-hidden">
        <table>
          <thead><tr><th>الاسم</th><th>المصنع</th><th>الطاقة/ساعة</th><th>ساعات/يوم</th><th>المنتج الحالي</th><th></th></tr></thead>
          <tbody>{lines.map((l: any) => (
            <tr key={l.id}>
              <td>{l.name}</td>
              <td className="text-sm">{l.factory?.name}</td>
              <td>{l.capacityPerHour}</td>
              <td>{l.hoursPerDay}</td>
              <td className="text-xs">{products.find((p: any) => p.id === l.currentProductId)?.name || "-"}</td>
              <td>
                <button onClick={() => { setForm({ factoryId: l.factoryId, name: l.name, type: l.type, capacityPerHour: String(l.capacityPerHour), hoursPerDay: String(l.hoursPerDay), currentProductId: l.currentProductId || "", suitableProductIds: "" }); setEditId(l.id); }} className="btn btn-sm btn-secondary ml-2">تعديل</button>
                <button onClick={() => remove(l.id)} className="btn btn-sm btn-danger">حذف</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Products ----------
function ProductsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [factories, setFactories] = useState<any[]>([]);
  const [form, setForm] = useState({ factoryId: "", name: "", code: "", unit: "حبة", priceCustomer: "", priceWholesale: "", priceSupermarket: "", moq: "1", setupTimeMinutes: "0", contributionMargin: "", seasonality: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { Promise.all([fetch("/api/products?all=true").then(r=>r.json()), fetch("/api/factories").then(r=>r.json())]).then(([p,f]) => { setItems(p); setFactories(f); setLoading(false); }); }, []);

  async function save() {
    const body = { ...form, priceCustomer: form.priceCustomer ? parseFloat(form.priceCustomer) : null, priceWholesale: form.priceWholesale ? parseFloat(form.priceWholesale) : null, priceSupermarket: form.priceSupermarket ? parseFloat(form.priceSupermarket) : null, moq: parseInt(form.moq), setupTimeMinutes: parseInt(form.setupTimeMinutes), contributionMargin: form.contributionMargin ? parseFloat(form.contributionMargin) : null };
    if (editId) { await fetch("/api/products", { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ id: editId, ...body }) }); }
    else { await fetch("/api/products", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) }); }
    setForm({ factoryId: "", name: "", code: "", unit: "حبة", priceCustomer: "", priceWholesale: "", priceSupermarket: "", moq: "1", setupTimeMinutes: "0", contributionMargin: "", seasonality: "" });
    setEditId(null);
    const p = await fetch("/api/products?all=true").then(r=>r.json()); setItems(p);
  }

  async function remove(id: string) { if (!confirm("حذف المنتج؟")) return; await fetch("/api/products", { method: "DELETE", headers: {"Content-Type":"application/json"}, body: JSON.stringify({id}) }); const p = await fetch("/api/products?all=true").then(r=>r.json()); setItems(p); }

  function calcCost(p: any): number { let c = 0; for (const b of p.bomItems || []) c += (b.quantity / b.batchSize) * b.rawMaterial.unitCost; return Math.round(c * 100) / 100; }

  if (loading) return <div className="text-center py-8">جاري التحميل...</div>;

  return (
    <div className="space-y-4">
      <div className="card grid gap-4 sm:grid-cols-4">
        <select className="input" value={form.factoryId} onChange={e => setForm({...form, factoryId: e.target.value})}>
          <option value="">المصنع...</option>
          {factories.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <input className="input" placeholder="اسم المنتج" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <input className="input" placeholder="الكود" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
        <input className="input" placeholder="سعر البيع" type="number" value={form.priceCustomer} onChange={e => setForm({...form, priceCustomer: e.target.value})} />
        <input className="input" placeholder="الهامش (%)" type="number" value={form.contributionMargin} onChange={e => setForm({...form, contributionMargin: e.target.value})} />
        <input className="input" placeholder="MOQ" type="number" value={form.moq} onChange={e => setForm({...form, moq: e.target.value})} />
        <button onClick={save} className="btn btn-primary">{editId ? "تحديث" : "إضافة"}</button>
      </div>
      <div className="card p-0 overflow-hidden">
        <table>
          <thead><tr><th>الاسم</th><th>الكود</th><th>المصنع</th><th>سعر البيع</th><th>التكلفة</th><th>الهامش</th><th></th></tr></thead>
          <tbody>{items.map((p: any) => {
            const cost = calcCost(p);
            const discrepancy = p.contributionMargin && p.priceCustomer && Math.abs(cost/(1-p.contributionMargin/100)-p.priceCustomer)/p.priceCustomer > 0.2;
            return (<tr key={p.id}>
              <td>{p.name}</td>
              <td className="text-xs">{p.code}</td>
              <td className="text-sm">{p.factory?.name}</td>
              <td>{p.priceCustomer?.toFixed(2)}</td>
              <td>{cost.toFixed(2)}</td>
              <td><span className={`badge ${p.contributionMargin >= 25 ? "badge-green" : p.contributionMargin >=15 ? "badge-yellow" : "badge-red"}`}>{p.contributionMargin ? `${p.contributionMargin}%` : "-"}</span></td>
              <td>
                {discrepancy && <span className="text-xs text-amber-600">⚠</span>}
                <button onClick={() => { setForm({ factoryId: p.factoryId, name: p.name, code: p.code, unit: p.unit, priceCustomer: String(p.priceCustomer||""), priceWholesale: String(p.priceWholesale||""), priceSupermarket: String(p.priceSupermarket||""), moq: String(p.moq), setupTimeMinutes: String(p.setupTimeMinutes), contributionMargin: String(p.contributionMargin||""), seasonality: p.seasonality||"" }); setEditId(p.id); }} className="btn btn-sm btn-secondary ml-2">تعديل</button>
                <button onClick={() => remove(p.id)} className="btn btn-sm btn-danger">حذف</button>
              </td>
            </tr>);
          })}</tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Raw Materials ----------
function MaterialsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", unit: "كغم", unitCost: "0", currentStock: "0", safetyStockDays: "7", leadTimeDays: "7", supplier: "", backupSupplier: "", riskNote: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/raw-materials").then(r=>r.json()).then(d=>{setItems(d);setLoading(false);}); }, []);

  async function save() {
    const body = { ...form, unitCost: parseFloat(form.unitCost), currentStock: parseFloat(form.currentStock), safetyStockDays: parseFloat(form.safetyStockDays), leadTimeDays: parseFloat(form.leadTimeDays) };
    if (editId) { await fetch("/api/raw-materials", { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({id: editId, ...body}) }); }
    else { await fetch("/api/raw-materials", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) }); }
    setForm({ name: "", unit: "كغم", unitCost: "0", currentStock: "0", safetyStockDays: "7", leadTimeDays: "7", supplier: "", backupSupplier: "", riskNote: "" });
    setEditId(null);
    fetch("/api/raw-materials").then(r=>r.json()).then(setItems);
  }

  async function remove(id: string) { if (!confirm("حذف المادة؟")) return; await fetch("/api/raw-materials", { method: "DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({id}) }); fetch("/api/raw-materials").then(r=>r.json()).then(setItems); }

  if (loading) return <div className="text-center py-8">جاري التحميل...</div>;

  return (
    <div className="space-y-4">
      <div className="card grid gap-4 sm:grid-cols-4">
        <input className="input" placeholder="اسم المادة" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <input className="input" placeholder="الوحدة" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} />
        <input className="input" placeholder="تكلفة الوحدة" type="number" value={form.unitCost} onChange={e => setForm({...form, unitCost: e.target.value})} />
        <input className="input" placeholder="المخزون الحالي" type="number" value={form.currentStock} onChange={e => setForm({...form, currentStock: e.target.value})} />
        <input className="input" placeholder="أيام الأمان" type="number" value={form.safetyStockDays} onChange={e => setForm({...form, safetyStockDays: e.target.value})} />
        <input className="input" placeholder="المهلة (أيام)" type="number" value={form.leadTimeDays} onChange={e => setForm({...form, leadTimeDays: e.target.value})} />
        <button onClick={save} className="btn btn-primary">{editId ? "تحديث" : "إضافة"}</button>
      </div>
      <div className="card p-0 overflow-hidden">
        <table>
          <thead><tr><th>المادة</th><th>الوحدة</th><th>التكلفة</th><th>المخزون</th><th>أيام الأمان</th><th>المهلة</th><th>المورد</th><th></th></tr></thead>
          <tbody>{items.map((m: any) => (
            <tr key={m.id}>
              <td className="font-medium">{m.name}</td>
              <td>{m.unit}</td>
              <td>{m.unitCost.toFixed(2)}</td>
              <td><span className={m.currentStock < m.safetyStockDays * 10 ? "text-red-600" : ""}>{m.currentStock}</span></td>
              <td>{m.safetyStockDays}</td>
              <td>{m.leadTimeDays}</td>
              <td className="text-sm">{m.supplier || "-"}</td>
              <td>
                <button onClick={() => { setForm(m); setEditId(m.id); }} className="btn btn-sm btn-secondary ml-2">تعديل</button>
                <button onClick={() => remove(m.id)} className="btn btn-sm btn-danger">حذف</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- BOM ----------
function BomTab() {
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [form, setForm] = useState({ productId: "", rawMaterialId: "", quantity: "0", batchSize: "1000" });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/bom").then(r=>r.json()),
      fetch("/api/products?all=true").then(r=>r.json()),
      fetch("/api/raw-materials").then(r=>r.json()),
    ]).then(([b,p,m]) => { setItems(b); setProducts(p); setMaterials(m); setLoading(false); });
  }, []);

  async function save() {
    const body = { ...form, quantity: parseFloat(form.quantity), batchSize: parseFloat(form.batchSize) };
    if (editId) { await fetch("/api/bom", { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({id: editId, ...body}) }); }
    else { await fetch("/api/bom", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) }); }
    setForm({ productId: "", rawMaterialId: "", quantity: "0", batchSize: "1000" }); setEditId(null);
    fetch("/api/bom").then(r=>r.json()).then(setItems);
  }

  async function remove(id: string) { if (!confirm("حذف عنصر BOM؟")) return; await fetch("/api/bom", { method: "DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id}) }); fetch("/api/bom").then(r=>r.json()).then(setItems); }

  if (loading) return <div className="text-center py-8">جاري التحميل...</div>;

  return (
    <div className="space-y-4">
      <div className="card grid gap-4 sm:grid-cols-4">
        <select className="input" value={form.productId} onChange={e => setForm({...form, productId: e.target.value})}>
          <option value="">المنتج...</option>
          {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
        </select>
        <select className="input" value={form.rawMaterialId} onChange={e => setForm({...form, rawMaterialId: e.target.value})}>
          <option value="">المادة...</option>
          {materials.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <input className="input" placeholder="الكمية" type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
        <input className="input" placeholder="حجم الدفعة" type="number" value={form.batchSize} onChange={e => setForm({...form, batchSize: e.target.value})} />
        <button onClick={save} className="btn btn-primary">{editId ? "تحديث" : "إضافة"}</button>
      </div>
      <div className="card p-0 overflow-hidden">
        <table>
          <thead><tr><th>المنتج</th><th>المادة</th><th>الكمية</th><th>حجم الدفعة</th><th></th></tr></thead>
          <tbody>{items.map((b: any) => (
            <tr key={b.id}>
              <td>{b.product?.name}</td>
              <td>{b.rawMaterial?.name}</td>
              <td>{b.quantity}</td>
              <td>{b.batchSize}</td>
              <td>
                <button onClick={() => { setForm({ productId: b.productId, rawMaterialId: b.rawMaterialId, quantity: String(b.quantity), batchSize: String(b.batchSize) }); setEditId(b.id); }} className="btn btn-sm btn-secondary ml-2">تعديل</button>
                <button onClick={() => remove(b.id)} className="btn btn-sm btn-danger">حذف</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Orders ----------
function OrdersTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }

  const filtered = filter === "all" ? items : items.filter((o: any) => o.status === filter);

  if (loading) return <div className="text-center py-8">جاري التحميل...</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[{v:"all",l:"الكل"},{v:"draft",l:"مسودة"},{v:"confirmed",l:"مؤكد"},{v:"delivered",l:"تم التسليم"},{v:"cancelled",l:"ملغي"}].map(f => (
          <button key={f.v} className={`btn btn-sm ${filter === f.v ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilter(f.v)}>{f.l}</button>
        ))}
      </div>
      <div className="card p-0 overflow-hidden">
        <table>
          <thead><tr><th>العميل</th><th>المنتج</th><th>الكمية</th><th>الموعد</th><th>CTP</th><th>الحالة</th></tr></thead>
          <tbody>{filtered.map((o: any) => (
            <tr key={o.id}>
              <td className="font-medium">{o.customerName}</td>
              <td className="text-sm">{o.product?.name}</td>
              <td>{o.quantity}</td>
              <td className="text-sm">{new Date(o.requestedDate).toLocaleDateString("ar-IQ")}</td>
              <td><span className={`badge ${o.ctpStatus === "green" ? "badge-green" : o.ctpStatus === "yellow" ? "badge-yellow" : o.ctpStatus === "red" ? "badge-red" : "badge-gray"}`}>{o.ctpStatus || "-"}</span></td>
              <td><span className={`badge ${o.status === "confirmed" ? "badge-green" : o.status === "draft" ? "badge-yellow" : o.status === "delivered" ? "badge-gray" : "badge-red"}`}>{o.status}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Forecasts ----------
function ForecastsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ productId: "", period: "", horizon: "monthly", optimistic: "0", likely: "0", pessimistic: "0" });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch("/api/forecasts").then(r=>r.json()), fetch("/api/products?all=true").then(r=>r.json())])
      .then(([f,p]) => { setItems(f); setProducts(p); setLoading(false); });
  }, []);

  async function save() {
    const body = { ...form, optimistic: parseFloat(form.optimistic), likely: parseFloat(form.likely), pessimistic: parseFloat(form.pessimistic) };
    if (editId) { await fetch("/api/forecasts", { method: "PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({id: editId, ...body}) }); }
    else { await fetch("/api/forecasts", { method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) }); }
    setForm({ productId: "", period: "", horizon: "monthly", optimistic: "0", likely: "0", pessimistic: "0" }); setEditId(null);
    fetch("/api/forecasts").then(r=>r.json()).then(setItems);
  }

  async function remove(id: string) { if (!confirm("حذف التنبؤ؟")) return; await fetch("/api/forecasts", { method: "DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({id}) }); fetch("/api/forecasts").then(r=>r.json()).then(setItems); }

  if (loading) return <div className="text-center py-8">جاري التحميل...</div>;

  return (
    <div className="space-y-4">
      <div className="card grid gap-4 sm:grid-cols-4">
        <select className="input" value={form.productId} onChange={e => setForm({...form, productId: e.target.value})}>
          <option value="">المنتج...</option>
          {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input className="input" placeholder="الفترة (مثال: 2026-Q4)" value={form.period} onChange={e => setForm({...form, period: e.target.value})} />
        <input className="input" placeholder="المتوقع" type="number" value={form.likely} onChange={e => setForm({...form, likely: e.target.value})} />
        <select className="input" value={form.horizon} onChange={e => setForm({...form, horizon: e.target.value})}>
          <option value="monthly">شهري</option><option value="quarterly">ربع سنوي</option><option value="annual">سنوي</option>
        </select>
        <button onClick={save} className="btn btn-primary">{editId ? "تحديث" : "إضافة"}</button>
      </div>
      <div className="card p-0 overflow-hidden">
        <table>
          <thead><tr><th>المنتج</th><th>الفترة</th><th>متفائل</th><th>متوقع</th><th>متشائم</th><th></th></tr></thead>
          <tbody>{items.map((f: any) => (
            <tr key={f.id}>
              <td>{f.product?.name}</td>
              <td>{f.period}</td>
              <td className="text-green-600">{f.optimistic}</td>
              <td className="font-medium">{f.likely}</td>
              <td className="text-red-600">{f.pessimistic}</td>
              <td>
                <button onClick={() => { setForm({ productId: f.productId, period: f.period, horizon: f.horizon, optimistic: String(f.optimistic), likely: String(f.likely), pessimistic: String(f.pessimistic) }); setEditId(f.id); }} className="btn btn-sm btn-secondary ml-2">تعديل</button>
                <button onClick={() => remove(f.id)} className="btn btn-sm btn-danger">حذف</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}