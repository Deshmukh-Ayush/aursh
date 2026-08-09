import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/utils/db";
import { contract } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getProjectAccess } from "@/lib/project-auth";
import { extractAndSaveContractScope } from "@/lib/ai/contract-parser";

/**
 * POST /api/ai/extract-contract
 *
 * Extracts scope terms from a contract PDF using AI.
 *
 * Accepts either:
 * - `contractId` in JSON body → fetches the PDF from the contract's stored URL.
 * - `file` in FormData → parses the uploaded PDF directly.
 *
 * Returns the extracted scope items, exclusions, revision limits, and payment terms.
 */
export async function POST(req: NextRequest) {
  try {
    // --- Auth ---
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Parse request body ---
    const contentType = req.headers.get("content-type") ?? "";
    let contractId: string | null = null;
    let projectId: string | null = null;
    let pdfSource: string | Buffer | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      contractId = formData.get("contractId") as string | null;

      const file = formData.get("file") as File | null;
      if (file) {
        if (file.type !== "application/pdf") {
          return NextResponse.json(
            { error: "Only PDF files are accepted" },
            { status: 400 },
          );
        }
        pdfSource = Buffer.from(await file.arrayBuffer());
      }
    } else {
      const body = await req.json();
      contractId = body.contractId ?? null;
    }

    if (!contractId) {
      return NextResponse.json(
        { error: "contractId is required" },
        { status: 400 },
      );
    }

    // --- Fetch contract from DB ---
    const [contractRow] = await db
      .select()
      .from(contract)
      .where(eq(contract.id, contractId));

    if (!contractRow) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 },
      );
    }

    projectId = contractRow.projectId;

    // --- Authorization: user must have project access ---
    const { isAuthorized } = await getProjectAccess(projectId, session.user.id);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // --- Determine PDF source ---
    if (!pdfSource) {
      if (!contractRow.fileUrl) {
        return NextResponse.json(
          { error: "Contract has no file URL and no file was uploaded" },
          { status: 400 },
        );
      }
      pdfSource = contractRow.fileUrl;
    }

    // --- Run AI extraction pipeline ---
    const result = await extractAndSaveContractScope(
      contractId,
      projectId,
      pdfSource,
    );

    return NextResponse.json({
      success: true,
      contractId: result.contractId,
      extractedCount: result.extractedCount,
      terms: result.terms,
    });
  } catch (error) {
    console.error("[AI Extract Contract]", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
