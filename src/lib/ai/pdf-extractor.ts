import { extractText, getDocumentProxy } from "unpdf";

/**
 * Extracts plain text from a PDF buffer using unpdf (serverless PDF.js).
 *
 * @param pdfBuffer - Raw PDF file as a Buffer or Uint8Array.
 * @returns Object with `text` (merged page text) and `totalPages`.
 * @throws Error if the PDF cannot be parsed.
 */
export async function extractPdfText(
  pdfBuffer: Buffer | Uint8Array,
): Promise<{ text: string; totalPages: number }> {
  const data =
    pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);

  const pdf = await getDocumentProxy(data);
  const result = await extractText(pdf, { mergePages: true });

  // When mergePages is true, result.text is a single string.
  // Cast explicitly since unpdf types may be inaccurate.
  const text = Array.isArray(result.text)
    ? (result.text as string[]).join("\n\n")
    : String(result.text);

  return { text: text.trim(), totalPages: result.totalPages };
}

/**
 * Fetches a PDF from a public URL and extracts its text.
 *
 * @param url - Public URL of the PDF (e.g. Vercel Blob URL).
 * @returns Object with `text` and `totalPages`.
 */
export async function extractPdfTextFromUrl(
  url: string,
): Promise<{ text: string; totalPages: number }> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch PDF from ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return extractPdfText(new Uint8Array(arrayBuffer));
}
