import { createWorker } from "tesseract.js";
import os from "os";
import { extractPdfText } from "./pdf-extractor";
import { generateStructuredWithFallback } from "./client";
import { z } from "zod";

export const paymentProofExtractedSchema = z.object({
  referenceId: z
    .string()
    .nullable()
    .describe("UTR number, UPI reference ID, IMPS/NEFT reference number, or transaction ID"),
  amount: z
    .number()
    .nullable()
    .describe("Payment amount transferred, in standard decimal units (e.g. 25000 or 1500.50)"),
  currency: z
    .string()
    .nullable()
    .describe("Currency code detected (e.g. INR, USD, EUR, GBP)"),
  paymentDate: z
    .string()
    .nullable()
    .describe("Transaction date in YYYY-MM-DD format or readable date"),
  paymentMethod: z
    .string()
    .nullable()
    .describe("Payment method detected: upi, bank_transfer, card, wire, cash, etc."),
  bankOrApp: z
    .string()
    .nullable()
    .describe("Bank name or payment app (e.g. HDFC Bank, ICICI Bank, Google Pay, PhonePe, Paytm, Chase)"),
  confidence: z
    .enum(["high", "medium", "low"])
    .describe("Confidence rating of the extracted financial proof"),
});

export type PaymentProofExtractedData = z.infer<typeof paymentProofExtractedSchema>;

const SYSTEM_PROMPT = `You are an expert payment verification and audit AI.
Analyze the extracted document text (from an invoice receipt, UPI confirmation screenshot, bank transfer slip, or wire receipt) and extract the key transaction fields.

Rules:
- For "referenceId", look for UTR, UPI Ref ID, Transaction ID, IMPS Ref, Txn Hash, or Cheque number.
- For "amount", extract the total payment amount transferred as a clean number (e.g. 25000, 1500.50). Remove currency symbols and commas.
- For "currency", infer standard 3-letter ISO code if recognizable (₹ -> INR, $ -> USD, € -> EUR, £ -> GBP).
- For "paymentDate", format as YYYY-MM-DD if recognizable, or preserve the date string found.
- For "paymentMethod", categorize as "upi", "bank_transfer", "card", "wire", or "other".
- For "bankOrApp", identify the transmitting bank or payment app (e.g. "Google Pay / HDFC Bank").
- Set "confidence" to "high" if referenceId and amount are clearly visible, "medium" if either is ambiguous, or "low" if key details are missing.`;

/**
 * Extracts text from an image buffer using Tesseract OCR.
 */
export async function ocrImageText(imageBuffer: Buffer): Promise<string> {
  let worker;
  try {
    worker = await createWorker("eng", 1, {
      cachePath: os.tmpdir(),
    });
    const {
      data: { text },
    } = await worker.recognize(imageBuffer);
    return text || "";
  } catch (err) {
    console.error("[Payment OCR Error]:", err);
    return "";
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // ignore cleanup error
      }
    }
  }
}

/**
 * End-to-end extraction pipeline for payment proof documents (PDF or Image).
 *
 * 1. For PDF: extracts embedded text layer via unpdf.
 * 2. For Images (or image-only PDFs): runs Tesseract OCR.
 * 3. Passes text to Groq structured extraction (openai/gpt-oss-120b with fallback to openai/gpt-oss-20b).
 */
export async function extractPaymentProof(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string = "",
): Promise<PaymentProofExtractedData> {
  let extractedText = "";

  const isPdf =
    mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    try {
      const pdfResult = await extractPdfText(fileBuffer);
      extractedText = pdfResult.text || "";
    } catch (pdfErr) {
      console.warn("[Payment Extractor] unpdf text extraction failed:", pdfErr);
    }
  }

  // If not a PDF or if PDF had no embedded text layer (scanned PDF), run OCR
  if (!extractedText || extractedText.trim().length < 20) {
    console.log("[Payment Extractor] Running Tesseract OCR on document...");
    extractedText = await ocrImageText(fileBuffer);
  }

  console.log(`[Payment Extractor] Document text length: ${extractedText.length} characters.`);

  if (!extractedText || extractedText.trim().length < 5) {
    return {
      referenceId: null,
      amount: null,
      currency: null,
      paymentDate: null,
      paymentMethod: null,
      bankOrApp: null,
      confidence: "low",
    };
  }

  try {
    const structuredResult = await generateStructuredWithFallback<PaymentProofExtractedData>({
      schema: paymentProofExtractedSchema,
      system: SYSTEM_PROMPT,
      prompt: `Extract structured payment proof details from the following document text:\n\n${extractedText.slice(
        0,
        15_000,
      )}`,
    });

    return structuredResult;
  } catch (aiErr) {
    console.error("[Payment Extractor] AI parsing failed:", aiErr);
    return {
      referenceId: null,
      amount: null,
      currency: null,
      paymentDate: null,
      paymentMethod: null,
      bankOrApp: null,
      confidence: "low",
    };
  }
}
