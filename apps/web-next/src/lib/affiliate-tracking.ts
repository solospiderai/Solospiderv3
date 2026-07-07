/**
 * Affiliate Referral Tracking Utility
 * 
 * Captures referral codes from URLs (?ref=xxx), stores them with expiry,
 * and handles commission calculation when referred users purchase plans.
 */

// Plan prices in INR (monthly)
const PLAN_PRICES: Record<string, number> = {
  growth: 4999,
  scale: 9999,
};

// Commission rates
const FIRST_TIME_RATE = 0.30; // 30%
const RECURRING_RATE = 0.15;  // 15%

interface StoredReferral {
  refCode: string;
  capturedAt: number; // timestamp
  expiresAt: number;  // timestamp
}

/**
 * Captures a referral code from the current URL (?ref=xxx)
 * and stores it in localStorage with a 60-day expiry.
 * Call this on landing pages (home, pricing, etc.)
 */
export function captureReferralCode(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");

    if (refCode && refCode.trim()) {
      const now = Date.now();
      const sixtyDays = 60 * 24 * 60 * 60 * 1000;

      const referral: StoredReferral = {
        refCode: refCode.trim().toLowerCase(),
        capturedAt: now,
        expiresAt: now + sixtyDays,
      };

      window.localStorage.setItem("solospider_referral", JSON.stringify(referral));
      return refCode.trim().toLowerCase();
    }
  } catch (err) {
    console.warn("Failed to capture referral code:", err);
  }

  return null;
}

/**
 * Retrieves the stored referral code if it exists and hasn't expired.
 */
export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem("solospider_referral");
    if (!stored) return null;

    const referral: StoredReferral = JSON.parse(stored);

    // Check expiry
    if (Date.now() > referral.expiresAt) {
      window.localStorage.removeItem("solospider_referral");
      return null;
    }

    return referral.refCode;
  } catch {
    return null;
  }
}

/**
 * Clears the stored referral code after successful attribution.
 */
export function clearReferralCode(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("solospider_referral");
}

/**
 * Records a referral commission after a successful plan purchase.
 * 
 * Looks up the affiliate by ref code, determines if this is a first-time
 * or recurring purchase, calculates commission, and credits the affiliate.
 * 
 * @param planId - The plan that was purchased ("growth" or "scale")
 * @param userEmail - The email of the buyer
 * @returns true if commission was recorded, false otherwise
 */
export function recordReferralCommission(
  planId: string,
  userEmail?: string
): boolean {
  if (typeof window === "undefined") return false;

  const refCode = getStoredReferralCode();
  if (!refCode) return false;

  try {
    const stored = window.localStorage.getItem("solospider_affiliate_state");
    if (!stored) return false;

    const state = JSON.parse(stored);
    const affiliates = state.affiliates || [];
    const referrals = state.referrals || [];

    // Find the affiliate who owns this ref code
    const affiliateIndex = affiliates.findIndex(
      (a: any) => a.refId?.toLowerCase() === refCode
    );

    if (affiliateIndex === -1) return false;

    const affiliate = affiliates[affiliateIndex];
    const planPrice = PLAN_PRICES[planId] || 4999;

    // Determine if this is a first-time or recurring purchase by this user
    const existingReferrals = referrals.filter(
      (r: any) =>
        r.affiliateId === affiliate.id &&
        r.customerEmail?.toLowerCase() === userEmail?.toLowerCase()
    );

    const isFirstTime = existingReferrals.length === 0;
    const rate = isFirstTime ? FIRST_TIME_RATE : RECURRING_RATE;
    const commission = Math.round(planPrice * rate * 100) / 100;

    // Create a referral record
    const newReferral = {
      id: "ref-" + Date.now(),
      affiliateId: affiliate.id,
      customerName: userEmail?.split("@")[0] || "Customer",
      customerEmail: userEmail || "unknown@user.com",
      plan: planId.charAt(0).toUpperCase() + planId.slice(1),
      signupDate: new Date().toISOString().split("T")[0],
      purchaseDate: new Date().toISOString().split("T")[0],
      status: "converted",
      commission,
      isFirstTime,
      rateApplied: rate * 100,
    };

    // Update affiliate stats
    affiliates[affiliateIndex] = {
      ...affiliate,
      signups: (affiliate.signups || 0) + (isFirstTime ? 1 : 0),
      activeCustomers: (affiliate.activeCustomers || 0) + (isFirstTime ? 1 : 0),
      pendingCommission: Math.round(((affiliate.pendingCommission || 0) + commission) * 100) / 100,
      totalEarnings: Math.round(((affiliate.totalEarnings || 0) + commission) * 100) / 100,
      balance: Math.round(((affiliate.balance || 0) + commission) * 100) / 100,
    };

    // Save back
    state.affiliates = affiliates;
    state.referrals = [...referrals, newReferral];
    window.localStorage.setItem("solospider_affiliate_state", JSON.stringify(state));

    // Don't clear the referral code — it should persist for recurring commissions
    // Only clear if it was a first-time attribution
    // Actually, keep the ref code so recurring purchases also track

    console.log(
      `[Affiliate] Commission recorded: ₹${commission} (${rate * 100}% ${isFirstTime ? "first-time" : "recurring"}) for affiliate "${affiliate.name}" (${affiliate.refId})`
    );

    return true;
  } catch (err) {
    console.warn("Failed to record referral commission:", err);
    return false;
  }
}
