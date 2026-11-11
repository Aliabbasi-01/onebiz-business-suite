"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import {
  getBusinessRecords,
  saveBusinessRecords,
  type BusinessRecord,
} from "@/lib/business-data";
import { getProducts, saveBusinessProducts } from "@/lib/products";
import { getBusinessConfig } from "@/lib/business-config";

type ModuleRecord = BusinessRecord & {
  status?: string;
  date?: string;
  time?: string;
  total?: number;
  quantity?: number;
  productId?: string;
  items?: Array<{ name: string; quantity: number }>;
  [key: string]: unknown;
};

type Field = {
  name: string;
  label: string;
  type?: string;
  options?: string[];
  multiple?: boolean;
};

const fieldsByModule: Record<string, Field[]> = {
  appointments: [
    { name: "customer", label: "Customer" },
    { name: "services", label: "Services", multiple: true },
    { name: "staff", label: "Assigned staff" },
    { name: "date", label: "Appointment date", type: "date" },
    { name: "time", label: "Start time", type: "time" },
    { name: "duration", label: "Duration (minutes)", type: "number" },
    { name: "status", label: "Status", options: ["Scheduled", "Confirmed", "In Progress", "Completed", "Cancelled", "No Show"] },
    { name: "notes", label: "Notes" },
  ],
  customers: [
    { name: "name", label: "Name" },
    { name: "phone", label: "Phone", type: "tel" },
    { name: "email", label: "Email", type: "email" },
    { name: "address", label: "Address" },
    { name: "notes", label: "Notes" },
  ],
  staff: [
    { name: "name", label: "Name" },
    { name: "phone", label: "Phone", type: "tel" },
    { name: "email", label: "Email", type: "email" },
    { name: "designation", label: "Designation" },
    { name: "skills", label: "Skills" },
    { name: "assignedServices", label: "Assigned services", multiple: true },
    { name: "commissionType", label: "Commission type", options: ["None", "Percentage", "Fixed"] },
    { name: "commissionValue", label: "Commission value", type: "number" },
    { name: "schedule", label: "Working schedule" },
    { name: "availability", label: "Availability", options: ["Available", "Unavailable"] },
  ],
  categories: [
    { name: "name", label: "Category name" },
    { name: "description", label: "Description" },
  ],
  suppliers: [
    { name: "name", label: "Supplier name" },
    { name: "phone", label: "Phone", type: "tel" },
    { name: "email", label: "Email", type: "email" },
    { name: "address", label: "Address" },
    { name: "notes", label: "Notes" },
  ],
  purchases: [
    { name: "productId", label: "Product" },
    { name: "supplier", label: "Supplier" },
    { name: "date", label: "Purchase date", type: "date" },
    { name: "invoice", label: "Supplier invoice number" },
    { name: "quantity", label: "Quantity received", type: "number" },
    { name: "unitCost", label: "Cost per unit", type: "number" },
    { name: "status", label: "Status", options: ["Draft", "Received"] },
  ],
};

const moduleLabels: Record<string, { title: string; collection: string; singular: string }> = {
  appointments: { title: "Appointments", collection: "appointments", singular: "Appointment" },
  customers: { title: "Customers", collection: "customers", singular: "Customer" },
  staff: { title: "Staff", collection: "staff", singular: "Staff member" },
  categories: { title: "Categories", collection: "categories", singular: "Category" },
  suppliers: { title: "Suppliers", collection: "suppliers", singular: "Supplier" },
  purchases: { title: "Purchases", collection: "purchases", singular: "Purchase" },
  payments: { title: "Payments", collection: "sales", singular: "Payment" },
  reports: { title: "Reports", collection: "sales", singular: "Report" },
  delivery: { title: "Delivery orders", collection: "orders", singular: "Delivery order" },
};

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes)
    ? hours * 60 + minutes
    : -1;
}

function localDateKey(value: string, includeDay = true) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const prefix = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  return includeDay
    ? `${prefix}-${String(date.getDate()).padStart(2, "0")}`
    : prefix;
}

export default function BusinessModule({ module }: { module: string }) {
  const [businessType, setBusinessType] = useState("other");
  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"day" | "week" | "all">("day");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const definition = moduleLabels[module];
  const config = getBusinessConfig(businessType);
  const allowed =
    module === "services"
      ? config.modules.services
      : module === "products"
        ? config.modules.products
        : module === "delivery"
          ? config.modules.deliveries
          : module === "purchases"
            ? config.modules.purchases
            : module === "payments"
              ? config.modules.payments
              : module === "reports"
                ? config.modules.reports
              : module === "suppliers"
                ? config.modules.suppliers
                : module === "staff"
                  ? config.modules.staff
                  : module === "appointments"
                    ? config.modules.appointments
                    : module === "categories"
                      ? config.modules.categories
                      : module === "customers"
                        ? config.modules.customers
                        : false;

  // Hydrate browser-only business records after the initial server render.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const activeType = localStorage.getItem("onebiz_business_type") || "other";
      setBusinessType(activeType);
      setRecords(
        getBusinessRecords<ModuleRecord>(
          definition?.collection || module,
          activeType
        )
      );
      if (module === "appointments") {
        setOptions(
          getProducts()
            .filter((product) => product.type === "Service" && product.available)
            .map((product) => product.name)
        );
      } else if (module === "staff") {
        setOptions(getProducts().filter((product) => product.type === "Service").map((product) => product.name));
      } else if (module === "purchases") {
        setOptions(getProducts().filter((product) => product.type !== "Service").map((product) => product.name));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load records.");
    } finally {
      setReady(true);
    }
  }, [definition?.collection, module]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const visibleRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch = !query || JSON.stringify(record).toLowerCase().includes(query);
      if (module !== "appointments" || filter === "all" || !record.date) return matchesSearch;
      if (filter === "day") return matchesSearch && record.date === todayKey();
      const date = new Date(`${record.date}T00:00:00`);
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return matchesSearch && date >= start && date < end;
    });
  }, [records, search, module, filter]);

  function persist(updated: ModuleRecord[]) {
    saveBusinessRecords(definition.collection, businessType, updated);
    setRecords(updated);
  }

  function openCreate() {
    const initial: Record<string, string> = {};
    for (const field of fieldsByModule[module] || []) {
      if (field.type === "date") initial[field.name] = todayKey();
      else if (field.options) initial[field.name] = field.options[0];
      else if (field.name === "duration") initial[field.name] = "30";
      else if (field.name === "quantity") initial[field.name] = "1";
      else if (field.name === "unitCost" || field.name === "commissionValue") initial[field.name] = "0";
      else initial[field.name] = "";
    }
    setEditingId(null);
    setForm(initial);
    setError("");
    setModalOpen(true);
  }

  function openEdit(record: ModuleRecord) {
    const values: Record<string, string> = {};
    for (const field of fieldsByModule[module] || []) {
      const value = record[field.name];
      values[field.name] = Array.isArray(value) ? value.join(", ") : String(value ?? "");
    }
    setEditingId(record.id);
    setForm(values);
    setError("");
    setModalOpen(true);
  }

  function saveRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (module === "appointments") {
      const startMinute = timeToMinutes(form.time);
      const duration = Number(form.duration);
      const overlaps = records.some((appointment) => {
        if (
          appointment.id === editingId ||
          appointment.date !== form.date ||
          appointment.staff !== form.staff ||
          ["Cancelled", "No Show"].includes(String(appointment.status))
        ) {
          return false;
        }
        const existingStart = timeToMinutes(String(appointment.time || ""));
        const existingEnd =
          existingStart + (Number(appointment.duration) || 30);
        return (
          startMinute < existingEnd &&
          startMinute + duration > existingStart
        );
      });
      if (!Number.isFinite(duration) || duration <= 0) {
        setError("Appointment duration must be greater than zero.");
        return;
      }
      if (overlaps) {
        setError("This staff member already has an appointment at that time.");
        return;
      }
    }
    if (module === "purchases") {
      const quantity = Number(form.quantity);
      const unitCost = Number(form.unitCost);
      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitCost) || unitCost < 0) {
        setError("Enter a valid product quantity and unit cost.");
        return;
      }
    }
    const now = new Date().toISOString();
    const values: Record<string, unknown> = {};
    for (const field of fieldsByModule[module] || []) {
      const value = form[field.name] || "";
      values[field.name] = field.multiple
        ? value.split(",").map((item) => item.trim()).filter(Boolean)
        : field.type === "number"
          ? Number(value)
          : value;
    }
    const purchaseProduct = module === "purchases"
      ? getProducts().find((product) => product.id === form.productId)
      : undefined;
    let record: ModuleRecord = {
      id: editingId || crypto.randomUUID(),
      name:
        module === "purchases"
          ? `${form.invoice || purchaseProduct?.name || "Purchase"}`
          : module === "appointments"
            ? `${form.customer || "Appointment"} · ${form.date || todayKey()}`
            : String(values.name || values.productId || "Record"),
      createdAt: records.find((item) => item.id === editingId)?.createdAt || now,
      updatedAt: now,
      ...values,
      ...(purchaseProduct ? { productName: purchaseProduct.name, total: Number(form.quantity) * Number(form.unitCost) } : {}),
    };

    try {
      if (module === "purchases" && record.status === "Received") {
        const previous = records.find((item) => item.id === record.id);
        if (!previous?.stockUpdated) record = addPurchaseStock(record);
      }
      const updated = editingId
        ? records.map((item) => (item.id === editingId ? record : item))
        : [record, ...records];
      persist(updated);
      setModalOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save record.");
    }
  }

  function addPurchaseStock(record: ModuleRecord): ModuleRecord {
    if (record.stockUpdated) return record;
    const productId = String(record.productId || "");
    const product = getProducts().find((item) => item.id === productId);
    if (!product) {
      throw new Error("Purchase could not be received because its product is no longer in the catalog.");
    }
    const quantity = Number(record.quantity) || 0;
    const updatedProduct = {
      ...product,
      trackInventory: true,
      stockQuantity: (product.stockQuantity || 0) + quantity,
      purchasePrice: Number(record.unitCost) || product.purchasePrice || 0,
    };
    const allProducts = getProducts().map((item) =>
      item.id === productId ? updatedProduct : item
    );
    saveBusinessProducts(businessType, allProducts);
    const updatedRecord = { ...record, status: "Received", stockUpdated: true };
    const movements = getBusinessRecords<ModuleRecord>("stock-movements", businessType);
    saveBusinessRecords("stock-movements", businessType, [{
      id: crypto.randomUUID(),
      name: `Purchase stock-in: ${product.name}`,
      productId,
      productName: product.name,
      direction: "in",
      quantity,
      reason: `Purchase ${String(record.invoice || record.id)}`,
      createdAt: new Date().toISOString(),
    }, ...movements]);
    return updatedRecord;
  }

  function receivePurchase(record: ModuleRecord) {
    try {
      const received = addPurchaseStock(record);
      persist(records.map((item) => item.id === record.id ? received : item));
    } catch (receiveError) {
      setError(receiveError instanceof Error ? receiveError.message : "Unable to receive purchase.");
    }
  }

  function changeAppointmentStatus(record: ModuleRecord, status: string) {
    persist(
      records.map((item) =>
        item.id === record.id
          ? { ...item, status, updatedAt: new Date().toISOString() }
          : item
      )
    );
  }

  if (!ready) return <div className="p-8 text-sm text-slate-500">Loading {definition?.title || "business data"}...</div>;
  if (!definition || !allowed) {
    return <main className="p-8"><h1 className="text-xl font-bold">This module is not available for your business.</h1></main>;
  }

  if (module === "payments") {
    return (
      <main className="min-h-screen p-5 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-extrabold">Payment history</h1>
          <p className="mt-1 text-sm text-slate-500">Completed cash and card transactions for this business.</p>
          <div className="mt-6 overflow-hidden rounded-2xl border bg-white">
            {visibleRecords.map((record) => (
              <div key={record.id} className="flex flex-wrap justify-between gap-3 border-b p-4">
                <div><p className="font-bold">{record.name}</p><p className="text-xs text-slate-500">{String(record.customerName || "Walk-in")} · {new Date(record.createdAt).toLocaleString()}</p></div>
                <p className="font-bold">{String(record.paymentMethod)} · {String(record.total)}</p>
              </div>
            ))}
            {!records.length && <p className="p-8 text-center text-sm text-slate-400">No payments recorded.</p>}
          </div>
        </div>
      </main>
    );
  }

  if (module === "delivery") {
    const deliveryOrders = records.filter((record) => record.orderType === "Delivery");
    return (
      <main className="min-h-screen p-5 sm:p-8">
        <div className="mx-auto max-w-6xl"><h1 className="text-3xl font-extrabold">Delivery orders</h1>
          <div className="mt-6 space-y-3">{deliveryOrders.map((order) => <div key={order.id} className="rounded-xl border bg-white p-4"><div className="flex justify-between"><b>{order.id}</b><span>{order.status}</span></div><p className="mt-2 text-sm text-slate-500">{order.items?.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p></div>)}</div>
        </div>
      </main>
    );
  }

  if (module === "reports") {
    const sales = getBusinessRecords<ModuleRecord>("sales", businessType);
    const paidSales = sales.filter((sale) => ["Paid", "Completed"].includes(String(sale.status)));
    const revenue = paidSales.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const today = todayKey();
    const month = today.slice(0, 7);
    const revenueToday = paidSales
      .filter((sale) => localDateKey(sale.createdAt) === today)
      .reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
    const revenueMonth = paidSales
      .filter((sale) => localDateKey(sale.createdAt, false) === month)
      .reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
    const cashTotal = paidSales
      .filter((sale) => sale.paymentMethod === "Cash")
      .reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
    const cardTotal = paidSales
      .filter((sale) => sale.paymentMethod === "Card")
      .reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
    const serviceCounts = new Map<string, number>();
    for (const sale of paidSales) {
      for (const item of sale.items || []) {
        serviceCounts.set(item.name, (serviceCounts.get(item.name) || 0) + item.quantity);
      }
    }
    const topItems = [...serviceCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const appointmentRecords = getBusinessRecords<ModuleRecord>("appointments", businessType);
    const salonStaff = getBusinessRecords<ModuleRecord>("staff", businessType);
    const staffPerformance = salonStaff.map((member) => {
      const staffSales = paidSales.filter((sale) => sale.staffName === member.name);
      const staffRevenue = staffSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
      const commissionValue = Number(member.commissionValue) || 0;
      const commission = member.commissionType === "Percentage"
        ? staffRevenue * commissionValue / 100
        : member.commissionType === "Fixed"
          ? staffSales.length * commissionValue
          : 0;
      return { name: member.name, revenue: staffRevenue, commission };
    }).sort((first, second) => second.revenue - first.revenue);
    const currency = String(JSON.parse(localStorage.getItem("onebiz_business_profile") || "{}").currency || "PKR");
    return (
      <main className="min-h-screen p-5 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-extrabold">Business reports</h1>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Summary label="Today's revenue" value={`${currency} ${revenueToday.toLocaleString()}`} />
            <Summary label="Monthly revenue" value={`${currency} ${revenueMonth.toLocaleString()}`} />
            <Summary label="Total revenue" value={`${currency} ${revenue.toLocaleString()}`} />
            <Summary label="Paid transactions" value={paidSales.length} />
            <Summary label="Low stock products" value={getProducts().filter((product) => product.trackInventory && (product.stockQuantity || 0) <= (product.lowStockThreshold || 0)).length} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Summary label="Cash payments" value={`${currency} ${cashTotal.toLocaleString()}`} />
            <Summary label="Card payments" value={`${currency} ${cardTotal.toLocaleString()}`} />
          </div>
          <section className="mt-5 rounded-2xl border bg-white p-5">
            <h2 className="font-bold">Best-selling items</h2>
            {topItems.map(([name, count]) => <p key={name} className="mt-3 flex justify-between text-sm"><span>{name}</span><b>{count} sold</b></p>)}
            {!topItems.length && <p className="mt-3 text-sm text-slate-400">Sales will appear here after the first payment.</p>}
          </section>
          {businessType === "salon" && <>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Summary label="Appointments" value={appointmentRecords.length} />
              <Summary label="Completed appointments" value={appointmentRecords.filter((item) => item.status === "Completed").length} />
              <Summary label="Cancelled appointments" value={appointmentRecords.filter((item) => item.status === "Cancelled").length} />
            </div>
            <section className="mt-5 rounded-2xl border bg-white p-5">
              <h2 className="font-bold">Staff performance & commissions</h2>
              {staffPerformance.map((member) => <p key={member.name} className="mt-3 flex justify-between gap-3 border-b pb-3 text-sm last:border-0"><span>{member.name}</span><span>{currency} {member.revenue.toLocaleString()} · Commission {currency} {member.commission.toLocaleString()}</span></p>)}
              {!staffPerformance.length && <p className="mt-3 text-sm text-slate-400">Add staff and assign them to paid invoices to see performance.</p>}
            </section>
          </>}
        </div>
      </main>
    );
  }

  const fields = fieldsByModule[module] || [];
  const title = module === "delivery" ? "Delivery orders" : definition.title;

  return (
    <main className="min-h-screen p-5 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">{config.label}</p><h1 className="mt-2 text-3xl font-extrabold">{title}</h1><p className="mt-1 text-sm text-slate-500">Create, search and manage your {title.toLowerCase()}.</p></div>
          <button onClick={openCreate} className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white"><Plus className="mr-1 inline" size={17} /> Add {definition.singular}</button>
        </header>
        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}...`} className="w-full rounded-xl border bg-white py-3 pl-10 pr-4 outline-none focus:border-blue-500" /></label>
          {module === "appointments" && <div className="flex gap-2">{(["day", "week", "all"] as const).map((range) => <button key={range} onClick={() => setFilter(range)} className={`rounded-lg px-3 text-sm font-semibold capitalize ${filter === range ? "bg-blue-600 text-white" : "border bg-white"}`}>{range}</button>)}</div>}
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <section className="mt-5 overflow-hidden rounded-2xl border bg-white">
          {visibleRecords.length ? visibleRecords.map((record) => (
            <div key={record.id} className="flex flex-wrap items-center justify-between gap-4 border-b p-4 last:border-b-0">
              <div className="min-w-[220px] flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="font-bold">{record.name}</p>{record.status && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{record.status}</span>}</div>
                <p className="mt-1 text-sm text-slate-500">{module === "appointments" ? `${record.date || ""} ${record.time || ""} · ${String(record.customer || "")} · ${String(record.services || "")}` : module === "purchases" ? `${String(record.productName || "")} · Qty ${String(record.quantity || 0)} · ${String(record.supplier || "")}` : [record.phone, record.email, record.designation, record.address].filter(Boolean).join(" · ") || new Date(record.createdAt).toLocaleDateString()}</p>
              </div>
              {module === "appointments" && <div className="flex flex-wrap gap-1">{["Confirmed", "In Progress", "Completed", "Cancelled", "No Show"].map((status) => <button key={status} onClick={() => changeAppointmentStatus(record, status)} className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50">{status}</button>)}</div>}
              {module === "purchases" && record.status !== "Received" && <button onClick={() => receivePurchase(record)} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">Receive & add stock</button>}
              <div className="flex gap-2">{!(module === "purchases" && record.status === "Received") && <button aria-label={`Edit ${record.name}`} onClick={() => openEdit(record)} className="rounded-lg border p-2 text-blue-600"><Pencil size={16} /></button>}<button aria-label={`Delete ${record.name}`} onClick={() => { if (window.confirm(`Delete ${record.name}?`)) persist(records.filter((item) => item.id !== record.id)); }} className="rounded-lg border p-2 text-red-600"><Trash2 size={16} /></button></div>
            </div>
          )) : <div className="p-10 text-center"><CalendarDays className="mx-auto text-slate-300" /><p className="mt-3 font-semibold">{module === "appointments" && filter === "day" ? "No appointments today" : `No ${title.toLowerCase()} found`}</p><p className="mt-1 text-sm text-slate-400">Add your first record to get started.</p></div>}
        </section>
      </div>

      {modalOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"><form onSubmit={saveRecord} className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <header className="flex items-center justify-between"><h2 className="text-xl font-extrabold">{editingId ? "Edit" : "Add"} {definition.singular}</h2><button type="button" onClick={() => setModalOpen(false)} aria-label="Close form"><X /></button></header>
        {fields.map((field) => <label key={field.name} className="block text-sm font-semibold text-slate-600">{field.label}
          {field.options ? <select required value={form[field.name] || ""} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} className="mt-1 w-full rounded-xl border p-3">{field.options.map((option) => <option key={option}>{option}</option>)}</select>
            : field.multiple && options.length ? <select multiple required={module === "appointments" && field.name === "services"} value={(form[field.name] || "").split(", ").filter(Boolean)} onChange={(event) => setForm((current) => ({ ...current, [field.name]: Array.from(event.target.selectedOptions).map((option) => option.value).join(", ") }))} className="mt-1 min-h-24 w-full rounded-xl border p-3">{options.map((option) => <option key={option}>{option}</option>)}</select>
              : field.name === "customer" || field.name === "staff" || field.name === "supplier" ? <select required={field.name !== "supplier" || module === "purchases"} value={form[field.name] || ""} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} className="mt-1 w-full rounded-xl border p-3"><option value="">Select {field.label.toLowerCase()}</option>{getBusinessRecords<ModuleRecord>(field.name === "customer" ? "customers" : field.name === "staff" ? "staff" : "suppliers", businessType).map((option) => <option key={option.id}>{option.name}</option>)}</select>
                : field.name === "productId" ? <select required value={form.productId || ""} onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))} className="mt-1 w-full rounded-xl border p-3"><option value="">Select product</option>{getProducts().filter((product) => product.type !== "Service").map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select>
                  : <input required={["name", "date", "time", "customer", "productId", "quantity", "unitCost"].includes(field.name)} type={field.type || "text"} min={field.type === "number" ? "0" : undefined} step={field.type === "number" ? "any" : undefined} value={form[field.name] || ""} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} className="mt-1 w-full rounded-xl border p-3 outline-none focus:border-blue-500" />}
        </label>)}
        <div className="flex justify-end gap-3 border-t pt-4"><button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border px-4 py-2 font-semibold">Cancel</button><button className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white">Save {definition.singular}</button></div>
      </form></div>}
    </main>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-extrabold">{value}</p></div>;
}
