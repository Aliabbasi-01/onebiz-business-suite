import type { BusinessProfile } from "@/lib/business-profile";
import { getBusinessConfig, type BusinessType } from "@/lib/business-config";

const BUSINESS_TYPE_KEY = "onebiz_business_type";
const ACTIVE_PROFILE_KEY = "onebiz_business_profile";

export function getStoredBusinessType(): BusinessType {
  if (typeof window === "undefined") return "other";

  const rawType = window.localStorage.getItem(BUSINESS_TYPE_KEY);
  const resolved = getBusinessConfig(rawType ?? undefined);

  return resolved.type === rawType ? resolved.type : "other";
}

export function getActiveBusinessProfile(): BusinessProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(ACTIVE_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as BusinessProfile) : null;
  } catch {
    return null;
  }
}

export function setActiveBusinessProfile(profile: BusinessProfile) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(profile));

  if (profile.businessType) {
    window.localStorage.setItem(BUSINESS_TYPE_KEY, profile.businessType);
  }
}

export function getCurrentBusinessConfig(type?: string | null) {
  return getBusinessConfig(type ?? getStoredBusinessType());
}
