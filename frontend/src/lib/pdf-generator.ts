// Professional PDF Generator for Payroll System
// Uses jsPDF with direct text/shape rendering for small file sizes

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

// Color scheme
const colors = {
  primary: '#1e3a5f',      // Dark navy blue
  secondary: '#2563eb',    // Blue
  accent: '#10b981',       // Green
  text: '#1f2937',         // Dark gray
  textLight: '#6b7280',    // Light gray
  border: '#e5e7eb',       // Light border
  background: '#f8fafc',   // Light background
  white: '#ffffff',
};

// Helper function to add header
function addHeader(pdf: jsPDF, companyName: string, documentTitle: string) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Header background
  pdf.setFillColor(30, 58, 95); // Dark navy
  pdf.rect(0, 0, pageWidth, 45, 'F');
  
  // Company name
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text(companyName, pageWidth / 2, 20, { align: 'center' });
  
  // Document title
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(documentTitle, pageWidth / 2, 32, { align: 'center' });
  
  // Decorative line
  pdf.setDrawColor(37, 99, 235); // Blue
  pdf.setLineWidth(0.5);
  pdf.line(20, 42, pageWidth - 20, 42);
}

// Helper function to add section title
function addSectionTitle(pdf: jsPDF, title: string, y: number): number {
  pdf.setFillColor(248, 250, 252); // Light background
  pdf.rect(15, y - 4, pdf.internal.pageSize.getWidth() - 30, 10, 'F');
  
  pdf.setTextColor(30, 58, 95); // Dark navy
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, 20, y + 3);
  
  return y + 15;
}

// Helper function to add a row
function addRow(pdf: jsPDF, label: string, value: string, y: number, highlight = false): number {
  if (highlight) {
    pdf.setFillColor(240, 253, 244); // Light green
    pdf.rect(15, y - 4, pdf.internal.pageSize.getWidth() - 30, 8, 'F');
  }
  
  pdf.setTextColor(107, 114, 128); // Light gray for label
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(label, 20, y);
  
  pdf.setTextColor(31, 41, 55); // Dark gray for value
  pdf.setFont('helvetica', 'bold');
  pdf.text(value, pdf.internal.pageSize.getWidth() - 20, y, { align: 'right' });
  
  return y + 8;
}

// Helper function to add footer
function addFooter(pdf: jsPDF, pageNum: number, totalPages: number) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Footer line
  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.3);
  pdf.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
  
  // Footer text
  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  
  pdf.text('This is a computer-generated document. No signature required.', 20, pageHeight - 18);
  pdf.text('Hush Healthcare Ltd - Confidential', 20, pageHeight - 12);
  pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 20, pageHeight - 12, { align: 'right' });
  pdf.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - 20, pageHeight - 18, { align: 'right' });
}

// Generate UK Payroll PDF
export function generateUKPayrollPDF(data: UKPayrollData): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Add header
  addHeader(pdf, 'Hush Healthcare Ltd', 'PAYSLIP');
  
  let y = 55;
  
  // Employee Information Box
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(15, y, pageWidth - 30, 35, 3, 3, 'FD');
  
  y += 8;
  
  // Two column layout for employee info
  const col1X = 20;
  const col2X = pageWidth / 2 + 5;
  
  pdf.setFontSize(9);
  pdf.setTextColor(107, 114, 128);
  pdf.setFont('helvetica', 'normal');
  
  pdf.text('Employee Name', col1X, y);
  pdf.text('Employee ID', col2X, y);
  y += 5;
  
  pdf.setTextColor(31, 41, 55);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(data.employeeName || '-', col1X, y);
  pdf.text(data.employeeId || '-', col2X, y);
  y += 8;
  
  pdf.setFontSize(9);
  pdf.setTextColor(107, 114, 128);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Pay Period Ending', col1X, y);
  pdf.text('Tax Code', col2X, y);
  y += 5;
  
  pdf.setTextColor(31, 41, 55);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(data.monthEnding || '-', col1X, y);
  pdf.text(data.taxCode || '-', col2X, y);
  
  y += 18;
  
  // NI Details
  y = addSectionTitle(pdf, 'NATIONAL INSURANCE DETAILS', y);
  y = addRow(pdf, 'NI Number', data.nationalInsuranceNumber || '-', y);
  y = addRow(pdf, 'NI Table', data.nationalInsuranceTable || '-', y);
  
  y += 5;
  
  // Payments Section
  y = addSectionTitle(pdf, 'PAYMENTS', y);
  y = addRow(pdf, `Hours Worked (${data.hours || '0'} hrs @ £${data.rate || '0'}/hr)`, `£${parseFloat(data.grossPay || '0').toFixed(2)}`, y);
  y = addRow(pdf, 'Holiday Pay', `£${parseFloat(data.holidayPay || '0').toFixed(2)}`, y);
  
  // Total Payments
  y += 2;
  pdf.setDrawColor(16, 185, 129);
  pdf.setLineWidth(0.5);
  pdf.line(20, y, pageWidth - 20, y);
  y += 6;
  y = addRow(pdf, 'TOTAL PAYMENTS', `£${parseFloat(data.totalPayments || '0').toFixed(2)}`, y, true);
  
  y += 5;
  
  // Deductions Section
  y = addSectionTitle(pdf, 'DEDUCTIONS', y);
  y = addRow(pdf, 'PAYE Tax', `£${parseFloat(data.tax || '0').toFixed(2)}`, y);
  y = addRow(pdf, 'National Insurance', `£${parseFloat(data.nationalInsurance || '0').toFixed(2)}`, y);
  y = addRow(pdf, 'Holiday Repayment', `£${parseFloat(data.holidayRepayment || '0').toFixed(2)}`, y);
  
  // Total Deductions
  y += 2;
  pdf.setDrawColor(239, 68, 68);
  pdf.setLineWidth(0.5);
  pdf.line(20, y, pageWidth - 20, y);
  y += 6;
  
  pdf.setFillColor(254, 242, 242); // Light red
  pdf.rect(15, y - 4, pageWidth - 30, 8, 'F');
  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('TOTAL DEDUCTIONS', 20, y);
  pdf.setTextColor(185, 28, 28);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`£${parseFloat(data.totalDeductions || '0').toFixed(2)}`, pageWidth - 20, y, { align: 'right' });
  y += 10;
  
  // NET PAY - Highlighted
  pdf.setFillColor(16, 185, 129); // Green
  pdf.roundedRect(15, y, pageWidth - 30, 15, 3, 3, 'F');
  y += 10;
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('NET PAY', 25, y);
  pdf.setFontSize(16);
  pdf.text(`£${parseFloat(data.netPay || '0').toFixed(2)}`, pageWidth - 25, y, { align: 'right' });
  
  y += 15;
  
  // Year to Date Summary
  y = addSectionTitle(pdf, 'YEAR TO DATE SUMMARY', y);
  y = addRow(pdf, 'Taxable Gross Pay YTD', `£${parseFloat(data.taxableGrossPayYTD || '0').toFixed(2)}`, y);
  y = addRow(pdf, 'Tax Paid YTD', `£${parseFloat(data.taxYTD || '0').toFixed(2)}`, y);
  y = addRow(pdf, 'Employee NI YTD', `£${parseFloat(data.employeeNationalInsuranceYTD || '0').toFixed(2)}`, y);
  y = addRow(pdf, 'Employer NI YTD', `£${parseFloat(data.employerNationalInsuranceYTD || '0').toFixed(2)}`, y);
  
  y += 5;
  
  // Payment Information
  y = addSectionTitle(pdf, 'PAYMENT INFORMATION', y);
  y = addRow(pdf, 'Payment Date', data.paidDate || '-', y);
  y = addRow(pdf, 'Employer PAYE Reference', data.employerPAYEReference || '-', y);
  y = addRow(pdf, 'Annual Leave Remaining', `${data.annualLeaveRemaining || '0'} days`, y);
  
  // Footer
  addFooter(pdf, 1, 1);
  
  return pdf;
}

// Generate Myanmar Payroll PDF
export function generateMyanmarPayrollPDF(data: MyanmarPayrollData): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Add header
  addHeader(pdf, 'Hush Healthcare Ltd', 'PAYROLL STATEMENT');
  
  let y = 60;
  
  // Statement Box
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(15, y, pageWidth - 30, 80, 3, 3, 'FD');
  
  y += 15;
  
  // Employee Information
  y = addSectionTitle(pdf, 'EMPLOYEE DETAILS', y);
  y = addRow(pdf, 'Employee ID', data.employeeId || '-', y);
  y = addRow(pdf, 'Employee Name', data.employeeName || '-', y);
  y = addRow(pdf, 'Email Address', data.email || '-', y);
  y = addRow(pdf, 'Pay Period Ending', data.monthEnding || '-', y);
  
  y += 20;
  
  // Amount Box
  pdf.setFillColor(16, 185, 129); // Green
  pdf.roundedRect(25, y, pageWidth - 50, 30, 5, 5, 'F');
  
  y += 12;
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('PAYROLL AMOUNT', pageWidth / 2, y, { align: 'center' });
  
  y += 12;
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  const amount = parseFloat(data.payrollAmount || '0').toLocaleString('en-US');
  pdf.text(`${amount} MMK`, pageWidth / 2, y, { align: 'center' });
  
  // Footer
  addFooter(pdf, 1, 1);
  
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
