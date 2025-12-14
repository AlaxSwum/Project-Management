// Resend Email Service for Payroll System
// Professional email service using Resend API

interface SendPayrollEmailParams {
  employeeName: string;
  employeeEmail: string;
  monthEnding: string;
  payrollType: 'uk' | 'myanmar';
  pdfBase64: string;
  netPay?: string;
  currency?: string;
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

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  }

  private getEmailTemplate(params: SendPayrollEmailParams): { html: string; text: string } {
    const { employeeName, monthEnding, payrollType, netPay, currency } = params;
    const formattedDate = this.formatDate(monthEnding);
    const payType = payrollType === 'uk' ? 'UK' : 'Myanmar';
    const currencySymbol = currency || (payrollType === 'uk' ? '£' : 'MMK ');
    const payAmount = netPay ? `${currencySymbol}${parseFloat(netPay).toLocaleString()}` : null;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip - ${formattedDate}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #cccccc;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #333333; padding: 25px 30px; text-align: center;">
              <h1 style="margin: 0 0 5px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">
                HUSH HEALTHCARE LTD
              </h1>
              <p style="margin: 0; font-size: 12px; color: #cccccc; letter-spacing: 2px;">
                PAYROLL DEPARTMENT
              </p>
            </td>
          </tr>
          
          <!-- Document Type -->
          <tr>
            <td style="background-color: #666666; padding: 10px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 12px; font-weight: 600; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
                      ${payType} Payslip
                    </p>
                  </td>
                  <td align="right">
                    <p style="margin: 0; font-size: 12px; color: #ffffff;">
                      Period: ${formattedDate}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 30px;">
              
              <p style="margin: 0 0 20px; font-size: 16px; color: #333333;">
                Dear ${employeeName},
              </p>
              
              <p style="margin: 0 0 20px; font-size: 14px; color: #555555; line-height: 1.6;">
                Please find attached your payslip for the period ending <strong>${formattedDate}</strong>.
              </p>
              
              ${payAmount ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="background-color: #f5f5f5; border: 1px solid #dddddd; padding: 20px; text-align: center;">
                    <p style="margin: 0 0 5px; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">
                      Net Pay This Period
                    </p>
                    <p style="margin: 0; font-size: 28px; color: #333333; font-weight: 700;">
                      ${payAmount}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="background-color: #f9f9f9; border-left: 3px solid #333333; padding: 15px 20px;">
                    <p style="margin: 0 0 10px; font-size: 13px; color: #333333; font-weight: 600;">
                      Important Information
                    </p>
                    <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #555555; line-height: 1.8;">
                      <li>Please review your payslip carefully for accuracy</li>
                      <li>Keep this document for your personal records</li>
                      <li>Contact HR within 5 working days if you notice any discrepancies</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #f5f5f5; border: 1px solid #dddddd; padding: 12px 15px;">
                    <p style="margin: 0; font-size: 12px; color: #555555;">
                      <strong>Attachment:</strong> Payslip_${formattedDate.replace(/\s/g, '_')}.pdf
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 13px; color: #555555;">
                If you have any questions regarding your payslip, please contact the HR department.
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f5f5; padding: 20px 30px; border-top: 1px solid #dddddd;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0 0 3px; font-size: 13px; color: #333333; font-weight: 600;">
                      Hush Healthcare Ltd
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #666666;">
                      Payroll Department
                    </p>
                  </td>
                  <td align="right">
                    <p style="margin: 0; font-size: 10px; color: #999999;">
                      This is an automated email.<br>
                      Please do not reply directly.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Legal Footer -->
          <tr>
            <td style="padding: 15px 30px; background-color: #333333;">
              <p style="margin: 0; font-size: 9px; color: #999999; text-align: center; line-height: 1.5;">
                This email and any attachments are confidential and intended solely for the use of the individual to whom it is addressed. 
                If you have received this email in error, please notify the sender immediately and delete it from your system.
              </p>
            </td>
          </tr>
          
        </table>
        
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
          <tr>
            <td style="padding: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 10px; color: #999999;">
                ${new Date().getFullYear()} Hush Healthcare Ltd. All rights reserved.
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
HUSH HEALTHCARE LTD
Payroll Department
------------------------------------------------------------

${payType.toUpperCase()} PAYSLIP | Period: ${formattedDate}

------------------------------------------------------------

Dear ${employeeName},

Please find attached your payslip for the period ending ${formattedDate}.

${payAmount ? `NET PAY THIS PERIOD: ${payAmount}` : ''}

IMPORTANT INFORMATION:
- Please review your payslip carefully for accuracy
- Keep this document for your personal records
- Contact HR within 5 working days if you notice any discrepancies

ATTACHMENT: Payslip_${formattedDate.replace(/\s/g, '_')}.pdf

------------------------------------------------------------

If you have any questions regarding your payslip, please contact the HR department.

------------------------------------------------------------

Hush Healthcare Ltd
Payroll Department

This is an automated email. Please do not reply directly.

CONFIDENTIALITY NOTICE: This email and any attachments are confidential and intended solely for the use of the individual to whom it is addressed.

${new Date().getFullYear()} Hush Healthcare Ltd. All rights reserved.
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
      const formattedDate = this.formatDate(monthEnding);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Hush Healthcare Payroll <onboarding@resend.dev>',
          to: [employeeEmail],
          subject: `Payslip - ${formattedDate} | Hush Healthcare Ltd`,
          html,
          text,
          attachments: [
            {
              filename: `Payslip_${formattedDate.replace(/\s/g, '_')}.pdf`,
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

      await response.json();
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
