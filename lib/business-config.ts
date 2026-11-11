import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  Coffee,
  CreditCard,
  LayoutDashboard,
  Package,
  Pizza,
  Plus,
  Receipt,
  Scissors,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Tags,
  Truck,
  Utensils,
  Users,
  Warehouse,
} from "lucide-react";

export type BusinessType =
  | "restaurant"
  | "cafe"
  | "pizza"
  | "salon"
  | "retail"
  | "grocery"
  | "other";

export type BusinessModuleConfig = {
  menu: boolean;
  products: boolean;
  services: boolean;
  inventory: boolean;
  kitchen: boolean;
  customers: boolean;
  staff: boolean;
  appointments: boolean;
  suppliers: boolean;
  purchases: boolean;
  payments: boolean;
  categories: boolean;
  reports: boolean;
  pos: boolean;
  tables: boolean;
  deliveries: boolean;
};

export type BusinessNavItem = {
  name: string;
  path: string;
  icon: LucideIcon;
};

export type BusinessDashboardStat = {
  title: string;
  icon: LucideIcon;
  bg: string;
  iconColor: string;
};

export type BusinessTerminology = {
  order: string;
  product: string;
  customer: string;
  inventory: string;
  sale: string;
  payment: string;
  report: string;
};

export type BusinessTermology = BusinessTerminology;

export type BusinessPosConfig = {
  tableService: boolean;
  takeaway: boolean;
  delivery: boolean;
  multiItemInvoice: boolean;
  cashPayment: boolean;
  cardPayment: boolean;
  discounts: boolean;
  taxes: boolean;
};

export type BusinessReportConfig = {
  dailyRevenue: boolean;
  monthlyRevenue: boolean;
  orderStats: boolean;
  inventory: boolean;
  paymentSummary: boolean;
  employeePerformance: boolean;
};

export type BusinessDefinition = {
  type: BusinessType;
  label: string;
  description: string;
  icon: LucideIcon;
  modules: BusinessModuleConfig;
  navigation: BusinessNavItem[];
  dashboardStats: BusinessDashboardStat[];
  quickActions: Array<{ name: string; icon: LucideIcon }>;
  terminology: BusinessTerminology;
  pos: BusinessPosConfig;
  reports: BusinessReportConfig;
};

export const BUSINESS_TYPES: BusinessType[] = [
  "restaurant",
  "cafe",
  "pizza",
  "salon",
  "retail",
  "grocery",
  "other",
];

export const BUSINESS_CONFIG: Record<BusinessType, BusinessDefinition> = {
  restaurant: {
    type: "restaurant",
    label: "Restaurant",
    description: "Tables, orders, kitchen and billing",
    icon: Utensils,
    modules: {
      menu: true,
      products: false,
      services: false,
      inventory: true,
      kitchen: true,
      customers: true,
      staff: false,
      appointments: false,
      suppliers: false,
      purchases: false,
      payments: true,
      categories: false,
      reports: true,
      pos: true,
      tables: true,
      deliveries: true,
    },
    navigation: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "POS / Orders", path: "/pos", icon: ShoppingCart },
      { name: "Tables", path: "/tables", icon: Utensils },
      { name: "Kitchen / KOT", path: "/kot", icon: ClipboardList },
      { name: "Menu", path: "/menu", icon: ClipboardList },
      { name: "Inventory", path: "/inventory", icon: Warehouse },
      { name: "Reports", path: "/reports", icon: ChartNoAxesCombined },
    ],
    dashboardStats: [
      { title: "Today's Revenue", icon: CreditCard, bg: "bg-blue-50", iconColor: "text-blue-600" },
      { title: "Total Orders", icon: ShoppingCart, bg: "bg-purple-50", iconColor: "text-purple-600" },
      { title: "Pending Orders", icon: Receipt, bg: "bg-green-50", iconColor: "text-green-600" },
      { title: "Active Tables", icon: Utensils, bg: "bg-orange-50", iconColor: "text-orange-600" },
    ],
    quickActions: [
      { name: "New Order", icon: ShoppingCart },
      { name: "Manage Tables", icon: Utensils },
      { name: "Add Menu Item", icon: Plus },
    ],
    terminology: {
      order: "Order",
      product: "Menu Item",
      customer: "Customer",
      inventory: "Inventory",
      sale: "Sale",
      payment: "Payment",
      report: "Report",
    },
    pos: {
      tableService: true,
      takeaway: true,
      delivery: true,
      multiItemInvoice: true,
      cashPayment: true,
      cardPayment: true,
      discounts: true,
      taxes: true,
    },
    reports: {
      dailyRevenue: true,
      monthlyRevenue: true,
      orderStats: true,
      inventory: true,
      paymentSummary: true,
      employeePerformance: false,
    },
  },
  cafe: {
    type: "cafe",
    label: "Cafe / Coffee Shop",
    description: "Coffee, pastries and quick service orders",
    icon: Coffee,
    modules: {
      menu: true,
      products: false,
      services: false,
      inventory: true,
      kitchen: true,
      customers: true,
      staff: false,
      appointments: false,
      suppliers: false,
      purchases: false,
      payments: true,
      categories: false,
      reports: true,
      pos: true,
      tables: true,
      deliveries: true,
    },
    navigation: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "POS / Orders", path: "/pos", icon: ShoppingCart },
      { name: "Tables", path: "/tables", icon: Utensils },
      { name: "Kitchen / KOT", path: "/kot", icon: ClipboardList },
      { name: "Coffee Menu", path: "/menu", icon: Coffee },
      { name: "Inventory", path: "/inventory", icon: Warehouse },
      { name: "Reports", path: "/reports", icon: ChartNoAxesCombined },
    ],
    dashboardStats: [
      { title: "Today's Revenue", icon: CreditCard, bg: "bg-blue-50", iconColor: "text-blue-600" },
      { title: "Total Orders", icon: ShoppingCart, bg: "bg-purple-50", iconColor: "text-purple-600" },
      { title: "Pending Orders", icon: Receipt, bg: "bg-green-50", iconColor: "text-green-600" },
      { title: "Active Tables", icon: Utensils, bg: "bg-orange-50", iconColor: "text-orange-600" },
    ],
    quickActions: [
      { name: "New Order", icon: ShoppingCart },
      { name: "Add Coffee Item", icon: Coffee },
      { name: "Manage Tables", icon: Utensils },
    ],
    terminology: {
      order: "Order",
      product: "Menu Item",
      customer: "Customer",
      inventory: "Inventory",
      sale: "Sale",
      payment: "Payment",
      report: "Report",
    },
    pos: {
      tableService: true,
      takeaway: true,
      delivery: false,
      multiItemInvoice: true,
      cashPayment: true,
      cardPayment: true,
      discounts: true,
      taxes: true,
    },
    reports: {
      dailyRevenue: true,
      monthlyRevenue: true,
      orderStats: true,
      inventory: true,
      paymentSummary: true,
      employeePerformance: false,
    },
  },
  pizza: {
    type: "pizza",
    label: "Pizza Shop",
    description: "Pizza menu, delivery and takeaway operations",
    icon: Pizza,
    modules: {
      menu: true,
      products: false,
      services: false,
      inventory: true,
      kitchen: true,
      customers: true,
      staff: false,
      appointments: false,
      suppliers: false,
      purchases: false,
      payments: true,
      categories: false,
      reports: true,
      pos: true,
      tables: false,
      deliveries: true,
    },
    navigation: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "POS / Orders", path: "/pos", icon: ShoppingCart },
      { name: "Kitchen / KOT", path: "/kot", icon: ClipboardList },
      { name: "Pizza Menu", path: "/menu", icon: Pizza },
      { name: "Inventory", path: "/inventory", icon: Warehouse },
      { name: "Delivery", path: "/delivery", icon: Truck },
      { name: "Reports", path: "/reports", icon: ChartNoAxesCombined },
    ],
    dashboardStats: [
      { title: "Today's Revenue", icon: CreditCard, bg: "bg-blue-50", iconColor: "text-blue-600" },
      { title: "Total Orders", icon: ShoppingCart, bg: "bg-purple-50", iconColor: "text-purple-600" },
      { title: "Pending Orders", icon: Receipt, bg: "bg-green-50", iconColor: "text-green-600" },
      { title: "Delivery Orders", icon: Truck, bg: "bg-orange-50", iconColor: "text-orange-600" },
    ],
    quickActions: [
      { name: "New Order", icon: ShoppingCart },
      { name: "New Delivery", icon: Truck },
      { name: "Add Pizza", icon: Pizza },
    ],
    terminology: {
      order: "Order",
      product: "Pizza",
      customer: "Customer",
      inventory: "Inventory",
      sale: "Sale",
      payment: "Payment",
      report: "Report",
    },
    pos: {
      tableService: false,
      takeaway: true,
      delivery: true,
      multiItemInvoice: true,
      cashPayment: true,
      cardPayment: true,
      discounts: true,
      taxes: true,
    },
    reports: {
      dailyRevenue: true,
      monthlyRevenue: true,
      orderStats: true,
      inventory: true,
      paymentSummary: true,
      employeePerformance: false,
    },
  },
  salon: {
    type: "salon",
    label: "Salon / Spa",
    description: "Appointments, services, staff and retail products",
    icon: Scissors,
    modules: {
      menu: false,
      products: true,
      services: true,
      inventory: true,
      kitchen: false,
      customers: true,
      staff: true,
      appointments: true,
      suppliers: false,
      purchases: false,
      payments: true,
      categories: true,
      reports: true,
      pos: true,
      tables: false,
      deliveries: false,
    },
    navigation: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "Appointments", path: "/appointments", icon: CalendarDays },
      { name: "POS / Billing", path: "/pos", icon: ShoppingCart },
      { name: "Services", path: "/services", icon: Scissors },
      { name: "Staff", path: "/staff", icon: Users },
      { name: "Customers", path: "/customers", icon: Users },
      { name: "Products", path: "/products", icon: Package },
      { name: "Inventory", path: "/inventory", icon: Warehouse },
      { name: "Payments", path: "/payments", icon: CreditCard },
      { name: "Reports", path: "/reports", icon: ChartNoAxesCombined },
    ],
    dashboardStats: [
      { title: "Today's Revenue", icon: CreditCard, bg: "bg-blue-50", iconColor: "text-blue-600" },
      { title: "Today's Appointments", icon: CalendarDays, bg: "bg-purple-50", iconColor: "text-purple-600" },
      { title: "Pending Appointments", icon: ClipboardList, bg: "bg-orange-50", iconColor: "text-orange-600" },
      { title: "Active Staff", icon: Users, bg: "bg-green-50", iconColor: "text-green-600" },
    ],
    quickActions: [
      { name: "New Appointment", icon: CalendarDays },
      { name: "Add Service", icon: Scissors },
      { name: "Add Customer", icon: Users },
    ],
    terminology: {
      order: "Appointment",
      product: "Service",
      customer: "Client",
      inventory: "Stock",
      sale: "Invoice",
      payment: "Payment",
      report: "Report",
    },
    pos: {
      tableService: false,
      takeaway: false,
      delivery: false,
      multiItemInvoice: true,
      cashPayment: true,
      cardPayment: true,
      discounts: true,
      taxes: true,
    },
    reports: {
      dailyRevenue: true,
      monthlyRevenue: true,
      orderStats: true,
      inventory: true,
      paymentSummary: true,
      employeePerformance: true,
    },
  },
  retail: {
    type: "retail",
    label: "Retail Store",
    description: "Products, sales and supplier management",
    icon: ShoppingBag,
    modules: {
      menu: false,
      products: true,
      services: false,
      inventory: true,
      kitchen: false,
      customers: true,
      staff: false,
      appointments: false,
      suppliers: true,
      purchases: true,
      payments: true,
      categories: true,
      reports: true,
      pos: true,
      tables: false,
      deliveries: false,
    },
    navigation: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "POS / Sales", path: "/pos", icon: ShoppingCart },
      { name: "Products", path: "/products", icon: Package },
      { name: "Categories", path: "/categories", icon: Tags },
      { name: "Inventory", path: "/inventory", icon: Warehouse },
      { name: "Customers", path: "/customers", icon: Users },
      { name: "Purchases", path: "/purchases", icon: Receipt },
      { name: "Suppliers", path: "/suppliers", icon: Truck },
      { name: "Payments", path: "/payments", icon: CreditCard },
      { name: "Reports", path: "/reports", icon: ChartNoAxesCombined },
    ],
    dashboardStats: [
      { title: "Today's Revenue", icon: CreditCard, bg: "bg-blue-50", iconColor: "text-blue-600" },
      { title: "Total Sales", icon: ShoppingCart, bg: "bg-purple-50", iconColor: "text-purple-600" },
      { title: "Low Stock Products", icon: Warehouse, bg: "bg-orange-50", iconColor: "text-orange-600" },
      { title: "Pending Payments", icon: Receipt, bg: "bg-green-50", iconColor: "text-green-600" },
    ],
    quickActions: [
      { name: "New Sale", icon: ShoppingCart },
      { name: "Add Product", icon: Package },
      { name: "Manage Stock", icon: Warehouse },
    ],
    terminology: {
      order: "Sale",
      product: "Product",
      customer: "Customer",
      inventory: "Inventory",
      sale: "Sale",
      payment: "Payment",
      report: "Report",
    },
    pos: {
      tableService: false,
      takeaway: false,
      delivery: false,
      multiItemInvoice: true,
      cashPayment: true,
      cardPayment: true,
      discounts: true,
      taxes: true,
    },
    reports: {
      dailyRevenue: true,
      monthlyRevenue: true,
      orderStats: true,
      inventory: true,
      paymentSummary: true,
      employeePerformance: false,
    },
  },
  grocery: {
    type: "grocery",
    label: "Grocery Store",
    description: "Stock, fresh inventory and daily sales",
    icon: ShoppingBasket,
    modules: {
      menu: false,
      products: true,
      services: false,
      inventory: true,
      kitchen: false,
      customers: true,
      staff: false,
      appointments: false,
      suppliers: true,
      purchases: true,
      payments: true,
      categories: true,
      reports: true,
      pos: true,
      tables: false,
      deliveries: false,
    },
    navigation: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "POS / Sales", path: "/pos", icon: ShoppingCart },
      { name: "Products", path: "/products", icon: Package },
      { name: "Categories", path: "/categories", icon: Tags },
      { name: "Inventory", path: "/inventory", icon: Warehouse },
      { name: "Suppliers", path: "/suppliers", icon: Truck },
      { name: "Customers", path: "/customers", icon: Users },
      { name: "Purchases", path: "/purchases", icon: Receipt },
      { name: "Payments", path: "/payments", icon: CreditCard },
      { name: "Reports", path: "/reports", icon: ChartNoAxesCombined },
    ],
    dashboardStats: [
      { title: "Today's Revenue", icon: CreditCard, bg: "bg-blue-50", iconColor: "text-blue-600" },
      { title: "Today's Sales", icon: ShoppingCart, bg: "bg-purple-50", iconColor: "text-purple-600" },
      { title: "Low Stock", icon: Warehouse, bg: "bg-orange-50", iconColor: "text-orange-600" },
      { title: "Out of Stock", icon: Package, bg: "bg-green-50", iconColor: "text-green-600" },
    ],
    quickActions: [
      { name: "New Sale", icon: ShoppingCart },
      { name: "Add Grocery Item", icon: Package },
      { name: "Manage Stock", icon: Warehouse },
    ],
    terminology: {
      order: "Sale",
      product: "Item",
      customer: "Customer",
      inventory: "Stock",
      sale: "Sale",
      payment: "Payment",
      report: "Report",
    },
    pos: {
      tableService: false,
      takeaway: false,
      delivery: false,
      multiItemInvoice: true,
      cashPayment: true,
      cardPayment: true,
      discounts: true,
      taxes: true,
    },
    reports: {
      dailyRevenue: true,
      monthlyRevenue: true,
      orderStats: true,
      inventory: true,
      paymentSummary: true,
      employeePerformance: false,
    },
  },
  other: {
    type: "other",
    label: "Other Business",
    description: "Flexible general-purpose business workflows",
    icon: BriefcaseBusiness,
    modules: {
      menu: false,
      products: true,
      services: true,
      inventory: true,
      kitchen: false,
      customers: true,
      staff: false,
      appointments: false,
      suppliers: false,
      purchases: false,
      payments: true,
      categories: false,
      reports: true,
      pos: true,
      tables: false,
      deliveries: false,
    },
    navigation: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "Sales / Orders", path: "/pos", icon: ShoppingCart },
      { name: "Products", path: "/products", icon: Package },
      { name: "Services", path: "/services", icon: BriefcaseBusiness },
      { name: "Inventory", path: "/inventory", icon: Warehouse },
      { name: "Customers", path: "/customers", icon: Users },
      { name: "Payments", path: "/payments", icon: CreditCard },
      { name: "Reports", path: "/reports", icon: ChartNoAxesCombined },
    ],
    dashboardStats: [
      { title: "Today's Sales", icon: CreditCard, bg: "bg-blue-50", iconColor: "text-blue-600" },
      { title: "Total Orders", icon: ShoppingCart, bg: "bg-purple-50", iconColor: "text-purple-600" },
      { title: "Products", icon: Package, bg: "bg-orange-50", iconColor: "text-orange-600" },
      { title: "Payments", icon: Receipt, bg: "bg-green-50", iconColor: "text-green-600" },
    ],
    quickActions: [
      { name: "New Sale", icon: ShoppingCart },
      { name: "Add Product", icon: Package },
      { name: "Add Customer", icon: Users },
    ],
    terminology: {
      order: "Order",
      product: "Product",
      customer: "Customer",
      inventory: "Inventory",
      sale: "Sale",
      payment: "Payment",
      report: "Report",
    },
    pos: {
      tableService: false,
      takeaway: false,
      delivery: false,
      multiItemInvoice: true,
      cashPayment: true,
      cardPayment: true,
      discounts: true,
      taxes: true,
    },
    reports: {
      dailyRevenue: true,
      monthlyRevenue: true,
      orderStats: true,
      inventory: true,
      paymentSummary: true,
      employeePerformance: false,
    },
  },
};

export function isBusinessType(value?: string | null): value is BusinessType {
  return !!value && BUSINESS_TYPES.includes(value as BusinessType);
}

export function getBusinessConfig(type?: string | null): BusinessDefinition {
  return BUSINESS_CONFIG[isBusinessType(type) ? type : "other"];
}

export function getBusinessLabel(type?: string | null): string {
  return getBusinessConfig(type).label;
}

export function getBusinessNavigation(type?: string | null): BusinessNavItem[] {
  return getBusinessConfig(type).navigation;
}

export function getBusinessDashboardStats(type?: string | null): BusinessDashboardStat[] {
  return getBusinessConfig(type).dashboardStats;
}

export function getBusinessModulesForType(type?: string | null) {
  return getBusinessConfig(type).modules;
}
