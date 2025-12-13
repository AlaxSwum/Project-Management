// Resend Email Service for Payroll System
// Professional email service using Resend API

interface SendPayrollEmailParams {
  employeeName: string;
  employeeEmail: string;
  monthEnding: string;
  payrollType: 'uk' | 'myanmar';
  pdfBase64: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
}

class ResendService {
  private apiKey: string;
  private apiUrl = 'https://api.resend.com/emails';

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('RESEND_API_KEY not found in environment variables');
    }
  }

  private getEmailTemplate(params: SendPayrollEmailParams): { html: string; text: string } {
    const { employeeName, monthEnding, payrollType } = params;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payroll Statement - ${monthEnding}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #1e293b; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Hush Healthcare Ltd</h1>
              <p style="color: #cbd5e1; margin: 10px 0 0 0; font-size: 16px;">Payroll Statement</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #1e293b; font-size: 16px; margin: 0 0 20px 0;">Dear ${employeeName},</p>
              
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                Please find attached your ${payrollType === 'uk' ? 'UK' : 'Myanmar'} payroll statement for the month ending ${monthEnding}.
              </p>
              
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
                If you have any questions or concerns regarding your payroll statement, please contact the HR department.
              </p>
              
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin-top: 30px;">
                <p style="color: #1e293b; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">Important Information:</p>
                <ul style="color: #64748b; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>This is an automated payroll statement</li>
                  <li>Please keep this document for your records</li>
                  <li>Contact HR for any discrepancies</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                Hush Healthcare Ltd<br>
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const text = `
Hush Healthcare Ltd - Payroll Statement

Dear ${employeeName},

Please find attached your ${payrollType === 'uk' ? 'UK' : 'Myanmar'} payroll statement for the month ending ${monthEnding}.

If you have any questions or concerns regarding your payroll statement, please contact the HR department.

Important Information:
- This is an automated payroll statement
- Please keep this document for your records
- Contact HR for any discrepancies

Hush Healthcare Ltd
This is an automated message. Please do not reply to this email.
    `.trim();

    return { html, text };
  }

  async sendPayrollEmail(params: SendPayrollEmailParams): Promise<EmailResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'RESEND_API_KEY not configured',
      };
    }

    try {
      const { html, text } = this.getEmailTemplate(params);
      const { employeeEmail, monthEnding, pdfBase64 } = params;

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Rother Care <support@rothercarepharmacy.co.uk>',
          to: [employeeEmail],
          subject: `Payroll Statement - ${monthEnding}`,
          html,
          text,
          attachments: [
            {
              filename: `Payroll_${monthEnding}.pdf`,
              content: pdfBase64,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error sending payroll email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export const resendService = new ResendService();
