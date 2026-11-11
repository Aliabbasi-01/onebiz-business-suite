import { getCurrentUser } from "@/lib/auth";

export type BusinessRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  [key: string]: unknown;
};

type StoredRecord = { id: string };

const LEGACY_KEYS: Record<string, string> = {
  products: "onebiz_products",
  orders: "onebiz_orders",
};

function getOwnerId(): string | null {
  return getCurrentUser()?.id ?? null;
}

function getStorageKey(collection: string, businessType: string): string | null {
  const ownerId = getOwnerId();
  if (!ownerId) return null;

  return `onebiz_data_v1_${encodeURIComponent(ownerId)}_${businessType}_${collection}`;
}

function parseRecords<T extends StoredRecord>(raw: string | null): T[] {
  if (!raw) return [];

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Saved business data has an invalid format.");
  }

  return parsed as T[];
}

export function getBusinessRecords<T extends StoredRecord>(
  collection: string,
  businessType: string
): T[] {
  if (typeof window === "undefined") return [];

  const storageKey = getStorageKey(collection, businessType);
  if (!storageKey) return [];

  const saved = window.localStorage.getItem(storageKey);
  if (saved !== null) return parseRecords<T>(saved);

  const legacyKey = LEGACY_KEYS[collection];
  if (!legacyKey) return [];

  const migrationKey = `onebiz_migration_v1_${collection}`;
  if (window.localStorage.getItem(migrationKey)) return [];

  const legacyRecords = parseRecords<T>(
    window.localStorage.getItem(legacyKey)
  );
  const matchingRecords = legacyRecords.filter((record) => {
    const recordType = (record as T & { businessType?: string }).businessType;
    return recordType === businessType || !recordType;
  });
  const migratedRecords = matchingRecords.map((record) => {
    const recordType = (record as T & { businessType?: string }).businessType;
    return recordType
      ? record
      : ({ ...record, businessType } as T);
  });

  if (migratedRecords.length > 0) {
    window.localStorage.setItem(storageKey, JSON.stringify(migratedRecords));
  }

  window.localStorage.setItem(migrationKey, "claimed");
  return migratedRecords;
}

export function saveBusinessRecords<T extends StoredRecord>(
  collection: string,
  businessType: string,
  records: T[]
): void {
  if (typeof window === "undefined") return;

  const storageKey = getStorageKey(collection, businessType);
  if (!storageKey) {
    throw new Error("Sign in before saving business records.");
  }

  window.localStorage.setItem(storageKey, JSON.stringify(records));
}
