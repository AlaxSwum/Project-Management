// Professional PDF Generator for Payroll System
// Clean, formal payslip documents - Black & White only

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
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  let y = margin;
  
  // ===== COMPANY HEADER =====
  pdf.setFillColor(40, 40, 40);
  pdf.rect(0, 0, pageWidth, 28, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('HUSH HEALTHCARE LTD', margin, 12);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('PAYSLIP', margin, 20);
  
  // Period on right
  pdf.setFontSize(9);
  pdf.text('Pay Period Ending:', pageWidth - margin - 45, 12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(formatDate(data.monthEnding), pageWidth - margin - 45, 20);
  
  y = 38;
  
  // ===== EMPLOYEE DETAILS =====
  pdf.setTextColor(0, 0, 0);
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EMPLOYEE DETAILS', margin + 3, y + 5.5);
  
  y += 8;
  pdf.setDrawColor(180, 180, 180);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, y, contentWidth, 22);
  
  // Row 1
  const col1 = margin + 3;
  const col2 = margin + 50;
  const col3 = pageWidth / 2 + 3;
  const col4 = pageWidth / 2 + 50;
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Employee Name:', col1, y + 6);
  pdf.text('Employee ID:', col3, y + 6);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.employeeName || '-', col2, y + 6);
  pdf.text(data.employeeId || '-', col4, y + 6);
  
  // Row 2
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Tax Code:', col1, y + 14);
  pdf.text('NI Number:', col3, y + 14);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.taxCode || '-', col2, y + 14);
  pdf.text(data.nationalInsuranceNumber || '-', col4, y + 14);
  
  y += 28;
  
  // ===== PAYMENTS & DEDUCTIONS =====
  const halfWidth = (contentWidth - 6) / 2;
  
  // Payments Header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, y, halfWidth, 8, 'F');
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('PAYMENTS', margin + 3, y + 5.5);
  
  // Deductions Header
  pdf.rect(margin + halfWidth + 6, y, halfWidth, 8, 'F');
  pdf.text('DEDUCTIONS', margin + halfWidth + 9, y + 5.5);
  
  y += 8;
  
  // Payments Box
  pdf.rect(margin, y, halfWidth, 40);
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  let py = y + 8;
  
  pdf.text(`Basic Pay (${data.hours || '0'} hrs x £${data.rate || '0'})`, margin + 3, py);
  pdf.text(formatCurrency(data.grossPay), margin + halfWidth - 3, py, { align: 'right' });
  
  py += 8;
  pdf.text('Holiday Pay', margin + 3, py);
  pdf.text(formatCurrency(data.holidayPay), margin + halfWidth - 3, py, { align: 'right' });
  
  // Total line
  py += 12;
  pdf.setDrawColor(180, 180, 180);
  pdf.line(margin + 3, py - 4, margin + halfWidth - 3, py - 4);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Payments', margin + 3, py);
  pdf.text(formatCurrency(data.totalPayments), margin + halfWidth - 3, py, { align: 'right' });
  
  // Deductions Box
  const dedX = margin + halfWidth + 6;
  pdf.rect(dedX, y, halfWidth, 40);
  
  pdf.setFont('helvetica', 'normal');
  let dy = y + 8;
  
  pdf.text('PAYE Tax', dedX + 3, dy);
  pdf.text(formatCurrency(data.tax), dedX + halfWidth - 3, dy, { align: 'right' });
  
  dy += 8;
  pdf.text('National Insurance', dedX + 3, dy);
  pdf.text(formatCurrency(data.nationalInsurance), dedX + halfWidth - 3, dy, { align: 'right' });
  
  dy += 8;
  pdf.text('Holiday Repayment', dedX + 3, dy);
  pdf.text(formatCurrency(data.holidayRepayment), dedX + halfWidth - 3, dy, { align: 'right' });
  
  // Total line
  dy += 8;
  pdf.line(dedX + 3, dy - 4, dedX + halfWidth - 3, dy - 4);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Deductions', dedX + 3, dy);
  pdf.text(formatCurrency(data.totalDeductions), dedX + halfWidth - 3, dy, { align: 'right' });
  
  y += 48;
  
  // ===== NET PAY BOX =====
  pdf.setFillColor(40, 40, 40);
  pdf.rect(margin, y, contentWidth, 16, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('NET PAY', margin + 5, y + 10);
  
  pdf.setFontSize(16);
  pdf.text(formatCurrency(data.netPay), pageWidth - margin - 5, y + 11, { align: 'right' });
  
  y += 24;
  
  // ===== YEAR TO DATE =====
  pdf.setTextColor(0, 0, 0);
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('YEAR TO DATE', margin + 3, y + 5.5);
  
  y += 8;
  pdf.rect(margin, y, contentWidth, 18);
  
  const ytdColWidth = contentWidth / 4;
  const ytdItems = [
    { label: 'Taxable Gross', value: formatCurrency(data.taxableGrossPayYTD) },
    { label: 'Tax Paid', value: formatCurrency(data.taxYTD) },
    { label: 'Employee NI', value: formatCurrency(data.employeeNationalInsuranceYTD) },
    { label: 'Employer NI', value: formatCurrency(data.employerNationalInsuranceYTD) },
  ];
  
  pdf.setFontSize(7);
  ytdItems.forEach((item, i) => {
    const x = margin + 5 + (i * ytdColWidth);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(item.label, x, y + 6);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text(item.value, x, y + 13);
  });
  
  y += 24;
  
  // ===== PAYMENT DETAILS =====
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PAYMENT DETAILS', margin + 3, y + 5.5);
  
  y += 8;
  pdf.rect(margin, y, contentWidth, 18);
  
  const detailItems = [
    { label: 'Payment Date', value: formatDate(data.paidDate) },
    { label: 'PAYE Reference', value: data.employerPAYEReference || '-' },
    { label: 'NI Table', value: data.nationalInsuranceTable || '-' },
    { label: 'Leave Remaining', value: `${data.annualLeaveRemaining || '0'} days` },
  ];
  
  pdf.setFontSize(7);
  detailItems.forEach((item, i) => {
    const x = margin + 5 + (i * ytdColWidth);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(item.label, x, y + 6);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text(item.value, x, y + 13);
  });
  
  // ===== FOOTER =====
  const footerY = pageHeight - 18;
  pdf.setDrawColor(180, 180, 180);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  pdf.setTextColor(120, 120, 120);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text('This is a computer-generated document. Please retain for your records.', margin, footerY);
  pdf.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin, footerY, { align: 'right' });
  
  pdf.setFontSize(6);
  pdf.text('Hush Healthcare Ltd | Confidential', margin, footerY + 5);
  
  return pdf;
}

// Generate Myanmar Payroll PDF - Professional Clean Design
export function generateMyanmarPayrollPDF(data: MyanmarPayrollData): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let y = margin;
  
  // ===== HEADER =====
  pdf.setFillColor(40, 40, 40);
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('HUSH HEALTHCARE LTD', pageWidth / 2, 15, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('PAYROLL STATEMENT', pageWidth / 2, 24, { align: 'center' });
  
  pdf.setFontSize(8);
  pdf.text('Myanmar Division', pageWidth / 2, 31, { align: 'center' });
  
  y = 48;
  
  // ===== DOCUMENT INFO =====
  pdf.setTextColor(0, 0, 0);
  pdf.setDrawColor(180, 180, 180);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, y, contentWidth, 16);
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Document No:', margin + 5, y + 6);
  pdf.text('Pay Period:', pageWidth / 2, y + 6);
  pdf.text('Issue Date:', margin + 5, y + 13);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`PAY-${data.employeeId || 'XXX'}-${new Date().getFullYear()}`, margin + 35, y + 6);
  pdf.text(formatDate(data.monthEnding), pageWidth / 2 + 25, y + 6);
  pdf.text(new Date().toLocaleDateString('en-GB'), margin + 35, y + 13);
  
  y += 24;
  
  // ===== EMPLOYEE DETAILS =====
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EMPLOYEE DETAILS', margin + 5, y + 5.5);
  
  y += 8;
  pdf.rect(margin, y, contentWidth, 28);
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Employee ID:', margin + 8, y + 8);
  pdf.text('Full Name:', margin + 8, y + 16);
  pdf.text('Email:', margin + 8, y + 24);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text(data.employeeId || '-', margin + 45, y + 8);
  pdf.text(data.employeeName || '-', margin + 45, y + 16);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(data.email || '-', margin + 45, y + 24);
  
  y += 38;
  
  // ===== PAYMENT SUMMARY =====
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('PAYMENT SUMMARY', margin + 5, y + 5.5);
  
  y += 8;
  pdf.rect(margin, y, contentWidth, 40);
  
  // Amount
  const amount = parseFloat(data.payrollAmount || '0').toLocaleString('en-US');
  
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Net Payroll Amount', pageWidth / 2, y + 10, { align: 'center' });
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text(amount, pageWidth / 2, y + 25, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text('MMK', pageWidth / 2, y + 34, { align: 'center' });
  
  y += 50;
  
  // ===== PAYMENT METHOD =====
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PAYMENT INFORMATION', margin + 5, y + 5.5);
  
  y += 8;
  pdf.rect(margin, y, contentWidth, 16);
  
  const halfWidth = contentWidth / 2;
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Payment Method:', margin + 8, y + 6);
  pdf.text('Status:', margin + halfWidth + 8, y + 6);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Bank Transfer', margin + 8, y + 13);
  pdf.text('Processed', margin + halfWidth + 8, y + 13);
  
  // ===== FOOTER =====
  const footerY = pageHeight - 30;
  
  // Signature lines
  pdf.setDrawColor(180, 180, 180);
  pdf.line(margin, footerY - 12, margin + 55, footerY - 12);
  pdf.line(pageWidth - margin - 55, footerY - 12, pageWidth - margin, footerY - 12);
  
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Authorized Signature', margin, footerY - 8);
  pdf.text('Employee Signature', pageWidth - margin - 55, footerY - 8);
  
  // Footer line
  pdf.line(margin, footerY, pageWidth - margin, footerY);
  
  pdf.setFontSize(7);
  pdf.text('This is a computer-generated document. Please retain this payslip for your records.', pageWidth / 2, footerY + 6, { align: 'center' });
  
  pdf.setFontSize(6);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Hush Healthcare Ltd | Myanmar Division | Generated: ${new Date().toLocaleDateString('en-GB')} | Confidential`, pageWidth / 2, footerY + 12, { align: 'center' });
  
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
