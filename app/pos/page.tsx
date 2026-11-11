
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Search, Plus, Minus, Trash2, ShoppingCart,
  CheckCircle2, Coffee, Utensils, Store, Truck, Armchair,
  AlertCircle, Receipt, CreditCard, Banknote, X, Printer,
  ImagePlus, RefreshCw,
} from "lucide-react";

import { createKOT } from "@/lib/kot";
import { getProducts, type Product } from "@/lib/products";
import { getOrders, saveOrders } from "@/lib/orders";
import type { SavedOrder } from "@/types/order";
import BusinessPOS from "@/components/BusinessPOS";

type CartItem = Product & { quantity: number };
type OrderType = SavedOrder["orderType"];
type PaymentMethod = NonNullable<SavedOrder["paymentMethod"]>;

const TERMINAL_STATUSES = ["Paid", "Completed", "Cancelled"];

function mergeItems(oldItems: CartItem[], newItems: CartItem[]) {
  const merged = oldItems.map((item) => ({ ...item }));

  newItems.forEach((newItem) => {
    const existing = merged.find((item) => item.id === newItem.id);

    if (existing) existing.quantity += newItem.quantity;
    else merged.push({ ...newItem });
  });

  return merged;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#039;",
    };
    return entities[char];
  });
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [existingOrder, setExistingOrder] = useState<SavedOrder | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [currency, setCurrency] = useState("PKR");
  const [businessName, setBusinessName] = useState("Your Business");
  const [businessType, setBusinessType] = useState("");
  const [tableCount, setTableCount] = useState(0);

  const [orderType, setOrderType] = useState<OrderType>("Dine In");
  const [selectedTable, setSelectedTable] = useState("");
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [processing, setProcessing] = useState(false);

  const [showPendingOrders, setShowPendingOrders] = useState(false);

  const isRestaurant = ["restaurant", "cafe", "pizza"].includes(businessType);

  const pendingOrders = useMemo(
    () => orders.filter((order) => !TERMINAL_STATUSES.includes(order.status)),
    [orders]
  );

  const refreshOrders = () => {
    try {
      setOrders(getOrders());
    } catch {
      setOrders([]);
    }
  };

  const loadOrder = (order: SavedOrder) => {
    setExistingOrder(order);
    setCurrentOrderId(order.id);
    setOrderType(order.orderType);
    setSelectedTable(order.tableNumber || "");
    setCart([]);
    setSaved(false);
    setError("");
    setShowPayment(false);
    setShowPendingOrders(false);

    window.history.replaceState(null, "", `/pos?orderId=${encodeURIComponent(order.id)}`);
  };

  const startNewOrder = (type: OrderType = "Dine In") => {
    setExistingOrder(null);
    setCurrentOrderId(null);
    setCart([]);
    setOrderType(type);
    setSelectedTable("");
    setSaved(false);
    setError("");
    setShowPayment(false);
    setShowPendingOrders(false);

    window.history.replaceState(null, "", "/pos?newOrder=1");
  };

  // LOAD PROFILE, PRODUCTS AND ORDER
  useEffect(() => {
    setProducts(getProducts());

    try {
      const profile = JSON.parse(
        localStorage.getItem("onebiz_business_profile") || "{}"
      );

      const type =
        profile.businessType ||
        localStorage.getItem("onebiz_business_type") ||
        "";

      setCurrency(profile.currency || "PKR");
      setBusinessName(profile.businessName || "Your Business");
      setBusinessType(type);

      const count = Number(profile.tableCount || 0);
      setTableCount(
        Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
      );

      const savedOrders = getOrders();

      setOrders(savedOrders);

      const params = new URLSearchParams(window.location.search);
      const orderId = params.get("orderId");
      const tableParam = params.get("table");

      if (orderId) {
        const found = savedOrders.find(
          (order) =>
            order.id === orderId &&
            !TERMINAL_STATUSES.includes(order.status)
        );

        if (found) {
          setExistingOrder(found);
          setCurrentOrderId(found.id);
          setOrderType(found.orderType);
          setSelectedTable(found.tableNumber || "");
        } else {
          setError("Order not found or already completed.");
        }
      } else if (tableParam && /^\d+$/.test(tableParam)) {
        const number = Number(tableParam);

        if (number < 1 || number > count) {
          setError("Invalid table number.");
        } else {
          const table = String(number);
          setOrderType("Dine In");
          setSelectedTable(table);

          const found = savedOrders.find(
            (order) =>
              order.orderType === "Dine In" &&
              order.tableNumber === table &&
              !TERMINAL_STATUSES.includes(order.status)
          );

          if (found) {
            setExistingOrder(found);
            setCurrentOrderId(found.id);
          }
        }
      }
    } catch {
      setError("Business profile or order data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(products.map((product) => product.category).filter(Boolean))
      ),
    ],
    [products]
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesCategory =
          category === "All" || product.category === category;
        const matchesSearch = product.name
          .toLowerCase()
          .includes(search.toLowerCase());

        return matchesCategory && matchesSearch && product.available;
      }),
    [products, category, search]
  );

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [cart]
  );

  const oldSubtotal =
    existingOrder?.items?.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    ) ?? 0;

  const grandTotal = oldSubtotal + subtotal;

  const oldItemCount =
    existingOrder?.items?.reduce(
      (total, item) => total + item.quantity,
      0
    ) ?? 0;

  const newItemCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalItems = oldItemCount + newItemCount;

  const formatPrice = (amount: number) => {
    const symbol = currency === "PKR" ? "Rs." : currency;
    return `${symbol} ${amount.toLocaleString("en-PK")}`;
  };

  const addToCart = (product: Product) => {
    setSaved(false);
    setError("");

    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setSaved(false);
    setError("");

    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setSaved(false);
    setError("");
    setCart((current) => current.filter((item) => item.id !== id));
  };

  const handleOrderTypeChange = (type: OrderType) => {
    if (currentOrderId) return;
    startNewOrder(type);
  };

  const handleTableSelect = (table: string) => {
    const found = pendingOrders.find(
      (order) =>
        order.orderType === "Dine In" &&
        order.tableNumber === table
    );

    if (found) {
      loadOrder(found);
    } else {
      setSelectedTable(table);
      setError("");
    }
  };

  // SAVE ORDER AND GENERATE KOT
  const saveOrder = () => {
    setError("");

    if (cart.length === 0) {
      setError("Please add products before sending KOT.");
      return;
    }

    if (orderType === "Dine In" && !selectedTable) {
      setError("Please select a table for this Dine In order.");
      return;
    }

    try {
      const latestOrders = getOrders();

      const now = new Date().toISOString();

      const existingIndex = currentOrderId
        ? latestOrders.findIndex((order) => order.id === currentOrderId)
        : -1;

      let updatedOrder: SavedOrder;

      if (existingIndex !== -1) {
        const previous = latestOrders[existingIndex];
        const combinedItems = mergeItems(previous.items || [], cart);
        const total = combinedItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        updatedOrder = {
          ...previous,
          items: combinedItems,
          subtotal: total,
          total,
          status: "Pending",
          updatedAt: now,
        };

        latestOrders[existingIndex] = updatedOrder;
      } else {
        updatedOrder = {
          id: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          businessName,
          businessType,
          orderType,
          tableNumber: orderType === "Dine In" ? selectedTable : null,
          items: cart.map((item) => ({ ...item })),
          subtotal,
          total: subtotal,
          currency,
          status: "Pending",
          createdAt: now,
          updatedAt: now,
        };

        latestOrders.unshift(updatedOrder);
      }

      saveOrders(latestOrders);
      setOrders(latestOrders);

      if (isRestaurant) {
        const kot = createKOT({
          orderId: updatedOrder.id,
          businessName,
          tableNumber: orderType === "Dine In" ? selectedTable : null,
          orderType,
          items: cart.map((item, index) => ({
            id: index + 1,
            name: item.name,
            quantity: item.quantity,
          })),
        });

        window.location.href = `/kot/${kot.id}`;
        return;
      }

      setExistingOrder(updatedOrder);
      setCurrentOrderId(updatedOrder.id);
      setCart([]);
      setSaved(true);
    } catch {
      setError("Unable to save order or generate KOT. Please try again.");
    }
  };

  // CUSTOMER INVOICE PRINT
  const printInvoice = (order: SavedOrder) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return false;

    const invoiceItems = order.items
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.name)}</td>
            <td>${item.quantity}</td>
            <td>${formatPrice(item.price)}</td>
            <td>${formatPrice(item.price * item.quantity)}</td>
          </tr>
        `
      )
      .join("");

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${escapeHtml(order.invoiceNumber || order.id)}</title>
        <meta charset="UTF-8" />
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial,sans-serif; color:#1e293b; padding:30px; max-width:800px; margin:auto; }
          h1 { margin-bottom:5px; }
          .muted { color:#64748b; font-size:13px; }
          .top { display:flex; justify-content:space-between; border-bottom:2px solid #e2e8f0; padding-bottom:20px; }
          .details { margin:25px 0; line-height:1.8; }
          table { width:100%; border-collapse:collapse; }
          th,td { padding:12px 8px; border-bottom:1px solid #e2e8f0; text-align:left; font-size:13px; }
          th { background:#f1f5f9; }
          .total { margin-top:25px; margin-left:auto; width:260px; text-align:right; }
          .grand { font-size:22px; font-weight:bold; border-top:2px solid #1e293b; padding-top:12px; }
          .footer { margin-top:45px; text-align:center; color:#64748b; font-size:13px; }
          @media print { body { padding:0; } }
        </style>
      </head>
      <body>
        <div class="top">
          <div>
            <h1>${escapeHtml(order.businessName)}</h1>
            <div class="muted">Customer Invoice</div>
          </div>
          <div style="text-align:right">
            <strong>${escapeHtml(order.invoiceNumber || order.id)}</strong>
            <div class="muted">${new Date(order.paidAt || order.createdAt).toLocaleString()}</div>
          </div>
        </div>
        <div class="details">
          <div><strong>Order:</strong> ${escapeHtml(order.id)}</div>
          <div><strong>Order Type:</strong> ${escapeHtml(order.orderType)}</div>
          ${order.tableNumber ? `<div><strong>Table:</strong> ${escapeHtml(order.tableNumber)}</div>` : ""}
          <div><strong>Payment:</strong> ${escapeHtml(order.paymentMethod || "Cash")}</div>
        </div>
        <table>
          <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>${invoiceItems}</tbody>
        </table>
        <div class="total">
          <p>Subtotal: ${formatPrice(order.subtotal)}</p>
          <p>Tax: ${formatPrice(0)}</p>
          <div class="grand">Total: ${formatPrice(order.total)}</div>
        </div>
        <div class="footer">
          <strong>Thank you for visiting!</strong>
          <p>${escapeHtml(order.businessName)}</p>
        </div>
        <script>
          window.onload = function() { window.focus(); window.print(); };
          window.onafterprint = function() { window.close(); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    return true;
  };

  const generateFinalBill = () => {
    setError("");

    if (orderType === "Dine In" && !selectedTable) {
      setError("Please select a table first.");
      return;
    }

    if (totalItems === 0) {
      setError("There are no items to generate a bill.");
      return;
    }

    setShowPayment(true);
  };

  // COMPLETE PAYMENT FOR THE SELECTED ORDER ONLY
  const completePayment = () => {
    if (processing) return;

    setError("");
    setProcessing(true);

    try {
      const latestOrders = getOrders();

      const now = new Date().toISOString();

      const existingIndex = currentOrderId
        ? latestOrders.findIndex((order) => order.id === currentOrderId)
        : -1;

      const latestExisting =
        existingIndex !== -1 ? latestOrders[existingIndex] : null;

      const finalItems = mergeItems(
        latestExisting?.items || existingOrder?.items || [],
        cart
      );

      if (finalItems.length === 0) {
        setError("There are no items to bill.");
        setProcessing(false);
        return;
      }

      const finalSubtotal = finalItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const orderId = latestExisting?.id || `ORD-${Date.now()}`;
      const invoiceNumber = `INV-${Date.now()}`;

      const paidOrder: SavedOrder = {
        ...(latestExisting || {}),
        id: orderId,
        businessName,
        businessType,
        orderType,
        tableNumber: orderType === "Dine In" ? selectedTable : null,
        items: finalItems,
        subtotal: finalSubtotal,
        total: finalSubtotal,
        currency,
        status: "Paid",
        createdAt: latestExisting?.createdAt || now,
        updatedAt: now,
        paymentMethod,
        paidAt: now,
        invoiceNumber,
      };

      if (existingIndex !== -1) {
        latestOrders[existingIndex] = paidOrder;
      } else {
        latestOrders.unshift(paidOrder);
      }

      saveOrders(latestOrders);
      setOrders(latestOrders);
      setShowPayment(false);

      const printOpened = printInvoice(paidOrder);

      if (!printOpened) {
        alert(
          "Bill successfully generated! Browser ne print window block kar di. Dashboard par ja kar Reports se invoice dobara print kar sakte hain."
        );
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Payment could not be completed. Please try again.");
      setProcessing(false);
    }
  };

  const backToDashboard = () => {
    window.location.href = "/dashboard";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading POS...
      </div>
    );
  }

  if (!isRestaurant) {
    return (
      <BusinessPOS
        businessType={businessType}
        businessName={businessName}
        currency={currency}
      />
    );
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-slate-50 text-slate-800">

      {/* Header */}
      <header className="relative z-20 flex min-h-[64px] flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 sm:px-4">

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={backToDashboard}
            className="shrink-0 rounded-lg border border-slate-200 p-2 hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight sm:text-lg">
              Point of Sale
            </h1>
            <p className="truncate text-[11px] text-slate-500">
              {businessName}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">

          <button
            onClick={() => setShowPendingOrders((value) => !value)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-[11px] font-bold text-amber-800 sm:flex-none sm:px-3 sm:text-xs"
          >
            <Receipt size={15} />
            Pending ({pendingOrders.length})
          </button>

          <button
            onClick={() => startNewOrder("Dine In")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-2 py-2 text-[11px] font-bold text-white hover:bg-indigo-700 sm:flex-none sm:px-3 sm:text-xs"
          >
            <Plus size={15} />
            New Order
          </button>

          <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-50 px-2 py-2 text-xs font-semibold text-indigo-700 sm:flex-none sm:px-3 sm:text-sm">
            <ShoppingCart size={16} />
            {totalItems} Items
          </div>
        </div>
      </header>

      {/* Pending Orders Popup */}
      {showPendingOrders && (
        <div className="fixed right-2 top-3 z-40 max-h-[85dvh] w-[calc(100vw-16px)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-2xl sm:right-4 sm:top-4 sm:w-[420px]">

          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-bold">Pending Orders</h2>
              <p className="text-[11px] text-slate-500">
                Select an order to generate its bill.
              </p>
            </div>

            <button
              onClick={() => setShowPendingOrders(false)}
              className="rounded-lg p-1 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>

          {pendingOrders.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500">
              No pending orders.
            </p>
          ) : (
            <div className="space-y-2">
              {pendingOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => loadOrder(order)}
                  className={`w-full rounded-lg border p-3 text-left transition hover:border-indigo-400 hover:bg-indigo-50 ${
                    currentOrderId === order.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">
                      {order.orderType}
                    </span>

                    <span className="rounded bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-1 flex justify-between gap-2 text-[11px] text-slate-500">
                    <span>
                      {order.tableNumber
                        ? `Table ${order.tableNumber}`
                        : order.id}
                    </span>

                    <span className="font-bold text-slate-800">
                      {formatPrice(order.total)}
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] text-slate-400">
                    {order.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    )} items · {new Date(order.createdAt).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={refreshOrders}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-xs font-semibold hover:bg-slate-50"
          >
            <RefreshCw size={13} />
            Refresh Orders
          </button>
        </div>
      )}

      {/* Main POS Layout */}
      <main className="grid grid-cols-1 gap-3 p-2 sm:p-3 lg:h-[calc(100dvh-64px)] lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_350px] xl:grid-cols-[minmax(0,1fr)_380px]">

        {/* Products Section */}
        <section className="flex min-h-[65vh] min-w-0 flex-col overflow-hidden lg:min-h-0">

          {isRestaurant && (
            <div className="mb-2 shrink-0 rounded-xl border border-slate-200 bg-white p-2">

              <div className="flex flex-wrap items-center gap-2">
                {([
                  { type: "Dine In", icon: Armchair },
                  { type: "Takeaway", icon: Store },
                  { type: "Delivery", icon: Truck },
                ] as const).map((option) => {
                  const Icon = option.icon;
                  const active = orderType === option.type;

                  return (
                    <button
                      key={option.type}
                      onClick={() => handleOrderTypeChange(option.type)}
                      disabled={Boolean(currentOrderId)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        active
                          ? "border-indigo-500 bg-indigo-600 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-indigo-50"
                      }`}
                    >
                      <Icon size={15} />
                      {option.type}
                    </button>
                  );
                })}

                {currentOrderId && (
                  <button
                    onClick={() => startNewOrder(orderType)}
                    className="ml-auto text-[11px] font-bold text-indigo-600 hover:underline"
                  >
                    + New Order
                  </button>
                )}
              </div>

              {orderType === "Dine In" && (
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">

                  <span className="shrink-0 text-xs font-semibold text-slate-500">
                    Table:
                  </span>

                  {selectedTable ? (
                    <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                      <Armchair size={14} />
                      Table {selectedTable}
                      {currentOrderId && (
                        <span className="text-green-700">· Saved Order</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
                      {Array.from(
                        { length: tableCount },
                        (_, index) => String(index + 1)
                      ).map((number) => (
                        <button
                          key={number}
                          onClick={() => handleTableSelect(number)}
                          className="shrink-0 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold hover:border-indigo-400 hover:bg-indigo-50"
                        >
                          {number}
                        </button>
                      ))}

                      {tableCount === 0 && (
                        <span className="text-xs text-red-500">
                          No tables configured.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!isRestaurant && (
            <div className="mb-2 flex shrink-0 items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2">
              <Store size={16} className="text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-800">
                New Sale · {businessName}
              </span>
            </div>
          )}

          {/* Search */}
          <div className="mb-2 flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
            <Search size={17} className="text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full min-w-0 bg-transparent py-2.5 text-sm outline-none"
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="mb-2 flex shrink-0 gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-lg px-4 py-2 text-xs font-bold transition ${
                  category === item
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">

                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex min-h-[155px] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-indigo-300 hover:shadow-md sm:min-h-[170px]"
                  >
                    <div className="flex h-20 shrink-0 items-center justify-center overflow-hidden bg-slate-100 sm:h-24">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-400">
                          {product.category.toLowerCase().includes("drink") ? (
                            <Coffee size={25} />
                          ) : (
                            <Utensils size={25} />
                          )}
                          <span className="text-[9px]">No image</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-2 sm:p-2.5">
                      <p className="truncate text-[10px] font-semibold text-indigo-600">
                        {product.category}
                      </p>

                      <h3 className="mt-0.5 line-clamp-2 min-h-8 text-xs font-bold leading-tight">
                        {product.name}
                      </h3>

                      <div className="mt-auto flex items-center justify-between gap-1 pt-2">
                        <span className="min-w-0 truncate text-[11px] font-bold text-slate-800 sm:text-xs">
                          {formatPrice(product.price)}
                        </span>

                        <button
                          onClick={() => addToCart(product)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 active:scale-95"
                          title="Add product"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">

                <ImagePlus size={32} className="mb-3 text-slate-400" />

                <p className="text-sm font-bold text-slate-700">
                  {products.length === 0
                    ? "Your menu is empty"
                    : "No available products found"}
                </p>

                <p className="mt-1 max-w-xs text-xs text-slate-500">
                  {products.length === 0
                    ? "Add products from Menu Management to start selling."
                    : "Try another category or make a product available from Menu."}
                </p>

                <a
                  href="/menu"
                  className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Manage Menu
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Cart Section */}
        <aside className="flex min-h-[450px] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white lg:min-h-0">

          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-3">

            <div>
              <h2 className="font-bold">Current Order</h2>
              <p className="text-[11px] text-slate-500">
                {totalItems} items in total
              </p>
            </div>

            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <ShoppingCart size={19} />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">

            {isRestaurant && (
              <div className="mb-3 rounded-lg bg-slate-50 p-2.5">

                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Order Type</span>
                  <span className="font-bold">{orderType}</span>
                </div>

                {orderType === "Dine In" && (
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-slate-500">Table</span>
                    <span className="font-bold">
                      {selectedTable ? `Table ${selectedTable}` : "Not selected"}
                    </span>
                  </div>
                )}

                {currentOrderId && (
                  <p className="mt-2 border-t border-slate-200 pt-2 text-[10px] font-semibold text-green-700">
                    Selected order · {currentOrderId}
                  </p>
                )}
              </div>
            )}

            {existingOrder && existingOrder.items.length > 0 && (
              <div className="mb-4">

                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700">
                    Previous Items
                  </h3>

                  <span className="rounded-md bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700">
                    Saved
                  </span>
                </div>

                <div className="space-y-2">
                  {existingOrder.items.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">
                          {item.name}
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {formatPrice(item.price)} × {item.quantity}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs font-bold">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700">
                New Items
              </h3>

              <span className="rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700">
                {newItemCount} items
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="flex min-h-[110px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 text-center">
                <ShoppingCart size={25} className="mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">
                  No new items
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Add products from the menu.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-100 p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">

                      <div className="min-w-0">
                        <h3 className="truncate text-xs font-semibold">
                          {item.name}
                        </h3>

                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="rounded-md p-1 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="rounded-md border border-slate-200 p-1 hover:bg-slate-100"
                        >
                          <Minus size={12} />
                        </button>

                        <span className="w-4 text-center text-xs font-bold">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="rounded-md border border-slate-200 p-1 hover:bg-slate-100"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <span className="text-xs font-bold">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          <div className="shrink-0 border-t border-slate-200 bg-white p-3">

            <div className="mb-3 space-y-1.5 text-xs">

              {existingOrder && (
                <div className="flex justify-between text-slate-500">
                  <span>Previous Order</span>
                  <span>{formatPrice(oldSubtotal)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>New Items</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span>{formatPrice(0)}</span>
              </div>

              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold">
                <span>Grand Total</span>
                <span className="text-indigo-600">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            <button
              onClick={saveOrder}
              disabled={cart.length === 0 || (orderType === "Dine In" && !selectedTable)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Printer size={16} />
              Save Order & Print KOT
            </button>

            <button
              onClick={generateFinalBill}
              disabled={totalItems === 0}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-xs font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Receipt size={16} />
              Generate Final Bill
            </button>

            {error && (
              <p className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 p-2 text-[11px] font-medium text-red-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}

            {saved && (
              <p className="mt-2 flex items-center gap-2 rounded-lg bg-green-50 p-2 text-[11px] font-medium text-green-700">
                <CheckCircle2 size={14} />
                Order saved successfully!
              </p>
            )}
          </div>
        </aside>
      </main>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-3 sm:p-4">

          <div className="my-auto w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl sm:p-5">

            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold">
                  Complete Payment
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Select payment method and generate the bill.
                </p>
              </div>

              <button
                onClick={() => setShowPayment(false)}
                disabled={processing}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mb-4 rounded-xl bg-indigo-50 p-4">
              <p className="text-xs text-indigo-700">
                Amount to Pay
              </p>

              <h3 className="mt-1 text-2xl font-bold text-indigo-700">
                {formatPrice(grandTotal)}
              </h3>

              <p className="mt-2 text-[11px] text-indigo-600">
                {totalItems} items · {orderType}
                {selectedTable ? ` · Table ${selectedTable}` : ""}
              </p>
            </div>

            <h3 className="mb-2 text-xs font-bold">
              Payment Method
            </h3>

            <div className="grid grid-cols-2 gap-3">

              <button
                onClick={() => setPaymentMethod("Cash")}
                disabled={processing}
                className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition ${
                  paymentMethod === "Cash"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Banknote size={24} />
                <span className="text-sm font-bold">Cash</span>
              </button>

              <button
                onClick={() => setPaymentMethod("Card")}
                disabled={processing}
                className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition ${
                  paymentMethod === "Card"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <CreditCard size={24} />
                <span className="text-sm font-bold">Card</span>
              </button>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
              <Printer size={15} className="mt-0.5 shrink-0" />
              Bill generate hone ke baad print dialog khulega. Wahan printer ya Save as PDF select kar sakte hain.
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">

              <button
                onClick={() => setShowPayment(false)}
                disabled={processing}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={completePayment}
                disabled={processing}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Receipt size={16} />
                {processing ? "Generating..." : "Generate Bill"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
