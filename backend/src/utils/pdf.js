import PDFDocument from "pdfkit";

export const fmt = (n) => Number(n || 0).toLocaleString("en-US");

export const startPdf = (res, filename) => {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  doc.pipe(res);
  return doc;
};

export const line = (doc, text, { bold = false, size = 11 } = {}) => {
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size).text(text, 50);
};

export const row = (doc, left, right, { bold = false } = {}) => {
  const y = doc.y;
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(11);
  doc.text(left, 50, y, { width: 350 });
  const afterLeft = doc.y;
  doc.text(right, 400, y, { width: 145, align: "right" });
  doc.y = Math.max(afterLeft, doc.y) + 3;
  doc.x = 50;
};