
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search, Plus, Package, AlertTriangle, TrendingUp,
  Boxes, Pencil, Trash2, X, ArrowDownToLine,
  ArrowUpFromLine, Warehouse,
} from "lucide-react";
import CatalogInventory from "@/components/CatalogInventory";

type Ingredient = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  cost: number;
};

const STORAGE_KEY = "onebiz_inventory";

const categories = [
  "Meat", "Dairy", "Vegetables", "Fruits",
  "Grains", "Beverages", "Spices", "Other",
];

const emptyForm = {
  name: "",
  category: "Other",
  quantity: "",
  unit: "kg",
  minStock: "",
  cost: "",
};

export default function InventoryPage() {
  const [businessType, setBusinessType] = useState("restaurant");
  const [storageKey, setStorageKey] = useState(STORAGE_KEY);
  const [items, setItems] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [stockItem, setStockItem] = useState<Ingredient | null>(null);
  const [stockMode, setStockMode] = useState<"in" | "out">("in");
  const [stockAmount, setStockAmount] = useState("");
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Inventory is scoped from the browser login session and hydrated on mount.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem("onebiz_business_profile") || "{}");
      const type = String(profile.businessType || localStorage.getItem("onebiz_business_type") || "restaurant");
      setBusinessType(type);
      const session = JSON.parse(sessionStorage.getItem("onebiz_current_user") || "{}");
      if (!session.id) {
        setReady(true);
        return;
      }
      const key = `onebiz_inventory_${encodeURIComponent(String(session.id))}_${type}`;
      setStorageKey(key);
      const saved = localStorage.getItem(key);
      if (saved) {
        setItems(JSON.parse(saved));
      } else if (!localStorage.getItem("onebiz_inventory_legacy_claimed")) {
        const legacy = localStorage.getItem(STORAGE_KEY);
        if (legacy) {
          setItems(JSON.parse(legacy));
          localStorage.setItem("onebiz_inventory_legacy_claimed", "claimed");
        }
      }
    } catch {
      setLoadError("Saved inventory could not be loaded.");
    }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (ready) {
      localStorage.setItem(storageKey, JSON.stringify(items));
    }
  }, [items, ready, storageKey]);

  const lowStock = items.filter(
    (item) => item.quantity > 0 && item.quantity <= item.minStock
  );

  const outOfStock = items.filter((item) => item.quantity <= 0);

  const totalValue = items.reduce(
    (sum, item) => sum + item.quantity * item.cost, 0
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "All" ||
        (filter === "Low Stock" && item.quantity > 0 && item.quantity <= item.minStock) ||
        (filter === "Out of Stock" && item.quantity <= 0) ||
        item.category === filter;

      return matchesSearch && matchesFilter;
    });
  }, [items, search, filter]);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setModal(true);
  }

  function openEdit(item: Ingredient) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      unit: item.unit,
      minStock: String(item.minStock),
      cost: String(item.cost),
    });
    setModal(true);
  }

  function saveIngredient(e: React.FormEvent) {
    e.preventDefault();

    const quantity = Number(form.quantity);
    const minStock = Number(form.minStock);
    const cost = Number(form.cost);

    if (
      !form.name.trim() ||
      !Number.isFinite(quantity) || quantity < 0 ||
      !Number.isFinite(minStock) || minStock < 0 ||
      !Number.isFinite(cost) || cost < 0
    ) return;

    if (editingId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, ...form, name: form.name.trim(), quantity, minStock, cost }
            : item
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          ...form,
          name: form.name.trim(),
          quantity,
          minStock,
          cost,
        },
      ]);
    }

    setModal(false);
  }

  function deleteIngredient(id: string) {
    if (!confirm("Delete this ingredient?")) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function updateStock() {
    const amount = Number(stockAmount);
    if (!stockItem || !Number.isFinite(amount) || amount <= 0) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === stockItem.id
          ? {
              ...item,
              quantity: Math.max(
                0,
                item.quantity + (stockMode === "in" ? amount : -amount)
              ),
            }
          : item
      )
    );

    setStockItem(null);
    setStockAmount("");
  }

  function stockStatus(item: Ingredient) {
    if (item.quantity <= 0) return "Out of Stock";
    if (item.quantity <= item.minStock) return "Low Stock";
    return "In Stock";
  }

  if (!ready) return null;
  if (!["restaurant", "cafe", "pizza"].includes(businessType)) {
    return <CatalogInventory businessType={businessType} />;
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-7">
        {loadError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Warehouse size={16} /> Restaurant Management
            </div>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              Inventory
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your restaurant ingredients and stock.
            </p>
          </div>

          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
          >
            <Plus size={19} /> Add Ingredient
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Ingredients",
              value: items.length,
              icon: Package,
              color: "blue",
            },
            {
              label: "Stock Value",
              value: `Rs ${totalValue.toLocaleString()}`,
              icon: TrendingUp,
              color: "violet",
            },
            {
              label: "Low Stock",
              value: lowStock.length,
              icon: AlertTriangle,
              color: "amber",
            },
            {
              label: "Out of Stock",
              value: outOfStock.length,
              icon: Boxes,
              color: "red",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                  <div className={`rounded-xl bg-${card.color}-50 p-3 text-${card.color}-600`}>
                    <Icon size={21} />
                  </div>
                </div>
                <p className="mt-4 text-2xl font-extrabold text-slate-900">
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Ingredients</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your restaurant stock and ingredient records
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ingredients..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 sm:w-60"
                />
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option>All</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">Ingredient</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Available Stock</th>
                  <th className="px-6 py-4">Min. Stock</th>
                  <th className="px-6 py-4">Unit Cost</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const status = stockStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{item.category}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {item.minStock} {item.unit}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        Rs {item.cost.toLocaleString()} / {item.unit}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                          status === "In Stock"
                            ? "bg-emerald-50 text-emerald-700"
                            : status === "Low Stock"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            title="Stock In"
                            onClick={() => {
                              setStockItem(item);
                              setStockMode("in");
                            }}
                            className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                          >
                            <ArrowDownToLine size={18} />
                          </button>
                          <button
                            title="Stock Out"
                            onClick={() => {
                              setStockItem(item);
                              setStockMode("out");
                            }}
                            className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                          >
                            <ArrowUpFromLine size={18} />
                          </button>
                          <button
                            title="Edit"
                            onClick={() => openEdit(item)}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            title="Delete"
                            onClick={() => deleteIngredient(item.id)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <Package className="mx-auto mb-3 text-slate-300" size={36} />
                      <p className="font-bold text-slate-600">No ingredients found</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Add your first ingredient to manage restaurant stock.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
          <form
            onSubmit={saveIngredient}
            className="w-full max-w-lg space-y-5 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-900">
                {editingId ? "Edit Ingredient" : "Add Ingredient"}
              </h2>
              <button type="button" onClick={() => setModal(false)}>
                <X />
              </button>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">Ingredient Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Chicken"
                className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-3"
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">Unit</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-3"
                >
                  {["kg", "g", "litre", "ml", "piece", "pack"].map((unit) => (
                    <option key={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">Current Quantity</label>
                <input
                  required type="number" min="0" step="any"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-3"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">Minimum Stock</label>
                <input
                  required type="number" min="0" step="any"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-3"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">Cost Per Unit (Rs)</label>
              <input
                required type="number" min="0" step="any"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 p-3"
              />
            </div>

            <button className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700">
              {editingId ? "Save Changes" : "Add Ingredient"}
            </button>
          </form>
        </div>
      )}

      {stockItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold">
                {stockMode === "in" ? "Stock In" : "Stock Out"}
              </h2>
              <button onClick={() => setStockItem(null)}><X /></button>
            </div>
            <p className="text-sm text-slate-500">
              {stockItem.name} — Current: {stockItem.quantity} {stockItem.unit}
            </p>
            <input
              type="number"
              min="0.001"
              step="any"
              value={stockAmount}
              onChange={(e) => setStockAmount(e.target.value)}
              placeholder={`Quantity (${stockItem.unit})`}
              className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-500"
            />
            {stockMode === "out" && Number(stockAmount) > stockItem.quantity && (
              <p className="text-sm text-red-600">Quantity cannot exceed available stock.</p>
            )}
            <button
              onClick={updateStock}
              disabled={
                !stockAmount ||
                Number(stockAmount) <= 0 ||
                (stockMode === "out" && Number(stockAmount) > stockItem.quantity)
              }
              className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Update Stock
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
