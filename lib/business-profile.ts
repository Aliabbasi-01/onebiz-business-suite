export type BusinessProfile = {
  ownerUserId: string;
  businessType: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  [key: string]: unknown;
};

const PROFILE_PREFIX = "onebiz_business_profile_";

export function saveUserBusinessProfile(
  userId: string,
  profile: BusinessProfile
) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    `${PROFILE_PREFIX}${userId}`,
    JSON.stringify(profile)
  );

  // Keep the existing app pages working with the logged-in user's profile.
  localStorage.setItem(
    "onebiz_business_profile",
    JSON.stringify(profile)
  );

  localStorage.setItem(
    "onebiz_business_type",
    profile.businessType
  );
}

export function getUserBusinessProfile(
  userId: string
): BusinessProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(`${PROFILE_PREFIX}${userId}`);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function activateUserBusinessProfile(
  profile: BusinessProfile
) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    "onebiz_business_profile",
    JSON.stringify(profile)
  );

  localStorage.setItem(
    "onebiz_business_type",
    profile.businessType
  );
}