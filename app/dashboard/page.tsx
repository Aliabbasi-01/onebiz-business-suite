
"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  ChartNoAxesCombined,
  Users,
  Bell,
  Search,
  Plus,
  Receipt,
  CreditCard,
  Utensils,
  Coffee,
  Pizza,
  Scissors,
  CalendarDays,
  ClipboardList,
  Tags,
  Truck,
  BriefcaseBusiness,
  RefreshCw,
} from "lucide-react";

import { getOrders } from "@/lib/orders";
import type { SavedOrder } from "@/types/order";
import { getBusinessRecords, type BusinessRecord } from "@/lib/business-data";
import { getProducts } from "@/lib/products";
import { getBusinessConfig } from "@/lib/business-config";
import { getCurrentUser } from "@/lib/auth";
import {
  getUserBusinessProfile,
  activateUserBusinessProfile,
} from "@/lib/business-profile";

type BusinessType =
  | "restaurant"
  | "cafe"
  | "pizza"
  | "salon"
  | "retail"
  | "grocery"
  | "other";

type BusinessProfile = {
  businessName?: string;
  ownerName?: string;
  currency?: string;
};

type NavItem = {
  name: string;
  icon: LucideIcon;
  count?: string;
};

type Stat = {
  title: string;
  icon: LucideIcon;
  bg: string;
  iconColor: string;
};

type DashboardSale = BusinessRecord & {
  total: number;
  status: string;
  customerName?: string;
  paymentMethod?: string;
  currency?: string;
  invoiceNumber?: string;
};

type DashboardRecord = BusinessRecord & {
  date?: string;
  status?: string;
  availability?: string;
  active?: boolean;
};

const businessConfig: Record<
  BusinessType,
  {
    label: string;
    navigation: NavItem[];
    quickActions: { name: string; icon: LucideIcon }[];
    stats: Stat[];
    activityTitle: string;
    activityDescription: string;
  }
> = {
  restaurant: {
    label: "Restaurant",
    navigation: [
      { name: "Dashboard", icon: LayoutDashboard },
      { name: "POS / Orders", icon: ShoppingCart },
      { name: "Tables", icon: Utensils },
      { name: "Menu", icon: ClipboardList },
      { name: "Products", icon: Package },
      { name: "Inventory", icon: Warehouse },
      { name: "Customers", icon: Users },
      { name: "Reports", icon: ChartNoAxesCombined },
    ],
    quickActions: [
      { name: "New Order", icon: ShoppingCart },
      { name: "Manage Tables", icon: Utensils },
      { name: "Add Menu Item", icon: Plus },
    ],
    stats: [
      {
        title: "Today's Sales",
        icon: CreditCard,
        bg: "bg-blue-50",
        iconColor: "text-blue-600",
      },
      {
        title: "Total Orders",
        icon: ShoppingCart,
        bg: "bg-purple-50",
        iconColor: "text-purple-600",
      },
      {
        title: "Active Tables",
        icon: Utensils,
        bg: "bg-orange-50",
        iconColor: "text-orange-600",
      },
      {
        title: "Pending Orders",
        icon: Receipt,
        bg: "bg-green-50",
        iconColor: "text-green-600",
      },
    ],
    activityTitle: "Recent Orders",
    activityDescription: "Latest transactions from your restaurant",
  },

  cafe: {
    label: "Cafe / Coffee Shop",
    navigation: [
      { name: "Dashboard", icon: LayoutDashboard },
      { name: "POS / Orders", icon: ShoppingCart },
      { name: "Tables", icon: Utensils },
      { name: "Coffee Menu", icon: Coffee },
      { name: "Products", icon: Package },
      { name: "Inventory", icon: Warehouse },
      { name: "Customers", icon: Users },
      { name: "Reports", icon: ChartNoAxesCombined },
    ],
    quickActions: [
      { name: "New Order", icon: ShoppingCart },
      { name: "Add Coffee Item", icon: Coffee },
      { name: "Manage Tables", icon: Utensils },
      { name: "Manage Stock", icon: Warehouse },
    ],
    stats: [
      {
        title: "Today's Sales",
        icon: CreditCard,
        bg: "bg-blue-50",
        iconColor: "text-blue-600",
      },
      {
        title: "Total Orders",
        icon: ShoppingCart,
        bg: "bg-purple-50",
        iconColor: "text-purple-600",
      },
      {
        title: "Active Tables",
        icon: Utensils,
        bg: "bg-orange-50",
        iconColor: "text-orange-600",
      },
      {
        title: "Pending Orders",
        icon: Receipt,
        bg: "bg-green-50",
        iconColor: "text-green-600",
      },
    ],
    activityTitle: "Recent Orders",
    activityDescription: "Latest cafe transactions",
  },

  pizza: {
    label: "Pizza Shop",
    navigation: [
      { name: "Dashboard", icon: LayoutDashboard },
      { name: "POS / Orders", icon: ShoppingCart },
      { name: "Pizza Menu", icon: Pizza },
      { name: "Products", icon: Package },
      { name: "Inventory", icon: Warehouse },
      { name: "Delivery", icon: Truck },
      { name: "Customers", icon: Users },
      { name: "Reports", icon: ChartNoAxesCombined },
    ],
    quickActions: [
      { name: "New Order", icon: ShoppingCart },
      { name: "New Delivery", icon: Truck },
      { name: "Add Pizza", icon: Pizza },
    ],
    stats: [
      {
        title: "Today's Sales",
        icon: CreditCard,
        bg: "bg-blue-50",
        iconColor: "text-blue-600",
      },
      {
        title: "Total Orders",
        icon: ShoppingCart,
        bg: "bg-purple-50",
        iconColor: "text-purple-600",
      },
      {
        title: "Active Tables",
        icon: Utensils,
        bg: "bg-orange-50",
        iconColor: "text-orange-600",
      },
      {
        title: "Pending Orders",
        icon: Receipt,
        bg: "bg-green-50",
        iconColor: "text-green-600",
      },
    ],
    activityTitle: "Recent Orders",
    activityDescription: "Latest pizza orders and deliveries",
  },

  salon: {
    label: "Salon / Spa",
    navigation: [
      { name: "Dashboard", icon: LayoutDashboard },
      { name: "Appointments", icon: CalendarDays },
      { name: "Services", icon: Scissors },
      { name: "Staff", icon: Users },
      { name: "Customers", icon: Users },
      { name: "Products", icon: Package },
      { name: "Payments", icon: CreditCard },
      { name: "Reports", icon: ChartNoAxesCombined },
    ],
    quickActions: [
      { name: "New Appointment", icon: CalendarDays },
      { name: "Add Service", icon: Scissors },
      { name: "Add Customer", icon: Users },
      { name: "Manage Staff", icon: BriefcaseBusiness },
    ],
    stats: [
      {
        title: "Today's Revenue",
        icon: CreditCard,
        bg: "bg-blue-50",
        iconColor: "text-blue-600",
      },
      {
        title: "Today's Appointments",
        icon: CalendarDays,
        bg: "bg-purple-50",
        iconColor: "text-purple-600",
      },
      {
        title: "Pending Appointments",
        icon: ClipboardList,
        bg: "bg-orange-50",
        iconColor: "text-orange-600",
      },
      {
        title: "Active Staff",
        icon: Users,
        bg: "bg-green-50",
        iconColor: "text-green-600",
      },
    ],
    activityTitle: "Recent Transactions",
    activityDescription: "Latest business transactions",
  },

  retail: {
    label: "Retail Store",
    navigation: [
      { name: "Dashboard", icon: LayoutDashboard },
      { name: "POS / Sales", icon: ShoppingCart },
      { name: "Products", icon: Package },
      { name: "Categories", icon: Tags },
      { name: "Inventory", icon: Warehouse },
      { name: "Customers", icon: Users },
      { name: "Purchases", icon: Receipt },
      { name: "Reports", icon: ChartNoAxesCombined },
    ],
    quickActions: [
      { name: "New Sale", icon: ShoppingCart },
      { name: "Add Product", icon: Package },
      { name: "Manage Stock", icon: Warehouse },
      { name: "New Purchase", icon: Receipt },
    ],
    stats: [
      {
        title: "Today's Sales",
        icon: CreditCard,
        bg: "bg-blue-50",
        iconColor: "text-blue-600",
      },
      {
        title: "Total Orders",
        icon: ShoppingCart,
        bg: "bg-purple-50",
        iconColor: "text-purple-600",
      },
      {
        title: "Active Tables",
        icon: Utensils,
        bg: "bg-orange-50",
        iconColor: "text-orange-600",
      },
      {
        title: "Pending Orders",
        icon: Receipt,
        bg: "bg-green-50",
        iconColor: "text-green-600",
      },
    ],
    activityTitle: "Recent Sales",
    activityDescription: "Latest retail transactions",
  },

  grocery: {
    label: "Grocery Store",
    navigation: [
      { name: "Dashboard", icon: LayoutDashboard },
      { name: "POS / Sales", icon: ShoppingCart },
      { name: "Products", icon: Package },
      { name: "Categories", icon: Tags },
      { name: "Inventory", icon: Warehouse },
      { name: "Purchases", icon: Receipt },
      { name: "Suppliers", icon: Truck },
      { name: "Customers", icon: Users },
      { name: "Reports", icon: ChartNoAxesCombined },
    ],
    quickActions: [
      { name: "New Sale", icon: ShoppingCart },
      { name: "Add Grocery Item", icon: Package },
      { name: "Manage Stock", icon: Warehouse },
      { name: "New Purchase", icon: Receipt },
    ],
    stats: [
      {
        title: "Today's Sales",
        icon: CreditCard,
        bg: "bg-blue-50",
        iconColor: "text-blue-600",
      },
      {
        title: "Total Orders",
        icon: ShoppingCart,
        bg: "bg-purple-50",
        iconColor: "text-purple-600",
      },
      {
        title: "Active Tables",
        icon: Utensils,
        bg: "bg-orange-50",
        iconColor: "text-orange-600",
      },
      {
        title: "Pending Orders",
        icon: Receipt,
        bg: "bg-green-50",
        iconColor: "text-green-600",
      },
    ],
    activityTitle: "Recent Sales",
    activityDescription: "Latest grocery transactions",
  },

  other: {
    label: "Other Business",
    navigation: [
      { name: "Dashboard", icon: LayoutDashboard },
      { name: "Sales / Orders", icon: ShoppingCart },
      { name: "Products", icon: Package },
      { name: "Inventory", icon: Warehouse },
      { name: "Customers", icon: Users },
      { name: "Reports", icon: ChartNoAxesCombined },
    ],
    quickActions: [
      { name: "New Sale", icon: ShoppingCart },
      { name: "Add Product", icon: Package },
      { name: "Add Customer", icon: Users },
      { name: "View Reports", icon: ChartNoAxesCombined },
    ],
    stats: [
      {
        title: "Today's Sales",
        icon: CreditCard,
        bg: "bg-blue-50",
        iconColor: "text-blue-600",
      },
      {
        title: "Total Orders",
        icon: ShoppingCart,
        bg: "bg-purple-50",
        iconColor: "text-purple-600",
      },
      {
        title: "Active Tables",
        icon: Utensils,
        bg: "bg-orange-50",
        iconColor: "text-orange-600",
      },
      {
        title: "Pending Orders",
        icon: Receipt,
        bg: "bg-green-50",
        iconColor: "text-green-600",
      },
    ],
    activityTitle: "Recent Activity",
    activityDescription: "Latest business transactions",
  },
};

const TERMINAL_STATUSES = ["Paid", "Completed", "Cancelled"];

const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const isSameDay = (first: Date, second: Date) =>
  getDateKey(first) === getDateKey(second);

const formatAmount = (amount: number) =>
  amount.toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  });

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-PK");
};

export default function DashboardPage() {
  const [businessType, setBusinessType] =
    useState<BusinessType>("restaurant");

  const [profile, setProfile] = useState<BusinessProfile>({});
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [businessSales, setBusinessSales] = useState<DashboardSale[]>([]);
  const [appointments, setAppointments] = useState<DashboardRecord[]>([]);
  const [staffMembers, setStaffMembers] = useState<DashboardRecord[]>([]);
  const [catalogSize, setCatalogSize] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [formattedDate, setFormattedDate] = useState("");
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshDashboard = () => {
    setOrders(getOrders());
    const type = localStorage.getItem("onebiz_business_type") || "restaurant";
    setBusinessSales(getBusinessRecords<DashboardSale>("sales", type));
    setAppointments(getBusinessRecords<DashboardRecord>("appointments", type));
    setStaffMembers(getBusinessRecords<DashboardRecord>("staff", type));
    const products = getProducts();
    setCatalogSize(products.length);
    setLowStockCount(
      products.filter(
        (product) =>
          product.trackInventory &&
          (product.stockQuantity || 0) <= (product.lowStockThreshold || 0)
      ).length
    );
    setOutOfStockCount(
      products.filter(
        (product) => product.trackInventory && (product.stockQuantity || 0) <= 0
      ).length
    );
  };

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);

    setFormattedDate(
      new Intl.DateTimeFormat("en-PK", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(now)
    );

    const user = getCurrentUser();

    if (!user) {
      window.location.replace("/");
      return;
    }

    const savedProfile = getUserBusinessProfile(user.id);

    if (!savedProfile) {
      window.location.replace("/select-business");
      return;
    }

    activateUserBusinessProfile(savedProfile);
    setProfile(savedProfile);

    const savedType = savedProfile.businessType;

    if (
      savedType &&
      Object.prototype.hasOwnProperty.call(businessConfig, savedType)
    ) {
      setBusinessType(savedType as BusinessType);
    }

    refreshDashboard();
    setLoading(false);

    window.addEventListener("storage", refreshDashboard);

    return () => {
      window.removeEventListener("storage", refreshDashboard);
    };
  }, []);

  const config = businessConfig[businessType];
  const centralConfig = getBusinessConfig(businessType);

  const businessName = profile.businessName || "Your Business";
  const ownerName = profile.ownerName || "Owner Account";
  const currency = profile.currency || "PKR";
  const currencySymbol = currency === "PKR" ? "Rs." : currency;

  const businessOrders = useMemo(
    () => orders.filter((order) => order.businessType === businessType),
    [orders, businessType]
  );

  const todayOrders = useMemo(() => {
    if (!currentDate) return [];

    return businessOrders.filter((order) =>
      isSameDay(new Date(order.createdAt), currentDate)
    );
  }, [businessOrders, currentDate]);

  const paidTodayOrders = useMemo(() => {
    if (!currentDate) return [];

    return businessOrders.filter((order) => {
      const paidDate = order.paidAt
        ? new Date(order.paidAt)
        : null;

      return (
        paidDate &&
        !Number.isNaN(paidDate.getTime()) &&
        isSameDay(paidDate, currentDate) &&
        ["Paid", "Completed"].includes(order.status)
      );
    });
  }, [businessOrders, currentDate]);

  const todaySales = paidTodayOrders.reduce(
    (total, order) => total + Number(order.total || 0),
    0
  );
  const todayBusinessSales = currentDate
    ? businessSales.filter(
        (sale) =>
          ["Paid", "Completed"].includes(sale.status) &&
          isSameDay(new Date(sale.createdAt), currentDate)
      )
    : [];
  const businessRevenueToday = todayBusinessSales.reduce(
    (total, sale) => total + Number(sale.total || 0),
    0
  );
  const appointmentsToday = currentDate
    ? appointments.filter(
        (appointment) =>
          appointment.date &&
          isSameDay(new Date(`${appointment.date}T00:00:00`), currentDate) &&
          appointment.status !== "Cancelled"
      )
    : [];
  const pendingAppointments = appointments.filter((appointment) =>
    ["Scheduled", "Confirmed", "In Progress"].includes(
      String(appointment.status || "")
    )
  );
  const activeStaffCount = staffMembers.filter(
    (member) =>
      member.active !== false && member.availability !== "Unavailable"
  ).length;

  const pendingOrders = useMemo(
    () =>
      businessOrders.filter(
        (order) => !TERMINAL_STATUSES.includes(order.status)
      ),
    [businessOrders]
  );

  const activeTables = useMemo(
    () =>
      new Set(
        pendingOrders
          .filter(
            (order) =>
              order.orderType === "Dine In" &&
              Boolean(order.tableNumber)
          )
          .map((order) => order.tableNumber)
      ).size,
    [pendingOrders]
  );

  const weeklySales = useMemo(() => {
    if (!currentDate) return [];

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() - (6 - index));

      return businessOrders
        .filter((order) => {
          const paidDate = order.paidAt
            ? new Date(order.paidAt)
            : null;

          return (
            paidDate &&
            !Number.isNaN(paidDate.getTime()) &&
            isSameDay(paidDate, date) &&
            ["Paid", "Completed"].includes(order.status)
          );
        })
        .reduce(
          (total, order) => total + Number(order.total || 0),
          0
        ) + businessSales
          .filter((sale) => {
            const saleDate = new Date(sale.createdAt);
            return (
              !Number.isNaN(saleDate.getTime()) &&
              isSameDay(saleDate, date) &&
              ["Paid", "Completed"].includes(sale.status)
            );
          })
          .reduce((total, sale) => total + Number(sale.total || 0), 0);
    });
  }, [businessOrders, businessSales, currentDate]);

  const weekDays = useMemo(() => {
    if (!currentDate) return [];

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() - (6 - index));

      return date.toLocaleDateString("en-US", {
        weekday: "short",
      });
    });
  }, [currentDate]);

  const maxWeeklySales = Math.max(...weeklySales, 1);

  const recentOrders = useMemo(
    () =>
      [...businessOrders]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )
        .slice(0, 6),
    [businessOrders]
  );
  const recentActivity = useMemo(() => {
    if (["restaurant", "cafe", "pizza"].includes(businessType)) {
      return recentOrders.map((order) => ({
        id: order.id,
        orderType: order.orderType,
        tableNumber: order.tableNumber,
        createdAt: order.createdAt,
        currency: order.currency,
        total: order.total,
        status: order.status,
        customerName: "",
      }));
    }

    return [...businessSales]
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
      )
      .slice(0, 6)
      .map((sale) => ({
        id: sale.invoiceNumber || sale.name,
        orderType: sale.paymentMethod || "Invoice",
        tableNumber: null,
        createdAt: sale.createdAt,
        currency: sale.currency || currency,
        total: sale.total,
        status: sale.status,
        customerName: sale.customerName || "Walk-in",
      }));
  }, [businessType, recentOrders, businessSales, currency]);

  const getStatValue = (title: string) => {
    switch (title) {
      case "Today's Sales":
        if (businessType === "grocery") {
          return todayBusinessSales.length.toString();
        }
        return `${currencySymbol} ${formatAmount(
          ["restaurant", "cafe", "pizza"].includes(businessType)
            ? todaySales
            : businessRevenueToday
        )}`;

      case "Today's Revenue":
        return `${currencySymbol} ${formatAmount(
          ["restaurant", "cafe", "pizza"].includes(businessType)
            ? todaySales
            : businessRevenueToday
        )}`;

      case "Total Orders":
      case "Total Transactions":
        return (
          ["restaurant", "cafe", "pizza"].includes(businessType)
            ? todayOrders.length
            : todayBusinessSales.length
        ).toString();

      case "Active Tables":
        return activeTables.toString().padStart(2, "0");

      case "Today's Appointments":
        return appointmentsToday.length.toString();

      case "Pending Appointments":
        return pendingAppointments.length.toString();

      case "Active Staff":
        return activeStaffCount.toString();

      case "Pending Orders":
        return pendingOrders.length.toString();

      case "Low Stock Products":
      case "Low Stock":
        return lowStockCount.toString();

      case "Out of Stock":
        return outOfStockCount.toString();

      case "Products":
        return catalogSize.toString();

      case "Total Sales":
        return todayBusinessSales.length.toString();

      case "Pending Payments":
        return businessSales.filter((sale) => sale.status === "Pending").length.toString();

      default:
        return "—";
    }
  };

  const getStatDescription = (title: string) => {
    switch (title) {
      case "Today's Sales":
      case "Today's Revenue":
        return "Paid orders today";

      case "Total Orders":
      case "Total Transactions":
        return "Orders created today";

      case "Active Tables":
        return "Currently occupied";

      case "Today's Appointments":
        return "Appointments scheduled for today";

      case "Pending Appointments":
        return "Awaiting completion";

      case "Active Staff":
        return "Staff currently available";

      case "Pending Orders":
        return "Awaiting payment";

      default:
        return "Not available yet";
    }
  };

  const navigate = (name: string) => {
    const routes: Record<string, string> = {
      Tables: "/tables",
      "Manage Tables": "/tables",

      "POS / Orders": "/pos",
      "POS / Sales": "/pos",
      "Sales / Orders": "/pos",
      "New Order": "/pos",
      "New Sale": "/pos",

      Menu: "/menu",
      "Coffee Menu": "/menu",
      "Pizza Menu": "/menu",
      "Add Menu Item": "/menu",
      "Add Coffee Item": "/menu",
      "Add Pizza": "/menu",

      Products: "/products",
      "Add Product": "/products",
      "Add Grocery Item": "/products",

      Inventory: "/inventory",
      "Manage Stock": "/inventory",

      Customers: "/customers",
      "Add Customer": "/customers",

      Reports: "/reports",
      "View Reports": "/reports",
      "View All": "/pos",

      Settings: "/settings",
      Delivery: "/delivery",
      "New Delivery": "/delivery",

      Appointments: "/appointments",
      "New Appointment": "/appointments",
      Services: "/services",
      "Add Service": "/services",
      Staff: "/staff",
      "Manage Staff": "/staff",

      Categories: "/categories",
      Purchases: "/purchases",
      "New Purchase": "/purchases",
      Suppliers: "/suppliers",
      Payments: "/payments",
    };

    const route =
      name === "View All" &&
      !["restaurant", "cafe", "pizza"].includes(businessType)
        ? "/payments"
        : routes[name];

    if (route) window.location.href = route;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Paid":
      case "Completed":
      case "Ready":
        return "bg-green-50 text-green-700";

      case "Preparing":
      case "Printed":
        return "bg-orange-50 text-orange-700";

      case "Cancelled":
        return "bg-red-50 text-red-700";

      default:
        return "bg-blue-50 text-blue-700";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-sm text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-800">
      <main className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-100 bg-white/90 px-5 backdrop-blur-md sm:px-8">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Dashboard
            </h2>
            <p className="hidden text-xs text-slate-400 sm:block">
              Welcome back, {ownerName}!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 md:flex">
              <Search size={17} className="text-slate-400" />
              <input
                placeholder="Search anything..."
                className="w-40 bg-transparent text-xs outline-none"
              />
            </div>

            <button
              onClick={refreshDashboard}
              title="Refresh dashboard"
              className="rounded-xl border border-slate-100 p-2.5 text-slate-500 hover:bg-slate-50"
            >
              <RefreshCw size={17} />
            </button>

            <button className="relative rounded-xl border border-slate-100 p-2.5 text-slate-500 hover:bg-slate-50">
              <Bell size={19} />
              {pendingOrders.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                  {pendingOrders.length}
                </span>
              )}
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
              {(ownerName.trim().charAt(0) || "A").toUpperCase()}
            </div>
          </div>
        </header>

        <div className="space-y-7 p-5 sm:p-8">
          {/* Welcome */}
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                {centralConfig.label}
              </span>

              <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                {businessName}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Monitor your business performance today.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600">
              {formattedDate}
            </div>
          </section>

          {/* Statistics */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {centralConfig.dashboardStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-500">
                      {stat.title}
                    </p>

                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg} ${stat.iconColor}`}
                    >
                      <Icon size={21} />
                    </div>
                  </div>

                  <h4 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
                    {getStatValue(stat.title)}
                  </h4>

                  <p className="mt-2 text-xs font-medium text-slate-400">
                    {getStatDescription(stat.title)}
                  </p>
                </div>
              );
            })}
          </section>

          {/* Sales Chart and Quick Actions */}
          <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            {/* Weekly Sales */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">
                    Sales Overview
                  </h4>
                  <p className="mt-1 text-xs text-slate-400">
                    Paid sales during the last 7 days
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                  Last 7 Days
                </div>
              </div>

              <div className="mt-7 flex h-48 items-end justify-between gap-3 px-1">
                {weeklySales.map((amount, index) => {
                  const height =
                    amount > 0
                      ? Math.max((amount / maxWeeklySales) * 100, 5)
                      : 0;

                  return (
                    <div
                      key={index}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <div className="flex w-full flex-1 items-end">
                        <div
                          title={`${currencySymbol} ${formatAmount(amount)}`}
                          style={{ height: `${height}%` }}
                          className={`w-full rounded-t-lg transition-all ${
                            amount > 0
                              ? "bg-gradient-to-t from-blue-700 to-cyan-400"
                              : "bg-slate-100"
                          }`}
                        />
                      </div>

                      <span className="text-[11px] font-medium text-slate-400">
                        {weekDays[index]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {weeklySales.length === 0 && (
                <p className="mt-8 text-center text-xs text-slate-400">
                  Loading sales data...
                </p>
              )}

              <div className="mt-4 flex justify-between border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-400">
                  Last 7 days paid sales
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {currencySymbol}{" "}
                  {formatAmount(
                    weeklySales.reduce((sum, amount) => sum + amount, 0)
                  )}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1746a2] via-blue-600 to-cyan-500 p-6 text-white shadow-lg shadow-blue-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-blue-100">
                  Quick Actions
                </p>
                <Plus size={20} />
              </div>

              <h4 className="mt-2 text-xl font-extrabold">
                What would you like to do?
              </h4>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {centralConfig.quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.name}
                      onClick={() => navigate(action.name)}
                      className="flex flex-col items-start gap-3 rounded-xl border border-white/20 bg-white/10 p-4 text-left transition hover:bg-white/20"
                    >
                      <Icon size={21} />
                      <span className="text-xs font-bold">
                        {action.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Recent Orders */}
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
              <div>
                <h4 className="font-bold text-slate-900">
                  {config.activityTitle}
                </h4>

                <p className="mt-1 text-xs text-slate-400">
                  {config.activityDescription}
                </p>
              </div>

              <button
                onClick={() => navigate("View All")}
                className="rounded-lg bg-blue-50 px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">
                      {["restaurant", "cafe", "pizza"].includes(businessType) ? "Order ID" : "Invoice ID"}
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      {["restaurant", "cafe", "pizza"].includes(businessType) ? "Order Type" : "Payment"}
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      {["restaurant", "cafe", "pizza"].includes(businessType) ? "Table" : "Customer"}
                    </th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((order) => (
                      <tr
                        key={order.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4 font-bold text-blue-600">
                          {order.id}
                        </td>

                        <td className="px-6 py-4 text-slate-500">
                          {order.orderType}
                        </td>

                        <td className="px-6 py-4 text-slate-500">
                          {["restaurant", "cafe", "pizza"].includes(businessType)
                            ? order.tableNumber
                              ? `Table ${order.tableNumber}`
                              : "—"
                            : order.customerName}
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-500">
                          {formatDateTime(order.createdAt)}
                        </td>

                        <td className="px-6 py-4 font-bold text-slate-800">
                          {order.currency === "PKR" ? "Rs." : order.currency}{" "}
                          {formatAmount(Number(order.total || 0))}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-bold ${getStatusStyle(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <ShoppingCart
                          size={30}
                          className="mx-auto mb-3 text-slate-300"
                        />

                        <p className="text-sm font-bold text-slate-600">
                          {["restaurant", "cafe", "pizza"].includes(businessType)
                            ? "No orders yet"
                            : "No transactions yet"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {["restaurant", "cafe", "pizza"].includes(businessType)
                            ? "Create your first order from POS to see it here."
                            : "Complete your first payment in POS to see it here."}
                        </p>

                        <button
                          onClick={() =>
                            navigate(
                              ["restaurant", "cafe", "pizza"].includes(businessType)
                                ? "New Order"
                                : "New Sale"
                            )
                          }
                          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                        >
                          {["restaurant", "cafe", "pizza"].includes(businessType)
                            ? "Create New Order"
                            : "Create New Sale"}
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Footer */}
          <p className="pb-2 text-center text-xs text-slate-400">
            © 2026 OneBiz. One Platform. Every Business.
          </p>
        </div>
      </main>
    </div>
  );
}
