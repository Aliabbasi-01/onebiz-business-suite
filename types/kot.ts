
export type KOTItem = {
  id: number;
  name: string;
  quantity: number;
  notes?: string;
};

export type KOT = {
  id: string;
  kotNumber: number;
  orderId: string;
  businessName: string;
  tableNumber: string | null;
  orderType: "Dine In" | "Takeaway" | "Delivery";
  items: KOTItem[];
  createdAt: string;
  status: "New" | "Printed";
};
