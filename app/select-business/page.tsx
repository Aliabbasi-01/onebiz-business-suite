
"use client";

import { useState } from "react";
import {
  Utensils,
  Coffee,
  Pizza,
  Scissors,
  ShoppingBag,
  ShoppingBasket,
  Store,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Search,
} from "lucide-react";

const businesses = [
  { id: "restaurant", name: "Restaurant", description: "Tables, orders, kitchen & billing", icon: Utensils, color: "bg-orange-50 text-orange-600" },
  { id: "cafe", name: "Cafe / Coffee Shop", description: "Coffee, menu & takeaway orders", icon: Coffee, color: "bg-amber-50 text-amber-600" },
  { id: "pizza", name: "Pizza Shop", description: "Pizza menu, toppings & delivery", icon: Pizza, color: "bg-red-50 text-red-600" },
  { id: "salon", name: "Salon / Spa", description: "Services, staff & appointments", icon: Scissors, color: "bg-pink-50 text-pink-600" },
  { id: "retail", name: "Retail Store", description: "Products, barcode & sales", icon: ShoppingBag, color: "bg-blue-50 text-blue-600" },
  { id: "grocery", name: "Grocery Store", description: "Stock, groceries & inventory", icon: ShoppingBasket, color: "bg-green-50 text-green-600" },
  { id: "other", name: "Other Business", description: "Configure your own business", icon: Store, color: "bg-purple-50 text-purple-600" },
];

export default function SelectBusinessPage() {
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");

  const filteredBusinesses = businesses.filter((business) =>
    business.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleContinue() {
    if (!selected) return;

    const business = businesses.find((item) => item.id === selected);

    if (business) {
      localStorage.setItem("onebiz_business_type", business.id);
      window.location.href = "/business-setup";
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc]">
      <header className="flex h-20 items-center justify-between border-b border-slate-100 bg-white px-5 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
            <Store size={23} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">OneBiz</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Business Suite</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-xs font-semibold text-slate-400 sm:flex">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          Step 1 of 2
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <Sparkles size={24} />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            Let's get started
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            What type of business do you run?
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
            Choose your business type. We'll customize OneBiz to match your daily workflow.
          </p>
        </div>

        <div className="mx-auto mt-9 max-w-md">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-400">
            <Search size={19} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your business..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="mx-auto mt-7 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBusinesses.map((business) => {
            const Icon = business.icon;
            const active = selected === business.id;

            return (
              <button
                key={business.id}
                onClick={() => setSelected(business.id)}
                className={`group relative flex items-start gap-4 rounded-2xl border bg-white p-5 text-left transition duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  active
                    ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-100"
                    : "border-slate-200 hover:border-blue-200"
                }`}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${business.color}`}>
                  <Icon size={23} />
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">{business.name}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {business.description}
                  </p>
                </div>

                {active && (
                  <CheckCircle2 size={21} className="shrink-0 text-blue-600" />
                )}
              </button>
            );
          })}
        </div>

        {filteredBusinesses.length === 0 && (
          <p className="mt-8 text-center text-sm text-slate-500">
            No business found. Try another search.
          </p>
        )}

        <div className="mx-auto mt-9 flex max-w-5xl flex-col-reverse items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
          <button
            onClick={() => window.location.href = "/"}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft size={17} /> Back to Login
          </button>

          <button
            onClick={handleContinue}
            disabled={!selected}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            Continue to Setup <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <footer className="pb-6 text-center text-xs text-slate-400">
        © 2026 OneBiz. One Platform. Every Business.
      </footer>
    </main>
  );
}
