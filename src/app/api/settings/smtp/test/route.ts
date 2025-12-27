import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sendTestEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const toEmail = body.email || session.user.email;

    const result = await sendTestEmail(toEmail);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `Test email sent to ${toEmail}` 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to send test email' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send test email' 
    }, { status: 500 });
  }
}
