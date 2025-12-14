// Professional PDF Generator for Payroll System
// Clean payslip design inspired by professional templates

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

// Theme colors
const teal = { r: 77, g: 166, b: 169 };
const lightTeal = { r: 220, g: 242, b: 243 };
const darkText = { r: 51, g: 51, b: 51 };
const grayText = { r: 102, g: 102, b: 102 };
const lineGray = { r: 200, g: 200, b: 200 };

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
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

// Generate UK Payroll PDF
export function generateUKPayrollPDF(data: UKPayrollData): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  let y = margin;
  
  // ===== HEADER =====
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(darkText.r, darkText.g, darkText.b);
  pdf.text('PAYSLIP', margin, y + 12);
  
  // Company name on right
  pdf.setFontSize(18);
  pdf.setTextColor(teal.r, teal.g, teal.b);
  pdf.text('Hush Healthcare', pageWidth - margin, y + 10, { align: 'right' });
  pdf.setFontSize(10);
  pdf.setTextColor(grayText.r, grayText.g, grayText.b);
  pdf.text('Ltd', pageWidth - margin, y + 16, { align: 'right' });
  
  y += 28;
  
  // ===== COMPANY INFO BAR =====
  pdf.setFillColor(teal.r, teal.g, teal.b);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Hush Healthcare Ltd', margin + 4, y + 5.5);
  
  y += 8;
  pdf.setTextColor(darkText.r, darkText.g, darkText.b);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Healthcare Services', margin + 4, y + 6);
  pdf.text('PAYE Ref: ' + (data.employerPAYEReference || '120/WE94437'), margin + 4, y + 12);
  
  y += 18;
  pdf.setDrawColor(lineGray.r, lineGray.g, lineGray.b);
  pdf.line(margin, y, pageWidth - margin, y);
  
  y += 8;
  
  // ===== EMPLOYEE DETAILS & PAYMENT INFO =====
  const halfWidth = (contentWidth - 10) / 2;
  
  // Employee Details Header
  pdf.setFillColor(teal.r, teal.g, teal.b);
  pdf.rect(margin, y, halfWidth, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Employee Details', margin + 4, y + 5.5);
  
  // Payment Details Header
  pdf.rect(margin + halfWidth + 10, y, halfWidth, 8, 'F');
  pdf.text('Payment Details', margin + halfWidth + 14, y + 5.5);
  
  y += 8;
  
  // Employee Details Content
  pdf.setFillColor(lightTeal.r, lightTeal.g, lightTeal.b);
  pdf.rect(margin, y, halfWidth, 32, 'F');
  
  pdf.setTextColor(darkText.r, darkText.g, darkText.b);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Employee Name', margin + 4, y + 8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.employeeName || '-', margin + 4, y + 14);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Employee ID', margin + 4, y + 22);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.employeeId || '-', margin + 4, y + 28);
  
  // Payment Details Content
  pdf.rect(margin + halfWidth + 10, y, halfWidth, 32, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Tax Code', margin + halfWidth + 14, y + 8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.taxCode || '-', margin + halfWidth + 50, y + 8);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('NI Number', margin + halfWidth + 14, y + 16);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.nationalInsuranceNumber || '-', margin + halfWidth + 50, y + 16);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('NI Table', margin + halfWidth + 14, y + 24);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.nationalInsuranceTable || 'A', margin + halfWidth + 50, y + 24);
  
  y += 40;
  
  // Period and Tax Code Row
  pdf.setDrawColor(lineGray.r, lineGray.g, lineGray.b);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 2;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Period End', margin + 4, y + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatDate(data.monthEnding), margin + 40, y + 6);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Payment Date', margin + halfWidth + 14, y + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatDate(data.paidDate), margin + halfWidth + 50, y + 6);
  
  y += 14;
  pdf.line(margin, y, pageWidth - margin, y);
  
  y += 8;
  
  // ===== PAYMENTS TABLE =====
  // Header
  pdf.setFillColor(teal.r, teal.g, teal.b);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  
  const cols = [margin + 4, margin + 70, margin + 100, margin + 130, margin + 160];
  pdf.text('Payments', cols[0], y + 5.5);
  pdf.text('Type', cols[1], y + 5.5);
  pdf.text('Rate', cols[2], y + 5.5);
  pdf.text('Hours', cols[3], y + 5.5);
  pdf.text('Amount', cols[4], y + 5.5);
  
  y += 8;
  
  // Payment rows
  pdf.setTextColor(darkText.r, darkText.g, darkText.b);
  pdf.setFont('helvetica', 'normal');
  
  // Basic Pay
  pdf.text('Basic Pay', cols[0], y + 6);
  pdf.text('Hourly', cols[1], y + 6);
  pdf.text(formatCurrency(data.rate), cols[2], y + 6);
  pdf.text(data.hours || '0', cols[3], y + 6);
  pdf.text(formatCurrency(data.grossPay), cols[4], y + 6);
  
  y += 8;
  
  // Holiday Pay
  pdf.text('Holiday Pay', cols[0], y + 6);
  pdf.text('Allowance', cols[1], y + 6);
  pdf.text('-', cols[2], y + 6);
  pdf.text('-', cols[3], y + 6);
  pdf.text(formatCurrency(data.holidayPay), cols[4], y + 6);
  
  y += 10;
  pdf.line(margin, y, pageWidth - margin, y);
  
  // Total Payments
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Gross Pay', cols[0], y + 6);
  pdf.text(formatCurrency(data.totalPayments), cols[4], y + 6);
  
  y += 14;
  
  // ===== DEDUCTIONS TABLE =====
  pdf.setFillColor(teal.r, teal.g, teal.b);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.text('Deductions', cols[0], y + 5.5);
  pdf.text('Amount', cols[4], y + 5.5);
  
  y += 8;
  
  pdf.setTextColor(darkText.r, darkText.g, darkText.b);
  pdf.setFont('helvetica', 'normal');
  
  // PAYE Tax
  pdf.text('PAYE Tax', cols[0], y + 6);
  pdf.text(formatCurrency(data.tax), cols[4], y + 6);
  y += 8;
  
  // National Insurance
  pdf.text('National Insurance', cols[0], y + 6);
  pdf.text(formatCurrency(data.nationalInsurance), cols[4], y + 6);
  y += 8;
  
  // Holiday Repayment
  pdf.text('Holiday Repayment', cols[0], y + 6);
  pdf.text(formatCurrency(data.holidayRepayment), cols[4], y + 6);
  y += 10;
  
  pdf.line(margin, y, pageWidth - margin, y);
  
  // Total Deductions
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Deductions', cols[0], y + 6);
  pdf.text(formatCurrency(data.totalDeductions), cols[4], y + 6);
  
  y += 16;
  
  // ===== NET PAY BOX =====
  pdf.setFillColor(teal.r, teal.g, teal.b);
  pdf.rect(margin, y, contentWidth, 14, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('NET PAY', margin + 4, y + 9);
  pdf.setFontSize(14);
  pdf.text(formatCurrency(data.netPay), pageWidth - margin - 4, y + 9, { align: 'right' });
  
  y += 22;
  
  // ===== YEAR TO DATE =====
  pdf.setFillColor(teal.r, teal.g, teal.b);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Year to Date Summary', margin + 4, y + 5.5);
  
  y += 8;
  
  const ytdColWidth = contentWidth / 4;
  const ytdItems = [
    { label: 'Taxable Gross', value: formatCurrency(data.taxableGrossPayYTD) },
    { label: 'Tax Paid', value: formatCurrency(data.taxYTD) },
    { label: 'Employee NI', value: formatCurrency(data.employeeNationalInsuranceYTD) },
    { label: 'Employer NI', value: formatCurrency(data.employerNationalInsuranceYTD) },
  ];
  
  pdf.setFillColor(lightTeal.r, lightTeal.g, lightTeal.b);
  pdf.rect(margin, y, contentWidth, 14, 'F');
  
  pdf.setTextColor(darkText.r, darkText.g, darkText.b);
  pdf.setFontSize(7);
  ytdItems.forEach((item, i) => {
    const x = margin + 4 + (i * ytdColWidth);
    pdf.setFont('helvetica', 'normal');
    pdf.text(item.label, x, y + 5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(item.value, x, y + 11);
  });
  
  // ===== FOOTER =====
  const footerY = pageHeight - 15;
  pdf.setDrawColor(lineGray.r, lineGray.g, lineGray.b);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  pdf.setTextColor(grayText.r, grayText.g, grayText.b);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text('This is a computer-generated payslip. Please retain for your records.', margin, footerY);
  pdf.text('Hush Healthcare Ltd | Confidential', pageWidth - margin, footerY, { align: 'right' });
  
  return pdf;
}

// Generate Myanmar Payroll PDF
export function generateMyanmarPayrollPDF(data: MyanmarPayrollData): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let y = margin;
  
  // ===== HEADER =====
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(darkText.r, darkText.g, darkText.b);
  pdf.text('PAYSLIP', margin, y + 12);
  
  // Company name on right
  pdf.setFontSize(18);
  pdf.setTextColor(teal.r, teal.g, teal.b);
  pdf.text('Hush Healthcare', pageWidth - margin, y + 10, { align: 'right' });
  pdf.setFontSize(10);
  pdf.setTextColor(grayText.r, grayText.g, grayText.b);
  pdf.text('Myanmar Division', pageWidth - margin, y + 16, { align: 'right' });
  
  y += 28;
  
  // ===== COMPANY INFO BAR =====
  pdf.setFillColor(teal.r, teal.g, teal.b);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Hush Healthcare Ltd - Myanmar Division', margin + 4, y + 5.5);
  
  y += 8;
  pdf.setTextColor(darkText.r, darkText.g, darkText.b);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Healthcare Services', margin + 4, y + 6);
  
  y += 12;
  pdf.setDrawColor(lineGray.r, lineGray.g, lineGray.b);
  pdf.line(margin, y, pageWidth - margin, y);
  
  y += 8;
  
  // ===== EMPLOYEE DETAILS =====
  pdf.setFillColor(teal.r, teal.g, teal.b);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Employee Details', margin + 4, y + 5.5);
  
  y += 8;
  
  pdf.setFillColor(lightTeal.r, lightTeal.g, lightTeal.b);
  pdf.rect(margin, y, contentWidth, 28, 'F');
  
  pdf.setTextColor(darkText.r, darkText.g, darkText.b);
  pdf.setFontSize(8);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Employee ID', margin + 4, y + 8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.employeeId || '-', margin + 50, y + 8);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Employee Name', margin + 4, y + 16);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.employeeName || '-', margin + 50, y + 16);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Email', margin + 4, y + 24);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.email || '-', margin + 50, y + 24);
  
  y += 36;
  
  // Period Row
  pdf.setDrawColor(lineGray.r, lineGray.g, lineGray.b);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 2;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Period End', margin + 4, y + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatDate(data.monthEnding), margin + 40, y + 6);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Issue Date', margin + contentWidth / 2, y + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.text(new Date().toLocaleDateString('en-GB'), margin + contentWidth / 2 + 30, y + 6);
  
  y += 14;
  pdf.line(margin, y, pageWidth - margin, y);
  
  y += 10;
  
  // ===== PAYMENT TABLE =====
  pdf.setFillColor(teal.r, teal.g, teal.b);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Payment', margin + 4, y + 5.5);
  pdf.text('Amount', pageWidth - margin - 4, y + 5.5, { align: 'right' });
  
  y += 8;
  
  pdf.setTextColor(darkText.r, darkText.g, darkText.b);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Net Salary', margin + 4, y + 8);
  
  const amount = parseFloat(data.payrollAmount || '0').toLocaleString('en-US');
  pdf.setFont('helvetica', 'bold');
  pdf.text(`MMK ${amount}`, pageWidth - margin - 4, y + 8, { align: 'right' });
  
  y += 14;
  pdf.line(margin, y, pageWidth - margin, y);
  
  y += 6;
  
  // ===== NET PAY BOX =====
  pdf.setFillColor(teal.r, teal.g, teal.b);
  pdf.rect(margin, y, contentWidth, 16, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('NET PAY', margin + 4, y + 10);
  pdf.setFontSize(16);
  pdf.text(`MMK ${amount}`, pageWidth - margin - 4, y + 11, { align: 'right' });
  
  y += 26;
  
  // Payment Info
  pdf.setFillColor(lightTeal.r, lightTeal.g, lightTeal.b);
  pdf.rect(margin, y, contentWidth, 16, 'F');
  
  pdf.setTextColor(darkText.r, darkText.g, darkText.b);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Payment Method', margin + 4, y + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Bank Transfer', margin + 4, y + 12);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Status', margin + contentWidth / 2, y + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Processed', margin + contentWidth / 2, y + 12);
  
  // ===== FOOTER =====
  const footerY = pageHeight - 20;
  
  // Signature lines
  pdf.setDrawColor(lineGray.r, lineGray.g, lineGray.b);
  pdf.line(margin, footerY - 15, margin + 50, footerY - 15);
  pdf.line(pageWidth - margin - 50, footerY - 15, pageWidth - margin, footerY - 15);
  
  pdf.setTextColor(grayText.r, grayText.g, grayText.b);
  pdf.setFontSize(7);
  pdf.text('Authorized Signature', margin, footerY - 10);
  pdf.text('Employee Signature', pageWidth - margin - 50, footerY - 10);
  
  pdf.line(margin, footerY, pageWidth - margin, footerY);
  
  pdf.text('This is a computer-generated payslip. Please retain for your records.', pageWidth / 2, footerY + 6, { align: 'center' });
  pdf.text('Hush Healthcare Ltd | Myanmar Division | Confidential', pageWidth / 2, footerY + 12, { align: 'center' });
  
  return pdf;
}

// Export PDF as base64
export function getPDFBase64(pdf: jsPDF): string {
  const pdfOutput = pdf.output('datauristring');
  return pdfOutput.split(',')[1];
}

// Export PDF as blob
export function getPDFBlob(pdf: jsPDF): Blob {
  return pdf.output('blob');
}
