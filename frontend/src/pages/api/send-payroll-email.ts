// API endpoint for sending payroll emails via Resend
// This keeps the API key secure on the server side

import { NextApiRequest, NextApiResponse } from 'next';
import { resendService } from '../../lib/resend-service';

// Increase body size limit to 10MB for PDF attachments
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { employeeName, employeeEmail, monthEnding, payrollType, pdfBase64, netPay, currency } = req.body;

    // Validate required fields
    if (!employeeName || !employeeEmail || !monthEnding || !payrollType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: employeeName, employeeEmail, monthEnding, payrollType' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(employeeEmail)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email address format' 
      });
    }

    // Check if PDF is provided
    if (!pdfBase64) {
      return res.status(400).json({ 
        success: false, 
        error: 'PDF attachment is required' 
      });
    }

    console.log(`Sending payroll email to: ${employeeEmail} for month: ${monthEnding}`);

    const result = await resendService.sendPayrollEmail({
      employeeName,
      employeeEmail,
      monthEnding,
      payrollType,
      pdfBase64,
      netPay,
      currency,
    });

    if (result.success) {
      console.log(`Email sent successfully to: ${employeeEmail}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Payroll email sent successfully' 
      });
    } else {
      console.error(`Failed to send email to ${employeeEmail}:`, result.error);
      return res.status(500).json({ 
        success: false, 
        error: result.error || 'Failed to send email' 
      });
    }
  } catch (error) {
    console.error('Error in send-payroll-email API:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    });
  }
}

