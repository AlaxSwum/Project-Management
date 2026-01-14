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
  UsersIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  PaperAirplaneIcon,
  TrashIcon,
  PlusIcon,
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
  
  // Members management
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
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
  
  // Manual gross pay toggle
  const [useManualGrossPay, setUseManualGrossPay] = useState(false);
  const [manualGrossPay, setManualGrossPay] = useState('');
  
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

  // Fetch payroll members
  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('payroll_members')
        .select(`
          id,
          user_id,
          role,
          can_view,
          can_create,
          can_edit,
          can_delete,
          can_generate_pdf,
          added_at,
          auth_user:user_id (id, name, email)
        `)
        .order('added_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Fetch all users for adding members
  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('auth_user')
        .select('id, name, email')
        .order('name');

      if (error) throw error;
      setAllUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Add member
  const addMember = async () => {
    if (!selectedUserId) {
      setMessage('Please select a user');
      return;
    }

    try {
      const { error } = await supabase
        .from('payroll_members')
        .insert({
          user_id: parseInt(selectedUserId),
          role: selectedRole,
          can_view: true,
          can_create: selectedRole === 'admin' || selectedRole === 'editor',
          can_edit: selectedRole === 'admin' || selectedRole === 'editor',
          can_delete: selectedRole === 'admin',
          can_generate_pdf: true,
          added_by: user?.id || null,
        });

      if (error) throw error;
      
      setMessage('Member added successfully!');
      setSelectedUserId('');
      setSelectedRole('viewer');
      fetchMembers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error('Error adding member:', err);
      setMessage('Error: ' + (err.message || 'Failed to add member'));
    }
  };

  // Remove member
  const removeMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const { error } = await supabase
        .from('payroll_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      
      setMessage('Member removed successfully!');
      fetchMembers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error('Error removing member:', err);
      setMessage('Error: ' + (err.message || 'Failed to remove member'));
    }
  };

  // Check if current user is admin
  useEffect(() => {
    if (hasAccess && user?.id) {
      const checkAdminStatus = async () => {
        try {
          const { data } = await supabase
            .from('payroll_members')
            .select('role')
            .eq('user_id', user.id)
            .single();
          
          setIsAdmin(data?.role === 'admin' || user.role === 'admin');
        } catch {
          // Check if user is a system admin
          setIsAdmin(user.role === 'admin' || (user as any)?.is_superuser);
        }
      };
      checkAdminStatus();
    }
  }, [hasAccess, user]);

  const calculateUKTotals = () => {
    let grossPay: number;
    
    if (useManualGrossPay) {
      // Use manually entered gross pay
      grossPay = parseFloat(manualGrossPay) || 0;
    } else {
      // Calculate from hours x rate
      const hours = parseFloat(ukPayrollData.hours) || 0;
      const rate = parseFloat(ukPayrollData.rate) || 0;
      grossPay = hours * rate;
    }
    
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
  }, [payrollType, ukPayrollData.hours, ukPayrollData.rate, ukPayrollData.holidayPay, ukPayrollData.tax, ukPayrollData.nationalInsurance, ukPayrollData.holidayRepayment, useManualGrossPay, manualGrossPay]);

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowMembersModal(true);
                        fetchMembers();
                        fetchAllUsers();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        background: '#333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                      }}
                    >
                      <UsersIcon style={{ width: '18px', height: '18px' }} />
                      Members
                    </button>
                  )}
                  <BuildingOfficeIcon style={{ width: '40px', height: '40px', color: '#6366f1' }} />
                </div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#111827', margin: '0', lineHeight: '1.4' }}>Payments</h3>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      fontSize: '0.8125rem',
                      color: '#374151',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}>
                      <input
                        type="checkbox"
                        checked={useManualGrossPay}
                        onChange={(e) => setUseManualGrossPay(e.target.checked)}
                        style={{ 
                          width: '16px', 
                          height: '16px',
                          accentColor: '#6366f1',
                          cursor: 'pointer'
                        }}
                      />
                      Manual Gross Pay (for hourly workers)
                    </label>
                  </div>
                  
                  {!useManualGrossPay ? (
                    // Calculated mode: Hours x Rate
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
                        <label style={formStyles.label}>Gross Pay (£) <span style={{ color: '#6b7280', fontWeight: '400' }}>(auto)</span></label>
                        <input
                          type="text"
                          style={formStyles.inputReadonly}
                          value={ukPayrollData.grossPay}
                          readOnly
                        />
                      </div>
                    </div>
                  ) : (
                    // Manual mode: Enter gross pay directly
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
                      gap: '1rem' 
                    }}>
                      <div>
                        <label style={formStyles.label}>Gross Pay (£) *</label>
                        <input
                          type="number"
                          step="0.01"
                          style={{
                            ...formStyles.input,
                            borderColor: '#6366f1',
                            backgroundColor: '#f5f3ff'
                          }}
                          value={manualGrossPay}
                          onChange={(e) => setManualGrossPay(e.target.value)}
                          placeholder="Enter total gross pay"
                        />
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                          Enter total gross pay amount directly
                        </div>
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
                        <label style={formStyles.label}>Total Payments (£)</label>
                        <input
                          type="text"
                          style={formStyles.inputReadonly}
                          value={ukPayrollData.totalPayments}
                          readOnly
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Info box when manual mode is on */}
                  {useManualGrossPay && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      color: '#0369a1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <CurrencyDollarIcon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                      Manual mode: Enter the total gross pay directly for hourly/variable pay employees.
                    </div>
                  )}
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

      {/* Members Modal */}
      {showMembersModal && (
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
            maxWidth: '500px',
            width: '100%',
            margin: '0 1rem',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UsersIcon style={{ width: '24px', height: '24px' }} />
                Manage Members
              </h3>
              <button
                onClick={() => setShowMembersModal(false)}
                style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
              >
                <XMarkIcon style={{ width: '24px', height: '24px' }} />
              </button>
            </div>

            {/* Add Member Form */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>Add New Member</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  style={{
                    flex: '2',
                    minWidth: '150px',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="">Select User...</option>
                  {allUsers
                    .filter(u => !members.find(m => m.user_id === u.id))
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))
                  }
                </select>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  style={{
                    flex: '1',
                    minWidth: '100px',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={addMember}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.875rem',
                  }}
                >
                  <PlusIcon style={{ width: '16px', height: '16px' }} />
                  Add
                </button>
              </div>
            </div>

            {/* Members List */}
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                Current Members ({members.length})
              </h4>
              {loadingMembers ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#6b7280' }}>Loading...</div>
              ) : members.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#6b7280' }}>No members yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {members.map((member) => (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#111827' }}>
                          {member.auth_user?.name || 'Unknown User'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {member.auth_user?.email || '-'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          padding: '2px 8px',
                          background: member.role === 'admin' ? '#333' : member.role === 'editor' ? '#6b7280' : '#d1d5db',
                          color: member.role === 'viewer' ? '#374151' : 'white',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                        }}>
                          {member.role}
                        </span>
                        <button
                          onClick={() => removeMember(member.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                            padding: '4px',
                          }}
                        >
                          <TrashIcon style={{ width: '18px', height: '18px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button */}
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button
                onClick={() => setShowMembersModal(false)}
                style={{
                  padding: '0.5rem 1.5rem',
                  background: '#e5e7eb',
                  color: '#374151',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// UK Payroll Preview Component - Professional Template Design
function UKPayrollPreview({ data }: { data: UKPayrollData }) {
  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB');
    } catch {
      return dateStr;
    }
  };

  const teal = '#4DA6A9';
  const lightTeal = '#DCF2F3';

  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", color: '#333', maxWidth: '700px', margin: '0 auto', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0', color: '#333', letterSpacing: '-0.5px' }}>PAYSLIP</h1>
          </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: teal }}>Hush Healthcare</div>
          <div style={{ fontSize: '11px', color: '#666' }}>Ltd</div>
          </div>
        </div>

      {/* Company Info Bar */}
      <div style={{ background: teal, color: 'white', padding: '8px 24px', fontSize: '11px', fontWeight: '600' }}>
        Hush Healthcare Ltd
        </div>
      <div style={{ padding: '8px 24px', fontSize: '10px', color: '#666', borderBottom: '1px solid #ddd' }}>
        <div>Healthcare Services</div>
        <div>PAYE Ref: {data.employerPAYEReference || '120/WE94437'}</div>
      </div>

      {/* Employee & Payment Details */}
      <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Employee Details */}
        <div>
          <div style={{ background: teal, color: 'white', padding: '6px 12px', fontSize: '10px', fontWeight: '600' }}>
            Employee Details
          </div>
          <div style={{ background: lightTeal, padding: '12px' }}>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '9px', fontWeight: '600', color: '#555' }}>Employee Name</div>
              <div style={{ fontSize: '12px' }}>{data.employeeName || '-'}</div>
        </div>
        <div>
              <div style={{ fontSize: '9px', fontWeight: '600', color: '#555' }}>Employee ID</div>
              <div style={{ fontSize: '12px' }}>{data.employeeId || '-'}</div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div>
          <div style={{ background: teal, color: 'white', padding: '6px 12px', fontSize: '10px', fontWeight: '600' }}>
            Payment Details
          </div>
          <div style={{ background: lightTeal, padding: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px' }}>
              <div><span style={{ fontWeight: '600' }}>Tax Code:</span> {data.taxCode || '-'}</div>
              <div><span style={{ fontWeight: '600' }}>NI Number:</span> {data.nationalInsuranceNumber || '-'}</div>
              <div><span style={{ fontWeight: '600' }}>NI Table:</span> {data.nationalInsuranceTable || 'A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Period Row */}
      <div style={{ padding: '8px 24px', borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
        <div><span style={{ fontWeight: '600' }}>Period End:</span> {formatDate(data.monthEnding)}</div>
        <div><span style={{ fontWeight: '600' }}>Payment Date:</span> {formatDate(data.paidDate)}</div>
          </div>

      {/* Payments Table */}
      <div style={{ padding: '16px 24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ background: teal, color: 'white' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>Payments</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>Type</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600' }}>Rate</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600' }}>Hours</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px 12px' }}>Basic Pay</td>
              <td style={{ padding: '8px 12px' }}>Hourly</td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>£{formatCurrency(data.rate)}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{data.hours || '0'}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>£{formatCurrency(data.grossPay)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px 12px' }}>Holiday Pay</td>
              <td style={{ padding: '8px 12px' }}>Allowance</td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>-</td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>-</td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>£{formatCurrency(data.holidayPay)}</td>
            </tr>
            <tr style={{ fontWeight: '700', borderTop: '2px solid #ddd' }}>
              <td colSpan={4} style={{ padding: '8px 12px' }}>Total Gross Pay</td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>£{formatCurrency(data.totalPayments)}</td>
            </tr>
          </tbody>
        </table>
        </div>

      {/* Deductions Table */}
      <div style={{ padding: '0 24px 16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ background: teal, color: 'white' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>Deductions</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px 12px' }}>PAYE Tax</td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>£{formatCurrency(data.tax)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px 12px' }}>National Insurance</td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>£{formatCurrency(data.nationalInsurance)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px 12px' }}>Holiday Repayment</td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>£{formatCurrency(data.holidayRepayment)}</td>
            </tr>
            <tr style={{ fontWeight: '700', borderTop: '2px solid #ddd' }}>
              <td style={{ padding: '8px 12px' }}>Total Deductions</td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>£{formatCurrency(data.totalDeductions)}</td>
            </tr>
          </tbody>
        </table>
          </div>

      {/* Net Pay Box */}
      <div style={{ margin: '0 24px 16px', background: teal, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>NET PAY</div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>£{formatCurrency(data.netPay)}</div>
      </div>

      {/* Year to Date */}
      <div style={{ margin: '0 24px 16px' }}>
        <div style={{ background: teal, color: 'white', padding: '6px 12px', fontSize: '10px', fontWeight: '600' }}>
          Year to Date Summary
        </div>
        <div style={{ background: lightTeal, padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '10px' }}>
          <div>
            <div style={{ color: '#555', marginBottom: '2px' }}>Taxable Gross</div>
            <div style={{ fontWeight: '600' }}>£{formatCurrency(data.taxableGrossPayYTD)}</div>
          </div>
          <div>
            <div style={{ color: '#555', marginBottom: '2px' }}>Tax Paid</div>
            <div style={{ fontWeight: '600' }}>£{formatCurrency(data.taxYTD)}</div>
        </div>
          <div>
            <div style={{ color: '#555', marginBottom: '2px' }}>Employee NI</div>
            <div style={{ fontWeight: '600' }}>£{formatCurrency(data.employeeNationalInsuranceYTD)}</div>
        </div>
          <div>
            <div style={{ color: '#555', marginBottom: '2px' }}>Employer NI</div>
            <div style={{ fontWeight: '600' }}>£{formatCurrency(data.employerNationalInsuranceYTD)}</div>
      </div>
      </div>
      </div>

    </div>
  );
}

// Myanmar Payroll Preview Component - Professional Template Design
function MyanmarPayrollPreview({ data }: { data: MyanmarPayrollData }) {
  const formatAmount = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0' : num.toLocaleString('en-US');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB');
    } catch {
      return dateStr;
    }
  };

  const teal = '#4DA6A9';
  const lightTeal = '#DCF2F3';

  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", color: '#333', maxWidth: '600px', margin: '0 auto', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0', color: '#333', letterSpacing: '-0.5px' }}>PAYSLIP</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: teal }}>Hush Healthcare</div>
          <div style={{ fontSize: '11px', color: '#666' }}>Myanmar Division</div>
        </div>
      </div>

      {/* Company Info Bar */}
      <div style={{ background: teal, color: 'white', padding: '8px 24px', fontSize: '11px', fontWeight: '600' }}>
        Hush Healthcare Ltd - Myanmar Division
        </div>
      <div style={{ padding: '8px 24px', fontSize: '10px', color: '#666', borderBottom: '1px solid #ddd' }}>
        Healthcare Services
      </div>

      {/* Employee Details */}
      <div style={{ padding: '16px 24px' }}>
        <div style={{ background: teal, color: 'white', padding: '6px 12px', fontSize: '10px', fontWeight: '600' }}>
          Employee Details
        </div>
        <div style={{ background: lightTeal, padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px', fontSize: '11px' }}>
            <div style={{ fontWeight: '600', color: '#555' }}>Employee ID</div>
            <div style={{ fontSize: '13px' }}>{data.employeeId || '-'}</div>
            <div style={{ fontWeight: '600', color: '#555' }}>Employee Name</div>
            <div style={{ fontSize: '13px' }}>{data.employeeName || '-'}</div>
            <div style={{ fontWeight: '600', color: '#555' }}>Email</div>
            <div style={{ fontSize: '13px' }}>{data.email || '-'}</div>
          </div>
        </div>
      </div>

      {/* Period Row */}
      <div style={{ padding: '8px 24px', borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
        <div><span style={{ fontWeight: '600' }}>Period End:</span> {formatDate(data.monthEnding)}</div>
        <div><span style={{ fontWeight: '600' }}>Issue Date:</span> {new Date().toLocaleDateString('en-GB')}</div>
      </div>

      {/* Payment Table */}
      <div style={{ padding: '16px 24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ background: teal, color: 'white' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>Payment</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px 12px' }}>Net Salary</td>
              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600' }}>MMK {formatAmount(data.payrollAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Net Pay Box */}
      <div style={{ margin: '0 24px 16px', background: teal, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>NET PAY</div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>MMK {formatAmount(data.payrollAmount)}</div>
      </div>

      {/* Payment Info */}
      <div style={{ margin: '0 24px 16px', background: lightTeal, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
        <div>
          <div style={{ fontWeight: '600', color: '#555' }}>Payment Method</div>
          <div>Bank Transfer</div>
        </div>
        <div>
          <div style={{ fontWeight: '600', color: '#555' }}>Status</div>
          <div>Processed</div>
        </div>
      </div>

    </div>
  );
}

