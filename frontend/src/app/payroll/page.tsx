'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { createClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  DocumentTextIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { brevoService } from '@/lib/brevo-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PayrollType = 'myanmar' | 'uk';

interface UKPayrollData {
  employeeName: string;
  employeeId: string;
  email: string;
  monthEnding: string;
  taxCode: string;
  nationalInsuranceNumber: string;
  nationalInsuranceTable: string;
  annualLeaveRemaining: string;
  
  // Payments
  hours: string;
  rate: string;
  grossPay: string;
  holidayPay: string;
  totalPayments: string;
  
  // Deductions
  tax: string;
  nationalInsurance: string;
  holidayRepayment: string;
  totalDeductions: string;
  
  // This Month
  taxableGrossPay: string;
  employerNationalInsurance: string;
  netPay: string;
  
  // Year to Date
  taxableGrossPayYTD: string;
  taxYTD: string;
  employeeNationalInsuranceYTD: string;
  employerNationalInsuranceYTD: string;
  
  // Payment
  netAmountPaid: string;
  paidDate: string;
  
  // Employer Info
  employerPAYEReference: string;
}

interface MyanmarPayrollData {
  employeeId: string;
  employeeName: string;
  email: string;
  payrollAmount: string;
  monthEnding: string;
}

export default function PayrollPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [payrollType, setPayrollType] = useState<PayrollType>('uk');
  const [isMobile, setIsMobile] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [message, setMessage] = useState('');
  const [pdfGenerated, setPdfGenerated] = useState(false);
  
  // UK Payroll Form Data
  const [ukPayrollData, setUkPayrollData] = useState<UKPayrollData>({
    employeeName: '',
    employeeId: '',
    email: '',
    monthEnding: '',
    taxCode: '1257L',
    nationalInsuranceNumber: '',
    nationalInsuranceTable: 'A',
    annualLeaveRemaining: '28',
    hours: '',
    rate: '',
    grossPay: '',
    holidayPay: '',
    totalPayments: '',
    tax: '',
    nationalInsurance: '',
    holidayRepayment: '',
    totalDeductions: '',
    taxableGrossPay: '',
    employerNationalInsurance: '',
    netPay: '',
    taxableGrossPayYTD: '',
    taxYTD: '',
    employeeNationalInsuranceYTD: '',
    employerNationalInsuranceYTD: '',
    netAmountPaid: '',
    paidDate: '',
    employerPAYEReference: '120/WE94437',
  });
  
  // Myanmar Payroll Form Data
  const [myanmarPayrollData, setMyanmarPayrollData] = useState<MyanmarPayrollData>({
    employeeId: '',
    employeeName: '',
    email: '',
    payrollAmount: '',
    monthEnding: '',
  });
  
  const [projects, setProjects] = useState<any[]>([]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check access control
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    checkAccess();
  }, [isAuthenticated, authLoading, router, user?.id]);

  // Fetch projects for sidebar
  useEffect(() => {
    if (hasAccess && user?.id) {
      fetchProjects();
    }
  }, [hasAccess, user?.id]);

  const checkAccess = async () => {
    if (!user?.id) {
      setHasAccess(false);
      setIsLoading(false);
      return;
    }

    try {
      const supabaseClient = (await import('@/lib/supabase')).supabase;
      
      // Check if user is a payroll member
      const { data: memberData, error: memberError } = await supabaseClient
        .from('payroll_members')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

      if (memberData && !memberError) {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      // Check user properties from auth context
      const contextRole = user.role || (user as any)?.user_metadata?.role;
      const isAdmin = contextRole === 'admin' || contextRole === 'hr' || contextRole === 'superuser';
      
      if (isAdmin) {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      // Check auth_user table for admin privileges
      const { data: userData, error: userError } = await supabaseClient
        .from('auth_user')
        .select('id, name, email, role, is_superuser, is_staff')
        .eq('id', user.id)
        .single();

      if (!userError && userData) {
        const hasAdminPermission = userData.is_superuser || userData.is_staff || userData.role === 'admin' || userData.role === 'hr';
        
        if (hasAdminPermission) {
          setHasAccess(true);
          setIsLoading(false);
          return;
        }
      }

      setHasAccess(false);
      setIsLoading(false);
    } catch (err) {
      console.error('Error checking payroll access:', err);
      setHasAccess(false);
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const calculateUKTotals = () => {
    const hours = parseFloat(ukPayrollData.hours) || 0;
    const rate = parseFloat(ukPayrollData.rate) || 0;
    const grossPay = hours * rate;
    const holidayPay = parseFloat(ukPayrollData.holidayPay) || 0;
    const totalPayments = grossPay + holidayPay;
    
    const tax = parseFloat(ukPayrollData.tax) || 0;
    const ni = parseFloat(ukPayrollData.nationalInsurance) || 0;
    const holidayRepayment = parseFloat(ukPayrollData.holidayRepayment) || 0;
    const totalDeductions = tax + ni + holidayRepayment;
    
    const netPay = totalPayments - totalDeductions;
    
    setUkPayrollData(prev => ({
      ...prev,
      grossPay: grossPay.toFixed(2),
      totalPayments: totalPayments.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
      netPay: netPay.toFixed(2),
      taxableGrossPay: grossPay.toFixed(2),
      netAmountPaid: netPay.toFixed(2),
    }));
  };

  useEffect(() => {
    if (payrollType === 'uk') {
      calculateUKTotals();
    }
  }, [ukPayrollData.hours, ukPayrollData.rate, ukPayrollData.holidayPay, ukPayrollData.tax, ukPayrollData.nationalInsurance, ukPayrollData.holidayRepayment]);

  const generatePDF = async () => {
    try {
      setMessage('Generating PDF...');
      const element = document.getElementById('payroll-preview');
      if (!element) {
        setMessage('Error: Preview element not found');
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = payrollType === 'uk' 
        ? `Payroll_UK_${ukPayrollData.employeeName}_${ukPayrollData.monthEnding}.pdf`
        : `Payroll_Myanmar_${myanmarPayrollData.employeeName}_${myanmarPayrollData.monthEnding}.pdf`;
      
      pdf.save(fileName);
      setPdfGenerated(true);
      setMessage('PDF generated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage('Error generating PDF');
    }
  };

  const handleSendEmail = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      setMessage('Please enter a valid email address');
      return;
    }

    try {
      setSendingEmail(true);
      setMessage('Sending email...');

      // Generate PDF as blob first
      const element = document.getElementById('payroll-preview');
      if (!element) {
        setMessage('Error: Preview element not found');
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const pdfBlob = pdf.output('blob');
      const pdfBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(pdfBlob);
      });

      // Send email with PDF attachment
      const employeeName = payrollType === 'uk' ? ukPayrollData.employeeName : myanmarPayrollData.employeeName;
      const monthEnding = payrollType === 'uk' ? ukPayrollData.monthEnding : myanmarPayrollData.monthEnding;
      
      const emailSubject = `Payroll Statement - ${employeeName} - ${monthEnding}`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #3B82F6;">Payroll Statement</h2>
          <p>Dear ${employeeName},</p>
          <p>Please find attached your payroll statement for the month ending ${monthEnding}.</p>
          <p>If you have any questions, please contact the HR department.</p>
          <p>Best regards,<br>Hush Healthcare Ltd<br>HR Department</p>
        </div>
      `;

      // Note: Brevo API doesn't support attachments directly in the current implementation
      // We'll send the email with a link to download or include the PDF in the email body
      const result = await brevoService.sendEmail({
        to: [emailAddress],
        subject: emailSubject,
        htmlContent: emailBody + `
          <p style="margin-top: 20px; padding: 15px; background-color: #F3F4F6; border-radius: 5px;">
            <strong>Note:</strong> Your payroll PDF has been generated. Please download it from the payroll system or contact HR for assistance.
          </p>
        `,
      });

      if (result.success) {
        setMessage('Email sent successfully!');
        setShowEmailModal(false);
        setEmailAddress('');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error sending email: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setMessage('Error sending email');
    } finally {
      setSendingEmail(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-600">Access Denied. Admin or Payroll Member access required.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {isMobile ? <MobileHeader /> : <Sidebar projects={projects} onCreateProject={() => {}} />}
      
      <div className={`min-h-screen ${isMobile ? 'pt-16' : 'ml-72'}`}>
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
                  Payroll Generation
                </h1>
                <p className="text-gray-600 mt-2">Generate and send payroll statements</p>
              </div>
              <BuildingOfficeIcon className="h-12 w-12 text-indigo-600" />
            </div>
          </div>

          {/* Payroll Type Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Payroll Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setPayrollType('uk')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  payrollType === 'uk'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GlobeAltIcon className={`h-6 w-6 ${payrollType === 'uk' ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <div className={`font-semibold ${payrollType === 'uk' ? 'text-indigo-600' : 'text-gray-700'}`}>
                      UK Payroll
                    </div>
                    <div className="text-sm text-gray-500">Full UK payroll with tax and NI</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setPayrollType('myanmar')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  payrollType === 'myanmar'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GlobeAltIcon className={`h-6 w-6 ${payrollType === 'myanmar' ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <div className={`font-semibold ${payrollType === 'myanmar' ? 'text-indigo-600' : 'text-gray-700'}`}>
                      Myanmar Payroll
                    </div>
                    <div className="text-sm text-gray-500">Simplified payroll format</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Employee Information</h2>
            
            {payrollType === 'uk' ? (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee Name *</label>
                    <input
                      type="text"
                      value={ukPayrollData.employeeName}
                      onChange={(e) => setUkPayrollData({ ...ukPayrollData, employeeName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID *</label>
                    <input
                      type="text"
                      value={ukPayrollData.employeeId}
                      onChange={(e) => setUkPayrollData({ ...ukPayrollData, employeeId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="EMP001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={ukPayrollData.email}
                      onChange={(e) => setUkPayrollData({ ...ukPayrollData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Month Ending *</label>
                    <input
                      type="date"
                      value={ukPayrollData.monthEnding}
                      onChange={(e) => setUkPayrollData({ ...ukPayrollData, monthEnding: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tax Code</label>
                    <input
                      type="text"
                      value={ukPayrollData.taxCode}
                      onChange={(e) => setUkPayrollData({ ...ukPayrollData, taxCode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="1257L"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">NI Number</label>
                    <input
                      type="text"
                      value={ukPayrollData.nationalInsuranceNumber}
                      onChange={(e) => setUkPayrollData({ ...ukPayrollData, nationalInsuranceNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="AB123456C"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">NI Table</label>
                    <select
                      value={ukPayrollData.nationalInsuranceTable}
                      onChange={(e) => setUkPayrollData({ ...ukPayrollData, nationalInsuranceTable: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                </div>

                {/* Payments Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payments</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hours</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ukPayrollData.hours}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, hours: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="167.25"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rate (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ukPayrollData.rate}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, rate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="12.25"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Holiday Pay (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ukPayrollData.holidayPay}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, holidayPay: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="196.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gross Pay (£)</label>
                      <input
                        type="text"
                        value={ukPayrollData.grossPay}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Deductions Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Deductions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tax (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ukPayrollData.tax}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, tax: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="44.80"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">National Insurance (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ukPayrollData.nationalInsurance}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, nationalInsurance: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="17.97"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Holiday Repayment (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ukPayrollData.holidayRepayment}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, holidayRepayment: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="972.16"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Deductions (£)</label>
                      <input
                        type="text"
                        value={ukPayrollData.totalDeductions}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Year to Date Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Year to Date</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Taxable Gross Pay YTD (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ukPayrollData.taxableGrossPayYTD}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, taxableGrossPayYTD: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="5219.61"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tax YTD (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ukPayrollData.taxYTD}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, taxYTD: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="414.80"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employee NI YTD (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ukPayrollData.employeeNationalInsuranceYTD}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, employeeNationalInsuranceYTD: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="166.04"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employer NI YTD (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ukPayrollData.employerNationalInsuranceYTD}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, employerNationalInsuranceYTD: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="595.29"
                      />
                    </div>
                  </div>
                </div>

                {/* This Month Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Taxable Gross Pay (£)</label>
                      <input
                        type="text"
                        value={ukPayrollData.taxableGrossPay}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employer National Insurance (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ukPayrollData.employerNationalInsurance}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, employerNationalInsurance: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="128.35"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Net Pay (£)</label>
                      <input
                        type="text"
                        value={ukPayrollData.netPay}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Net Amount Paid (£)</label>
                      <input
                        type="text"
                        value={ukPayrollData.netAmountPaid}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Paid Date</label>
                      <input
                        type="date"
                        value={ukPayrollData.paidDate}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, paidDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employer PAYE Reference</label>
                      <input
                        type="text"
                        value={ukPayrollData.employerPAYEReference}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, employerPAYEReference: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="120/WE94437"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID *</label>
                    <input
                      type="text"
                      value={myanmarPayrollData.employeeId}
                      onChange={(e) => setMyanmarPayrollData({ ...myanmarPayrollData, employeeId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="EMP001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee Name *</label>
                    <input
                      type="text"
                      value={myanmarPayrollData.employeeName}
                      onChange={(e) => setMyanmarPayrollData({ ...myanmarPayrollData, employeeName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={myanmarPayrollData.email}
                      onChange={(e) => setMyanmarPayrollData({ ...myanmarPayrollData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payroll Amount (MMK) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={myanmarPayrollData.payrollAmount}
                      onChange={(e) => setMyanmarPayrollData({ ...myanmarPayrollData, payrollAmount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="1000000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month Ending *</label>
                  <input
                    type="date"
                    value={myanmarPayrollData.monthEnding}
                    onChange={(e) => setMyanmarPayrollData({ ...myanmarPayrollData, monthEnding: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview Section */}
          {(payrollType === 'uk' && ukPayrollData.employeeName && ukPayrollData.monthEnding) ||
           (payrollType === 'myanmar' && myanmarPayrollData.employeeName && myanmarPayrollData.monthEnding) ? (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
              <div id="payroll-preview" className="bg-white p-8 border-2 border-gray-200 rounded-lg">
                {payrollType === 'uk' ? (
                  <UKPayrollPreview data={ukPayrollData} />
                ) : (
                  <MyanmarPayrollPreview data={myanmarPayrollData} />
                )}
              </div>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={generatePDF}
                disabled={!pdfGenerated && ((payrollType === 'uk' && (!ukPayrollData.employeeName || !ukPayrollData.monthEnding)) ||
                  (payrollType === 'myanmar' && (!myanmarPayrollData.employeeName || !myanmarPayrollData.monthEnding)))}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Generate PDF
              </button>
              
              {pdfGenerated && (
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                  Send Email
                </button>
              )}
            </div>
            
            {message && (
              <div className={`mt-4 p-3 rounded-lg ${
                message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Send Payroll Email</h3>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailAddress('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="employee@example.com"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailAddress}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {sendingEmail ? 'Sending...' : 'Send'}
              </button>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailAddress('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// UK Payroll Preview Component
function UKPayrollPreview({ data }: { data: UKPayrollData }) {
  return (
    <div className="payroll-preview" style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>Hush Healthcare Ltd</h1>
        <h2 style={{ fontSize: '18px', color: '#666' }}>Payslip</h2>
      </div>

      <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #333' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <strong>Employee Name:</strong> {data.employeeName}
          </div>
          <div>
            <strong>Month Ending:</strong> {data.monthEnding}
          </div>
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          <strong>Company:</strong> Hush Healthcare Ltd
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
            Employee Details
          </h3>
          <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
            <div><strong>Tax code:</strong> {data.taxCode}</div>
            <div><strong>National Insurance number:</strong> {data.nationalInsuranceNumber}</div>
            <div><strong>National Insurance table:</strong> {data.nationalInsuranceTable}</div>
            <div><strong>Annual leave remaining:</strong> {data.annualLeaveRemaining} days</div>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
            Payments
          </h3>
          <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
            <div>{data.hours} hours @ £{data.rate}: £{data.grossPay}</div>
            <div>Holiday pay: £{data.holidayPay}</div>
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ccc' }}>
              <strong>Total Payments:</strong> £{data.totalPayments}
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
            Deductions
          </h3>
          <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
            <div>Tax: £{data.tax}</div>
            <div>National Insurance: £{data.nationalInsurance}</div>
            <div>Holiday repayment: £{data.holidayRepayment}</div>
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ccc' }}>
              <strong>Total Deductions:</strong> £{data.totalDeductions}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
            This Month
          </h3>
          <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
            <div>Taxable gross pay: £{data.taxableGrossPay}</div>
            <div>Employer National Insurance: £{data.employerNationalInsurance}</div>
            <div style={{ marginTop: '10px', fontWeight: 'bold' }}>Net pay: £{data.netPay}</div>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
            Year to Date
          </h3>
          <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
            <div>Taxable gross pay: £{data.taxableGrossPayYTD}</div>
            <div>Tax: £{data.taxYTD}</div>
            <div>Employee National Insurance: £{data.employeeNationalInsuranceYTD}</div>
            <div>Employer National Insurance: £{data.employerNationalInsuranceYTD}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '2px solid #333' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <strong>Payment</strong>
          </div>
        </div>
        <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
          <div>Net amount paid: £{data.netAmountPaid}</div>
          <div>Paid date: {data.paidDate}</div>
        </div>
      </div>

      <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #ccc', fontSize: '10px', color: '#666', textAlign: 'center' }}>
        <div>Employer PAYE Reference: {data.employerPAYEReference}</div>
        <div style={{ marginTop: '5px' }}>Created with Hush Healthcare Ltd Payroll System</div>
      </div>
    </div>
  );
}

// Myanmar Payroll Preview Component
function MyanmarPayrollPreview({ data }: { data: MyanmarPayrollData }) {
  return (
    <div className="payroll-preview" style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>Hush Healthcare Ltd</h1>
        <h2 style={{ fontSize: '18px', color: '#666' }}>Payroll Statement</h2>
      </div>

      <div style={{ marginBottom: '30px', paddingBottom: '15px', borderBottom: '2px solid #333' }}>
        <div style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
          <strong>Company:</strong> Hush Healthcare Ltd
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '12px', fontWeight: 'bold', width: '40%' }}>Employee ID:</td>
              <td style={{ padding: '12px' }}>{data.employeeId}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>Employee Name:</td>
              <td style={{ padding: '12px' }}>{data.employeeName}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>Email:</td>
              <td style={{ padding: '12px' }}>{data.email}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>Month Ending:</td>
              <td style={{ padding: '12px' }}>{data.monthEnding}</td>
            </tr>
            <tr style={{ borderBottom: '2px solid #333', backgroundColor: '#f5f5f5' }}>
              <td style={{ padding: '12px', fontWeight: 'bold', fontSize: '16px' }}>Payroll Amount:</td>
              <td style={{ padding: '12px', fontSize: '18px', fontWeight: 'bold' }}>{parseFloat(data.payrollAmount || '0').toLocaleString('en-US')} MMK</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #ccc', fontSize: '10px', color: '#666', textAlign: 'center' }}>
        <div>Created with Hush Healthcare Ltd Payroll System</div>
      </div>
    </div>
  );
}

