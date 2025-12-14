// Professional PDF Generator for Payroll System
// Clean, formal payslip documents

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

// Generate UK Payroll PDF - Professional Clean Design
export function generateUKPayrollPDF(data: UKPayrollData): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Colors
  const black = { r: 0, g: 0, b: 0 };
  const darkGray = { r: 51, g: 51, b: 51 };
  const gray = { r: 102, g: 102, b: 102 };
  const lightGray = { r: 245, g: 245, b: 245 };
  const lineGray = { r: 200, g: 200, b: 200 };
  
  let y = margin;
  
  // ===== HEADER =====
  pdf.setFillColor(darkGray.r, darkGray.g, darkGray.b);
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('HUSH HEALTHCARE LTD', margin, 18);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('PAYSLIP', margin, 28);
  
  // Period on right
  pdf.setFontSize(10);
  pdf.text(`Pay Period: ${formatDate(data.monthEnding)}`, pageWidth - margin, 23, { align: 'right' });
  
  y = 50;
  
  // ===== EMPLOYEE DETAILS BOX =====
  pdf.setDrawColor(lineGray.r, lineGray.g, lineGray.b);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, y, contentWidth, 28);
  
  // Labels and values
  const col1 = margin + 5;
  const col2 = margin + 45;
  const col3 = pageWidth / 2 + 5;
  const col4 = pageWidth / 2 + 45;
  
  pdf.setTextColor(gray.r, gray.g, gray.b);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  
  pdf.text('Employee Name:', col1, y + 8);
  pdf.text('Employee ID:', col3, y + 8);
  pdf.text('Tax Code:', col1, y + 18);
  pdf.text('NI Number:', col3, y + 18);
  
  pdf.setTextColor(black.r, black.g, black.b);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.employeeName || '-', col2, y + 8);
  pdf.text(data.employeeId || '-', col4, y + 8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.taxCode || '-', col2, y + 18);
  pdf.text(data.nationalInsuranceNumber || '-', col4, y + 18);
  
  y += 38;
  
  // ===== PAYMENTS & DEDUCTIONS TABLE =====
  const tableWidth = (contentWidth - 10) / 2;
  
  // Payments Header
  pdf.setFillColor(lightGray.r, lightGray.g, lightGray.b);
  pdf.rect(margin, y, tableWidth, 8, 'F');
  pdf.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PAYMENTS', margin + 3, y + 6);
  
  // Deductions Header
  pdf.rect(margin + tableWidth + 10, y, tableWidth, 8, 'F');
  pdf.text('DEDUCTIONS', margin + tableWidth + 13, y + 6);
  
  y += 8;
  
  // Payments rows
  pdf.setDrawColor(lineGray.r, lineGray.g, lineGray.b);
  pdf.rect(margin, y, tableWidth, 32);
  
  pdf.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  
  const payY = y + 8;
  pdf.text(`Basic Pay (${data.hours || '0'} hrs @ £${data.rate || '0'})`, margin + 3, payY);
  pdf.text(formatCurrency(data.grossPay), margin + tableWidth - 3, payY, { align: 'right' });
  
  pdf.text('Holiday Pay', margin + 3, payY + 8);
  pdf.text(formatCurrency(data.holidayPay), margin + tableWidth - 3, payY + 8, { align: 'right' });
  
  // Total line
  pdf.setDrawColor(lineGray.r, lineGray.g, lineGray.b);
  pdf.line(margin + 3, payY + 14, margin + tableWidth - 3, payY + 14);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Payments', margin + 3, payY + 22);
  pdf.text(formatCurrency(data.totalPayments), margin + tableWidth - 3, payY + 22, { align: 'right' });
  
  // Deductions rows
  pdf.rect(margin + tableWidth + 10, y, tableWidth, 32);
  
  pdf.setFont('helvetica', 'normal');
  const dedY = y + 8;
  pdf.text('PAYE Tax', margin + tableWidth + 13, dedY);
  pdf.text(formatCurrency(data.tax), margin + contentWidth - 3, dedY, { align: 'right' });
  
  pdf.text('National Insurance', margin + tableWidth + 13, dedY + 8);
  pdf.text(formatCurrency(data.nationalInsurance), margin + contentWidth - 3, dedY + 8, { align: 'right' });
  
  pdf.text('Holiday Repayment', margin + tableWidth + 13, dedY + 16);
  pdf.text(formatCurrency(data.holidayRepayment), margin + contentWidth - 3, dedY + 16, { align: 'right' });
  
  // Total line
  pdf.line(margin + tableWidth + 13, dedY + 20, margin + contentWidth - 3, dedY + 20);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Deductions', margin + tableWidth + 13, dedY + 26);
  pdf.text(formatCurrency(data.totalDeductions), margin + contentWidth - 3, dedY + 26, { align: 'right' });
  
  y += 42;
  
  // ===== NET PAY BOX =====
  pdf.setFillColor(darkGray.r, darkGray.g, darkGray.b);
  pdf.rect(margin, y, contentWidth, 18, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('NET PAY', margin + 5, y + 12);
  
  pdf.setFontSize(16);
  pdf.text(formatCurrency(data.netPay), pageWidth - margin - 5, y + 12, { align: 'right' });
  
  y += 28;
  
  // ===== YEAR TO DATE =====
  pdf.setFillColor(lightGray.r, lightGray.g, lightGray.b);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('YEAR TO DATE', margin + 3, y + 6);
  
  y += 8;
  pdf.rect(margin, y, contentWidth, 20);
  
  const ytdColWidth = contentWidth / 4;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(gray.r, gray.g, gray.b);
  
  const ytdLabels = ['Taxable Gross', 'Tax Paid', 'Employee NI', 'Employer NI'];
  const ytdValues = [data.taxableGrossPayYTD, data.taxYTD, data.employeeNationalInsuranceYTD, data.employerNationalInsuranceYTD];
  
  ytdLabels.forEach((label, i) => {
    const x = margin + 5 + (i * ytdColWidth);
    pdf.text(label, x, y + 8);
    pdf.setTextColor(black.r, black.g, black.b);
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatCurrency(ytdValues[i]), x, y + 15);
    pdf.setTextColor(gray.r, gray.g, gray.b);
    pdf.setFont('helvetica', 'normal');
  });
  
  y += 30;
  
  // ===== PAYMENT DETAILS =====
  pdf.setFillColor(lightGray.r, lightGray.g, lightGray.b);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PAYMENT DETAILS', margin + 3, y + 6);
  
  y += 8;
  pdf.rect(margin, y, contentWidth, 16);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(gray.r, gray.g, gray.b);
  
  const detailLabels = ['Payment Date', 'PAYE Reference', 'NI Table', 'Leave Remaining'];
  const detailValues = [formatDate(data.paidDate), data.employerPAYEReference || '-', data.nationalInsuranceTable || '-', `${data.annualLeaveRemaining || '0'} days`];
  
  detailLabels.forEach((label, i) => {
    const x = margin + 5 + (i * ytdColWidth);
    pdf.text(label, x, y + 6);
    pdf.setTextColor(black.r, black.g, black.b);
    pdf.setFont('helvetica', 'bold');
    pdf.text(detailValues[i], x, y + 12);
    pdf.setTextColor(gray.r, gray.g, gray.b);
    pdf.setFont('helvetica', 'normal');
  });
  
  // ===== FOOTER =====
  const footerY = pageHeight - 20;
  pdf.setDrawColor(lineGray.r, lineGray.g, lineGray.b);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  pdf.setTextColor(gray.r, gray.g, gray.b);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('This is a computer-generated document. Please retain for your records.', margin, footerY);
  pdf.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin, footerY, { align: 'right' });
  
  pdf.setFontSize(7);
  pdf.text('Hush Healthcare Ltd | Confidential', margin, footerY + 6);
  
  return pdf;
}

// Generate Myanmar Payroll PDF - Professional Clean Design
export function generateMyanmarPayrollPDF(data: MyanmarPayrollData): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 25;
  const contentWidth = pageWidth - (margin * 2);
  
  // Colors - clean black/white/gray
  const black = { r: 0, g: 0, b: 0 };
  const darkGray = { r: 51, g: 51, b: 51 };
  const gray = { r: 102, g: 102, b: 102 };
  const lightGray = { r: 245, g: 245, b: 245 };
  const lineGray = { r: 180, g: 180, b: 180 };
  
  let y = margin;
  
  // ===== HEADER =====
  pdf.setFillColor(darkGray.r, darkGray.g, darkGray.b);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('HUSH HEALTHCARE LTD', pageWidth / 2, 18, { align: 'center' });
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('PAYROLL STATEMENT', pageWidth / 2, 28, { align: 'center' });
  
  pdf.setFontSize(9);
  pdf.text('Myanmar Division', pageWidth / 2, 36, { align: 'center' });
  
  y = 55;
  
  // ===== DOCUMENT INFO =====
  pdf.setDrawColor(lineGray.r, lineGray.g, lineGray.b);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, y, contentWidth, 14);
  
  pdf.setTextColor(gray.r, gray.g, gray.b);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Document No:', margin + 5, y + 6);
  pdf.text('Pay Period:', pageWidth / 2, y + 6);
  
  pdf.setTextColor(black.r, black.g, black.b);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`PAY-${data.employeeId || 'XXX'}-${new Date().getFullYear()}`, margin + 35, y + 6);
  pdf.text(formatDate(data.monthEnding), pageWidth / 2 + 25, y + 6);
  
  pdf.setTextColor(gray.r, gray.g, gray.b);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Issue Date:', margin + 5, y + 11);
  pdf.setTextColor(black.r, black.g, black.b);
  pdf.text(new Date().toLocaleDateString('en-GB'), margin + 35, y + 11);
  
  y += 24;
  
  // ===== EMPLOYEE DETAILS =====
  pdf.setFillColor(lightGray.r, lightGray.g, lightGray.b);
  pdf.rect(margin, y, contentWidth, 10, 'F');
  pdf.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EMPLOYEE DETAILS', margin + 5, y + 7);
  
  y += 10;
  pdf.rect(margin, y, contentWidth, 32);
  
  // Employee info
  const labelX = margin + 8;
  const valueX = margin + 50;
  
  pdf.setTextColor(gray.r, gray.g, gray.b);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  
  pdf.text('Employee ID:', labelX, y + 10);
  pdf.text('Full Name:', labelX, y + 20);
  pdf.text('Email:', labelX, y + 30);
  
  pdf.setTextColor(black.r, black.g, black.b);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.employeeId || '-', valueX, y + 10);
  pdf.text(data.employeeName || '-', valueX, y + 20);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(data.email || '-', valueX, y + 30);
  
  y += 44;
  
  // ===== PAYMENT SUMMARY =====
  pdf.setFillColor(lightGray.r, lightGray.g, lightGray.b);
  pdf.rect(margin, y, contentWidth, 10, 'F');
  pdf.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PAYMENT SUMMARY', margin + 5, y + 7);
  
  y += 10;
  pdf.rect(margin, y, contentWidth, 45);
  
  // Amount display
  const amount = parseFloat(data.payrollAmount || '0').toLocaleString('en-US');
  
  pdf.setTextColor(gray.r, gray.g, gray.b);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Net Payroll Amount', pageWidth / 2, y + 12, { align: 'center' });
  
  pdf.setTextColor(black.r, black.g, black.b);
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  pdf.text(amount, pageWidth / 2, y + 28, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text('MMK', pageWidth / 2, y + 38, { align: 'center' });
  
  pdf.setFontSize(9);
  pdf.setTextColor(gray.r, gray.g, gray.b);
  pdf.text('Myanmar Kyat', pageWidth / 2, y + 44, { align: 'center' });
  
  y += 55;
  
  // ===== PAYMENT METHOD =====
  pdf.setFillColor(lightGray.r, lightGray.g, lightGray.b);
  pdf.rect(margin, y, contentWidth, 10, 'F');
  pdf.setTextColor(darkGray.r, darkGray.g, darkGray.b);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PAYMENT INFORMATION', margin + 5, y + 7);
  
  y += 10;
  pdf.rect(margin, y, contentWidth, 20);
  
  const halfWidth = contentWidth / 2;
  
  pdf.setTextColor(gray.r, gray.g, gray.b);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Payment Method:', margin + 8, y + 8);
  pdf.text('Status:', margin + halfWidth + 8, y + 8);
  
  pdf.setTextColor(black.r, black.g, black.b);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Bank Transfer', margin + 8, y + 15);
  pdf.text('Processed', margin + halfWidth + 8, y + 15);
  
  // ===== FOOTER =====
  const footerY = pageHeight - 35;
  
  // Signature line
  pdf.setDrawColor(lineGray.r, lineGray.g, lineGray.b);
  pdf.line(margin, footerY - 15, margin + 60, footerY - 15);
  pdf.line(pageWidth - margin - 60, footerY - 15, pageWidth - margin, footerY - 15);
  
  pdf.setTextColor(gray.r, gray.g, gray.b);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Authorized Signature', margin, footerY - 10);
  pdf.text('Employee Signature', pageWidth - margin - 60, footerY - 10);
  
  // Footer text
  pdf.setDrawColor(lineGray.r, lineGray.g, lineGray.b);
  pdf.line(margin, footerY, pageWidth - margin, footerY);
  
  pdf.setFontSize(8);
  pdf.text('This is a computer-generated document. Please retain this payslip for your records.', pageWidth / 2, footerY + 8, { align: 'center' });
  
  pdf.setFontSize(7);
  pdf.setTextColor(gray.r, gray.g, gray.b);
  pdf.text(`Hush Healthcare Ltd | Myanmar Division | Generated: ${new Date().toLocaleDateString('en-GB')}`, pageWidth / 2, footerY + 14, { align: 'center' });
  pdf.text('Confidential', pageWidth / 2, footerY + 20, { align: 'center' });
  
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
