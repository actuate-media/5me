import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const reasonLabels: Record<string, string> = {
  bug: 'Bug Report',
  feature: 'Feature Request',
  account: 'Account Issue',
  billing: 'Billing Question',
  integration: 'Integration Help',
  data: 'Data Issue',
  training: 'Training Request',
  other: 'Other',
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, reason, subject, message } = body;

    // Validate required fields
    if (!reason || !subject || !message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please fill in all required fields' 
      }, { status: 400 });
    }

    // Get superadmin emails
    const superadmins = await prisma.user.findMany({
      where: { role: 'SUPERADMIN', isActive: true },
      select: { email: true },
      take: 10,
    });

    if (superadmins.length === 0) {
      console.error('No superadmins found to receive support request');
      return NextResponse.json({ 
        success: false, 
        error: 'Unable to send message. Please try again later.' 
      }, { status: 500 });
    }

    const reasonLabel = reasonLabels[reason] || reason;
    const recipients = superadmins.map(admin => ({ address: admin.email }));

    // Send email to superadmins
    const result = await sendEmail({
      to: recipients,
      subject: `[5me Support] ${reasonLabel}: ${subject}`,
      replyTo: { name: name || 'User', address: email },
      textContent: `
5me Support Request
===================

From: ${name || 'Not provided'} <${email}>
Reason: ${reasonLabel}
Subject: ${subject}

Message:
${message}

---
This support request was submitted through the 5me Help & Support page.
Reply directly to this email to respond to the user.
      `.trim(),
      htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #586c96 0%, #728fc9 100%); border-radius: 12px 12px 0 0; padding: 24px 32px;">
              <h1 style="margin: 0; font-size: 20px; color: white;">New Support Request</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <!-- Meta info -->
              <table role="presentation" style="width: 100%; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                    <strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">From</strong><br>
                    <span style="color: #111827;">${name || 'Not provided'} &lt;${email}&gt;</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                    <strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Reason</strong><br>
                    <span style="display: inline-block; background: #586c96; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${reasonLabel}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Subject</strong><br>
                    <span style="color: #111827; font-weight: 500;">${subject}</span>
                  </td>
                </tr>
              </table>
              
              <!-- Message -->
              <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <strong style="color: #6b7280; font-size: 12px; text-transform: uppercase; display: block; margin-bottom: 8px;">Message</strong>
                <p style="margin: 0; color: #374151; white-space: pre-wrap; line-height: 1.6;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
              </div>
              
              <!-- Footer -->
              <p style="margin: 24px 0 0 0; font-size: 13px; color: #9ca3af;">
                Reply directly to this email to respond to the user.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Support request sent' });
    } else {
      console.error('Failed to send support email:', result.error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send message. Please try again.' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Support API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred. Please try again.' 
    }, { status: 500 });
  }
}
