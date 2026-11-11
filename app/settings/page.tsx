
"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Store,
  Globe,
  Receipt,
  ShoppingBag,
  Printer,
  Database,
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  LogOut,
} from "lucide-react";
import { logoutUser } from "@/lib/auth";

type BusinessProfile = {
  ownerUserId?: string;
  businessType?: string;
  businessName?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  currency?: string;
  [key: string]: unknown;
};

type AppSettings = {
  taxEnabled: boolean;
  taxName: string;
  taxRate: string;
  receiptHeader: string;
  receiptFooter: string;
  showAddress: boolean;
  showPhone: boolean;
  defaultOrderType: string;
  paperSize: string;
};

const DEFAULT_SETTINGS: AppSettings = {
  taxEnabled: false,
  taxName: "GST",
  taxRate: "0",
  receiptHeader: "",
  receiptFooter: "Thank you for visiting!",
  showAddress: true,
  showPhone: true,
  defaultOrderType: "Dine In",
  paperSize: "80mm",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

export default function SettingsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<BusinessProfile>({});
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeSection, setActiveSection] = useState("business");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    try {
      const savedProfile = JSON.parse(
        localStorage.getItem("onebiz_business_profile") || "{}"
      );

      const userId = String(savedProfile.ownerUserId || "");
      const settingsKey = userId
        ? `onebiz_settings_${userId}`
        : "onebiz_settings";

      const savedSettings = JSON.parse(
        localStorage.getItem(settingsKey) || "{}"
      );

      setProfile(savedProfile);
      setSettings({
        ...DEFAULT_SETTINGS,
        ...savedSettings,
      });
    } catch (error) {
      console.error("Settings loading failed:", error);
    } finally {
      setReady(true);
    }
  }, []);

  function updateProfile(field: keyof BusinessProfile, value: string) {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function updateSetting<K extends keyof AppSettings>(
    field: K,
    value: AppSettings[K]
  ) {
    setSettings((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function saveAllSettings() {
    try {
      const userId = String(profile.ownerUserId || "");

      localStorage.setItem(
        "onebiz_business_profile",
        JSON.stringify(profile)
      );

      if (userId) {
        localStorage.setItem(
          `onebiz_business_profile_${userId}`,
          JSON.stringify(profile)
        );
        localStorage.setItem(
          `onebiz_settings_${userId}`,
          JSON.stringify(settings)
        );
      } else {
        localStorage.setItem("onebiz_settings", JSON.stringify(settings));
      }

      localStorage.setItem(
        "onebiz_business_type",
        String(profile.businessType || "restaurant")
      );

      setMessage("Settings saved successfully.");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Settings save failed:", error);
      setMessage("Unable to save settings.");
    }
  }

  function resetSettings() {
    if (!window.confirm("Reset all settings to default values?")) {
      return;
    }

    setSettings(DEFAULT_SETTINGS);
    setMessage("Default values loaded. Click Save Changes to apply.");
  }

  async function handleLogout() {
    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    try {
      setLoggingOut(true);
      await logoutUser();
      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
      setMessage("Unable to logout. Please try again.");
      setLoggingOut(false);
    }
  }

  function downloadBackup() {
    try {
      const backup: Record<string, unknown> = {};

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("onebiz_")) {
          const value = localStorage.getItem(key);

          if (value !== null) {
            backup[key] = value;
          }
        }
      });

      const file = new Blob(
        [
          JSON.stringify(
            {
              app: "OneBiz",
              version: 1,
              exportedAt: new Date().toISOString(),
              data: backup,
            },
            null,
            2
          ),
        ],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(file);
      const link = document.createElement("a");

      link.href = url;
      link.download = "onebiz-backup.json";
      link.click();

      URL.revokeObjectURL(url);

      setMessage("Backup downloaded successfully.");
    } catch (error) {
      console.error("Backup failed:", error);
      setMessage("Backup could not be created.");
    }
  }

  function restoreBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));

        if (
          parsed.app !== "OneBiz" ||
          !parsed.data ||
          typeof parsed.data !== "object"
        ) {
          alert("Invalid OneBiz backup file.");
          return;
        }

        if (
          !window.confirm(
            "Restore this backup? Existing matching OneBiz data will be replaced."
          )
        ) {
          event.target.value = "";
          return;
        }

        Object.entries(parsed.data).forEach(([key, value]) => {
          if (key.startsWith("onebiz_") && typeof value === "string") {
            localStorage.setItem(key, value);
          }
        });

        alert("Backup restored. The page will reload.");
        window.location.reload();
      } catch {
        alert("Unable to read this backup file.");
      } finally {
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  }

  function testPrint() {
    const businessName = String(
      profile.businessName || "OneBiz Business"
    );

    const address = settings.showAddress
      ? String(profile.address || "")
      : "";

    const phone = settings.showPhone
      ? String(profile.phone || "")
      : "";

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow pop-ups to test printing.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Printer Test</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            width: 300px;
            margin: 20px auto;
            text-align: center;
            color: #111;
          }
          h2 { margin-bottom: 6px; }
          p { font-size: 13px; margin: 5px 0; }
          hr { border: 0; border-top: 1px dashed #777; margin: 15px 0; }
          .footer { margin-top: 25px; }
          @media print {
            body { margin: 0 auto; }
          }
        </style>
      </head>
      <body>
        <h2>${businessName.replace(/[&<>"']/g, "")}</h2>
        <p>${address.replace(/[&<>"']/g, "")}</p>
        <p>${phone.replace(/[&<>"']/g, "")}</p>
        <hr />
        <h3>PRINTER TEST</h3>
        <p>OneBiz POS</p>
        <p>Paper Size: ${settings.paperSize}</p>
        <hr />
        <p class="footer">${settings.receiptFooter.replace(/[&<>"']/g, "")}</p>
        <script>
          window.addEventListener("afterprint", function() {
            window.close();
          });
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  }

  const sections = [
    { id: "business", label: "Business Profile", icon: Store },
    { id: "regional", label: "Regional & Tax", icon: Globe },
    { id: "receipt", label: "Receipt Settings", icon: Receipt },
    { id: "orders", label: "Order Settings", icon: ShoppingBag },
    { id: "printer", label: "Printer Settings", icon: Printer },
    { id: "backup", label: "Data Backup", icon: Database },
  ];

  if (!ready) return null;

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Settings size={16} />
              System Configuration
            </div>

            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              Settings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your business and POS preferences.
            </p>
          </div>

          <button
            onClick={saveAllSettings}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Save size={17} />
            Save Changes
          </button>
        </div>

        {message && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
          <aside className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
            <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Settings Menu
            </p>

            <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-x-visible">
              {sections.map((section) => {
                const Icon = section.icon;
                const active = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={18} />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="space-y-6 lg:col-span-3">
            {activeSection === "business" && (
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-xl font-bold text-slate-900">
                  Business Profile
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your business information and contact details.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Business Name</label>
                    <input
                      className={inputClass}
                      value={String(profile.businessName || "")}
                      onChange={(e) =>
                        updateProfile("businessName", e.target.value)
                      }
                      placeholder="Your business name"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Owner Name</label>
                    <input
                      className={inputClass}
                      value={String(profile.ownerName || "")}
                      onChange={(e) =>
                        updateProfile("ownerName", e.target.value)
                      }
                      placeholder="Owner name"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <input
                      className={inputClass}
                      value={String(profile.phone || "")}
                      onChange={(e) =>
                        updateProfile("phone", e.target.value)
                      }
                      placeholder="03XX XXXXXXX"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input
                      type="email"
                      className={inputClass}
                      value={String(profile.email || "")}
                      onChange={(e) =>
                        updateProfile("email", e.target.value)
                      }
                      placeholder="business@example.com"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>Business Address</label>
                    <textarea
                      className={inputClass}
                      rows={3}
                      value={String(profile.address || "")}
                      onChange={(e) =>
                        updateProfile("address", e.target.value)
                      }
                      placeholder="Complete business address"
                    />
                  </div>
                </div>
              </section>
            )}

            {activeSection === "regional" && (
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-xl font-bold text-slate-900">
                  Regional & Tax Settings
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Configure currency and tax preferences.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Currency</label>
                    <select
                      className={inputClass}
                      value={String(profile.currency || "Rs")}
                      onChange={(e) =>
                        updateProfile("currency", e.target.value)
                      }
                    >
                      <option value="Rs">PKR - Pakistani Rupee (Rs)</option>
                      <option value="$">USD - US Dollar ($)</option>
                      <option value="£">GBP - British Pound (£)</option>
                      <option value="€">EUR - Euro (€)</option>
                      <option value="SAR">SAR - Saudi Riyal</option>
                      <option value="AED">AED - UAE Dirham</option>
                      <option value="INR">INR - Indian Rupee</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Tax Name</label>
                    <input
                      className={inputClass}
                      value={settings.taxName}
                      onChange={(e) =>
                        updateSetting("taxName", e.target.value)
                      }
                      placeholder="GST / VAT / Sales Tax"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Tax Percentage (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className={inputClass}
                      value={settings.taxRate}
                      onChange={(e) =>
                        updateSetting("taxRate", e.target.value)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                    <div>
                      <p className="font-semibold text-slate-800">
                        Enable Tax
                      </p>
                      <p className="text-xs text-slate-500">
                        Save tax preference for POS configuration.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={settings.taxEnabled}
                      onChange={(e) =>
                        updateSetting("taxEnabled", e.target.checked)
                      }
                      className="h-5 w-5 accent-blue-600"
                    />
                  </div>
                </div>

                <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  Tax settings are saved as preferences. They will not change
                  existing order totals until tax calculation is connected to
                  the POS checkout.
                </p>
              </section>
            )}

            {activeSection === "receipt" && (
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-xl font-bold text-slate-900">
                  Receipt Settings
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Customize the information shown on receipts.
                </p>

                <div className="mt-6 space-y-5">
                  <div>
                    <label className={labelClass}>Receipt Header</label>
                    <textarea
                      className={inputClass}
                      rows={3}
                      value={settings.receiptHeader}
                      onChange={(e) =>
                        updateSetting("receiptHeader", e.target.value)
                      }
                      placeholder="Welcome to our restaurant..."
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Receipt Footer</label>
                    <textarea
                      className={inputClass}
                      rows={3}
                      value={settings.receiptFooter}
                      onChange={(e) =>
                        updateSetting("receiptFooter", e.target.value)
                      }
                      placeholder="Thank you for visiting!"
                    />
                  </div>

                  <label className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                    <span className="text-sm font-semibold text-slate-700">
                      Show business address on receipt
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.showAddress}
                      onChange={(e) =>
                        updateSetting("showAddress", e.target.checked)
                      }
                      className="h-5 w-5 accent-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                    <span className="text-sm font-semibold text-slate-700">
                      Show phone number on receipt
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.showPhone}
                      onChange={(e) =>
                        updateSetting("showPhone", e.target.checked)
                      }
                      className="h-5 w-5 accent-blue-600"
                    />
                  </label>
                </div>
              </section>
            )}

            {activeSection === "orders" && (
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-xl font-bold text-slate-900">
                  Order Settings
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Configure your preferred order defaults.
                </p>

                <div className="mt-6 space-y-5">
                  <div>
                    <label className={labelClass}>Default Order Type</label>
                    <select
                      className={inputClass}
                      value={settings.defaultOrderType}
                      onChange={(e) =>
                        updateSetting("defaultOrderType", e.target.value)
                      }
                    >
                      <option value="Dine In">Dine In</option>
                      <option value="Takeaway">Takeaway</option>
                      <option value="Delivery">Delivery</option>
                    </select>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="font-semibold text-blue-900">
                      Order preferences
                    </p>
                    <p className="mt-1 text-sm text-blue-800">
                      Your selected default is saved for future POS
                      integration. Existing orders will not be changed.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {activeSection === "printer" && (
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-xl font-bold text-slate-900">
                  Printer Settings
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Configure receipt paper preferences and test printing.
                </p>

                <div className="mt-6 space-y-5">
                  <div>
                    <label className={labelClass}>Receipt Paper Size</label>
                    <select
                      className={inputClass}
                      value={settings.paperSize}
                      onChange={(e) =>
                        updateSetting("paperSize", e.target.value)
                      }
                    >
                      <option value="58mm">58mm Thermal Printer</option>
                      <option value="80mm">80mm Thermal Printer</option>
                      <option value="A4">A4 Paper</option>
                    </select>
                  </div>

                  <button
                    onClick={testPrint}
                    className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100"
                  >
                    <Printer size={18} />
                    Test Print
                  </button>

                  <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                    Printing currently uses your browser's print dialog.
                    Direct thermal printer connection and automatic
                    cutting are not integrated yet.
                  </p>
                </div>
              </section>
            )}

            {activeSection === "backup" && (
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-xl font-bold text-slate-900">
                  Data Backup & Restore
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Protect your locally stored OneBiz data.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-5">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Download size={22} />
                    </div>

                    <h3 className="font-bold text-slate-900">
                      Download Backup
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Export your OneBiz local data into a JSON backup file.
                    </p>

                    <button
                      onClick={downloadBackup}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
                    >
                      <Download size={17} />
                      Download Backup
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-5">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Upload size={22} />
                    </div>

                    <h3 className="font-bold text-slate-900">
                      Restore Backup
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Restore data from a previously downloaded OneBiz JSON
                      backup.
                    </p>

                    <label className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700">
                      <Upload size={17} />
                      Select Backup File
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={restoreBackup}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  Keep your backup file safe. Restoring a backup replaces
                  matching OneBiz data stored in this browser.
                </div>
              </section>
            )}

            <div className="flex flex-wrap justify-between gap-3">
              <button
                onClick={resetSettings}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <RotateCcw size={16} />
                Reset Preferences
              </button>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut size={17} />
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>

                <button
                  onClick={saveAllSettings}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
                >
                  <Save size={17} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
