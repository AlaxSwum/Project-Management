// Professional PDF Generator for Payroll System
// Creates elegant, professional payslip documents

import { jsPDF } from 'jspdf';

interface UKPayrollData {
  employeeName: string;
  employeeId: string;
  email: string;
  monthEnding: string;
  taxCode: string;
  nationalInsuranceNumber: string;
  nationalInsuranceTable: string;
  hours: string;
  rate: string;
  holidayPay: string;
  grossPay: string;
  tax: string;
  nationalInsurance: string;
  holidayRepayment: string;
  totalDeductions: string;
  totalPayments: string;
  taxableGrossPayYTD: string;
  taxYTD: string;
  employeeNationalInsuranceYTD: string;
  employerNationalInsuranceYTD: string;
  taxableGrossPay: string;
  employerNationalInsurance: string;
  netPay: string;
  netAmountPaid: string;
  paidDate: string;
  employerPAYEReference: string;
  annualLeaveRemaining: string;
}

interface MyanmarPayrollData {
  employeeId: string;
  employeeName: string;
  email: string;
  payrollAmount: string;
  monthEnding: string;
}

// Professional color palette
const colors = {
  primary: { r: 15, g: 23, b: 42 },       // Slate 900
  secondary: { r: 30, g: 64, b: 175 },    // Blue 800
  accent: { r: 16, g: 185, b: 129 },      // Emerald 500
  success: { r: 34, g: 197, b: 94 },      // Green 500
  danger: { r: 239, g: 68, b: 68 },       // Red 500
  text: { r: 15, g: 23, b: 42 },          // Slate 900
  textLight: { r: 100, g: 116, b: 139 },  // Slate 500
  border: { r: 226, g: 232, b: 240 },     // Slate 200
  background: { r: 248, g: 250, b: 252 }, // Slate 50
  white: { r: 255, g: 255, b: 255 },
};

// Format currency
const formatCurrency = (value: string | number, symbol = '£'): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return `${symbol}0.00`;
  return `${symbol}${num.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format date
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

// Draw rounded rectangle
const drawRoundedRect = (
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: boolean = true,
  stroke: boolean = false
) => {
  pdf.roundedRect(x, y, width, height, radius, radius, fill ? 'F' : stroke ? 'S' : 'FD');
};

// Generate UK Payroll PDF
export function generateUKPayrollPDF(data: UKPayrollData): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // ===== HEADER SECTION =====
  // Dark header background
  pdf.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
  pdf.rect(0, 0, pageWidth, 50, 'F');
  
  // Company name
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('HUSH HEALTHCARE LTD', margin, 22);
  
  // Document type badge
  pdf.setFillColor(colors.accent.r, colors.accent.g, colors.accent.b);
  drawRoundedRect(pdf, pageWidth - margin - 40, 12, 40, 12, 3);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PAYSLIP', pageWidth - margin - 20, 20, { align: 'center' });
  
  // Pay period
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Pay Period: ${formatDate(data.monthEnding)}`, margin, 38);
  
  // Reference number
  pdf.setFontSize(9);
  pdf.setTextColor(200, 200, 200);
  pdf.text(`Ref: ${data.employerPAYEReference || 'N/A'}`, pageWidth - margin, 38, { align: 'right' });
  
  let y = 60;
  
  // ===== EMPLOYEE DETAILS CARD =====
  pdf.setFillColor(colors.white.r, colors.white.g, colors.white.b);
  pdf.setDrawColor(colors.border.r, colors.border.g, colors.border.b);
  pdf.setLineWidth(0.3);
  drawRoundedRect(pdf, margin, y, contentWidth, 32, 4, true, true);
  
  // Left side - Employee info
  const col1 = margin + 8;
  const col2 = pageWidth / 2 + 10;
  
  pdf.setTextColor(colors.textLight.r, colors.textLight.g, colors.textLight.b);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('EMPLOYEE NAME', col1, y + 10);
  pdf.text('EMPLOYEE ID', col2, y + 10);
  
  pdf.setTextColor(colors.text.r, colors.text.g, colors.text.b);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.employeeName || '-', col1, y + 18);
  pdf.text(data.employeeId || '-', col2, y + 18);
  
  pdf.setTextColor(colors.textLight.r, colors.textLight.g, colors.textLight.b);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('TAX CODE', col1, y + 26);
  pdf.text('NI NUMBER', col2, y + 26);
  
  pdf.setTextColor(colors.text.r, colors.text.g, colors.text.b);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.taxCode || '-', col1 + 25, y + 26);
  pdf.text(data.nationalInsuranceNumber || '-', col2 + 28, y + 26);
  
  y += 42;
  
  // ===== NET PAY HIGHLIGHT BOX =====
  pdf.setFillColor(colors.accent.r, colors.accent.g, colors.accent.b);
  drawRoundedRect(pdf, margin, y, contentWidth, 28, 4);
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('NET PAY THIS PERIOD', margin + 10, y + 11);
  
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text(formatCurrency(data.netPay), pageWidth - margin - 10, y + 19, { align: 'right' });
  
  y += 38;
  
  // ===== PAYMENTS & DEDUCTIONS SECTION =====
  const halfWidth = (contentWidth - 8) / 2;
  
  // Payments box
  pdf.setFillColor(240, 253, 244); // Light green
  pdf.setDrawColor(187, 247, 208); // Green border
  drawRoundedRect(pdf, margin, y, halfWidth, 58, 4, true, true);
  
  pdf.setFillColor(34, 197, 94); // Green header
  drawRoundedRect(pdf, margin, y, halfWidth, 12, 4);
  pdf.rect(margin, y + 8, halfWidth, 4, 'F'); // Square bottom corners
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PAYMENTS', margin + 6, y + 8);
  
  // Payments content
  let py = y + 20;
  pdf.setTextColor(colors.text.r, colors.text.g, colors.text.b);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  
  const paymentItems = [
    { label: `Basic Pay (${data.hours || '0'} hrs × £${data.rate || '0'})`, value: formatCurrency(data.grossPay) },
    { label: 'Holiday Pay', value: formatCurrency(data.holidayPay) },
  ];
  
  paymentItems.forEach(item => {
    pdf.text(item.label, margin + 6, py);
    pdf.text(item.value, margin + halfWidth - 6, py, { align: 'right' });
    py += 7;
  });
  
  // Total payments
  pdf.setDrawColor(187, 247, 208);
  pdf.line(margin + 6, py, margin + halfWidth - 6, py);
  py += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(22, 163, 74); // Green text
  pdf.text('Total Payments', margin + 6, py);
  pdf.text(formatCurrency(data.totalPayments), margin + halfWidth - 6, py, { align: 'right' });
  
  // Deductions box
  const deductX = margin + halfWidth + 8;
  pdf.setFillColor(254, 242, 242); // Light red
  pdf.setDrawColor(254, 202, 202); // Red border
  drawRoundedRect(pdf, deductX, y, halfWidth, 58, 4, true, true);
  
  pdf.setFillColor(239, 68, 68); // Red header
  drawRoundedRect(pdf, deductX, y, halfWidth, 12, 4);
  pdf.rect(deductX, y + 8, halfWidth, 4, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DEDUCTIONS', deductX + 6, y + 8);
  
  // Deductions content
  let dy = y + 20;
  pdf.setTextColor(colors.text.r, colors.text.g, colors.text.b);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  
  const deductionItems = [
    { label: 'PAYE Tax', value: formatCurrency(data.tax) },
    { label: 'National Insurance', value: formatCurrency(data.nationalInsurance) },
    { label: 'Holiday Repayment', value: formatCurrency(data.holidayRepayment) },
  ];
  
  deductionItems.forEach(item => {
    pdf.text(item.label, deductX + 6, dy);
    pdf.text(item.value, deductX + halfWidth - 6, dy, { align: 'right' });
    dy += 7;
  });
  
  // Total deductions
  pdf.setDrawColor(254, 202, 202);
  pdf.line(deductX + 6, dy, deductX + halfWidth - 6, dy);
  dy += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(185, 28, 28); // Red text
  pdf.text('Total Deductions', deductX + 6, dy);
  pdf.text(formatCurrency(data.totalDeductions), deductX + halfWidth - 6, dy, { align: 'right' });
  
  y += 68;
  
  // ===== YEAR TO DATE SECTION =====
  pdf.setFillColor(colors.background.r, colors.background.g, colors.background.b);
  pdf.setDrawColor(colors.border.r, colors.border.g, colors.border.b);
  drawRoundedRect(pdf, margin, y, contentWidth, 36, 4, true, true);
  
  pdf.setTextColor(colors.text.r, colors.text.g, colors.text.b);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('YEAR TO DATE SUMMARY', margin + 8, y + 10);
  
  // YTD grid
  const ytdY = y + 18;
  const colWidth = contentWidth / 4;
  
  const ytdItems = [
    { label: 'Taxable Gross', value: formatCurrency(data.taxableGrossPayYTD) },
    { label: 'Tax Paid', value: formatCurrency(data.taxYTD) },
    { label: 'Employee NI', value: formatCurrency(data.employeeNationalInsuranceYTD) },
    { label: 'Employer NI', value: formatCurrency(data.employerNationalInsuranceYTD) },
  ];
  
  ytdItems.forEach((item, i) => {
    const x = margin + 8 + (i * colWidth);
    pdf.setTextColor(colors.textLight.r, colors.textLight.g, colors.textLight.b);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(item.label.toUpperCase(), x, ytdY);
    
    pdf.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(item.value, x, ytdY + 8);
  });
  
  y += 46;
  
  // ===== PAYMENT INFORMATION =====
  pdf.setFillColor(colors.white.r, colors.white.g, colors.white.b);
  pdf.setDrawColor(colors.border.r, colors.border.g, colors.border.b);
  drawRoundedRect(pdf, margin, y, contentWidth, 24, 4, true, true);
  
  const payInfoItems = [
    { label: 'Payment Date', value: formatDate(data.paidDate) },
    { label: 'PAYE Reference', value: data.employerPAYEReference || '-' },
    { label: 'NI Table', value: data.nationalInsuranceTable || '-' },
    { label: 'Leave Remaining', value: `${data.annualLeaveRemaining || '0'} days` },
  ];
  
  payInfoItems.forEach((item, i) => {
    const x = margin + 8 + (i * colWidth);
    pdf.setTextColor(colors.textLight.r, colors.textLight.g, colors.textLight.b);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(item.label.toUpperCase(), x, y + 9);
    
    pdf.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(item.value, x, y + 17);
  });
  
  // ===== FOOTER =====
  const footerY = pageHeight - 20;
  
  pdf.setDrawColor(colors.border.r, colors.border.g, colors.border.b);
  pdf.setLineWidth(0.3);
  pdf.line(margin, footerY - 8, pageWidth - margin, footerY - 8);
  
  pdf.setTextColor(colors.textLight.r, colors.textLight.g, colors.textLight.b);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text('This is a computer-generated document and requires no signature.', margin, footerY - 2);
  pdf.text('Please retain this payslip for your records.', margin, footerY + 3);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('HUSH HEALTHCARE LTD', pageWidth - margin, footerY - 2, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin, footerY + 3, { align: 'right' });
  
  return pdf;
}

// Generate Myanmar Payroll PDF
export function generateMyanmarPayrollPDF(data: MyanmarPayrollData): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // ===== HEADER =====
  // Dark blue gradient header
  pdf.setFillColor(15, 23, 42); // Slate 900
  pdf.rect(0, 0, pageWidth, 52, 'F');
  
  // Subtle decorative element
  pdf.setFillColor(30, 58, 138); // Blue 800
  pdf.rect(0, 48, pageWidth, 4, 'F');
  
  // Payroll Statement badge
  pdf.setFillColor(255, 255, 255, 0.15);
  drawRoundedRect(pdf, (pageWidth - 50) / 2, 10, 50, 8, 4);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PAYROLL STATEMENT', pageWidth / 2, 15.5, { align: 'center' });
  
  // Company name
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('HUSH HEALTHCARE LTD', pageWidth / 2, 32, { align: 'center' });
  
  // Division
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Myanmar Division', pageWidth / 2, 42, { align: 'center' });
  
  // Period banner (emerald green)
  pdf.setFillColor(5, 150, 105); // Emerald 600
  pdf.rect(0, 52, pageWidth, 14, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Pay Period: ${formatDate(data.monthEnding)}`, pageWidth / 2, 61, { align: 'center' });
  
  let y = 80;
  
  // ===== EMPLOYEE DETAILS CARD =====
  // Card background
  pdf.setFillColor(248, 250, 252); // Slate 50
  pdf.setDrawColor(226, 232, 240); // Slate 200
  pdf.setLineWidth(0.5);
  drawRoundedRect(pdf, margin, y, contentWidth, 55, 6, true, true);
  
  // Section header with icon
  pdf.setFillColor(30, 58, 138); // Blue 800
  drawRoundedRect(pdf, margin + 12, y + 8, 8, 8, 2);
  
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EMPLOYEE DETAILS', margin + 26, y + 14);
  
  // Employee ID and Name row
  const detailsY = y + 28;
  const halfContent = contentWidth / 2;
  
  // Employee ID
  pdf.setTextColor(100, 116, 139); // Slate 500
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EMPLOYEE ID', margin + 12, detailsY);
  
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.employeeId || '-', margin + 12, detailsY + 10);
  
  // Employee Name
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FULL NAME', margin + halfContent, detailsY);
  
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.employeeName || '-', margin + halfContent, detailsY + 10);
  
  // Email (full width)
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EMAIL ADDRESS', margin + 12, y + 48);
  
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.email || '-', margin + 45, y + 48);
  
  y += 70;
  
  // ===== AMOUNT BOX =====
  // Green gradient box
  pdf.setFillColor(5, 150, 105); // Emerald 600
  drawRoundedRect(pdf, margin, y, contentWidth, 65, 8);
  
  // Decorative lighter stripe
  pdf.setFillColor(16, 185, 129); // Emerald 500
  drawRoundedRect(pdf, margin + 4, y + 4, contentWidth - 8, 57, 6);
  
  // Amount label badge
  pdf.setFillColor(255, 255, 255, 0.2);
  drawRoundedRect(pdf, (pageWidth - 60) / 2, y + 12, 60, 8, 4);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('NET PAYROLL AMOUNT', pageWidth / 2, y + 17.5, { align: 'center' });
  
  // Amount value
  const amount = parseFloat(data.payrollAmount || '0').toLocaleString('en-US');
  pdf.setFontSize(42);
  pdf.setFont('helvetica', 'bold');
  pdf.text(amount, pageWidth / 2, y + 42, { align: 'center' });
  
  // Currency
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('MMK', pageWidth / 2, y + 54, { align: 'center' });
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Myanmar Kyat', pageWidth / 2, y + 61, { align: 'center' });
  
  y += 80;
  
  // ===== STATUS INFO =====
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  drawRoundedRect(pdf, margin, y, contentWidth, 18, 4, true, true);
  
  // Status
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('STATUS', margin + 20, y + 8);
  pdf.setTextColor(5, 150, 105);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Processed', margin + 20, y + 14);
  
  // Divider
  pdf.setDrawColor(226, 232, 240);
  pdf.line(pageWidth / 2, y + 4, pageWidth / 2, y + 14);
  
  // Payment Type
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PAYMENT TYPE', pageWidth / 2 + 20, y + 8);
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Bank Transfer', pageWidth / 2 + 20, y + 14);
  
  // ===== FOOTER =====
  const footerY = pageHeight - 22;
  
  // Footer background
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, footerY - 8, pageWidth, 30, 'F');
  
  pdf.setTextColor(148, 163, 184); // Slate 400
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('This is a computer-generated document. No signature required.', pageWidth / 2, footerY, { align: 'center' });
  
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(8);
  pdf.text(`© ${new Date().getFullYear()} Hush Healthcare Ltd • Confidential`, pageWidth / 2, footerY + 8, { align: 'center' });
  
  return pdf;
}

// Export PDF as base64 (for email attachment)
export function getPDFBase64(pdf: jsPDF): string {
  const pdfOutput = pdf.output('datauristring');
  return pdfOutput.split(',')[1];
}

// Export PDF as blob
export function getPDFBlob(pdf: jsPDF): Blob {
  return pdf.output('blob');
}
