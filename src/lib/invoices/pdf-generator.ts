import { PDFDocument, StandardFonts, rgb, RGB } from "pdf-lib";
import { InvoiceData, calculateInvoiceTotals, formatInvoiceMoney } from "./types";

function hexToRgbColor(hex: string): RGB {
  const cleanHex = hex.replace("#", "");
  const fullHex = cleanHex.length === 3
    ? cleanHex.split("").map((c) => c + c).join("")
    : cleanHex;

  const num = parseInt(fullHex, 16);
  if (isNaN(num)) return rgb(0.0, 0.0, 0.0);

  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  return rgb(r, g, b);
}

async function fetchImageBytes(url: string): Promise<{ bytes: Uint8Array; type: "png" | "jpg" } | null> {
  try {
    if (url.startsWith("data:image/png;base64,")) {
      const b64 = url.replace("data:image/png;base64,", "");
      const buf = Buffer.from(b64, "base64");
      return { bytes: new Uint8Array(buf), type: "png" };
    }
    if (url.startsWith("data:image/jpeg;base64,") || url.startsWith("data:image/jpg;base64,")) {
      const b64 = url.replace(/^data:image\/(jpeg|jpg);base64,/, "");
      const buf = Buffer.from(b64, "base64");
      return { bytes: new Uint8Array(buf), type: "jpg" };
    }

    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "";
    const isPng = contentType.includes("png") || url.toLowerCase().endsWith(".png");
    return { bytes: new Uint8Array(arrayBuf), type: isPng ? "png" : "jpg" };
  } catch {
    return null;
  }
}

export async function generateInvoicePdf(invoice: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const themeColor = hexToRgbColor(invoice.themeColor || "#000000");
  const darkColor = rgb(0.06, 0.06, 0.06);
  const bodyColor = rgb(0.28, 0.28, 0.28);
  const mutedColor = rgb(0.55, 0.55, 0.55);
  const labelColor = rgb(0.65, 0.65, 0.65);
  const borderColor = rgb(0.85, 0.85, 0.85);

  const margin = 48;
  let y = height - margin;

  // 1. Header: Logo on left, Invoice number on right
  if (invoice.companySnapshot.logoUrl) {
    const logoData = await fetchImageBytes(invoice.companySnapshot.logoUrl);
    if (logoData) {
      try {
        const image = logoData.type === "png"
          ? await doc.embedPng(logoData.bytes)
          : await doc.embedJpg(logoData.bytes);
        const dims = image.scaleToFit(140, 36);
        page.drawImage(image, {
          x: margin,
          y: y - dims.height,
          width: dims.width,
          height: dims.height,
        });
      } catch { /* continue */ }
    }
  }

  const invoiceTitle = `Invoice ${invoice.invoiceNumber || "INV-001"}`;
  const titleWidth = fontBold.widthOfTextAtSize(invoiceTitle, 18);
  page.drawText(invoiceTitle, {
    x: width - margin - titleWidth,
    y: y - 14,
    size: 18,
    font: fontBold,
    color: themeColor,
  });

  const statusLabel = (invoice.status || "DRAFT").toUpperCase();
  const statusWidth = fontRegular.widthOfTextAtSize(statusLabel, 7.5);
  page.drawText(statusLabel, {
    x: width - margin - statusWidth,
    y: y - 28,
    size: 7.5,
    font: fontRegular,
    color: invoice.status === "paid" ? rgb(0.1, 0.65, 0.35) : mutedColor,
  });

  y -= 50;

  // 2. Metadata Row
  const metaItems = [
    { label: "Serial:", val: String(invoice.serialNumber || 1).padStart(4, "0") },
    { label: "Issue Date:", val: new Date(invoice.invoiceDate).toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" }) },
    { label: "Due Date:", val: new Date(invoice.dueDate).toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" }) },
    { label: "Currency:", val: invoice.currency || "USD" },
  ];

  let metaX = margin;
  for (let i = 0; i < metaItems.length; i++) {
    const m = metaItems[i];
    page.drawText(m.label, { x: metaX, y, size: 7.5, font: fontRegular, color: mutedColor });
    const labelW = fontRegular.widthOfTextAtSize(m.label, 7.5);
    page.drawText(` ${m.val}`, { x: metaX + labelW, y, size: 7.5, font: fontBold, color: darkColor });
    const valW = fontBold.widthOfTextAtSize(` ${m.val}`, 7.5);
    metaX += labelW + valW + 18;
    if (i < metaItems.length - 1) {
      page.drawText("|", { x: metaX - 12, y, size: 7.5, font: fontRegular, color: borderColor });
    }
  }

  y -= 18;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: borderColor });
  y -= 20;

  // 3. Billed By & Billed To
  const colWidth = (width - margin * 2 - 24) / 2;

  page.drawText("FROM", { x: margin, y, size: 7, font: fontBold, color: labelColor });
  let fromY = y - 14;
  page.drawText(invoice.companySnapshot.name || "Company Name", { x: margin, y: fromY, size: 10, font: fontBold, color: darkColor });
  fromY -= 12;
  if (invoice.companySnapshot.address) {
    for (const line of invoice.companySnapshot.address.split("\n").slice(0, 2)) {
      page.drawText(line.trim(), { x: margin, y: fromY, size: 8.5, font: fontRegular, color: bodyColor });
      fromY -= 11;
    }
  }
  if (invoice.companySnapshot.email) {
    page.drawText(invoice.companySnapshot.email, { x: margin, y: fromY, size: 8.5, font: fontRegular, color: bodyColor });
    fromY -= 11;
  }
  if (invoice.companySnapshot.phone) {
    page.drawText(invoice.companySnapshot.phone, { x: margin, y: fromY, size: 8.5, font: fontRegular, color: bodyColor });
    fromY -= 11;
  }

  const toX = margin + colWidth + 24;
  page.drawText("TO", { x: toX, y, size: 7, font: fontBold, color: labelColor });
  let toY = y - 14;
  page.drawText(invoice.clientSnapshot.name || "Client Name", { x: toX, y: toY, size: 10, font: fontBold, color: darkColor });
  toY -= 12;
  if (invoice.clientSnapshot.address) {
    for (const line of invoice.clientSnapshot.address.split("\n").slice(0, 2)) {
      page.drawText(line.trim(), { x: toX, y: toY, size: 8.5, font: fontRegular, color: bodyColor });
      toY -= 11;
    }
  }
  if (invoice.clientSnapshot.email) {
    page.drawText(invoice.clientSnapshot.email, { x: toX, y: toY, size: 8.5, font: fontRegular, color: bodyColor });
    toY -= 11;
  }
  if (invoice.clientSnapshot.phone) {
    page.drawText(invoice.clientSnapshot.phone, { x: toX, y: toY, size: 8.5, font: fontRegular, color: bodyColor });
  }

  y = Math.min(fromY, toY) - 18;

  // 4. Line Items Table
  const colItemX = margin;
  const colQtyX = margin + 290;
  const colPriceX = margin + 360;
  const colTotalX = width - margin;

  page.drawText("ITEM", { x: colItemX, y, size: 7.5, font: fontBold, color: labelColor });
  page.drawText("QTY", { x: colQtyX, y, size: 7.5, font: fontBold, color: labelColor });
  page.drawText("PRICE", { x: colPriceX, y, size: 7.5, font: fontBold, color: labelColor });
  const totalHdrW = fontBold.widthOfTextAtSize("TOTAL", 7.5);
  page.drawText("TOTAL", { x: colTotalX - totalHdrW, y, size: 7.5, font: fontBold, color: labelColor });

  y -= 8;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: borderColor });
  y -= 14;

  for (const item of invoice.lineItems) {
    const itemStartY = y;
    page.drawText(item.itemName || "Item", { x: colItemX, y, size: 9, font: fontBold, color: darkColor });
    y -= 11;
    if (item.description) {
      page.drawText(item.description.slice(0, 60), { x: colItemX, y, size: 7.5, font: fontRegular, color: mutedColor });
      y -= 10;
    }
    page.drawText(String(item.quantity || 1), { x: colQtyX, y: itemStartY, size: 9, font: fontRegular, color: bodyColor });
    page.drawText(formatInvoiceMoney(item.unitPrice, invoice.currency), { x: colPriceX, y: itemStartY, size: 9, font: fontRegular, color: bodyColor });
    const ltStr = formatInvoiceMoney(item.lineTotal, invoice.currency);
    const ltW = fontBold.widthOfTextAtSize(ltStr, 9);
    page.drawText(ltStr, { x: colTotalX - ltW, y: itemStartY, size: 9, font: fontBold, color: darkColor });
    y -= 4;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.3, color: rgb(0.92, 0.92, 0.92) });
    y -= 14;
  }

  y -= 8;

  // 5. Summary
  const totals = calculateInvoiceTotals(invoice.lineItems, invoice.billingDetails);
  const summaryX = width - margin - 200;
  let sY = y;

  page.drawText("Subtotal", { x: summaryX, y: sY, size: 9, font: fontRegular, color: bodyColor });
  const stStr = formatInvoiceMoney(totals.subtotal, invoice.currency);
  page.drawText(stStr, { x: width - margin - fontRegular.widthOfTextAtSize(stStr, 9), y: sY, size: 9, font: fontRegular, color: darkColor });
  sY -= 14;

  for (const b of totals.computedBilling) {
    const lbl = b.type === "percentage" ? `${b.label} (${b.rawValue}%)` : b.label;
    page.drawText(lbl, { x: summaryX, y: sY, size: 9, font: fontRegular, color: bodyColor });
    const sign = b.computedAmount >= 0 ? "+" : "";
    const aStr = `${sign}${formatInvoiceMoney(b.computedAmount, invoice.currency)}`;
    page.drawText(aStr, { x: width - margin - fontRegular.widthOfTextAtSize(aStr, 9), y: sY, size: 9, font: fontRegular, color: darkColor });
    sY -= 14;
  }

  sY -= 4;
  page.drawLine({ start: { x: summaryX, y: sY + 6 }, end: { x: width - margin, y: sY + 6 }, thickness: 0.5, color: borderColor });

  page.drawText("Total Due", { x: summaryX, y: sY - 6, size: 10, font: fontBold, color: darkColor });
  const tStr = formatInvoiceMoney(totals.total, invoice.currency);
  page.drawText(tStr, { x: width - margin - fontBold.widthOfTextAtSize(tStr, 14), y: sY - 8, size: 14, font: fontBold, color: themeColor });

  // 6. Payment Information
  if (invoice.paymentInformation && invoice.paymentInformation.length > 0) {
    let pY = y;
    page.drawText("PAYMENT INFORMATION", { x: margin, y: pY, size: 7, font: fontBold, color: labelColor });
    pY -= 14;
    for (const info of invoice.paymentInformation) {
      page.drawText(`${info.label}:`, { x: margin, y: pY, size: 8.5, font: fontBold, color: darkColor });
      page.drawText(info.value, { x: margin + 80, y: pY, size: 8.5, font: fontRegular, color: bodyColor });
      pY -= 12;
    }
  }

  y = sY - 40;

  // 7. Signature
  if (invoice.companySnapshot.signatureUrl) {
    const sigData = await fetchImageBytes(invoice.companySnapshot.signatureUrl);
    if (sigData) {
      try {
        const sigImage = sigData.type === "png" ? await doc.embedPng(sigData.bytes) : await doc.embedJpg(sigData.bytes);
        const dims = sigImage.scaleToFit(120, 36);
        page.drawImage(sigImage, { x: width - margin - dims.width, y: Math.max(margin + 25, y - dims.height - 10), width: dims.width, height: dims.height });
        page.drawLine({ start: { x: width - margin - 130, y: Math.max(margin + 22, y - dims.height - 13) }, end: { x: width - margin, y: Math.max(margin + 22, y - dims.height - 13) }, thickness: 0.5, color: borderColor });
        page.drawText("Authorized Signature", { x: width - margin - 110, y: Math.max(margin + 12, y - dims.height - 23), size: 7.5, font: fontRegular, color: mutedColor });
      } catch { /* continue */ }
    }
  }

  // Footer
  page.drawLine({ start: { x: margin, y: margin + 12 }, end: { x: width - margin, y: margin + 12 }, thickness: 0.3, color: rgb(0.92, 0.92, 0.92) });
  page.drawText("Scrunity", { x: margin, y: margin, size: 7.5, font: fontRegular, color: rgb(0.7, 0.7, 0.7) });
  const tyStr = "Thank you for your business";
  page.drawText(tyStr, { x: width - margin - fontRegular.widthOfTextAtSize(tyStr, 7.5), y: margin, size: 7.5, font: fontRegular, color: rgb(0.7, 0.7, 0.7) });

  return await doc.save();
}
