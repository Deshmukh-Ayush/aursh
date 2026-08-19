import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/utils/db";
import { organization } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCachedTenant } from "@/utils/cached-tenant";
import { BillingClientContainer } from "@/components/dashboard/billing/billing-client-container";
import { BILLING_CONFIG } from "@/config/billing";

export const metadata = {
  title: "Billing & Plans",
  description: "Manage your subscription and billing details.",
};

async function BillingData() {
  const { organizationId, user } = await getCachedTenant();

  if (!organizationId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center max-w-2xl mx-auto mt-12 border rounded-xl bg-muted/20">
        <h2 className="text-xl font-semibold text-foreground">No Active Organization</h2>
        <p className="text-muted-foreground text-xs mt-2">
          You need an active organization to view billing.
        </p>
      </div>
    );
  }

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
    columns: {
      id: true,
      name: true,
      plan: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      trialEndsAt: true,
    }
  });

  if (!org) {
    return <div className="p-6 text-xs text-muted-foreground">Organization not found</div>;
  }

  return (
    <BillingClientContainer 
      organization={org} 
      config={BILLING_CONFIG}
      userEmail={user.email}
    />
  );
}

export default function BillingPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Billing & Plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription, view limits, and upgrade your plan.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-xl" />}>
        <BillingData />
      </Suspense>
    </div>
  );
}
