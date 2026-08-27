import { get, put } from "@vercel/blob";

export interface PutBlobOptions {
  contentType?: string;
  addRandomSuffix?: boolean;
  allowOverwrite?: boolean;
}

/**
 * Robustly uploads a file to Vercel Blob, dynamically adapting to whether
 * the underlying Vercel Blob store is configured as "public" or "private".
 */
export async function putBlob(
  pathname: string,
  body: string | Blob | ArrayBuffer | Buffer | ReadableStream,
  options?: PutBlobOptions
) {
  const addRandomSuffix = options?.addRandomSuffix ?? false;
  const allowOverwrite = options?.allowOverwrite ?? true;
  const contentType = options?.contentType;

  try {
    // 1. Try public access (default for standard Vercel Blob stores)
    return await put(pathname, body, {
      access: "public",
      addRandomSuffix,
      allowOverwrite,
      ...(contentType ? { contentType } : {}),
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    // If the store is explicitly configured for private access, retry with private
    if (
      errMsg.includes("Cannot use public access on a private store") ||
      errMsg.includes("must be configured with public access") ||
      errMsg.includes("private store")
    ) {
      return await put(pathname, body, {
        access: "private",
        addRandomSuffix,
        allowOverwrite,
        ...(contentType ? { contentType } : {}),
      });
    }
    throw err;
  }
}

/**
 * Retrieves a document stream from Vercel Blob across public/private stores,
 * with graceful HTTP fetch fallback.
 */
export async function getBlobStream(
  url: string
): Promise<{ stream: ReadableStream; contentType: string } | null> {
  // Tier 1: Try direct HTTP fetch (fastest and universal for public stores)
  try {
    const res = await fetch(url);
    if (res.ok && res.body) {
      return {
        stream: res.body,
        contentType: res.headers.get("content-type") || "application/octet-stream",
      };
    }
  } catch {
    // Ignore and fallback
  }

  // Tier 2: Try Vercel Blob get with public access
  try {
    const document = await get(url, { access: "public", useCache: false });
    if (document?.stream) {
      return {
        stream: document.stream,
        contentType: document.blob?.contentType || "application/octet-stream",
      };
    }
  } catch {
    // Ignore and fallback
  }

  // Tier 3: Try Vercel Blob get with private access
  try {
    const document = await get(url, { access: "private", useCache: false });
    if (document?.stream) {
      return {
        stream: document.stream,
        contentType: document.blob?.contentType || "application/octet-stream",
      };
    }
  } catch {
    // Ignore and return null
  }

  return null;
}

/**
 * Retrieves a document as an ArrayBuffer from Vercel Blob across public/private stores.
 */
export async function getBlobBuffer(url: string): Promise<ArrayBuffer | null> {
  const result = await getBlobStream(url);
  if (!result) return null;
  return await new Response(result.stream).arrayBuffer();
}
