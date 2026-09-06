import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant-context";
import { headers } from "next/headers";
import DodoPayments from "dodopayments";
import { BILLING_CONFIG, PlanTier } from "@/config/billing";
import { db } from "@/utils/db";
import { organization } from "@/db/schema";
import { eq } from "drizzle-orm";

const environment =
  process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
    ? "live_mode"
    : "test_mode";

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY || "",
  environment,
});

export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const { user, organizationId } = await getTenantContext(reqHeaders);

    if (!user || !organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.DODO_PAYMENTS_API_KEY) {
      console.error("DODO_PAYMENTS_API_KEY is not configured in environment variables.");
      return NextResponse.json(
        { error: "Payment processor is not configured (missing DODO_PAYMENTS_API_KEY)" },
        { status: 500 }
      );
    }

    const { plan } = await req.json();

    const planConfig = BILLING_CONFIG[plan as PlanTier];
    if (!planConfig || !planConfig.priceId) {
      return NextResponse.json(
        { error: `Missing price configuration for plan '${plan}'. Please check NEXT_PUBLIC_DODO_${(plan || "").toUpperCase()}_PRICE_ID.` },
        { status: 400 }
      );
    }

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

    // Create Dodo Checkout Session (handles one-time products as well as recurring subscriptions)
    const session = await dodo.checkoutSessions.create({
      billing_address: org.globalCurrency === "INR" ? { country: "IN" } : undefined,
      feature_flags: {
        allow_customer_editing_country: true,
        allow_customer_editing_state: true,
        allow_customer_editing_city: true,
        allow_customer_editing_zipcode: true,
        allow_customer_editing_street: true,
      },
      customer: {
        email: user.email,
        name: user.name || "",
      },
      product_cart: [
        {
          product_id: planConfig.priceId,
          quantity: 1,
        },
      ],
      return_url: `${appUrl}/dashboard/billing?success=true`,
      metadata: {
        organizationId: organizationId,
        plan: plan,
      },
    });

    const url = session.checkout_url || (session as any).paymentLink || (session as any).payment_link || (session as any).url;

    if (url) {
      return NextResponse.json({ url });
    } else {
      console.error("Dodo checkout session missing checkout_url:", session);
      return NextResponse.json({ error: "Failed to generate checkout link" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Checkout error:", error);
    const errorMessage = error?.message || error?.error?.message || "Failed to create checkout session";
    return NextResponse.json({ error: errorMessage }, { status: error?.status || 500 });
  }
}
