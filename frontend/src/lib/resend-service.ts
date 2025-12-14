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
    const currencySymbol = currency || (payrollType === 'uk' ? '£' : 'MMK');
    const payAmount = netPay ? `${currencySymbol}${parseFloat(netPay).toLocaleString()}` : null;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Payslip - ${formattedDate}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
  
  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Email Container -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 40px 40px 35px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <!-- Logo/Company Name -->
                    <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                      Hush Healthcare Ltd
                    </h1>
                    <p style="margin: 0; font-size: 14px; color: rgba(255, 255, 255, 0.8);">
                      ${payType} Payroll Department
                    </p>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <!-- Payslip Icon -->
                    <div style="width: 48px; height: 48px; background-color: rgba(255, 255, 255, 0.15); border-radius: 12px; display: inline-block; text-align: center; line-height: 48px;">
                      <span style="font-size: 24px;">📄</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Document Type Banner -->
          <tr>
            <td style="background-color: #10b981; padding: 12px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 13px; font-weight: 600; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
                      📋 Payslip Attached
                    </p>
                  </td>
                  <td align="right">
                    <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.9);">
                      Period: ${formattedDate}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 20px; font-size: 18px; color: #1f2937; font-weight: 600;">
                Hello ${employeeName},
              </p>
              
              <p style="margin: 0 0 25px; font-size: 15px; color: #4b5563; line-height: 1.6;">
                Your payslip for the period ending <strong style="color: #1f2937;">${formattedDate}</strong> is now available. Please find your detailed ${payType} payroll statement attached to this email.
              </p>
              
              ${payAmount ? `
              <!-- Pay Amount Card -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 25px;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px 25px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td>
                          <p style="margin: 0 0 5px; font-size: 12px; color: #16a34a; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">
                            Net Pay This Period
                          </p>
                          <p style="margin: 0; font-size: 28px; color: #15803d; font-weight: 700;">
                            ${payAmount}
                          </p>
                        </td>
                        <td align="right" style="vertical-align: middle;">
                          <div style="width: 50px; height: 50px; background-color: #22c55e; border-radius: 50%; text-align: center; line-height: 50px;">
                            <span style="font-size: 24px;">✓</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 25px;">
                <tr>
                  <td style="background-color: #f8fafc; border-radius: 12px; padding: 20px 25px; border-left: 4px solid #2563eb;">
                    <p style="margin: 0 0 12px; font-size: 14px; color: #1e40af; font-weight: 600;">
                      📌 Important Information
                    </p>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #64748b; line-height: 1.8;">
                      <li>Please review your payslip carefully for accuracy</li>
                      <li>Keep this document for your personal records</li>
                      <li>Contact HR within 5 working days if you notice any discrepancies</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <!-- Attachment Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 30px;">
                <tr>
                  <td style="background-color: #fff7ed; border-radius: 8px; padding: 15px 20px; border: 1px solid #fed7aa;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <span style="font-size: 20px;">📎</span>
                        </td>
                        <td>
                          <p style="margin: 0; font-size: 13px; color: #9a3412;">
                            <strong>Attachment:</strong> Payroll_${formattedDate.replace(/\s/g, '_')}.pdf
                          </p>
                          <p style="margin: 5px 0 0; font-size: 12px; color: #c2410c;">
                            This is a secure, password-protected document.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="mailto:hr@hushhealthcare.co.uk?subject=Payslip%20Query%20-%20${formattedDate}" style="display: inline-block; background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
                      💬 Contact HR if you have questions
                    </a>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <p style="margin: 0 0 5px; font-size: 14px; color: #374151; font-weight: 600;">
                      Hush Healthcare Ltd
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
                      Payroll Department<br>
                      Email: payroll@hushhealthcare.co.uk
                    </p>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <p style="margin: 0; font-size: 11px; color: #9ca3af;">
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
            <td style="padding: 20px 40px; background-color: #1f2937;">
              <p style="margin: 0; font-size: 10px; color: #9ca3af; text-align: center; line-height: 1.6;">
                This email and any attachments are confidential and intended solely for the use of the individual to whom it is addressed. 
                If you have received this email in error, please notify the sender immediately and delete it from your system.
              </p>
            </td>
          </tr>
          
        </table>
        
        <!-- Post-footer -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px;">
          <tr>
            <td style="padding: 25px 0; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                © ${new Date().getFullYear()} Hush Healthcare Ltd. All rights reserved.
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
${payType} Payroll Department
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 PAYSLIP ATTACHED | Period: ${formattedDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hello ${employeeName},

Your payslip for the period ending ${formattedDate} is now available. Please find your detailed ${payType} payroll statement attached to this email.

${payAmount ? `
💰 NET PAY THIS PERIOD: ${payAmount}
` : ''}

📌 IMPORTANT INFORMATION:
• Please review your payslip carefully for accuracy
• Keep this document for your personal records  
• Contact HR within 5 working days if you notice any discrepancies

📎 ATTACHMENT: Payroll_${formattedDate.replace(/\s/g, '_')}.pdf

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you have any questions about your payslip, please contact the HR department at hr@hushhealthcare.co.uk

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hush Healthcare Ltd
Payroll Department
Email: payroll@hushhealthcare.co.uk

This is an automated email. Please do not reply directly.

CONFIDENTIALITY NOTICE: This email and any attachments are confidential and intended solely for the use of the individual to whom it is addressed.

© ${new Date().getFullYear()} Hush Healthcare Ltd. All rights reserved.
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
          subject: `📋 Your Payslip - ${formattedDate} | Hush Healthcare Ltd`,
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
