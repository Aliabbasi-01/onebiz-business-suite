"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChartNoAxesCombined,
  ShoppingCart,
  Wallet,
  TrendingUp,
  CalendarDays,
  CreditCard,
  Banknote,
  Package,
  FileDown,
} from "lucide-react";
import { getOrders } from "@/lib/orders";
import type { SavedOrder } from "@/types/order";
import BusinessModule from "@/components/BusinessModule";

type Period = "today" | "7days" | "30days" | "all";

type DailySale = {
  label: string;
  total: number;
};

type OrderTypeSummary = {
  name: string;
  totalOrders: number;
  paidOrders: number;
  revenue: number;
};

const money = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

const safeDate = (value: string | Date | null | undefined) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value: string | Date | null | undefined) => {
  const date = safeDate(value);

  return date
    ? date.toLocaleString("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "N/A";
};
const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });

function getOrderType(orderType: string | undefined) {
  const type = String(orderType || "").toLowerCase();

  if (type.includes("dine")) return "Dine In";
  if (type.includes("take")) return "Takeaway";
  if (type.includes("deliver")) return "Delivery";

  return orderType || "Other";
}

export default function ReportsPage() {
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [period, setPeriod] = useState<Period>("7days");
  const [currency, setCurrency] = useState("Rs");
  const [businessType, setBusinessType] = useState("restaurant");
  const [businessProfile, setBusinessProfile] = useState<
    Record<string, unknown>
  >({});
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const profile = JSON.parse(
        localStorage.getItem("onebiz_business_profile") || "{}"
      );

      setBusinessProfile(profile);
      setCurrency(profile.currency || "Rs");
      setBusinessType(profile.businessType || "restaurant");
      setOrders(getOrders());
      setCurrentDate(new Date());
    } catch (error) {
      console.error("Reports initialization failed:", error);
      setCurrentDate(new Date());
    } finally {
      setReady(true);
    }
  }, []);

  const filteredOrders = useMemo(() => {
    if (!currentDate) return [];

    const start = new Date(currentDate);

    if (period === "today") {
      start.setHours(0, 0, 0, 0);
    } else if (period === "7days") {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (period === "30days") {
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    } else {
      start.setTime(0);
    }

    return orders.filter((order) => {
      if (order.businessType !== businessType) return false;

      const date = safeDate(order.createdAt);
      return date !== null && date >= start;
    });
  }, [orders, period, businessType, currentDate]);

  const paidOrders = filteredOrders.filter((order) =>
    ["Paid", "Completed"].includes(order.status)
  );

  const pendingOrders = filteredOrders.filter(
    (order) =>
      !["Paid", "Completed", "Cancelled"].includes(order.status)
  );

  const cancelledOrders = filteredOrders.filter(
    (order) => order.status === "Cancelled"
  );

  const revenue = paidOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  const averageOrder =
    paidOrders.length > 0 ? revenue / paidOrders.length : 0;

  const cashTotal = paidOrders
    .filter((order) => order.paymentMethod === "Cash")
    .reduce((sum, order) => sum + order.total, 0);

  const cardTotal = paidOrders
    .filter((order) => order.paymentMethod === "Card")
    .reduce((sum, order) => sum + order.total, 0);

  const orderTypeSummary = useMemo<OrderTypeSummary[]>(() => {
    const types = ["Dine In", "Takeaway", "Delivery", "Other"];

    return types
      .map((name) => {
        const typeOrders = filteredOrders.filter(
          (order) => getOrderType(order.orderType) === name
        );

        const typePaid = typeOrders.filter((order) =>
          ["Paid", "Completed"].includes(order.status)
        );

        return {
          name,
          totalOrders: typeOrders.length,
          paidOrders: typePaid.length,
          revenue: typePaid.reduce(
            (sum, order) => sum + order.total,
            0
          ),
        };
      })
      .filter((item) => item.totalOrders > 0);
  }, [filteredOrders]);

  const dailySales = useMemo<DailySale[]>(() => {
    if (!currentDate) return [];

    const days =
      period === "today" ? 1 : period === "30days" ? 30 : 7;

    const result: DailySale[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const total = paidOrders
        .filter((order) => {
          const paidDate = safeDate(order.paidAt || order.createdAt);

          return (
            paidDate !== null &&
            paidDate >= date &&
            paidDate < nextDay
          );
        })
        .reduce((sum, order) => sum + order.total, 0);

      result.push({
        label: date.toLocaleDateString("en", {
          day: "numeric",
          month: "short",
        }),
        total,
      });
    }

    return result;
  }, [paidOrders, period, currentDate]);

  const maxSale = Math.max(
    ...dailySales.map((day) => day.total),
    1
  );

  const popularItems = useMemo(() => {
    const map = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();

    paidOrders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = map.get(item.id) || {
          name: item.name,
          quantity: 0,
          revenue: 0,
        };

        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;

        map.set(item.id, existing);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [paidOrders]);

  function exportPDF() {
    const businessName = String(
      businessProfile.businessName || "OneBiz Restaurant"
    );

    const address = String(businessProfile.address || "");
    const phone = String(businessProfile.phone || "");
    const ownerName = String(businessProfile.ownerName || "");

    const periodLabel = {
      today: "Today",
      "7days": "Last 7 Days",
      "30days": "Last 30 Days",
      all: "All Time",
    }[period];

    const paymentTotal = cashTotal + cardTotal;

    const typeRows = orderTypeSummary
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.name)}</td>
            <td>${item.totalOrders}</td>
            <td>${item.paidOrders}</td>
            <td>${escapeHtml(money(item.revenue, currency))}</td>
          </tr>
        `
      )
      .join("");

    const itemRows = popularItems
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.name)}</td>
            <td>${item.quantity}</td>
            <td>${escapeHtml(money(item.revenue, currency))}</td>
          </tr>
        `
      )
      .join("");

    const orderRows = [...filteredOrders]
      .sort((a, b) => {
        const dateA = safeDate(a.createdAt)?.getTime() || 0;
        const dateB = safeDate(b.createdAt)?.getTime() || 0;
        return dateB - dateA;
      })
      .map((order) => {
        const orderData = order as SavedOrder & {
          tableNumber?: string | number;
          table?: string | number;
        };

        const table =
          orderData.tableNumber || orderData.table || "-";

        return `
          <tr>
            <td>${escapeHtml(order.id)}</td>
            <td>${escapeHtml(formatDate(order.createdAt))}</td>
            <td>${escapeHtml(getOrderType(order.orderType))}</td>
            <td>${escapeHtml(table)}</td>
            <td>${escapeHtml(order.paymentMethod || "N/A")}</td>
            <td>${escapeHtml(order.status)}</td>
            <td class="amount">${escapeHtml(money(order.total, currency))}</td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>OneBiz Sales Report</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 28px;
            font-size: 12px;
          }

          .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 18px;
            margin-bottom: 22px;
          }

          h1 {
            font-size: 25px;
            margin: 0 0 7px;
            color: #0f172a;
          }

          h2 {
            font-size: 16px;
            margin: 26px 0 12px;
            color: #0f172a;
          }

          p {
            margin: 4px 0;
            color: #64748b;
          }

          .report-meta {
            text-align: right;
          }

          .cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 22px;
          }

          .card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 13px;
            background: #f8fafc;
          }

          .card span {
            display: block;
            color: #64748b;
            font-size: 10px;
            margin-bottom: 7px;
          }

          .card strong {
            font-size: 17px;
            color: #0f172a;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }

          th {
            background: #eff6ff;
            color: #1e40af;
            text-align: left;
            font-weight: bold;
          }

          th, td {
            padding: 9px 8px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
          }

          tbody tr:nth-child(even) {
            background: #f8fafc;
          }

          .amount {
            text-align: right;
            white-space: nowrap;
            font-weight: bold;
          }

          .summary {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .summary-box {
            padding: 13px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
          }

          .summary-box strong {
            font-size: 15px;
          }

          .footer {
            margin-top: 28px;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            text-align: center;
            color: #94a3b8;
            font-size: 10px;
          }

          .empty {
            text-align: center;
            color: #94a3b8;
            padding: 18px;
          }

          @page {
            size: A4 landscape;
            margin: 12mm;
          }

          @media print {
            body {
              padding: 0;
            }

            h2 {
              break-after: avoid;
            }

            tr {
              break-inside: avoid;
            }

            .card, .summary-box {
              break-inside: avoid;
            }
          }
        </style>
      </head>

      <body>
        <div class="header">
          <div>
            <h1>${escapeHtml(businessName)}</h1>
            <p>${escapeHtml(address)}</p>
            <p>${escapeHtml(phone)}</p>
            <p>${ownerName ? `Owner: ${escapeHtml(ownerName)}` : ""}</p>
          </div>

          <div class="report-meta">
            <h1>Sales Report</h1>
            <p><strong>Period:</strong> ${escapeHtml(periodLabel)}</p>
            <p><strong>Generated:</strong> ${escapeHtml(formatDate(currentDate))}</p>
            <p><strong>Currency:</strong> ${escapeHtml(currency)}</p>
          </div>
        </div>

        <h2>1. Sales Overview</h2>

        <div class="cards">
          <div class="card">
            <span>Total Revenue</span>
            <strong>${escapeHtml(money(revenue, currency))}</strong>
          </div>

          <div class="card">
            <span>Total Orders</span>
            <strong>${filteredOrders.length}</strong>
          </div>

          <div class="card">
            <span>Paid / Completed</span>
            <strong>${paidOrders.length}</strong>
          </div>

          <div class="card">
            <span>Pending Orders</span>
            <strong>${pendingOrders.length}</strong>
          </div>

          <div class="card">
            <span>Cancelled Orders</span>
            <strong>${cancelledOrders.length}</strong>
          </div>

          <div class="card">
            <span>Average Paid Order</span>
            <strong>${escapeHtml(money(averageOrder, currency))}</strong>
          </div>
        </div>

        <h2>2. Order Type Breakdown</h2>

        <table>
          <thead>
            <tr>
              <th>Order Type</th>
              <th>Total Orders</th>
              <th>Paid Orders</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${
              typeRows ||
              '<tr><td colspan="4" class="empty">No orders found</td></tr>'
            }
          </tbody>
        </table>

        <h2>3. Payment Summary</h2>

        <div class="summary">
          <div class="summary-box">
            <p>Cash Collection</p>
            <strong>${escapeHtml(money(cashTotal, currency))}</strong>
          </div>

          <div class="summary-box">
            <p>Card Collection</p>
            <strong>${escapeHtml(money(cardTotal, currency))}</strong>
          </div>

          <div class="summary-box">
            <p>Total Recorded Cash / Card</p>
            <strong>${escapeHtml(money(paymentTotal, currency))}</strong>
          </div>

          <div class="summary-box">
            <p>Other / Unspecified Payment</p>
            <strong>${escapeHtml(money(Math.max(revenue - paymentTotal, 0), currency))}</strong>
          </div>
        </div>

        <h2>4. Best Selling Menu Items</h2>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item Name</th>
              <th>Quantity Sold</th>
              <th>Sales Amount</th>
            </tr>
          </thead>
          <tbody>
            ${
              itemRows ||
              '<tr><td colspan="4" class="empty">No sales items found</td></tr>'
            }
          </tbody>
        </table>

        <h2>5. Complete Order Details</h2>

        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date / Time</th>
              <th>Order Type</th>
              <th>Table</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${
              orderRows ||
              '<tr><td colspan="7" class="empty">No orders found for this period</td></tr>'
            }
          </tbody>
        </table>

        <div class="footer">
          Generated by OneBiz POS · One Platform. Every Business.
          <br />
          This report is based on locally stored order records.
        </div>

        <script>
          // Print complete hone ya cancel hone par
          // sirf ye temporary print window close hogi.
          window.addEventListener("afterprint", function () {
            window.close();
          });

          window.onload = function () {
            window.focus();

            setTimeout(function () {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow pop-ups to generate the PDF report.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  if (
    ready &&
    !["restaurant", "cafe", "pizza"].includes(businessType)
  ) {
    return <BusinessModule module="reports" />;
  }
  if (!ready || !currentDate) return null;

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <ChartNoAxesCombined size={16} />
              Business Analytics
            </div>

            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              Reports
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track sales, revenue and restaurant performance.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
            >
              <FileDown size={17} />
              Download PDF
            </button>

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Revenue",
              value: money(revenue, currency),
              icon: Wallet,
              color: "blue",
            },
            {
              label: "Paid Orders",
              value: paidOrders.length,
              icon: ShoppingCart,
              color: "emerald",
            },
            {
              label: "Average Order",
              value: money(averageOrder, currency),
              icon: TrendingUp,
              color: "violet",
            },
            {
              label: "Pending Orders",
              value: pendingOrders.length,
              icon: CalendarDays,
              color: "amber",
            },
          ].map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-500">
                    {card.label}
                  </p>

                  <div
                    className={`rounded-xl p-3 ${
                      card.color === "blue"
                        ? "bg-blue-50 text-blue-600"
                        : card.color === "emerald"
                        ? "bg-emerald-50 text-emerald-600"
                        : card.color === "violet"
                        ? "bg-violet-50 text-violet-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
            <h2 className="text-lg font-bold text-slate-900">
              Sales Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Revenue from paid orders
            </p>

            <div className="mt-8 flex h-64 items-end gap-2 sm:gap-4">
              {dailySales.map((day) => (
                <div
                  key={day.label}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-[10px] font-semibold text-slate-500 sm:text-xs">
                    {day.total > 0 ? day.total.toLocaleString() : ""}
                  </span>

                  <div className="flex h-48 w-full items-end">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-cyan-400 transition-all"
                      style={{
                        height: `${Math.max(
                          (day.total / maxSale) * 100,
                          day.total > 0 ? 5 : 0
                        )}%`,
                      }}
                    />
                  </div>

                  <span className="text-[10px] text-slate-400 sm:text-xs">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Payment Methods
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Breakdown of received payments
            </p>

            <div className="mt-7 space-y-6">
              {[
                {
                  name: "Cash",
                  total: cashTotal,
                  icon: Banknote,
                  color: "bg-emerald-500",
                },
                {
                  name: "Card",
                  total: cardTotal,
                  icon: CreditCard,
                  color: "bg-blue-500",
                },
              ].map((method) => {
                const Icon = method.icon;
                const percentage = revenue
                  ? (method.total / revenue) * 100
                  : 0;

                return (
                  <div key={method.name}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Icon size={18} />
                        {method.name}
                      </div>

                      <span className="text-sm font-bold text-slate-900">
                        {money(method.total, currency)}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${method.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <p className="mt-1 text-right text-xs text-slate-400">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Order Type Breakdown
            </h2>

            <div className="mt-5 space-y-4">
              {orderTypeSummary.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between border-b border-slate-100 pb-3"
                >
                  <div>
                    <p className="font-bold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.totalOrders} orders · {item.paidOrders} paid
                    </p>
                  </div>

                  <p className="text-sm font-bold text-slate-800">
                    {money(item.revenue, currency)}
                  </p>
                </div>
              ))}

              {orderTypeSummary.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">
                  No orders available.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Popular Menu Items
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Best selling items
            </p>

            <div className="mt-5 space-y-4">
              {popularItems.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-600">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {item.name}
                    </p>

                    <p className="text-xs text-slate-400">
                      {item.quantity} sold
                    </p>
                  </div>

                  <p className="text-sm font-bold text-slate-800">
                    {money(item.revenue, currency)}
                  </p>
                </div>
              ))}

              {popularItems.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">
                  No paid sales available.
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Order Summary
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total Orders", value: filteredOrders.length },
              { label: "Paid", value: paidOrders.length },
              { label: "Pending", value: pendingOrders.length },
              { label: "Cancelled", value: cancelledOrders.length },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}