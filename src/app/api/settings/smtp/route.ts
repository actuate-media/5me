import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return SMTP settings from environment variables
  // API key is masked for security (only show last 4 chars)
  const apiKey = process.env.SMTP_API_KEY || '';
  const maskedApiKey = apiKey ? `${'•'.repeat(Math.max(0, apiKey.length - 4))}${apiKey.slice(-4)}` : '';

  return NextResponse.json({
    channelName: process.env.SMTP_CHANNEL_NAME || '',
    apiKey: maskedApiKey,
    senderEmail: process.env.SMTP_SENDER_EMAIL || '',
    isConfigured: !!(process.env.SMTP_API_KEY && process.env.SMTP_SENDER_EMAIL),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // For now, SMTP settings are stored in env vars (read-only from UI)
  // In the future, these could be saved to the database per-company
  return NextResponse.json({ 
    success: true,
    message: 'SMTP settings are configured via environment variables. Contact admin to update.',
  });
}
