
import {
  getBusinessRecords,
  saveBusinessRecords,
  type BusinessRecord,
} from "@/lib/business-data";

export type ProductType = "Product" | "Service";

export type Product = BusinessRecord & {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  available: boolean;
  createdAt: string;

  // Universal catalog fields
  type?: ProductType;
  purchasePrice?: number;
  trackInventory?: boolean;
  sku?: string;
  unit?: string;

  // Business separation
  businessType?: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  barcode?: string;
  expiryDate?: string;
  durationMinutes?: number;
  assignedStaff?: string[];
  batchNumber?: string;
};

export const PRODUCTS_STORAGE_KEY = "onebiz_products";

export function getProducts(): Product[] {
  if (typeof window === "undefined") return [];

  const currentBusiness =
    localStorage.getItem("onebiz_business_type") || "other";

  return getBusinessRecords<Product>("products", currentBusiness).map(
    (product) => ({
      ...product,
      type: product.type || "Product",
      purchasePrice: product.purchasePrice ?? 0,
      trackInventory: product.trackInventory ?? false,
      sku: product.sku || "",
      unit: product.unit || "Piece",
      businessType: product.businessType || currentBusiness,
      stockQuantity: product.stockQuantity ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 0,
      barcode: product.barcode || "",
      expiryDate: product.expiryDate || "",
    })
  );
}

export function getProductsByBusinessType(
  businessType: string
): Product[] {
  return getProducts().filter(
    (product) => product.businessType === businessType
  );
}

export function saveProducts(products: Product[]) {
  const businessType =
    localStorage.getItem("onebiz_business_type") || "other";
  saveBusinessRecords("products", businessType, products);
}

// Save only the current business catalog without touching other businesses.
export function saveBusinessProducts(
  businessType: string,
  businessProducts: Product[]
) {
  if (typeof window === "undefined") return;

  const updatedProducts = businessProducts.map((product) => ({
    ...product,
    businessType,
  }));

  saveBusinessRecords("products", businessType, updatedProducts);
}
