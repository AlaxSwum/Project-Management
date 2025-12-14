'use client';

// Force dynamic rendering to prevent stale cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { createClient } from '@supabase/supabase-js';
import { generateUKPayrollPDF, generateMyanmarPayrollPDF, getPDFBase64 } from '@/lib/pdf-generator';
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Reusable form styles to match theme (same pattern as company-outreach)
const formStyles = {
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.875rem',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontFamily: "'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: '#111827',
    boxSizing: 'border-box' as const,
    lineHeight: '1.5',
  },
  inputFocus: {
    borderColor: '#6366f1',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
    backgroundColor: '#ffffff',
  },
  inputHover: {
    borderColor: '#cbd5e1',
  },
  inputReadonly: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.875rem',
    backgroundColor: '#f9fafb',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontFamily: "'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: '#111827',
    boxSizing: 'border-box' as const,
    cursor: 'not-allowed',
    fontWeight: '600',
    lineHeight: '1.5',
  },
  select: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.875rem',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: "'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: '#111827',
    boxSizing: 'border-box' as const,
    lineHeight: '1.5',
  },
  selectFocus: {
    borderColor: '#6366f1',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
  selectHover: {
    borderColor: '#cbd5e1',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '600',
    fontSize: '0.8125rem',
    color: '#374151',
    fontFamily: "'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    lineHeight: '1.4',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
    padding: '1.25rem',
    marginBottom: '1.25rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '1rem',
    marginTop: '0',
    fontFamily: "'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    lineHeight: '1.4',
  },
  sectionDivider: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '1.5rem',
    marginTop: '1.5rem',
  },
  buttonPrimary: {
    padding: '0.625rem 1.25rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: 'white',
    transition: 'all 0.2s ease',
    fontFamily: "'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '0.875rem',
    lineHeight: '1.4',
  },
  buttonPrimaryHover: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  buttonSuccess: {
    padding: '0.625rem 1.25rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#10b981',
    color: 'white',
    transition: 'all 0.2s ease',
    fontFamily: "'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '0.875rem',
    lineHeight: '1.4',
  },
  buttonSuccessHover: {
    background: '#059669',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
  },
  buttonDisabled: {
    padding: '0.625rem 1.25rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'not-allowed',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#d1d5db',
    color: 'white',
    fontFamily: "'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '0.875rem',
    lineHeight: '1.4',
  },
  buttonSecondary: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    background: '#e5e7eb',
    color: '#374151',
    transition: 'all 0.2s ease',
    fontFamily: "'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '0.875rem',
    lineHeight: '1.4',
  },
  buttonSecondaryHover: {
    background: '#d1d5db',
  },
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%)',
    fontFamily: "'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  content: {
    padding: '2rem',
    minHeight: '100vh',
  },
  contentMobile: {
    padding: '12px',
    paddingTop: '70px',
    minHeight: '100vh',
  },
};

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
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payrollType, ukPayrollData.hours, ukPayrollData.rate, ukPayrollData.holidayPay, ukPayrollData.tax, ukPayrollData.nationalInsurance, ukPayrollData.holidayRepayment]);

  const generatePDF = async () => {
    try {
      setMessage('Generating PDF...');
      
      let pdf;
      let fileName;
      
      if (payrollType === 'uk') {
        pdf = generateUKPayrollPDF(ukPayrollData);
        fileName = `Payslip_UK_${ukPayrollData.employeeName.replace(/\s/g, '_')}_${ukPayrollData.monthEnding}.pdf`;
      } else {
        pdf = generateMyanmarPayrollPDF(myanmarPayrollData);
        fileName = `Payslip_Myanmar_${myanmarPayrollData.employeeName.replace(/\s/g, '_')}_${myanmarPayrollData.monthEnding}.pdf`;
      }
      
      pdf.save(fileName);
      setPdfGenerated(true);
      setMessage('✅ PDF generated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage('❌ Error generating PDF. Please try again.');
    }
  };

  const handleSendEmail = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      setMessage('⚠️ Please enter a valid email address');
      return;
    }

    try {
      setSendingEmail(true);
      setMessage('📧 Generating payslip and sending email...');

      // Generate PDF using the new professional generator
      let pdf;
      let netPay;
      let currency;
      
      if (payrollType === 'uk') {
        pdf = generateUKPayrollPDF(ukPayrollData);
        netPay = ukPayrollData.netPay;
        currency = '£';
      } else {
        pdf = generateMyanmarPayrollPDF(myanmarPayrollData);
        netPay = myanmarPayrollData.payrollAmount;
        currency = 'MMK ';
      }
      
      // Get base64 directly from PDF (much smaller than image-based)
      const pdfBase64 = getPDFBase64(pdf);

      // Send email with PDF attachment using Resend API
      const employeeName = payrollType === 'uk' ? ukPayrollData.employeeName : myanmarPayrollData.employeeName;
      const monthEnding = payrollType === 'uk' ? ukPayrollData.monthEnding : myanmarPayrollData.monthEnding;
      const employeeEmail = payrollType === 'uk' ? ukPayrollData.email : myanmarPayrollData.email;
      
      const response = await fetch('/api/send-payroll-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeName,
          employeeEmail: emailAddress || employeeEmail,
          monthEnding,
          payrollType,
          pdfBase64,
          netPay,
          currency,
        }),
      });

      // Handle non-JSON responses (like 413 error pages)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setMessage('✅ Email sent successfully!');
        setShowEmailModal(false);
        setEmailAddress('');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Error: ' + (result.error || 'Failed to send email'));
      }
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage('❌ Error sending email: ' + errorMessage);
    } finally {
      setSendingEmail(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        <MobileHeader title="Payroll Generation" isMobile={isMobile} />
        {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}
        <div style={{ 
          marginLeft: isMobile ? '0' : '256px',
          padding: isMobile ? '12px' : '2rem', 
          paddingTop: isMobile ? '70px' : '2rem',
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '1.125rem', color: '#666' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        <MobileHeader title="Payroll Generation" isMobile={isMobile} />
        {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}
        <div style={{ 
          marginLeft: isMobile ? '0' : '256px',
          padding: isMobile ? '12px' : '2rem', 
          paddingTop: isMobile ? '70px' : '2rem',
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '1.125rem', color: '#dc2626' }}>Access Denied. Admin or Payroll Member access required.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .payroll-page input[type="text"],
        .payroll-page input[type="email"],
        .payroll-page input[type="number"],
        .payroll-page input[type="date"],
        .payroll-page select {
          width: 100% !important;
          padding: 0.75rem 1rem !important;
          border: 2px solid #e5e7eb !important;
          border-radius: 8px !important;
          font-size: 0.875rem !important;
          background-color: #ffffff !important;
          color: #111827 !important;
          font-family: 'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          line-height: 1.5 !important;
          box-sizing: border-box !important;
        }
        .payroll-page .payroll-card {
          background: white !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06) !important;
          padding: 1.25rem !important;
          margin-bottom: 1.25rem !important;
        }
        .payroll-page label {
          display: block !important;
          margin-bottom: 0.5rem !important;
          font-weight: 600 !important;
          font-size: 0.8125rem !important;
          color: #374151 !important;
          font-family: 'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          line-height: 1.4 !important;
        }
        .payroll-page button {
          font-family: 'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
      `}} />
      <MobileHeader title="Payroll Generation" isMobile={isMobile} />
      
      <div className="payroll-page" style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        {!isMobile && <Sidebar projects={projects} onCreateProject={() => {}} />}
        
        <div style={{ 
          marginLeft: isMobile ? '0' : '256px',
          padding: isMobile ? '12px' : '2rem', 
          paddingTop: isMobile ? '70px' : '2rem',
          background: '#F5F5ED', 
          flex: 1,
          minHeight: '100vh',
          overflow: 'hidden'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div className="payroll-card" style={formStyles.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 0.5rem 0', lineHeight: '1.3' }}>
                    <DocumentTextIcon style={{ width: '28px', height: '28px', color: '#6366f1' }} />
                    Payroll Generation
                  </h1>
                  <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0', fontSize: '0.875rem', lineHeight: '1.4' }}>Generate and send payroll statements</p>
                </div>
                <BuildingOfficeIcon style={{ width: '40px', height: '40px', color: '#6366f1' }} />
              </div>
            </div>

          {/* Payroll Type Selection */}
          <div className="payroll-card" style={formStyles.card}>
            <h2 style={formStyles.sectionTitle}>Select Payroll Type</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
              gap: '1rem' 
            }}>
              <button
                onClick={() => setPayrollType('uk')}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: `2px solid ${payrollType === 'uk' ? '#6366f1' : '#e5e7eb'}`,
                  background: payrollType === 'uk' ? '#eef2ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (payrollType !== 'uk') {
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (payrollType !== 'uk') {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <GlobeAltIcon style={{ width: '20px', height: '20px', color: payrollType === 'uk' ? '#6366f1' : '#9ca3af' }} />
                  <div>
                    <div style={{ fontWeight: '600', color: payrollType === 'uk' ? '#6366f1' : '#374151', fontSize: '0.875rem', lineHeight: '1.4' }}>
                      UK Payroll
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', lineHeight: '1.4' }}>Full UK payroll with tax and NI</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setPayrollType('myanmar')}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: `2px solid ${payrollType === 'myanmar' ? '#6366f1' : '#e5e7eb'}`,
                  background: payrollType === 'myanmar' ? '#eef2ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (payrollType !== 'myanmar') {
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (payrollType !== 'myanmar') {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <GlobeAltIcon style={{ width: '20px', height: '20px', color: payrollType === 'myanmar' ? '#6366f1' : '#9ca3af' }} />
                  <div>
                    <div style={{ fontWeight: '600', color: payrollType === 'myanmar' ? '#6366f1' : '#374151', fontSize: '0.875rem', lineHeight: '1.4' }}>
                      Myanmar Payroll
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', lineHeight: '1.4' }}>Simplified payroll format</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Form Section */}
          <div className="payroll-card" style={formStyles.card}>
            <h2 style={formStyles.sectionTitle}>Employee Information</h2>
            
            {payrollType === 'uk' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Basic Info */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
                  gap: '1rem' 
                }}>
                  <div>
                    <label style={formStyles.label}>Employee Name *</label>
                    <input
                      type="text"
                      className="payroll-input"
                      style={formStyles.input}
                      value={ukPayrollData.employeeName}
                      onChange={(e) => setUkPayrollData({ ...ukPayrollData, employeeName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label style={formStyles.label}>Employee ID *</label>
                    <input
                      type="text"
                      className="payroll-input"
                      style={formStyles.input}
                      value={ukPayrollData.employeeId}
                      onChange={(e) => setUkPayrollData({ ...ukPayrollData, employeeId: e.target.value })}
                      placeholder="EMP001"
                    />
                  </div>
                  <div>
                    <label style={formStyles.label}>Email *</label>
                    <input
                      type="email"
                      className="payroll-input"
                      style={formStyles.input}
                      value={ukPayrollData.email}
                      onChange={(e) => setUkPayrollData({ ...ukPayrollData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', 
                  gap: '1rem' 
                }}>
                  <div>
                    <label style={formStyles.label}>Month Ending *</label>
                    <input
                      type="date"
                      style={formStyles.input}
                      value={ukPayrollData.monthEnding}
                      onChange={(e) => setUkPayrollData({ ...ukPayrollData, monthEnding: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={formStyles.label}>Tax Code</label>
                    <input
                      type="text"
                      style={formStyles.input}
                      value={ukPayrollData.taxCode}
                      onChange={(e) => setUkPayrollData({ ...ukPayrollData, taxCode: e.target.value })}
                      placeholder="1257L"
                    />
                  </div>
                  <div>
                    <label style={formStyles.label}>NI Number</label>
                    <input
                      type="text"
                      style={formStyles.input}
                      value={ukPayrollData.nationalInsuranceNumber}
                      onChange={(e) => setUkPayrollData({ ...ukPayrollData, nationalInsuranceNumber: e.target.value })}
                      placeholder="AB123456C"
                    />
                  </div>
                  <div>
                    <label style={formStyles.label}>NI Table</label>
                    <select
                      className="payroll-select"
                      style={formStyles.select}
                      value={ukPayrollData.nationalInsuranceTable}
                      onChange={(e) => setUkPayrollData({ ...ukPayrollData, nationalInsuranceTable: e.target.value })}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                </div>

                {/* Payments Section */}
                <div style={{ 
                  borderTop: '1px solid #e5e7eb', 
                  paddingTop: '1.5rem', 
                  marginTop: '1.5rem' 
                }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem', margin: '0 0 0.75rem 0', lineHeight: '1.4' }}>Payments</h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', 
                    gap: '1rem' 
                  }}>
                    <div>
                      <label style={formStyles.label}>Hours</label>
                      <input
                        type="number"
                        step="0.01"
                        style={formStyles.input}
                        value={ukPayrollData.hours}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, hours: e.target.value })}
                        placeholder="167.25"
                      />
                    </div>
                    <div>
                      <label style={formStyles.label}>Rate (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        style={formStyles.input}
                        value={ukPayrollData.rate}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, rate: e.target.value })}
                        placeholder="12.25"
                      />
                    </div>
                    <div>
                      <label style={formStyles.label}>Holiday Pay (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        style={formStyles.input}
                        value={ukPayrollData.holidayPay}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, holidayPay: e.target.value })}
                        placeholder="196.00"
                      />
                    </div>
                    <div>
                      <label style={formStyles.label}>Gross Pay (£)</label>
                      <input
                        type="text"
                        style={formStyles.inputReadonly}
                        value={ukPayrollData.grossPay}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Deductions Section */}
                <div style={{ 
                  borderTop: '1px solid #e5e7eb', 
                  paddingTop: '1.5rem', 
                  marginTop: '1.5rem' 
                }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem', margin: '0 0 0.75rem 0', lineHeight: '1.4' }}>Deductions</h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', 
                    gap: '1rem' 
                  }}>
                    <div>
                      <label style={formStyles.label}>Tax (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        style={formStyles.input}
                        value={ukPayrollData.tax}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, tax: e.target.value })}
                        placeholder="44.80"
                      />
                    </div>
                    <div>
                      <label style={formStyles.label}>National Insurance (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        style={formStyles.input}
                        value={ukPayrollData.nationalInsurance}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, nationalInsurance: e.target.value })}
                        placeholder="17.97"
                      />
                    </div>
                    <div>
                      <label style={formStyles.label}>Holiday Repayment (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        style={formStyles.input}
                        value={ukPayrollData.holidayRepayment}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, holidayRepayment: e.target.value })}
                        placeholder="972.16"
                      />
                    </div>
                    <div>
                      <label style={formStyles.label}>Total Deductions (£)</label>
                      <input
                        type="text"
                        style={formStyles.inputReadonly}
                        value={ukPayrollData.totalDeductions}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Year to Date Section */}
                <div style={{ 
                  borderTop: '1px solid #e5e7eb', 
                  paddingTop: '1.5rem', 
                  marginTop: '1.5rem' 
                }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem', margin: '0 0 0.75rem 0', lineHeight: '1.4' }}>Year to Date</h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', 
                    gap: '1rem' 
                  }}>
                    <div>
                      <label style={formStyles.label}>Taxable Gross Pay YTD (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        style={formStyles.input}
                        value={ukPayrollData.taxableGrossPayYTD}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, taxableGrossPayYTD: e.target.value })}
                        placeholder="5219.61"
                      />
                    </div>
                    <div>
                      <label style={formStyles.label}>Tax YTD (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        style={formStyles.input}
                        value={ukPayrollData.taxYTD}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, taxYTD: e.target.value })}
                        placeholder="414.80"
                      />
                    </div>
                    <div>
                      <label style={formStyles.label}>Employee NI YTD (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        style={formStyles.input}
                        value={ukPayrollData.employeeNationalInsuranceYTD}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, employeeNationalInsuranceYTD: e.target.value })}
                        placeholder="166.04"
                      />
                    </div>
                    <div>
                      <label style={formStyles.label}>Employer NI YTD (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        style={formStyles.input}
                        value={ukPayrollData.employerNationalInsuranceYTD}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, employerNationalInsuranceYTD: e.target.value })}
                        placeholder="595.29"
                      />
                    </div>
                  </div>
                </div>

                {/* This Month Section */}
                <div style={{ 
                  borderTop: '1px solid #e5e7eb', 
                  paddingTop: '1.5rem', 
                  marginTop: '1.5rem' 
                }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem', margin: '0 0 0.75rem 0', lineHeight: '1.4' }}>This Month</h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
                    gap: '1rem' 
                  }}>
                    <div>
                      <label style={formStyles.label}>Taxable Gross Pay (£)</label>
                      <input
                        type="text"
                        style={formStyles.inputReadonly}
                        value={ukPayrollData.taxableGrossPay}
                        readOnly
                      />
                    </div>
                    <div>
                      <label style={formStyles.label}>Employer National Insurance (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        style={formStyles.input}
                        value={ukPayrollData.employerNationalInsurance}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, employerNationalInsurance: e.target.value })}
                        placeholder="128.35"
                      />
                    </div>
                    <div>
                      <label style={formStyles.label}>Net Pay (£)</label>
                      <input
                        type="text"
                        style={formStyles.inputReadonly}
                        value={ukPayrollData.netPay}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div style={{ 
                  borderTop: '1px solid #e5e7eb', 
                  paddingTop: '1.5rem', 
                  marginTop: '1.5rem' 
                }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem', margin: '0 0 0.75rem 0', lineHeight: '1.4' }}>Payment Details</h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
                    gap: '1rem' 
                  }}>
                    <div>
                      <label style={formStyles.label}>Net Amount Paid (£)</label>
                      <input
                        type="text"
                        style={formStyles.inputReadonly}
                        value={ukPayrollData.netAmountPaid}
                        readOnly
                      />
                    </div>
                    <div>
                      <label style={formStyles.label}>Paid Date</label>
                      <input
                        type="date"
                        style={formStyles.input}
                        value={ukPayrollData.paidDate}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, paidDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={formStyles.label}>Employer PAYE Reference</label>
                      <input
                        type="text"
                        style={formStyles.input}
                        value={ukPayrollData.employerPAYEReference}
                        onChange={(e) => setUkPayrollData({ ...ukPayrollData, employerPAYEReference: e.target.value })}
                        placeholder="120/WE94437"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
                  gap: '1rem' 
                }}>
                  <div>
                    <label style={formStyles.label}>Employee ID *</label>
                    <input
                      type="text"
                      style={formStyles.input}
                      value={myanmarPayrollData.employeeId}
                      onChange={(e) => setMyanmarPayrollData({ ...myanmarPayrollData, employeeId: e.target.value })}
                      placeholder="EMP001"
                    />
                  </div>
                  <div>
                    <label style={formStyles.label}>Employee Name *</label>
                    <input
                      type="text"
                      style={formStyles.input}
                      value={myanmarPayrollData.employeeName}
                      onChange={(e) => setMyanmarPayrollData({ ...myanmarPayrollData, employeeName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
                  gap: '1rem' 
                }}>
                  <div>
                    <label style={formStyles.label}>Email *</label>
                    <input
                      type="email"
                      style={formStyles.input}
                      value={myanmarPayrollData.email}
                      onChange={(e) => setMyanmarPayrollData({ ...myanmarPayrollData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label style={formStyles.label}>Payroll Amount (MMK) *</label>
                    <input
                      type="number"
                      step="0.01"
                      style={formStyles.input}
                      value={myanmarPayrollData.payrollAmount}
                      onChange={(e) => setMyanmarPayrollData({ ...myanmarPayrollData, payrollAmount: e.target.value })}
                      placeholder="1000000"
                    />
                  </div>
                </div>
                <div>
                  <label style={formStyles.label}>Month Ending *</label>
                  <input
                    type="date"
                    style={formStyles.input}
                    value={myanmarPayrollData.monthEnding}
                    onChange={(e) => setMyanmarPayrollData({ ...myanmarPayrollData, monthEnding: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview Section */}
          {(payrollType === 'uk' && ukPayrollData.employeeName && ukPayrollData.monthEnding) ||
           (payrollType === 'myanmar' && myanmarPayrollData.employeeName && myanmarPayrollData.monthEnding) ? (
            <div className="payroll-card" style={formStyles.card}>
              <h2 style={formStyles.sectionTitle}>Preview</h2>
              <div id="payroll-preview" style={{ background: 'white', padding: '2rem', border: '2px solid #e5e7eb', borderRadius: '8px' }}>
                {payrollType === 'uk' ? (
                  <UKPayrollPreview data={ukPayrollData} />
                ) : (
                  <MyanmarPayrollPreview data={myanmarPayrollData} />
                )}
              </div>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="payroll-card" style={formStyles.card}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
              <button
                onClick={generatePDF}
                disabled={!pdfGenerated && ((payrollType === 'uk' && (!ukPayrollData.employeeName || !ukPayrollData.monthEnding)) ||
                  (payrollType === 'myanmar' && (!myanmarPayrollData.employeeName || !myanmarPayrollData.monthEnding)))}
                style={(!pdfGenerated && ((payrollType === 'uk' && (!ukPayrollData.employeeName || !ukPayrollData.monthEnding)) ||
                  (payrollType === 'myanmar' && (!myanmarPayrollData.employeeName || !myanmarPayrollData.monthEnding)))) 
                  ? formStyles.buttonDisabled 
                  : formStyles.buttonPrimary}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    Object.assign(e.currentTarget.style, formStyles.buttonPrimaryHover);
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                  }
                }}
              >
                <ArrowDownTrayIcon style={{ width: '18px', height: '18px' }} />
                Generate PDF
              </button>
              
              {pdfGenerated && (
                <button
                  onClick={() => setShowEmailModal(true)}
                  style={formStyles.buttonSuccess}
                  onMouseEnter={(e) => {
                    Object.assign(e.currentTarget.style, formStyles.buttonSuccessHover);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#10b981';
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <PaperAirplaneIcon style={{ width: '18px', height: '18px' }} />
                  Send Email
                </button>
              )}
            </div>
            
            {message && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                borderRadius: '8px',
                backgroundColor: message.includes('Error') ? '#fef2f2' : '#f0fdf4',
                color: message.includes('Error') ? '#991b1b' : '#166534'
              }}>
                {message}
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            maxWidth: '28rem',
            width: '100%',
            margin: '0 1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>Send Payroll Email</h3>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailAddress('');
                }}
                style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#4b5563'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                <XMarkIcon style={{ width: '24px', height: '24px' }} />
              </button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={formStyles.label}>Email Address</label>
              <input
                type="email"
                style={formStyles.input}
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="employee@example.com"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailAddress}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  background: (sendingEmail || !emailAddress) ? '#d1d5db' : '#6366f1',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: (sendingEmail || !emailAddress) ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!sendingEmail && emailAddress) {
                    e.currentTarget.style.background = '#4f46e5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!sendingEmail && emailAddress) {
                    e.currentTarget.style.background = '#6366f1';
                  }
                }}
              >
                {sendingEmail ? 'Sending...' : 'Send'}
              </button>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailAddress('');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#e5e7eb',
                  color: '#374151',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#d1d5db'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#e5e7eb'}
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

// UK Payroll Preview Component - Professional Design
function UKPayrollPreview({ data }: { data: UKPayrollData }) {
  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", color: '#1f2937', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', color: 'white', padding: '24px', borderRadius: '12px 12px 0 0', marginBottom: '0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Hush Healthcare Ltd</h1>
            <p style={{ fontSize: '13px', margin: '0', opacity: '0.85' }}>UK Payroll Statement</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', opacity: '0.75', marginBottom: '2px' }}>Pay Period Ending</div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>{data.monthEnding || '-'}</div>
          </div>
        </div>
      </div>

      {/* Employee Info Bar */}
      <div style={{ background: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Employee Name</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e3a5f' }}>{data.employeeName || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Employee ID</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e3a5f' }}>{data.employeeId || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Tax Code</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e3a5f' }}>{data.taxCode || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>NI Number</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e3a5f' }}>{data.nationalInsuranceNumber || '-'}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '24px', background: 'white' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Payments */}
          <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '16px', border: '1px solid #bbf7d0' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#15803d', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.5px' }}>
              💰 Payments
            </h3>
            <div style={{ fontSize: '12px', lineHeight: '1.8', color: '#166534' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{data.hours || '0'} hrs @ £{data.rate || '0'}/hr</span>
                <span style={{ fontWeight: '600' }}>£{formatCurrency(data.grossPay)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Holiday Pay</span>
                <span style={{ fontWeight: '600' }}>£{formatCurrency(data.holidayPay)}</span>
              </div>
              <div style={{ borderTop: '1px solid #86efac', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                <span>Total Payments</span>
                <span>£{formatCurrency(data.totalPayments)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '16px', border: '1px solid #fecaca' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#b91c1c', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.5px' }}>
              📉 Deductions
            </h3>
            <div style={{ fontSize: '12px', lineHeight: '1.8', color: '#991b1b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>PAYE Tax</span>
                <span style={{ fontWeight: '600' }}>£{formatCurrency(data.tax)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>National Insurance</span>
                <span style={{ fontWeight: '600' }}>£{formatCurrency(data.nationalInsurance)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Holiday Repayment</span>
                <span style={{ fontWeight: '600' }}>£{formatCurrency(data.holidayRepayment)}</span>
              </div>
              <div style={{ borderTop: '1px solid #fca5a5', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                <span>Total Deductions</span>
                <span>£{formatCurrency(data.totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Pay Box */}
        <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '12px', padding: '20px', marginBottom: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Net Pay This Period</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: 'white' }}>£{formatCurrency(data.netPay)}</div>
        </div>

        {/* Year to Date */}
        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a5f', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.5px' }}>
            📊 Year to Date Summary
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '11px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#6b7280', marginBottom: '2px' }}>Taxable Gross</div>
              <div style={{ fontWeight: '600', color: '#1e3a5f' }}>£{formatCurrency(data.taxableGrossPayYTD)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#6b7280', marginBottom: '2px' }}>Tax Paid</div>
              <div style={{ fontWeight: '600', color: '#1e3a5f' }}>£{formatCurrency(data.taxYTD)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#6b7280', marginBottom: '2px' }}>Employee NI</div>
              <div style={{ fontWeight: '600', color: '#1e3a5f' }}>£{formatCurrency(data.employeeNationalInsuranceYTD)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#6b7280', marginBottom: '2px' }}>Employer NI</div>
              <div style={{ fontWeight: '600', color: '#1e3a5f' }}>£{formatCurrency(data.employerNationalInsuranceYTD)}</div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '11px' }}>
          <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ color: '#64748b', marginBottom: '2px' }}>Payment Date</div>
            <div style={{ fontWeight: '600', color: '#1e293b' }}>{data.paidDate || '-'}</div>
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ color: '#64748b', marginBottom: '2px' }}>PAYE Reference</div>
            <div style={{ fontWeight: '600', color: '#1e293b' }}>{data.employerPAYEReference || '-'}</div>
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ color: '#64748b', marginBottom: '2px' }}>Leave Remaining</div>
            <div style={{ fontWeight: '600', color: '#1e293b' }}>{data.annualLeaveRemaining || '0'} days</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#1f2937', color: '#9ca3af', padding: '12px 24px', borderRadius: '0 0 12px 12px', fontSize: '9px', textAlign: 'center' }}>
        <div>This is a computer-generated document. No signature required. • Hush Healthcare Ltd • Confidential</div>
      </div>
    </div>
  );
}

// Myanmar Payroll Preview Component - Professional Design
function MyanmarPayrollPreview({ data }: { data: MyanmarPayrollData }) {
  const formatAmount = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0' : num.toLocaleString('en-US');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", color: '#1f2937', maxWidth: '650px', margin: '0 auto', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)', color: 'white', padding: '32px 28px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', padding: '8px 20px', borderRadius: '50px', marginBottom: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase' }}>PAYROLL STATEMENT</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
          HUSH HEALTHCARE LTD
        </h1>
        <p style={{ fontSize: '14px', margin: '0', opacity: '0.9', fontWeight: '500' }}>Myanmar Division</p>
      </div>

      {/* Period Banner */}
      <div style={{ background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)', color: 'white', padding: '14px 28px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span style={{ fontSize: '15px', fontWeight: '600' }}>Pay Period: {formatDate(data.monthEnding)}</span>
      </div>

      {/* Main Content */}
      <div style={{ padding: '28px', background: '#ffffff' }}>
        {/* Employee Card */}
        <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: '14px', padding: '24px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee Details</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600', letterSpacing: '0.5px' }}>Employee ID</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{data.employeeId || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600', letterSpacing: '0.5px' }}>Full Name</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{data.employeeName || '-'}</div>
            </div>
          </div>
          
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600', letterSpacing: '0.5px' }}>Email Address</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>{data.email || '-'}</div>
          </div>
        </div>

        {/* Amount Box */}
        <div style={{ background: 'linear-gradient(145deg, #059669 0%, #10b981 50%, #34d399 100%)', borderRadius: '16px', padding: '36px 28px', textAlign: 'center', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '50px', marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'white', textTransform: 'uppercase', letterSpacing: '1.5px' }}>NET PAYROLL AMOUNT</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: '48px', fontWeight: '800', color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.15)', letterSpacing: '-1px' }}>
              {formatAmount(data.payrollAmount)}
            </span>
            <span style={{ fontSize: '22px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>MMK</span>
          </div>
          <div style={{ marginTop: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
            Myanmar Kyat
          </div>
        </div>

        {/* Payment Info */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '32px', padding: '16px', background: '#f8fafc', borderRadius: '10px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Status</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#059669', marginTop: '4px' }}>✓ Processed</div>
          </div>
          <div style={{ width: '1px', background: '#e2e8f0' }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Payment Type</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>Bank Transfer</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)', color: '#94a3b8', padding: '16px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', marginBottom: '4px', fontWeight: '500' }}>
          This is a computer-generated document. No signature required.
        </div>
        <div style={{ fontSize: '10px', color: '#64748b' }}>
          © {new Date().getFullYear()} Hush Healthcare Ltd • Confidential
        </div>
      </div>
    </div>
  );
}

