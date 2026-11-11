
import type { Product } from "@/lib/products";

export type OrderType = "Dine In" | "Takeaway" | "Delivery";
export type PaymentMethod = "Cash" | "Card";

export type OrderStatus =
  | "Pending"
  | "Preparing"
  | "Ready"
  | "Paid"
  | "Completed"
  | "Cancelled";

export type OrderItem = Product & {
  quantity: number;
};

export type SavedOrder = {
  id: string;
  businessName: string;
  businessType: string;
  orderType: OrderType;
  tableNumber: string | null;
  items: OrderItem[];
  subtotal: number;
  total: number;
  currency: string;
  status: OrderStatus | string;
  createdAt: string;
  updatedAt?: string;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
  invoiceNumber?: string;
};
