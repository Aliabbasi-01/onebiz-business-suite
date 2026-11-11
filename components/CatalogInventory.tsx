"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Search, Warehouse } from "lucide-react";
import {
  getBusinessRecords,
  saveBusinessRecords,
  type BusinessRecord,
} from "@/lib/business-data";
import {
  getProducts,
  saveBusinessProducts,
  type Product,
} from "@/lib/products";

type Movement = BusinessRecord & {
  productName: string;
  direction: "in" | "out";
  quantity: number;
  reason: string;
};

export default function CatalogInventory({ businessType }: { businessType: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  // Read the active account's local inventory after client hydration.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      setProducts(getProducts().filter((product) => product.type !== "Service"));
      setMovements(getBusinessRecords<Movement>("stock-movements", businessType));
      const profile = JSON.parse(localStorage.getItem("onebiz_business_profile") || "{}");
      setCurrency(String(profile.currency || "PKR"));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load inventory.");
    } finally {
      setReady(true);
    }
  }, [businessType]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    return products.filter((product) => !query || `${product.name} ${product.sku} ${product.barcode}`.toLowerCase().includes(query));
  }, [products, search]);
  const lowStock = products.filter((product) => product.trackInventory && (product.stockQuantity || 0) <= (product.lowStockThreshold || 0));
  const value = products.reduce((sum, product) => sum + (product.stockQuantity || 0) * (product.purchasePrice || 0), 0);

  function updateStock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const amount = Number(quantity);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a quantity greater than zero.");
      return;
    }
    const currentQuantity = selected.stockQuantity ?? 0;
    if (direction === "out" && amount > currentQuantity) {
      setError("Stock-out quantity cannot exceed available stock.");
      return;
    }

    try {
      const updatedProduct = {
        ...selected,
        trackInventory: true,
        stockQuantity: currentQuantity + (direction === "in" ? amount : -amount),
      };
      const updatedProducts = products.map((product) =>
        product.id === selected.id ? updatedProduct : product
      );
      const movement: Movement = {
        id: crypto.randomUUID(),
        name: `${direction === "in" ? "Stock in" : "Stock out"}: ${selected.name}`,
        productName: selected.name,
        direction,
        quantity: amount,
        reason: reason.trim() || (direction === "in" ? "Stock received" : "Manual adjustment"),
        createdAt: new Date().toISOString(),
      };
      const updatedMovements = [movement, ...movements];
      saveBusinessProducts(businessType, updatedProducts);
      saveBusinessRecords("stock-movements", businessType, updatedMovements);
      setProducts(updatedProducts);
      setMovements(updatedMovements);
      setSelected(null);
      setQuantity("");
      setReason("");
      setError("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update stock.");
    }
  }

  if (!ready) return <div className="p-8 text-sm text-slate-500">Loading inventory...</div>;

  return (
    <main className="min-h-screen p-5 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm font-semibold text-blue-600">Product stock</p><h1 className="mt-1 text-3xl font-extrabold">Inventory</h1><p className="mt-1 text-sm text-slate-500">Track retail stock, stock movements and low-stock alerts.</p></div>
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." className="rounded-xl border bg-white py-3 pl-10 pr-4 outline-none focus:border-blue-500" /></div>
        </header>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card label="Products tracked" value={products.filter((product) => product.trackInventory).length} />
          <Card label="Low stock" value={lowStock.length} />
          <Card label="Stock valuation" value={`${currency} ${value.toLocaleString()}`} />
        </section>
        <section className="mt-5 overflow-hidden rounded-2xl border bg-white">
          <div className="border-b p-4"><h2 className="font-bold">Products</h2></div>
          {filtered.map((product) => {
            const stock = product.stockQuantity ?? 0;
            const threshold = product.lowStockThreshold ?? 0;
            return <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 border-b p-4 last:border-0">
              <div><p className="font-bold">{product.name}</p><p className="text-xs text-slate-500">{product.sku || "No SKU"} · {product.unit || "piece"} · {product.expiryDate ? `Expires ${product.expiryDate}` : "No expiry date"}</p></div>
              <div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${stock <= threshold ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{stock} {product.unit || "piece"}{stock <= threshold ? " · Low stock" : ""}</span><button onClick={() => { setSelected(product); setDirection("in"); setError(""); }} className="rounded-lg border p-2 text-emerald-700" aria-label={`Stock in ${product.name}`}><ArrowDownToLine size={17} /></button><button onClick={() => { setSelected(product); setDirection("out"); setError(""); }} className="rounded-lg border p-2 text-amber-700" aria-label={`Stock out ${product.name}`}><ArrowUpFromLine size={17} /></button></div>
            </div>;
          })}
          {!filtered.length && <div className="p-10 text-center"><Warehouse className="mx-auto text-slate-300" /><p className="mt-2 font-semibold">No products in inventory</p><p className="mt-1 text-sm text-slate-500">Create products in the Products module before managing stock.</p></div>}
        </section>
        <section className="mt-5 rounded-2xl border bg-white p-4">
          <h2 className="font-bold">Inventory history</h2>
          {movements.slice(0, 10).map((movement) => <p key={movement.id} className="flex justify-between gap-3 border-b py-3 text-sm last:border-0"><span>{movement.productName} · {movement.reason}</span><span className={movement.direction === "in" ? "text-emerald-700" : "text-amber-700"}>{movement.direction === "in" ? "+" : "-"}{movement.quantity} · {new Date(movement.createdAt).toLocaleString()}</span></p>)}
          {!movements.length && <p className="mt-3 text-sm text-slate-400">Stock movement history will appear here.</p>}
        </section>
      </div>
      {selected && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"><form onSubmit={updateStock} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6"><h2 className="text-xl font-extrabold">{direction === "in" ? "Stock in" : "Stock out"}: {selected.name}</h2><p className="text-sm text-slate-500">Available: {selected.stockQuantity ?? 0} {selected.unit || "piece"}</p><label className="block text-sm font-semibold">Quantity<input autoFocus type="number" min="0.001" step="any" required value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1 w-full rounded-xl border p-3" /></label><label className="block text-sm font-semibold">Reason<input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Purchase, correction, damaged goods..." className="mt-1 w-full rounded-xl border p-3" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelected(null)} className="rounded-xl border px-4 py-2">Cancel</button><button className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white">Save movement</button></div></form></div>}
    </main>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-extrabold">{value}</p></div>;
}
