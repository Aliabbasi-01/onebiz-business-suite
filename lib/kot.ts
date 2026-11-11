
import type { KOT, KOTItem } from "@/types/kot";

const KOT_STORAGE_KEY = "onebiz_kots";
const KOT_COUNTER_KEY = "onebiz_kot_counter";

export function createKOT(data: {
  orderId: string;
  businessName: string;
  tableNumber: string | null;
  orderType: "Dine In" | "Takeaway" | "Delivery";
  items: KOTItem[];
}): KOT {
  if (typeof window === "undefined") {
    throw new Error("KOT can only be created in the browser.");
  }

  const currentNumber = Number(
    localStorage.getItem(KOT_COUNTER_KEY) || "0"
  );

  const nextNumber = currentNumber + 1;

  localStorage.setItem(KOT_COUNTER_KEY, String(nextNumber));

  const kot: KOT = {
    id: crypto.randomUUID(),
    kotNumber: nextNumber,
    orderId: data.orderId,
    businessName: data.businessName,
    tableNumber: data.tableNumber,
    orderType: data.orderType,
    items: data.items,
    createdAt: new Date().toISOString(),
    status: "New",
  };

  const existingKOTs: KOT[] = JSON.parse(
    localStorage.getItem(KOT_STORAGE_KEY) || "[]"
  );

  existingKOTs.push(kot);

  localStorage.setItem(
    KOT_STORAGE_KEY,
    JSON.stringify(existingKOTs)
  );

  return kot;
}

export function getKOTById(id: string): KOT | null {
  if (typeof window === "undefined") return null;

  const kots: KOT[] = JSON.parse(
    localStorage.getItem(KOT_STORAGE_KEY) || "[]"
  );

  return kots.find((kot) => kot.id === id) || null;
}

export function updateKOTStatus(
  id: string,
  status: KOT["status"]
): void {
  if (typeof window === "undefined") return;

  const kots: KOT[] = JSON.parse(
    localStorage.getItem(KOT_STORAGE_KEY) || "[]"
  );

  const updatedKOTs = kots.map((kot) =>
    kot.id === id ? { ...kot, status } : kot
  );

  localStorage.setItem(
    KOT_STORAGE_KEY,
    JSON.stringify(updatedKOTs)
  );
}
