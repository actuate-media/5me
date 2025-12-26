import { NextRequest, NextResponse } from 'next/server';
import { recordClick } from '@/services/source.service';

export const dynamic = 'force-dynamic';

// POST /api/clicks - Record a review click (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceId, locationId, rating } = body;

    if (!sourceId || !locationId) {
      return NextResponse.json(
        { error: 'sourceId and locationId are required' },
        { status: 400 }
      );
    }

    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    const click = await recordClick(sourceId, locationId, rating, ipAddress, userAgent);
    return NextResponse.json(click, { status: 201 });
  } catch (error) {
    console.error('Error recording click:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
