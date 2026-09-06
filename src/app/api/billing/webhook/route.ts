import { NextResponse } from "next/server";
import { db } from "@/utils/db";
import { organization } from "@/db/schema";
import { eq } from "drizzle-orm";
// Dodo uses standardwebhooks for verification
import { Webhook } from "standardwebhooks";

const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET || "";

export async function POST(req: Request) {
  try {
    const payload = await req.text();
    const headers = {
      "webhook-id": req.headers.get("webhook-id") || "",
      "webhook-signature": req.headers.get("webhook-signature") || "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
    };

    // Verify webhook signature
    const wh = new Webhook(webhookSecret);
    let event: any;
    try {
      event = wh.verify(payload, headers as any);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const { type, data } = event;

    // Handle payment/subscription success
    if (type === "payment.succeeded" || type === "subscription.active" || type === "subscription.renewed") {
      const metadata = data.metadata || {};
      const orgId = metadata.organizationId;
      const plan = metadata.plan;

      if (orgId) {
        await db.update(organization)
          .set({
            plan: plan || "freelancer", // Fallback
            subscriptionStatus: "active",
            dodoCustomerId: data.customer?.customer_id || data.customer_id,
            dodoSubscriptionId: data.subscription_id || data.payment_id,
            // Add a generous current period end if it's a subscription, otherwise 1 month
            currentPeriodEnd: data.next_billing_date ? new Date(data.next_billing_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          })
          .where(eq(organization.id, orgId));
      }
    }

    // Handle subscription cancellation
    if (type === "subscription.canceled" || type === "subscription.cancelled" || type === "subscription.past_due" || type === "subscription.expired") {
      const customerId = data.customer?.customer_id || data.customer_id;
      if (customerId) {
        await db.update(organization)
          .set({ subscriptionStatus: (type === "subscription.canceled" || type === "subscription.cancelled") ? "canceled" : "past_due" })
          .where(eq(organization.dodoCustomerId, customerId));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
