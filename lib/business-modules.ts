import { getBusinessConfig, type BusinessType } from "@/lib/business-config";

export type BusinessModules = {
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

const asBusinessModules = (businessType?: string | null): BusinessModules => {
  const config = getBusinessConfig(businessType);

  return {
    menu: config.modules.menu,
    products: config.modules.products,
    services: config.modules.services,
    inventory: config.modules.inventory,
    kitchen: config.modules.kitchen,
    customers: config.modules.customers,
    staff: config.modules.staff,
    appointments: config.modules.appointments,
    suppliers: config.modules.suppliers,
    purchases: config.modules.purchases,
    payments: config.modules.payments,
    categories: config.modules.categories,
    reports: config.modules.reports,
    pos: config.modules.pos,
    tables: config.modules.tables,
    deliveries: config.modules.deliveries,
  };
};

export function getBusinessModules(
  businessType?: string | null
): BusinessModules {
  return asBusinessModules(businessType);
}

export function getModuleAvailability(
  businessType?: string | null
): BusinessModules {
  return asBusinessModules(businessType);
}

export function resolveBusinessType(
  businessType?: string | null
): BusinessType {
  return getBusinessConfig(businessType).type;
}