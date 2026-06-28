import PDFDocument from "pdfkit";
import { Response } from "express";

interface InvoiceData {
  billId: number;
  customerName: string;
  address: string;
  month: string;
  year: number;
  items: any[];
  subscriptionTotal: number;
  ordersTotal: number;
  previousPending: number;
  penalty: number;
  discount: number;
  finalAmount: number;
  dueDate: string;
  status: string;
  generatedDate: string;
}

export function generateInvoicePDF(data: InvoiceData, res: Response) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });

  // Set response headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="invoice_${data.customerName.replace(/\s+/g, "_")}_${data.month}_${data.year}.pdf"`);

  doc.pipe(res);

  // Brand Header
  doc.fillColor("#0d3e83").font("Helvetica-Bold").fontSize(24).text("DIVINE NATURALS", 50, 50);
  doc.fillColor("#6b7280").font("Helvetica-Oblique").fontSize(9).text("Pure. Fresh. Daily.", 50, 78);

  // Invoice Metadata (Top Right)
  doc.fillColor("#111827").font("Helvetica-Bold").fontSize(12).text(`INVOICE`, 400, 50, { align: "right", width: 162 });
  doc.fillColor("#4b5563").font("Helvetica").fontSize(9);
  doc.text(`Invoice ID: #${data.billId}`, 400, 68, { align: "right", width: 162 });
  doc.text(`Billing Month: ${data.month} ${data.year}`, 400, 82, { align: "right", width: 162 });
  doc.text(`Generated: ${new Date(data.generatedDate).toLocaleDateString("en-IN")}`, 400, 96, { align: "right", width: 162 });

  // Divider Line
  doc.moveTo(50, 115).lineTo(562, 115).strokeColor("#e5e7eb").lineWidth(1).stroke();

  // Customer & Payment Info Columns
  let y = 130;
  doc.fillColor("#9ca3af").font("Helvetica-Bold").fontSize(8).text("BILL TO:", 50, y);
  doc.fillColor("#9ca3af").font("Helvetica-Bold").fontSize(8).text("STATUS & DUE DATE:", 320, y);

  y += 12;
  doc.fillColor("#111827").font("Helvetica-Bold").fontSize(11).text(data.customerName, 50, y);
  
  // Status Badge
  const statusUpper = data.status.toUpperCase();
  const statusColor = statusUpper === "PAID" ? "#0d3e83" : statusUpper === "OVERDUE" ? "#ef4444" : "#ca8a04";
  doc.fillColor(statusColor).font("Helvetica-Bold").fontSize(11).text(statusUpper, 320, y);

  y += 16;
  doc.fillColor("#4b5563").font("Helvetica").fontSize(9.5).text(data.address, 50, y, { width: 240 });
  
  doc.fillColor("#4b5563").font("Helvetica").fontSize(9.5).text(`Due Date: ${new Date(data.dueDate).toLocaleDateString("en-IN")}`, 320, y);

  // Summary Metrics Blocks
  y = 210;
  const cardWidth = 150;
  const cardHeight = 45;
  const cardGap = 16;

  // Card 1: Subscriptions
  doc.roundedRect(50, y, cardWidth, cardHeight, 6).fillOpacity(0.04).fill("#0d3e83");
  doc.fillOpacity(1);
  doc.fillColor("#0d3e83").font("Helvetica-Bold").fontSize(7.5).text("SUBSCRIPTIONS", 62, y + 10);
  doc.fillColor("#111827").font("Helvetica-Bold").fontSize(13).text(`Rs. ${data.subscriptionTotal.toLocaleString()}`, 62, y + 22);

  // Card 2: Orders
  doc.roundedRect(50 + cardWidth + cardGap, y, cardWidth, cardHeight, 6).fillOpacity(0.04).fill("#3b82f6");
  doc.fillOpacity(1);
  doc.fillColor("#3b82f6").font("Helvetica-Bold").fontSize(7.5).text("ONE-TIME ORDERS", 50 + cardWidth + cardGap + 12, y + 10);
  doc.fillColor("#111827").font("Helvetica-Bold").fontSize(13).text(`Rs. ${data.ordersTotal.toLocaleString()}`, 50 + cardWidth + cardGap + 12, y + 22);

  // Card 3: Net Total
  doc.roundedRect(50 + (cardWidth + cardGap) * 2, y, cardWidth, cardHeight, 6).fillOpacity(0.04).fill("#10b981");
  doc.fillOpacity(1);
  doc.fillColor("#10b981").font("Helvetica-Bold").fontSize(7.5).text("TOTAL AMOUNT", 50 + (cardWidth + cardGap) * 2 + 12, y + 10);
  doc.fillColor("#111827").font("Helvetica-Bold").fontSize(13).text(`Rs. ${data.finalAmount.toLocaleString()}`, 50 + (cardWidth + cardGap) * 2 + 12, y + 22);

  // Items Table Header
  y = 280;
  doc.rect(50, y, 512, 22).fill("#f3f4f6");
  doc.fillColor("#374151").font("Helvetica-Bold").fontSize(8.5);
  doc.text("Date", 60, y + 7);
  doc.text("Description", 130, y + 7);
  doc.text("Qty", 340, y + 7, { width: 40, align: "center" });
  doc.text("Rate", 390, y + 7, { width: 70, align: "right" });
  doc.text("Total", 470, y + 7, { width: 85, align: "right" });

  y += 22;

  // Table Rows
  doc.font("Helvetica").fontSize(8.5).fillColor("#4b5563");
  
  if (data.items && data.items.length > 0) {
    data.items.forEach((item: any, idx: number) => {
      // Calculate wrapped height of description to prevent text overlap
      const descHeight = doc.heightOfString(item.description || item.name || "", { width: 200 });
      const rowHeight = Math.max(descHeight + 10, 22);

      // Check if page needs to break
      if (y + rowHeight > 740) {
        doc.addPage();
        y = 50;
        
        // Re-draw sub-header on new page
        doc.rect(50, y, 512, 22).fill("#f3f4f6");
        doc.fillColor("#374151").font("Helvetica-Bold").fontSize(8.5);
        doc.text("Date", 60, y + 7);
        doc.text("Description", 130, y + 7);
        doc.text("Qty", 340, y + 7, { width: 40, align: "center" });
        doc.text("Rate", 390, y + 7, { width: 70, align: "right" });
        doc.text("Total", 470, y + 7, { width: 85, align: "right" });
        y += 22;
        doc.font("Helvetica").fontSize(8.5).fillColor("#4b5563");
      }

      // Draw Alternating Background
      if (idx % 2 === 1) {
        doc.rect(50, y, 512, rowHeight).fill("#f9fafb");
        doc.fillColor("#4b5563");
      }

      doc.text(item.date || "-", 60, y + 6);
      doc.text(item.description || item.name || "-", 130, y + 6, { width: 200 });
      doc.text((item.quantity || item.qty || 1).toString(), 340, y + 6, { width: 40, align: "center" });
      
      const rate = Number(item.rate || item.price || 0);
      const total = Number(item.total || 0);
      doc.text(`Rs. ${rate.toFixed(2)}`, 390, y + 6, { width: 70, align: "right" });
      doc.text(`Rs. ${total.toFixed(2)}`, 470, y + 6, { width: 85, align: "right" });

      // Draw bottom border line
      doc.moveTo(50, y + rowHeight).lineTo(562, y + rowHeight).strokeColor("#f3f4f6").lineWidth(0.5).stroke();

      y += rowHeight;
    });
  } else {
    doc.text("No billing transactions recorded for this period.", 60, y + 10, { align: "center", width: 492 });
    y += 30;
  }

  // Check page layout for summary box
  if (y + 130 > 740) {
    doc.addPage();
    y = 50;
  }

  // Totals Box (Right Side Align)
  y += 15;
  const totalBoxX = 330;
  const totalBoxW = 232;
  
  doc.rect(totalBoxX, y, totalBoxW, 115).strokeColor("#e5e7eb").lineWidth(1).stroke();

  let subY = y + 8;
  const drawTotalRow = (label: string, value: number, isGrand = false, isDiscount = false) => {
    doc.font(isGrand ? "Helvetica-Bold" : "Helvetica").fontSize(isGrand ? 10 : 8.5).fillColor(isGrand ? "#111827" : "#4b5563");
    doc.text(label, totalBoxX + 12, subY);
    
    const prefix = isDiscount ? "-Rs. " : "Rs. ";
    doc.text(`${prefix}${value.toLocaleString()}`, totalBoxX + 110, subY, { width: 110, align: "right" });
    
    if (!isGrand) {
      doc.moveTo(totalBoxX + 12, subY + 14).lineTo(totalBoxX + totalBoxW - 12, subY + 14).strokeColor("#f3f4f6").lineWidth(0.5).stroke();
      subY += 18;
    }
  };

  drawTotalRow("Subscriptions:", data.subscriptionTotal);
  drawTotalRow("One-Time Orders:", data.ordersTotal);
  if (data.previousPending > 0) {
    drawTotalRow("Previous Due:", data.previousPending);
  }
  if (data.penalty > 0) {
    drawTotalRow("Penalty:", data.penalty);
  }
  if (data.discount > 0) {
    drawTotalRow("Discount:", data.discount, false, true);
  }
  
  subY = y + 92;
  // Grand Total Line
  doc.moveTo(totalBoxX + 12, subY - 4).lineTo(totalBoxX + totalBoxW - 12, subY - 4).strokeColor("#e5e7eb").lineWidth(1).stroke();
  drawTotalRow("Grand Total:", data.finalAmount, true);

  // Footer Message
  doc.fillColor("#9ca3af").font("Helvetica").fontSize(7.5);
  doc.text("This is an automatically generated electronic invoice. No signature is required.", 50, 735, { align: "center", width: 512 });
  doc.text("Thank you for choosing Gauranitai! For support, contact support@gauranitai.com", 50, 746, { align: "center", width: 512 });

  doc.end();
}
