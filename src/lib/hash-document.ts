import crypto from "crypto";

export function hashDocument(buffer: ArrayBuffer): string {
  const hash = crypto.createHash("sha256");
  hash.update(Buffer.from(buffer));
  return hash.digest("hex");
}
