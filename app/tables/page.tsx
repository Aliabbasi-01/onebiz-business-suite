
"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Armchair,
  Clock,
  Plus,
  RefreshCw,
  ShoppingBag,
  Utensils,
  Trash2,
  Check,
} from "lucide-react";
import { getOrders } from "@/lib/orders";

type Order = {
  id: string;
  orderType?: string;
  tableNumber?: string | null;
  total: number;
  currency?: string;
  status: string;
  items: { name: string; quantity: number }[];
  createdAt: string;
};

type TableInfo = {
  number: number;
  order: Order | null;
};

type BusinessProfile = {
  ownerUserId?: string;
  businessName?: string;
  businessType?: string;
  currency?: string;
  tableCount?: number;
  tableNumbers?: number[];
  [key: string]: unknown;
};

const ACTIVE_ORDER_STATUSES = ["Paid", "Completed", "Cancelled"];

export default function TablesPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [businessName, setBusinessName] = useState("Your Business");
  const [currency, setCurrency] = useState("PKR");
  const [loading, setLoading] = useState(true);
  const [addingTable, setAddingTable] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const getProfile = (): BusinessProfile => {
    return JSON.parse(
      localStorage.getItem("onebiz_business_profile") || "{}"
    );
  };

  const saveProfile = (profile: BusinessProfile) => {
    localStorage.setItem(
      "onebiz_business_profile",
      JSON.stringify(profile)
    );

    if (profile.ownerUserId) {
      localStorage.setItem(
        `onebiz_business_profile_${profile.ownerUserId}`,
        JSON.stringify(profile)
      );
    }

    if (profile.businessType) {
      localStorage.setItem(
        "onebiz_business_type",
        profile.businessType
      );
    }
  };

  const getTableNumbers = (profile: BusinessProfile): number[] => {
    if (Array.isArray(profile.tableNumbers)) {
      return [
        ...new Set(
          profile.tableNumbers
            .map(Number)
            .filter(
              (number) => Number.isInteger(number) && number > 0
            )
        ),
      ].sort((a, b) => a - b);
    }

    const count = Math.max(
      0,
      Math.floor(Number(profile.tableCount) || 0)
    );

    return Array.from({ length: count }, (_, index) => index + 1);
  };

  const showMessage = (
    text: string,
    type: "success" | "error" = "success"
  ) => {
    setMessage(text);
    setMessageType(type);
  };

  const loadTables = () => {
    try {
      const profile = getProfile();
      const numbers = getTableNumbers(profile);

      setBusinessName(profile.businessName || "Your Business");
      setCurrency(profile.currency || "PKR");

      const orders = getOrders() as Order[];

      const activeOrders = orders.filter(
        (order) =>
          order.orderType === "Dine In" &&
          order.tableNumber &&
          !ACTIVE_ORDER_STATUSES.includes(order.status)
      );

      const tableList = numbers.map((number) => {
        const tableOrders = activeOrders.filter(
          (order) => Number(order.tableNumber) === number
        );

        return {
          number,
          order: tableOrders[0] || null,
        };
      });

      setTables(tableList);
    } catch {
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const addTable = () => {
    if (addingTable) return;

    setAddingTable(true);
    setMessage("");

    try {
      const profile = getProfile();
      const numbers = getTableNumbers(profile);

      const nextNumber =
        numbers.length > 0 ? Math.max(...numbers) + 1 : 1;

      const updatedNumbers = [...numbers, nextNumber];

      saveProfile({
        ...profile,
        tableNumbers: updatedNumbers,
        tableCount: updatedNumbers.length,
      });

      loadTables();
      showMessage(`Table ${nextNumber} added successfully!`);
    } catch {
      showMessage("Unable to add table. Please try again.", "error");
    } finally {
      setAddingTable(false);
    }
  };

  const deleteTable = (table: TableInfo) => {
    if (table.order) {
      showMessage(
        `Table ${table.number} has an active order. Complete the order before deleting it.`,
        "error"
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete Table ${table.number}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const profile = getProfile();
      const numbers = getTableNumbers(profile);

      const updatedNumbers = numbers.filter(
        (number) => number !== table.number
      );

      if (updatedNumbers.length === numbers.length) {
        showMessage("Table was not found.", "error");
        return;
      }

      saveProfile({
        ...profile,
        tableNumbers: updatedNumbers,
        tableCount: updatedNumbers.length,
      });

      loadTables();
      showMessage(`Table ${table.number} deleted successfully!`);
    } catch {
      showMessage("Unable to delete table. Please try again.", "error");
    }
  };

  const formatPrice = (amount: number) => {
    const symbol = currency === "PKR" ? "Rs." : currency;

    return `${symbol} ${Number(amount || 0).toLocaleString("en-PK")}`;
  };

  const occupiedCount = tables.filter((table) => table.order).length;
  const availableCount = tables.length - occupiedCount;

  const openTable = (tableNumber: number) => {
    window.location.href = `/pos?table=${tableNumber}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-5 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-100"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <h1 className="text-xl font-bold">Restaurant Tables</h1>
              <p className="text-xs text-slate-500">{businessName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadTables}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={addTable}
              disabled={addingTable}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={18} />
              {addingTable ? "Adding..." : "Add Table"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] p-5">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Manage Your Tables</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add or remove tables and manage your restaurant orders.
          </p>
        </div>

        {message && (
          <div
            className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
              messageType === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {messageType === "success" ? (
              <Check size={17} />
            ) : (
              <Trash2 size={17} />
            )}
            {message}
          </div>
        )}

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Total Tables
              </p>
              <Armchair className="text-indigo-500" size={21} />
            </div>
            <h3 className="mt-3 text-3xl font-bold">{tables.length}</h3>
          </div>

          <div className="rounded-2xl border border-green-100 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Available
              </p>
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <h3 className="mt-3 text-3xl font-bold text-green-600">
              {availableCount}
            </h3>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Running Orders
              </p>
              <Clock className="text-orange-500" size={21} />
            </div>
            <h3 className="mt-3 text-3xl font-bold text-orange-600">
              {occupiedCount}
            </h3>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold">All Tables</h3>

          <div className="flex flex-wrap gap-4 text-xs font-medium">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              Available
            </span>

            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              Running
            </span>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            Loading tables...
          </div>
        ) : tables.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Armchair size={40} className="mx-auto mb-3 text-slate-300" />

            <h3 className="font-bold">No tables configured</h3>

            <p className="mt-2 text-sm text-slate-500">
              Click Add Table to create your first restaurant table.
            </p>

            <button
              onClick={addTable}
              disabled={addingTable}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Plus size={17} />
              Add First Table
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tables.map((table) => {
              const occupied = Boolean(table.order);

              return (
                <div
                  key={table.number}
                  role="button"
                  tabIndex={0}
                  onClick={() => openTable(table.number)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;

                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openTable(table.number);
                    }
                  }}
                  className={`cursor-pointer rounded-2xl border bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    occupied
                      ? "border-orange-200 hover:border-orange-400"
                      : "border-green-200 hover:border-green-400"
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        occupied
                          ? "bg-orange-50 text-orange-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      <Armchair size={24} />
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          occupied
                            ? "bg-orange-50 text-orange-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {occupied ? "Running" : "Available"}
                      </span>

                      <button
                        type="button"
                        title={
                          occupied
                            ? "Cannot delete a table with an active order"
                            : `Delete Table ${table.number}`
                        }
                        disabled={occupied}
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteTable(table);
                        }}
                        className="rounded-lg border border-red-100 p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold">
                    Table {table.number}
                  </h4>

                  {occupied && table.order ? (
                    <div className="mt-3 space-y-2">
                      <p className="flex items-center gap-2 text-xs text-slate-500">
                        <ShoppingBag size={14} />
                        {table.order.items?.reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        ) || 0}{" "}
                        items
                      </p>

                      <p className="text-sm font-bold text-orange-700">
                        {formatPrice(table.order.total)}
                      </p>

                      <p className="text-xs text-slate-400">
                        Order #{table.order.id.slice(-6)}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-sm text-slate-500">
                        No active order
                      </p>

                      <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-green-600">
                        <Plus size={14} />
                        Start New Order
                      </p>
                    </div>
                  )}

                  <div
                    className={`mt-5 flex w-full items-center justify-between border-t border-slate-100 pt-3 ${
                      occupied ? "text-orange-700" : "text-green-700"
                    }`}
                  >
                    <span className="text-xs font-semibold">
                      {occupied ? "Continue Order" : "Open Table"}
                    </span>

                    <Utensils size={17} className="text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
