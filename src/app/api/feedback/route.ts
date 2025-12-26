import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllFeedback, createFeedback, getFeedbackStats } from '@/services/feedbacks';
import type { FeedbackStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/feedback - Get all feedback
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || undefined;
    const locationId = searchParams.get('locationId') || undefined;
    const status = searchParams.get('status') as FeedbackStatus | undefined;
    const search = searchParams.get('search') || undefined;
    const statsOnly = searchParams.get('stats') === 'true';

    if (statsOnly) {
      const stats = await getFeedbackStats(companyId);
      return NextResponse.json(stats);
    }

    const feedback = await getAllFeedback({ companyId, locationId, status, search });
    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/feedback - Create new feedback (can be public for review funnel)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locationId, rating, name, email, phone, message } = body;

    if (!locationId || !rating || !name || !email || !message) {
      return NextResponse.json(
        { error: 'locationId, rating, name, email, and message are required' },
        { status: 400 }
      );
    }

    const feedback = await createFeedback({
      locationId,
      rating,
      name,
      email,
      phone,
      message,
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
