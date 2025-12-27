/**
 * SMTP.com Email Service
 * API Documentation: https://api.smtp.com/v4/messages
 */

const SMTP_API_URL = 'https://api.smtp.com/v4/messages';

interface EmailRecipient {
  name?: string;
  address: string;
}

interface EmailOptions {
  to: EmailRecipient[];
  subject: string;
  textContent?: string;
  htmlContent?: string;
  replyTo?: EmailRecipient;
}

interface SmtpResponse {
  status: string;
  data: {
    msg_id?: string;
    errors?: Record<string, unknown>[];
  };
}

/**
 * Send an email via SMTP.com API
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.SMTP_API_KEY;
  const channel = process.env.SMTP_CHANNEL_NAME;
  const senderEmail = process.env.SMTP_SENDER_EMAIL;

  if (!apiKey || !channel || !senderEmail) {
    console.error('SMTP configuration missing. Set SMTP_API_KEY, SMTP_CHANNEL_NAME, and SMTP_SENDER_EMAIL.');
    return { success: false, error: 'SMTP not configured' };
  }

  const bodyParts: { type: string; content: string }[] = [];
  
  if (options.textContent) {
    bodyParts.push({ type: 'text/plain', content: options.textContent });
  }
  
  if (options.htmlContent) {
    bodyParts.push({ type: 'text/html', content: options.htmlContent });
  }

  const requestBody = {
    channel,
    recipients: {
      to: options.to.map(r => ({ name: r.name || '', address: r.address })),
    },
    originator: {
      from: { name: '5me Notifications', address: senderEmail },
      ...(options.replyTo && { reply_to: { name: options.replyTo.name || '', address: options.replyTo.address } }),
    },
    subject: options.subject,
    body: {
      parts: bodyParts,
    },
  };

  try {
    const response = await fetch(SMTP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data: SmtpResponse = await response.json();

    if (!response.ok) {
      console.error('SMTP API error:', data);
      return { 
        success: false, 
        error: response.status === 401 ? 'Invalid API key' : 'Failed to send email' 
      };
    }

    return { success: true, messageId: data.data?.msg_id };
  } catch (error) {
    console.error('SMTP send error:', error);
    return { success: false, error: 'Network error sending email' };
  }
}

/**
 * Send feedback notification to location notification emails
 */
export async function sendFeedbackNotification(params: {
  locationName: string;
  companyName: string;
  rating: number;
  customerName?: string;
  customerEmail?: string;
  message: string;
  notificationEmails: string[];
}): Promise<{ success: boolean; error?: string }> {
  const { locationName, companyName, rating, customerName, customerEmail, message, notificationEmails } = params;

  if (notificationEmails.length === 0) {
    return { success: false, error: 'No notification emails configured' };
  }

  const ratingEmoji = rating <= 2 ? '😟' : rating === 3 ? '😐' : '😊';
  const ratingStars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

  const subject = `${ratingEmoji} New ${rating}-Star Feedback for ${locationName}`;

  const textContent = `
New Feedback Received

Location: ${locationName} (${companyName})
Rating: ${ratingStars} (${rating}/5)
Customer: ${customerName || 'Anonymous'}${customerEmail ? ` <${customerEmail}>` : ''}

Message:
${message}

---
This notification was sent by 5me Review Management.
`.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #586c96, #728fc9); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .rating { font-size: 24px; color: #f59e0b; margin: 10px 0; }
    .message-box { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 15px 0; }
    .customer { color: #6b7280; font-size: 14px; }
    .footer { color: #9ca3af; font-size: 12px; margin-top: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">New Feedback Received ${ratingEmoji}</h2>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">${locationName} • ${companyName}</p>
    </div>
    <div class="content">
      <div class="rating">${ratingStars}</div>
      <p class="customer">
        <strong>From:</strong> ${customerName || 'Anonymous'}
        ${customerEmail ? `&lt;${customerEmail}&gt;` : ''}
      </p>
      <div class="message-box">
        <p style="margin: 0; white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      </div>
      <p class="footer">This notification was sent by 5me Review Management</p>
    </div>
  </div>
</body>
</html>
`.trim();

  const recipients = notificationEmails.map(email => ({ address: email }));

  const result = await sendEmail({
    to: recipients,
    subject,
    textContent,
    htmlContent,
    ...(customerEmail && { replyTo: { name: customerName, address: customerEmail } }),
  });

  return result;
}

/**
 * Send a test email to verify SMTP configuration
 */
export async function sendTestEmail(toEmail: string): Promise<{ success: boolean; error?: string }> {
  const result = await sendEmail({
    to: [{ address: toEmail }],
    subject: '✅ 5me SMTP Test - Configuration Working!',
    textContent: `
5me - SMTP Configuration Test
==============================

Great news! Your SMTP configuration is working correctly.

This test email confirms that 5me can send email notifications through your SMTP.com account.

What's next?
- Feedback notifications will be sent to your configured email addresses
- Make sure your notification emails are set up for each location

---
Powered by 5me Review Management
https://5me.app
    `.trim(),
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>5me SMTP Test</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 500px; width: 100%; border-collapse: collapse;">
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="font-size: 32px; font-weight: bold; color: #586c96;">5me</div>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background: linear-gradient(135deg, #586c96 0%, #728fc9 100%); border-radius: 16px; overflow: hidden;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 48px 32px;">
                    <div style="font-size: 64px; margin-bottom: 16px;">✅</div>
                    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: white;">SMTP Configuration Working!</h1>
                    <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.9);">Your email setup is complete</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Info Section -->
          <tr>
            <td style="padding-top: 24px;">
              <table role="presentation" style="width: 100%; background: white; border-radius: 12px; border: 1px solid #e5e7eb; border-collapse: collapse;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #374151;">What's next?</h2>
                    <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                      <li>Feedback notifications will be sent to your configured email addresses</li>
                      <li>Make sure notification emails are set up for each location</li>
                      <li>Customers who leave low ratings will trigger instant alerts</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #9ca3af;">Powered by</p>
              <div style="font-size: 20px; font-weight: bold; color: #586c96;">5me</div>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">Review Management Platform</p>
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

  return result;
}
