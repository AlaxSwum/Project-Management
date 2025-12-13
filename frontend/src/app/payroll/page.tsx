'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
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
    fontSize: '0.95rem',
    backgroundColor: '#fafafa',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontFamily: "'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: '#111827',
    boxSizing: 'border-box' as const,
  },
  inputReadonly: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.95rem',
    backgroundColor: '#f9fafb',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontFamily: "'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: '#111827',
    boxSizing: 'border-box' as const,
    cursor: 'not-allowed',
    fontWeight: '600',
  },
  select: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.95rem',
    backgroundColor: '#fafafa',
    transition: 'all 0.2s ease',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: "'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: '#111827',
    boxSizing: 'border-box' as const,
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '600',
    fontSize: '0.875rem',
    color: '#374151',
    fontFamily: "'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '1rem',
    marginTop: '0',
    fontFamily: "'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  sectionDivider: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '1.5rem',
    marginTop: '1.5rem',
  },
  buttonPrimary: {
    padding: '0.75rem 1.5rem',
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
    fontSize: '0.95rem',
  },
  buttonSuccess: {
    padding: '0.75rem 1.5rem',
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
    fontSize: '0.95rem',
  },
  buttonDisabled: {
    padding: '0.75rem 1.5rem',
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
    fontSize: '0.95rem',
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
    fontSize: '0.95rem',
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
          pdfBase64: pdfBase64,
        }),
      });

      const result = await response.json();

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '1.125rem' }}>Loading...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '1.125rem', color: '#dc2626' }}>Access Denied. Admin or Payroll Member access required.</div>
      </div>
    );
  }

  return (
    <div style={formStyles.container}>
      {isMobile ? <MobileHeader title="Payroll Generation" isMobile={isMobile} /> : <Sidebar projects={projects} onCreateProject={() => {}} />}
      
      <div style={{ 
        marginLeft: isMobile ? '0' : '280px',
        ...(isMobile ? formStyles.contentMobile : formStyles.content)
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={formStyles.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 0.5rem 0' }}>
                  <DocumentTextIcon style={{ width: '32px', height: '32px', color: '#6366f1' }} />
                  Payroll Generation
                </h1>
                <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>Generate and send payroll statements</p>
              </div>
              <BuildingOfficeIcon style={{ width: '48px', height: '48px', color: '#6366f1' }} />
            </div>
          </div>

          {/* Payroll Type Selection */}
          <div style={formStyles.card}>
            <h2 style={formStyles.sectionTitle}>Select Payroll Type</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
              gap: '1rem' 
            }}>
              <button
                onClick={() => setPayrollType('uk')}
                style={{
                  padding: '1.5rem',
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
                  <GlobeAltIcon style={{ width: '24px', height: '24px', color: payrollType === 'uk' ? '#6366f1' : '#9ca3af' }} />
                  <div>
                    <div style={{ fontWeight: '600', color: payrollType === 'uk' ? '#6366f1' : '#374151' }}>
                      UK Payroll
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Full UK payroll with tax and NI</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setPayrollType('myanmar')}
                style={{
                  padding: '1.5rem',
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
                  <GlobeAltIcon style={{ width: '24px', height: '24px', color: payrollType === 'myanmar' ? '#6366f1' : '#9ca3af' }} />
                  <div>
                    <div style={{ fontWeight: '600', color: payrollType === 'myanmar' ? '#6366f1' : '#374151' }}>
                      Myanmar Payroll
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Simplified payroll format</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Form Section */}
          <div style={formStyles.card}>
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
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem', margin: '0 0 1rem 0' }}>Payments</h3>
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
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem', margin: '0 0 1rem 0' }}>Deductions</h3>
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
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem', margin: '0 0 1rem 0' }}>Year to Date</h3>
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
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem', margin: '0 0 1rem 0' }}>This Month</h3>
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
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem', margin: '0 0 1rem 0' }}>Payment Details</h3>
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
            <div style={formStyles.card}>
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
          <div style={formStyles.card}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
              <button
                onClick={generatePDF}
                disabled={!pdfGenerated && ((payrollType === 'uk' && (!ukPayrollData.employeeName || !ukPayrollData.monthEnding)) ||
                  (payrollType === 'myanmar' && (!myanmarPayrollData.employeeName || !myanmarPayrollData.monthEnding)))}
                style={(!pdfGenerated && ((payrollType === 'uk' && (!ukPayrollData.employeeName || !ukPayrollData.monthEnding)) ||
                  (payrollType === 'myanmar' && (!myanmarPayrollData.employeeName || !myanmarPayrollData.monthEnding)))) 
                  ? formStyles.buttonDisabled 
                  : formStyles.buttonPrimary}
              >
                <ArrowDownTrayIcon style={{ width: '20px', height: '20px' }} />
                Generate PDF
              </button>
              
              {pdfGenerated && (
                <button
                  onClick={() => setShowEmailModal(true)}
                  style={formStyles.buttonSuccess}
                >
                  <PaperAirplaneIcon style={{ width: '20px', height: '20px' }} />
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

// UK Payroll Preview Component
function UKPayrollPreview({ data }: { data: UKPayrollData }) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
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
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
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

