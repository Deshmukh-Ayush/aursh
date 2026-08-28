import { PDFDocument, StandardFonts, rgb, RGB } from "pdf-lib";
import { InvoiceData, calculateInvoiceTotals, formatInvoiceMoney } from "./types";

function hexToRgbColor(hex: string): RGB {
  const cleanHex = hex.replace("#", "");
  const fullHex = cleanHex.length === 3
    ? cleanHex.split("").map((c) => c + c).join("")
    : cleanHex;

  const num = parseInt(fullHex, 16);
  if (isNaN(num)) return rgb(0.31, 0.27, 0.9); // Fallback to #4F46E5

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
  const page = doc.addPage([595.28, 841.89]); // A4 dimensions
  const { width, height } = page.getSize();

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const themeColor = hexToRgbColor(invoice.themeColor || "#4F46E5");
  const darkColor = rgb(0.08, 0.08, 0.08);
  const mutedColor = rgb(0.45, 0.45, 0.45);
  const lightCardColor = rgb(0.97, 0.97, 0.98);
  const borderColor = rgb(0.88, 0.88, 0.9);
  const whiteColor = rgb(1, 1, 1);

  const margin = 40;
  let y = height - margin;

  // 1. Top Accent Strip
  page.drawRectangle({
    x: 0,
    y: height - 5,
    width: width,
    height: 5,
    color: themeColor,
  });

  y -= 15;

  // 2. Header Section: Hero Invoice Title on Left, Metadata Grid on Right
  let logoDrawn = false;
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
        y -= (dims.height + 8);
        logoDrawn = true;
      } catch {
        // Continue if logo fails
      }
    }
  }

  const invoiceTitle = `Invoice ${invoice.invoiceNumber || "INV-001"}`;
  page.drawText(invoiceTitle, {
    x: margin,
    y: y - 16,
    size: 20,
    font: fontBold,
    color: themeColor,
  });

  // Status Badge below title
  const statusLabel = (invoice.status || "DRAFT").toUpperCase();
  const statusWidth = fontBold.widthOfTextAtSize(statusLabel, 7.5) + 12;
  page.drawRectangle({
    x: margin,
    y: y - 34,
    width: statusWidth,
    height: 14,
    color: invoice.status === "paid" ? rgb(0.85, 0.96, 0.89) : rgb(0.93, 0.94, 0.96),
    borderColor: invoice.status === "paid" ? rgb(0.2, 0.7, 0.3) : borderColor,
    borderWidth: 0.5,
  });
  page.drawText(statusLabel, {
    x: margin + 6,
    y: y - 31,
    size: 7.5,
    font: fontBold,
    color: invoice.status === "paid" ? rgb(0.1, 0.5, 0.2) : mutedColor,
  });

  // Right Metadata Table
  const metaRightX = width - margin;
  let mY = y - 4;
  const metaLabels = [
    { label: "Serial Number:", val: String(invoice.serialNumber || 1).padStart(4, "0") },
    { label: "Date:", val: new Date(invoice.invoiceDate).toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" }) },
    { label: "Due Date:", val: new Date(invoice.dueDate).toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" }) },
    { label: "Currency:", val: invoice.currency || "USD" },
  ];

  for (const m of metaLabels) {
    page.drawText(m.label, { x: metaRightX - 160, y: mY, size: 8.5, font: fontRegular, color: mutedColor });
    const valWidth = fontBold.widthOfTextAtSize(m.val, 8.5);
    page.drawText(m.val, { x: metaRightX - valWidth, y: mY, size: 8.5, font: fontBold, color: darkColor });
    mY -= 12;
  }

  y -= 54;

  // 3. Billed By & Billed To Side-by-Side Highlight Cards (Invoicely Style)
  const cardWidth = (width - margin * 2 - 16) / 2;
  const cardHeight = 90;
  const cardY = y - cardHeight;

  // Left Card: Billed By
  page.drawRectangle({
    x: margin,
    y: cardY,
    width: cardWidth,
    height: cardHeight,
    color: lightCardColor,
    borderColor,
    borderWidth: 0.5,
  });
  page.drawText("BILLED BY", { x: margin + 12, y: cardY + cardHeight - 16, size: 8, font: fontBold, color: themeColor });
  page.drawText(invoice.companySnapshot.name || "Company Name", { x: margin + 12, y: cardY + cardHeight - 29, size: 9.5, font: fontBold, color: darkColor });

  let byY = cardY + cardHeight - 41;
  if (invoice.companySnapshot.address) {
    const addrLines = invoice.companySnapshot.address.split("\n");
    for (const line of addrLines.slice(0, 2)) {
      page.drawText(line.trim(), { x: margin + 12, y: byY, size: 8, font: fontRegular, color: mutedColor });
      byY -= 10;
    }
  }
  if (invoice.companySnapshot.email) {
    page.drawText(invoice.companySnapshot.email, { x: margin + 12, y: byY, size: 8, font: fontRegular, color: mutedColor });
    byY -= 10;
  }
  if (invoice.companySnapshot.phone) {
    page.drawText(invoice.companySnapshot.phone, { x: margin + 12, y: byY, size: 8, font: fontRegular, color: mutedColor });
  }

  // Right Card: Billed To
  const rightCardX = margin + cardWidth + 16;
  page.drawRectangle({
    x: rightCardX,
    y: cardY,
    width: cardWidth,
    height: cardHeight,
    color: lightCardColor,
    borderColor,
    borderWidth: 0.5,
  });
  page.drawText("BILLED TO", { x: rightCardX + 12, y: cardY + cardHeight - 16, size: 8, font: fontBold, color: themeColor });
  page.drawText(invoice.clientSnapshot.name || "Client Name", { x: rightCardX + 12, y: cardY + cardHeight - 29, size: 9.5, font: fontBold, color: darkColor });

  let toY = cardY + cardHeight - 41;
  if (invoice.clientSnapshot.address) {
    const addrLines = invoice.clientSnapshot.address.split("\n");
    for (const line of addrLines.slice(0, 2)) {
      page.drawText(line.trim(), { x: rightCardX + 12, y: toY, size: 8, font: fontRegular, color: mutedColor });
      toY -= 10;
    }
  }
  if (invoice.clientSnapshot.email) {
    page.drawText(invoice.clientSnapshot.email, { x: rightCardX + 12, y: toY, size: 8, font: fontRegular, color: mutedColor });
    toY -= 10;
  }
  if (invoice.clientSnapshot.phone) {
    page.drawText(invoice.clientSnapshot.phone, { x: rightCardX + 12, y: toY, size: 8, font: fontRegular, color: mutedColor });
  }

  y = cardY - 18;

  // 4. Line Items Table with Solid Theme-Colored Header
  const tableHeaderHeight = 22;
  page.drawRectangle({
    x: margin,
    y: y - tableHeaderHeight,
    width: width - margin * 2,
    height: tableHeaderHeight,
    color: themeColor,
  });

  const colItemX = margin + 10;
  const colQtyX = margin + 280;
  const colPriceX = margin + 350;
  const colTotalX = width - margin - 10;

  page.drawText("ITEM", { x: colItemX, y: y - 15, size: 8, font: fontBold, color: whiteColor });
  page.drawText("QTY", { x: colQtyX, y: y - 15, size: 8, font: fontBold, color: whiteColor });
  page.drawText("PRICE", { x: colPriceX, y: y - 15, size: 8, font: fontBold, color: whiteColor });
  
  const totalHeaderWidth = fontBold.widthOfTextAtSize("TOTAL", 8);
  page.drawText("TOTAL", { x: colTotalX - totalHeaderWidth, y: y - 15, size: 8, font: fontBold, color: whiteColor });

  y -= tableHeaderHeight + 10;

  for (const item of invoice.lineItems) {
    const itemStartY = y;
    page.drawText(item.itemName || "Item", { x: colItemX, y, size: 9, font: fontBold, color: darkColor });
    y -= 11;

    if (item.description) {
      page.drawText(item.description.slice(0, 60), { x: colItemX, y, size: 8, font: fontRegular, color: mutedColor });
      y -= 10;
    }

    page.drawText(String(item.quantity || 1), { x: colQtyX, y: itemStartY, size: 9, font: fontRegular, color: darkColor });

    const priceFormatted = formatInvoiceMoney(item.unitPrice, invoice.currency);
    page.drawText(priceFormatted, { x: colPriceX, y: itemStartY, size: 9, font: fontRegular, color: darkColor });

    const lineTotalFormatted = formatInvoiceMoney(item.lineTotal, invoice.currency);
    const lineTotalWidth = fontBold.widthOfTextAtSize(lineTotalFormatted, 9);
    page.drawText(lineTotalFormatted, { x: colTotalX - lineTotalWidth, y: itemStartY, size: 9, font: fontBold, color: darkColor });

    y -= 6;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: borderColor,
    });
    y -= 12;
  }

  y -= 6;

  // 5. Calculations Summary Box (Right) & Payment/Notes (Left)
  const totals = calculateInvoiceTotals(invoice.lineItems, invoice.billingDetails);

  const summaryWidth = 220;
  const summaryX = width - margin - summaryWidth;
  let sY = y;

  // Subtotal
  page.drawText("Subtotal", { x: summaryX, y: sY, size: 9, font: fontRegular, color: mutedColor });
  const subtotalStr = formatInvoiceMoney(totals.subtotal, invoice.currency);
  const subtotalWidth = fontRegular.widthOfTextAtSize(subtotalStr, 9);
  page.drawText(subtotalStr, { x: width - margin - subtotalWidth, y: sY, size: 9, font: fontRegular, color: darkColor });
  sY -= 14;

  // Adjustments
  for (const b of totals.computedBilling) {
    const labelStr = b.type === "percentage" ? `${b.label} (${b.rawValue}%)` : b.label;
    page.drawText(labelStr, { x: summaryX, y: sY, size: 9, font: fontRegular, color: mutedColor });

    const sign = b.computedAmount >= 0 ? "+" : "";
    const amountStr = `${sign}${formatInvoiceMoney(b.computedAmount, invoice.currency)}`;
    const amtWidth = fontRegular.widthOfTextAtSize(amountStr, 9);
    page.drawText(amountStr, { x: width - margin - amtWidth, y: sY, size: 9, font: fontRegular, color: darkColor });
    sY -= 14;
  }

  sY -= 4;

  // Total Due Highlight Pill
  page.drawRectangle({
    x: summaryX - 8,
    y: sY - 10,
    width: summaryWidth + 8,
    height: 28,
    color: rgb(0.96, 0.96, 0.98),
    borderColor,
    borderWidth: 0.5,
  });

  page.drawText("Total Due", { x: summaryX, y: sY + 2, size: 10, font: fontBold, color: darkColor });
  const totalStr = formatInvoiceMoney(totals.total, invoice.currency);
  const totalWidth = fontBold.widthOfTextAtSize(totalStr, 13);
  page.drawText(totalStr, { x: width - margin - totalWidth, y: sY + 1, size: 13, font: fontBold, color: themeColor });

  // 6. Payment Information Box (Left)
  if (invoice.paymentInformation && invoice.paymentInformation.length > 0) {
    let pY = y;
    const pBoxWidth = 240;
    
    page.drawRectangle({
      x: margin,
      y: pY - 8 - (invoice.paymentInformation.length * 13 + 24),
      width: pBoxWidth,
      height: invoice.paymentInformation.length * 13 + 30,
      color: lightCardColor,
      borderColor,
      borderWidth: 0.5,
    });

    page.drawText("PAYMENT INFORMATION", { x: margin + 10, y: pY - 4, size: 8, font: fontBold, color: themeColor });
    pY -= 18;

    for (const info of invoice.paymentInformation) {
      page.drawText(`${info.label}:`, { x: margin + 10, y: pY, size: 8.5, font: fontBold, color: darkColor });
      page.drawText(info.value, { x: margin + 85, y: pY, size: 8.5, font: fontRegular, color: darkColor });
      pY -= 13;
    }
  }

  y = sY - 35;

  // 7. Signature Stamp (if present)
  if (invoice.companySnapshot.signatureUrl) {
    const sigData = await fetchImageBytes(invoice.companySnapshot.signatureUrl);
    if (sigData) {
      try {
        const sigImage = sigData.type === "png"
          ? await doc.embedPng(sigData.bytes)
          : await doc.embedJpg(sigData.bytes);
        const dims = sigImage.scaleToFit(120, 36);
        page.drawImage(sigImage, {
          x: width - margin - dims.width,
          y: Math.max(margin + 25, y - dims.height - 10),
          width: dims.width,
          height: dims.height,
        });
        page.drawLine({
          start: { x: width - margin - 130, y: Math.max(margin + 22, y - dims.height - 13) },
          end: { x: width - margin, y: Math.max(margin + 22, y - dims.height - 13) },
          thickness: 0.5,
          color: borderColor,
        });
        page.drawText("Authorized Signature", {
          x: width - margin - 110,
          y: Math.max(margin + 12, y - dims.height - 23),
          size: 7.5,
          font: fontRegular,
          color: mutedColor,
        });
      } catch {
        // Continue if signature embedding has format issue
      }
    }
  }

  // Footer Note
  page.drawText("Generated with Scrunity", {
    x: margin,
    y: margin,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.7, 0.7, 0.7),
  });

  return await doc.save();
}
