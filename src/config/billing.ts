export type PlanTier = "free" | "freelancer" | "agency" | "enterprise";

export interface PlanConfig {
  name: string;
  maxSeats: number;
  maxClients: number | "unlimited"; // "unlimited" for paid plans
  maxProjects: number | "unlimited";
  features: string[];
  priceMonthly: number;
  priceId?: string; // Dodo Payments Product/Price ID
}

export const BILLING_CONFIG: Record<PlanTier, PlanConfig> = {
  free: {
    name: "Free Trial",
    maxSeats: 1, // Only the owner
    maxClients: 2,
    maxProjects: 2,
    features: ["Up to 2 clients", "Basic AI credits", "14-day trial"],
    priceMonthly: 0,
  },
  freelancer: {
    name: "Freelancer",
    maxSeats: 1, // 1 seat (the owner)
    maxClients: "unlimited",
    maxProjects: "unlimited",
    features: [
      "1 seat",
      "Standard AI credits",
      "Unlimited client projects",
      "Unlimited proposals & contracts",
      "Unlimited file uploads",
    ],
    priceMonthly: 20, // Discounted to $15 at checkout
    priceId: process.env.NEXT_PUBLIC_DODO_FREELANCER_PRICE_ID,
  },
  agency: {
    name: "Agency",
    maxSeats: 5, // 1 owner + 4 members
    maxClients: "unlimited",
    maxProjects: "unlimited",
    features: [
      "Up to 5 seats",
      "Extended AI credits",
      "Whitelabeling",
      "Everything in Freelancer",
    ],
    priceMonthly: 30, // Discounted to $25 at checkout
    priceId: process.env.NEXT_PUBLIC_DODO_AGENCY_PRICE_ID,
  },
  enterprise: {
    name: "Enterprise",
    maxSeats: 9999,
    maxClients: "unlimited",
    maxProjects: "unlimited",
    features: [
      "Custom seat limits",
      "Unlimited AI credits",
      "Dedicated account manager",
      "Custom integrations",
    ],
    priceMonthly: 0, // Contact Sales
    priceId: undefined,
  },
};

/**
 * Checks if local billing bypass is active.
 * When NEXT_PUBLIC_BYPASS_BILLING=true, all limits act as if the user is on an Enterprise plan.
 */
export const isBillingBypassed = (): boolean => {
  return process.env.NEXT_PUBLIC_BYPASS_BILLING === "true";
};

/**
 * Helper to get active limits for an organization's plan.
 */
export const getPlanLimits = (plan: PlanTier = "free"): PlanConfig => {
  if (isBillingBypassed()) {
    return BILLING_CONFIG.enterprise;
  }
  return BILLING_CONFIG[plan] || BILLING_CONFIG.free;
};
