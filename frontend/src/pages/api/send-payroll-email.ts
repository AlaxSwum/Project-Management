// API endpoint for sending payroll emails via Resend
// This keeps the API key secure on the server side

import { NextApiRequest, NextApiResponse } from 'next';
import { resendService } from '../../lib/resend-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { employeeName, employeeEmail, monthEnding, payrollType, pdfBase64 } = req.body;

    if (!employeeName || !employeeEmail || !monthEnding || !payrollType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await resendService.sendPayrollEmail({
      employeeName,
      employeeEmail,
      monthEnding,
      payrollType,
      pdfBase64,
    });

    if (result.success) {
      return res.status(200).json({ success: true, message: 'Email sent successfully' });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending payroll email:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

