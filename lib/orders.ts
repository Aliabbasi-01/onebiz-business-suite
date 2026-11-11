
import type { SavedOrder } from "@/types/order";
import {
  getBusinessRecords,
  saveBusinessRecords,
} from "@/lib/business-data";

export function getOrders(): SavedOrder[] {
  if (typeof window === "undefined") return [];

  const businessType =
    localStorage.getItem("onebiz_business_type") || "other";
  return getBusinessRecords<SavedOrder>("orders", businessType);
}

export function saveOrders(orders: SavedOrder[]): void {
  if (typeof window === "undefined") return;

  const businessType =
    localStorage.getItem("onebiz_business_type") || "other";
  saveBusinessRecords("orders", businessType, orders);
}

export function getTodayOrders(): SavedOrder[] {
  const today = new Date().toDateString();

  return getOrders().filter(
    (order) => new Date(order.createdAt).toDateString() === today
  );
}

export function getTodaySales(): number {
  return getTodayOrders()
    .filter((order) => ["Paid", "Completed"].includes(order.status))
    .reduce((total, order) => total + order.total, 0);
}

export function getPendingOrders(): SavedOrder[] {
  return getOrders().filter(
    (order) => !["Paid", "Completed", "Cancelled"].includes(order.status)
  );
}

export function getWeeklySales(): number[] {
  const orders = getOrders();
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return orders
      .filter((order) => {
        const orderDate = new Date(order.paidAt || order.createdAt);

        return (
          orderDate.toDateString() === date.toDateString() &&
          ["Paid", "Completed"].includes(order.status)
        );
      })
      .reduce((total, order) => total + order.total, 0);
  });
}
