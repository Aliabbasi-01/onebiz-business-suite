
"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Settings,
  Menu,
  X,
} from "lucide-react";
import { getBusinessConfig } from "@/lib/business-config";
import { getCurrentUser } from "@/lib/auth";

const excludedPaths = ["/", "/select-business", "/business-setup"];

function WorkspaceShellContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [businessType, setBusinessType] = useState("restaurant");
  const [businessName, setBusinessName] = useState("Your Business");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!excludedPaths.includes(pathname) && !getCurrentUser()) {
      window.location.replace("/");
      return;
    }

    try {
      const profile = JSON.parse(
        localStorage.getItem("onebiz_business_profile") || "{}"
      );

      const type =
        profile.businessType ||
        localStorage.getItem("onebiz_business_type") ||
        "restaurant";

      const resolvedType = getBusinessConfig(type).type;

      setBusinessType(resolvedType);
      setBusinessName(profile.businessName || "Your Business");
    } catch {
      setBusinessType("restaurant");
    } finally {
      setReady(true);
    }
  }, [pathname]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isExcluded = excludedPaths.includes(pathname);
  const config = getBusinessConfig(businessType);
  const BusinessIcon = config.icon;

  // Restaurant sidebar se Kitchen / KOT hide.
  // Baqi business types ki navigation unchanged.
  const items =
    businessType === "restaurant"
      ? config.navigation.filter(
          (item) =>
            !item.name.toLowerCase().includes("kitchen") &&
            !item.name.toLowerCase().includes("kot")
        )
      : config.navigation;

  if (isExcluded || !ready) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]">

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-64 flex-col overflow-hidden border-r border-slate-100 bg-white transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >

        {/* Sidebar Header */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-100 px-6">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
              <BusinessIcon size={21} />
            </div>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                OneBiz
              </h1>

              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Business Suite
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Workspace Information */}
        <div className="shrink-0 px-5 pt-6">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Workspace
          </p>

          <div className="mb-4 flex items-center gap-3 rounded-xl bg-blue-50 p-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <BusinessIcon size={20} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">
                {businessName}
              </p>

              <p className="text-xs text-slate-500">
                {config.label || "Business"}
              </p>
            </div>

          </div>
        </div>

        {/* Navigation */}
        <nav
          className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-5 pb-5"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#cbd5e1 transparent",
          }}
        >

          {items.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.path ||
              (item.path !== "/dashboard" &&
                pathname.startsWith(`${item.path}/`));

            return (
              <button
                key={item.path + item.name}
                onClick={() => router.push(item.path)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-200"
                    : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
                }`}
              >
                <Icon size={19} />
                {item.name}
              </button>
            );
          })}

          {/* Settings */}
          <button
            onClick={() => router.push("/settings")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
              pathname === "/settings"
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-200"
                : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
            }`}
          >
            <Settings size={19} />
            Settings
          </button>

        </nav>

        {/* Bottom Welcome Card */}
        <div className="shrink-0 border-t border-slate-100 bg-white p-5">

          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 p-4 text-white">

            <p className="text-sm font-bold">
              Welcome to OneBiz!
            </p>

            <p className="mt-1 text-xs leading-relaxed text-blue-100">
              Manage your business from one simple platform.
            </p>

          </div>
        </div>

      </aside>

      {/* Main Content */}
      <div className="min-h-screen lg:ml-64">

        {/* Mobile Header */}
        <div className="sticky top-0 z-30 flex h-14 items-center border-b border-slate-100 bg-white px-4 lg:hidden">

          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <Menu size={22} />
          </button>

          <span className="ml-3 font-extrabold text-slate-900">
            OneBiz
          </span>

        </div>

        {children}

      </div>
    </div>
  );
}

export default function WorkspaceShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f7fb]">
          {children}
        </div>
      }
    >
      <WorkspaceShellContent>
        {children}
      </WorkspaceShellContent>
    </Suspense>
  );
}
