
"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Store,
  ArrowLeft,
  ArrowRight,
  Building2,
  UserRound,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Utensils,
  Coffee,
  Pizza,
  Scissors,
  ShoppingBag,
  ShoppingBasket,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { saveUserBusinessProfile } from "@/lib/business-profile";

const businessNames: Record<string, string> = {
  restaurant: "Restaurant",
  cafe: "Cafe / Coffee Shop",
  pizza: "Pizza Shop",
  salon: "Salon / Spa",
  retail: "Retail Store",
  grocery: "Grocery Store",
  other: "Other Business",
};

const businessIcons: Record<string, LucideIcon> = {
  restaurant: Utensils,
  cafe: Coffee,
  pizza: Pizza,
  salon: Scissors,
  retail: ShoppingBag,
  grocery: ShoppingBasket,
  other: Store,
};

export default function BusinessSetupPage() {
  const [businessType, setBusinessType] = useState("restaurant");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    phone: "",
    email: "",
    address: "",
    currency: "PKR",
    tableCount: "10",
    staffCount: "3",
    serviceMode: "Both",
    delivery: true,
    takeaway: true,
    barcode: true,
  });

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      window.location.href = "/";
      return;
    }

    const savedType = localStorage.getItem("onebiz_business_type");

    if (savedType && businessNames[savedType]) {
      setBusinessType(savedType);
    }

    setLoading(false);
  }, []);

  const updateField = (field: string, value: string | boolean) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const user = getCurrentUser();

    if (!user) {
      window.location.href = "/";
      return;
    }

    const businessProfile = {
      ...form,
      ownerUserId: user.id,
      businessType,
      createdAt: new Date().toISOString(),
    };

    // Save this user's separate business profile.
    saveUserBusinessProfile(user.id, businessProfile);

    window.location.href = "/dashboard";
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">
          Loading setup...
        </p>
      </div>
    );
  }

  const BusinessIcon = businessIcons[businessType] || Store;

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <header className="flex h-20 items-center justify-between border-b border-slate-100 bg-white px-5 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
            <Store size={23} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">OneBiz</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Business Suite
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 text-xs font-semibold text-slate-400 sm:flex">
          <CheckCircle2 size={16} className="text-green-500" />
          Business selected
          <span className="mx-2">•</span>
          <span className="text-blue-600">Step 2 of 2</span>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-9 sm:px-8">
        <div className="mb-8">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <BusinessIcon size={27} />
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
            Almost there
          </p>

          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            Set up your business
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Tell us a little about your business so we can personalize your OneBiz experience.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
            <BusinessIcon size={17} />
            {businessNames[businessType]}
          </div>

          <button
            onClick={() => (window.location.href = "/select-business")}
            className="ml-3 text-xs font-semibold text-slate-500 underline hover:text-blue-600"
          >
            Change business
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h3 className="flex items-center gap-2 font-bold text-slate-900">
                <Building2 size={19} className="text-blue-600" />
                Business Information
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Enter your business details.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Business Name" icon={<Store size={17} />}>
                <input
                  required
                  value={form.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                  placeholder="e.g. Ali Restaurant"
                  className="field-input"
                />
              </Field>

              <Field label="Owner Name" icon={<UserRound size={17} />}>
                <input
                  required
                  value={form.ownerName}
                  onChange={(e) => updateField("ownerName", e.target.value)}
                  placeholder="Your full name"
                  className="field-input"
                />
              </Field>

              <Field label="Phone Number" icon={<Phone size={17} />}>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+92 300 1234567"
                  className="field-input"
                />
              </Field>

              <Field label="Business Email" icon={<Mail size={17} />}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="business@example.com"
                  className="field-input"
                />
              </Field>

              <Field label="Business Address" icon={<MapPin size={17} />}>
                <input
                  required
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="City, Area, Street"
                  className="field-input"
                />
              </Field>

              <Field label="Currency" icon={<Building2 size={17} />}>
                <select
                  value={form.currency}
                  onChange={(e) => updateField("currency", e.target.value)}
                  className="field-input"
                >
                  <option value="PKR">PKR - Pakistani Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h3 className="font-bold text-slate-900">
                Business Configuration
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                These settings depend on your selected business type.
              </p>
            </div>

            {businessType === "restaurant" && (
              <div className="space-y-5">
                <Field label="Total Number of Tables">
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.tableCount}
                    onChange={(e) => updateField("tableCount", e.target.value)}
                    className="field-input"
                  />
                </Field>

                <Toggle
                  label="Enable Takeaway Orders"
                  checked={form.takeaway}
                  onChange={(value) => updateField("takeaway", value)}
                />

                <Toggle
                  label="Enable Delivery Orders"
                  checked={form.delivery}
                  onChange={(value) => updateField("delivery", value)}
                />
              </div>
            )}

            {businessType === "cafe" && (
              <div className="space-y-5">
                <Field label="Service Mode">
                  <select
                    value={form.serviceMode}
                    onChange={(e) => updateField("serviceMode", e.target.value)}
                    className="field-input"
                  >
                    <option>Both</option>
                    <option>Dine In Only</option>
                    <option>Takeaway Only</option>
                  </select>
                </Field>

                <Field label="Number of Tables">
                  <input
                    type="number"
                    min="0"
                    value={form.tableCount}
                    onChange={(e) => updateField("tableCount", e.target.value)}
                    className="field-input"
                  />
                </Field>
              </div>
            )}

            {businessType === "pizza" && (
              <div className="space-y-5">
                <Toggle
                  label="Enable Delivery"
                  checked={form.delivery}
                  onChange={(value) => updateField("delivery", value)}
                />

                <Toggle
                  label="Enable Takeaway"
                  checked={form.takeaway}
                  onChange={(value) => updateField("takeaway", value)}
                />

                <Field label="Number of Tables (if applicable)">
                  <input
                    type="number"
                    min="0"
                    value={form.tableCount}
                    onChange={(e) => updateField("tableCount", e.target.value)}
                    className="field-input"
                  />
                </Field>
              </div>
            )}

            {businessType === "salon" && (
              <div className="space-y-5">
                <Field label="Number of Staff Members">
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.staffCount}
                    onChange={(e) => updateField("staffCount", e.target.value)}
                    className="field-input"
                  />
                </Field>

                <p className="rounded-xl bg-pink-50 p-3 text-xs leading-5 text-pink-700">
                  You will be able to add services, staff profiles and appointments later.
                </p>
              </div>
            )}

            {(businessType === "retail" || businessType === "grocery") && (
              <div className="space-y-5">
                <Toggle
                  label="Enable Barcode Management"
                  checked={form.barcode}
                  onChange={(value) => updateField("barcode", value)}
                />

                <p className="rounded-xl bg-green-50 p-3 text-xs leading-5 text-green-700">
                  You will be able to manage products, purchases and stock from your dashboard.
                </p>
              </div>
            )}

            {businessType === "other" && (
              <div className="rounded-xl bg-purple-50 p-4 text-sm leading-6 text-purple-700">
                Your business profile will be created with general business management features. You can customize your modules later.
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse items-center justify-between gap-4 pb-5 sm:flex-row">
            <button
              type="button"
              onClick={() => (window.location.href = "/select-business")}
              className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:shadow-xl sm:w-auto"
            >
              Complete Setup
              <ArrowRight size={18} />
            </button>
          </div>
        </form>

        <p className="pb-5 text-center text-xs text-slate-400">
          © 2026 OneBiz. One Platform. Every Business.
        </p>
      </section>

      <style jsx global>{`
        .field-input {
          width: 100%;
          height: 46px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          padding: 0 13px;
          color: #334155;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }
        .field-input:focus {
          border-color: #3b82f6;
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
