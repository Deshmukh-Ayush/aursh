import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant-context";
import { getOrganizationCreditSummary } from "@/lib/ai/credits";
import { headers } from "next/headers";

export async function GET() {
  try {
    const reqHeaders = await headers();
    const { user, organizationId } = await getTenantContext(reqHeaders);

    if (!user || !organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = await getOrganizationCreditSummary(organizationId);

    return NextResponse.json({
      success: true,
      creditSummary: summary,
    });
  } catch (error) {
    console.error("[Credits API Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization credit usage." },
      { status: 500 }
    );
  }
}
