import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant-context";
import { headers } from "next/headers";
import DodoPayments from "dodopayments";
import { BILLING_CONFIG, PlanTier } from "@/config/billing";
import { db } from "@/utils/db";
import { organization } from "@/db/schema";
import { eq } from "drizzle-orm";

// Make sure to add DODO_PAYMENTS_API_KEY to your .env.local
const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const { user, organizationId } = await getTenantContext(reqHeaders);

    if (!user || !organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await req.json();

    const planConfig = BILLING_CONFIG[plan as PlanTier];
    if (!planConfig || !planConfig.priceId) {
      return NextResponse.json({ error: "Invalid plan or missing price config" }, { status: 400 });
    }

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    if (!org) {
      return NextResponse.json({ error: "Org not found" }, { status: 404 });
    }

    // Create Dodo Checkout Session
    const payment = await dodo.payments.create({
      billing: {
        country: "US"
      },
      customer: {
        email: user.email,
        name: user.name || "",
      },
      product_cart: [
        {
          product_id: planConfig.priceId,
          quantity: 1,
        }
      ],
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing?success=true`,
      // Attach org ID to metadata so the webhook knows who paid
      metadata: {
        organizationId: organizationId,
        plan: plan,
      },
    });

    // Handle different possible response structures depending on SDK version
    const url = (payment as any).paymentLink || (payment as any).payment_link || (payment as any).url;

    if (url) {
      return NextResponse.json({ url });
    } else {
      console.error("Dodo payments response missing URL:", payment);
      return NextResponse.json({ error: "Failed to generate payment link" }, { status: 500 });
    }
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}
