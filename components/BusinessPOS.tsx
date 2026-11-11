"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CreditCard,
  Minus,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import {
  getBusinessRecords,
  saveBusinessRecords,
  type BusinessRecord,
} from "@/lib/business-data";
import { getProducts, saveBusinessProducts, type Product } from "@/lib/products";
import { getCurrentUser } from "@/lib/auth";

type CartLine = { product: Product; quantity: number };
type SaleLine = {
  productId: string;
  name: string;
  type: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
};
type BusinessSale = BusinessRecord & {
  invoiceNumber: string;
  items: SaleLine[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: "Cash" | "Card";
  status: "Paid";
  customerName: string;
  staffName: string;
  businessName: string;
  currency: string;
};
type NamedRecord = BusinessRecord & { phone?: string; active?: boolean };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}

export default function BusinessPOS({
  businessType,
  businessName,
  currency,
}: {
  businessType: string;
  businessName: string;
  currency: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<NamedRecord[]>([]);
  const [staff, setStaff] = useState<NamedRecord[]>([]);
  const [sales, setSales] = useState<BusinessSale[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [staffName, setStaffName] = useState("");
  const [discount, setDiscount] = useState("0");
  const [taxRate, setTaxRate] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card">("Cash");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  // Load account-owned data only after the browser session is available.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      setProducts(getProducts());
      setCustomers(getBusinessRecords<NamedRecord>("customers", businessType));
      setStaff(getBusinessRecords<NamedRecord>("staff", businessType));
      setSales(getBusinessRecords<BusinessSale>("sales", businessType));
      const ownerId = getCurrentUser()?.id;
      if (ownerId) {
        const settings = JSON.parse(
          localStorage.getItem(`onebiz_settings_${ownerId}`) || "{}"
        );
        if (settings.taxEnabled) {
          setTaxRate(String(settings.taxRate || "0"));
        }
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load point of sale data."
      );
    } finally {
      setReady(true);
    }
  }, [businessType]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const sellableProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.available &&
          (businessType !== "salon" || product.type === "Service" || product.type === "Product")
      ),
    [products, businessType]
  );
  const visibleProducts = useMemo(
    () =>
      sellableProducts.filter((product) => {
        const query = search.trim().toLowerCase();
        return (
          !query ||
          product.name.toLowerCase().includes(query) ||
          (product.sku || "").toLowerCase().includes(query) ||
          (product.barcode || "").toLowerCase() === query
        );
      }),
    [sellableProducts, search]
  );
  const subtotal = cart.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0
  );
  const discountAmount = Math.min(
    subtotal,
    Math.max(0, Number(discount) || 0)
  );
  const taxAmount =
    Math.max(0, Number(taxRate) || 0) * (subtotal - discountAmount) / 100;
  const total = subtotal - discountAmount + taxAmount;
  const currencyLabel = currency === "PKR" ? "Rs." : currency;

  function addToCart(product: Product) {
    const currentQuantity =
      cart.find((line) => line.product.id === product.id)?.quantity ?? 0;
    if (
      product.trackInventory &&
      product.stockQuantity !== undefined &&
      currentQuantity + 1 > product.stockQuantity
    ) {
      setError(`${product.name} does not have enough stock.`);
      return;
    }

    setError("");
    setCart((current) => {
      const line = current.find((item) => item.product.id === product.id);
      return line
        ? current.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...current, { product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, change: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.product.id === productId
            ? { ...line, quantity: Math.max(0, line.quantity + change) }
            : line
        )
        .filter((line) => line.quantity > 0)
    );
  }

  function setItemQuantity(productId: string, value: string) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const line = cart.find((item) => item.product.id === productId);
    if (
      line?.product.trackInventory &&
      line.product.stockQuantity !== undefined &&
      amount > line.product.stockQuantity
    ) {
      setError(`${line.product.name} does not have enough stock.`);
      return;
    }
    setError("");
    setCart((current) =>
      current.map((item) =>
        item.product.id === productId ? { ...item, quantity: amount } : item
      )
    );
  }

  function handleBarcodeEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    const code = search.trim().toLowerCase();
    const match = sellableProducts.find(
      (product) =>
        product.barcode?.toLowerCase() === code ||
        product.sku?.toLowerCase() === code
    );
    if (match) {
      event.preventDefault();
      addToCart(match);
      setSearch("");
    }
  }

  function printInvoice(sale: BusinessSale) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setError("Invoice was saved, but the browser blocked the print window.");
      return;
    }

    const rows = sale.items
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.name)}</td><td>${item.quantity}</td><td>${currencyLabel} ${item.unitPrice.toFixed(2)}</td><td>${currencyLabel} ${(item.unitPrice * item.quantity).toFixed(2)}</td></tr>`
      )
      .join("");
    printWindow.document.write(
      `<!doctype html><html><head><title>${escapeHtml(sale.invoiceNumber)}</title><style>body{font:14px Arial;max-width:760px;margin:40px auto;color:#172033}header{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding-bottom:16px}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{text-align:left;padding:10px;border-bottom:1px solid #eee}.total{text-align:right;margin-top:24px}</style></head><body><header><div><h1>${escapeHtml(sale.businessName)}</h1><p>Customer invoice</p></div><div><strong>${escapeHtml(sale.invoiceNumber)}</strong><p>${new Date(sale.createdAt).toLocaleString()}</p></div></header><p>Customer: ${escapeHtml(sale.customerName || "Walk-in")}${sale.staffName ? ` · Staff: ${escapeHtml(sale.staffName)}` : ""}</p><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><div class="total"><p>Subtotal: ${currencyLabel} ${sale.subtotal.toFixed(2)}</p><p>Discount: ${currencyLabel} ${sale.discount.toFixed(2)}</p><p>Tax: ${currencyLabel} ${sale.tax.toFixed(2)}</p><h2>Total: ${currencyLabel} ${sale.total.toFixed(2)}</h2><p>Payment: ${sale.paymentMethod}</p></div><script>window.onload=()=>window.print();</script></body></html>`
    );
    printWindow.document.close();
  }

  function completePayment() {
    if (!cart.length) {
      setError("Add at least one product or service before payment.");
      return;
    }

    try {
      const now = new Date().toISOString();
      const sale: BusinessSale = {
        id: crypto.randomUUID(),
        name: `Invoice ${Date.now()}`,
        invoiceNumber: `INV-${Date.now()}`,
        items: cart.map(({ product, quantity }) => ({
          productId: product.id,
          name: product.name,
          type: product.type || "Product",
          quantity,
          unitPrice: product.price,
          purchasePrice: product.purchasePrice || 0,
        })),
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total,
        paymentMethod,
        status: "Paid",
        customerName,
        staffName,
        businessName,
        currency,
        createdAt: now,
      };
      const updatedSales = [sale, ...sales];
      const updatedProducts = products.map((product) => {
        const soldLine = cart.find((line) => line.product.id === product.id);
        if (!soldLine || !product.trackInventory) return product;

        const stockQuantity = product.stockQuantity ?? 0;
        if (stockQuantity < soldLine.quantity) {
          throw new Error(`${product.name} does not have enough stock.`);
        }
        return { ...product, stockQuantity: stockQuantity - soldLine.quantity };
      });
      const previousMovements =
        getBusinessRecords<BusinessRecord>("stock-movements", businessType);
      const stockMovements = cart
        .filter(({ product }) => product.trackInventory)
        .map(({ product, quantity }) => ({
          id: crypto.randomUUID(),
          name: `POS stock-out: ${product.name}`,
          productId: product.id,
          productName: product.name,
          direction: "out" as const,
          quantity,
          reason: sale.invoiceNumber,
          createdAt: now,
        }));

      saveBusinessRecords("sales", businessType, updatedSales);
      saveBusinessProducts(businessType, updatedProducts);
      if (stockMovements.length) {
        saveBusinessRecords("stock-movements", businessType, [
          ...stockMovements,
          ...previousMovements,
        ]);
      }
      setSales(updatedSales);
      setProducts(updatedProducts);
      setCart([]);
      setDiscount("0");
      setCustomerName("");
      setStaffName("");
      setError("");
      printInvoice(sale);
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Unable to complete payment."
      );
    }
  }

  if (!ready) {
    return <div className="p-8 text-sm text-slate-500">Loading point of sale...</div>;
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-600">{businessName}</p>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {businessType === "salon" ? "Services & Products Billing" : "Sales Point of Sale"}
            </h1>
          </div>
          <div className="rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-sm">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} items
          </div>
        </header>

        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <label className="relative mb-4 block">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={handleBarcodeEnter}
                placeholder="Search products, services, SKU or barcode..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-blue-500"
              />
            </label>
            {visibleProducts.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visibleProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-400 hover:bg-blue-50/50"
                  >
                    <span className="text-xs font-semibold uppercase text-slate-400">
                      {product.type || "Product"} · {product.category}
                    </span>
                    <span className="mt-2 block font-bold text-slate-800">{product.name}</span>
                    <span className="mt-1 block text-sm font-bold text-blue-700">
                      {currencyLabel} {product.price.toLocaleString()}
                    </span>
                    {product.trackInventory && (
                      <span className="mt-2 block text-xs text-slate-500">
                        Stock: {product.stockQuantity ?? "Not tracked"} {product.unit || ""}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-8 text-center">
                <ShoppingCart className="mx-auto text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-700">No available items</p>
                <p className="mt-1 text-xs text-slate-500">Add products or services from the catalog first.</p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Current Invoice</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <select value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5">
                <option value="">Walk-in customer</option>
                {customers.map((customer) => <option key={customer.id}>{customer.name}</option>)}
              </select>
              {businessType === "salon" && (
                <select value={staffName} onChange={(event) => setStaffName(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5">
                  <option value="">Assign staff member</option>
                  {staff.filter((member) => member.active !== false && member.availability !== "Unavailable").map((member) => <option key={member.id}>{member.name}</option>)}
                </select>
              )}
            </div>

            <div className="my-4 max-h-64 space-y-3 overflow-y-auto">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{product.name}</p>
                    <p className="text-xs text-slate-500">{currencyLabel} {product.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button aria-label={`Decrease ${product.name}`} onClick={() => changeQuantity(product.id, -1)} className="rounded-lg border p-1.5"><Minus size={14} /></button>
                    <input
                      aria-label={`Quantity of ${product.name}`}
                      type="number"
                      min="0.001"
                      step="any"
                      value={quantity}
                      onChange={(event) => setItemQuantity(product.id, event.target.value)}
                      className="w-16 rounded-lg border px-1 py-1 text-center text-sm"
                    />
                    <button aria-label={`Increase ${product.name}`} onClick={() => addToCart(product)} className="rounded-lg border p-1.5"><Plus size={14} /></button>
                    <button aria-label={`Remove ${product.name}`} onClick={() => setCart((current) => current.filter((line) => line.product.id !== product.id))} className="rounded-lg p-1.5 text-red-500"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
              {!cart.length && <p className="py-5 text-center text-sm text-slate-400">Choose items to start an invoice.</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-slate-500">Discount amount
                <input type="number" min="0" max={subtotal} step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-800" />
              </label>
              <label className="text-xs font-semibold text-slate-500">Tax %
                <input type="number" min="0" step="0.01" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-800" />
              </label>
            </div>
            <div className="my-4 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{currencyLabel} {subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>-{currencyLabel} {discountAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{currencyLabel} {taxAmount.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-extrabold"><span>Total</span><span>{currencyLabel} {total.toFixed(2)}</span></div>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {(["Cash", "Card"] as const).map((method) => {
                const Icon = method === "Cash" ? Banknote : CreditCard;
                return (
                  <button key={method} onClick={() => setPaymentMethod(method)} className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-sm font-semibold ${paymentMethod === method ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200"}`}>
                    <Icon size={16} /> {method}
                  </button>
                );
              })}
            </div>
            <button onClick={completePayment} disabled={!cart.length} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
              <Printer className="mr-2 inline" size={17} /> Complete payment & print invoice
            </button>
          </section>
        </div>

        <section className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-bold">Recent payments</h2>
          <div className="divide-y divide-slate-100">
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div><p className="font-semibold">{sale.invoiceNumber}</p><p className="text-xs text-slate-500">{sale.customerName || "Walk-in"} · {new Date(sale.createdAt).toLocaleString()}</p></div>
                <div className="flex items-center gap-3"><span className="font-bold">{currencyLabel} {sale.total.toFixed(2)}</span><button aria-label={`Print ${sale.invoiceNumber}`} onClick={() => printInvoice(sale)} className="rounded-lg border p-2 text-blue-600"><Printer size={15} /></button></div>
              </div>
            ))}
            {!sales.length && <p className="py-3 text-sm text-slate-400">No payments recorded yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
