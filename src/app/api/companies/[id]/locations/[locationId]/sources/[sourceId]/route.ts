import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSourceById, updateSource, deleteSource } from '@/services/source.service';
import { ReviewSourceType } from '@prisma/client';

export const dynamic = 'force-dynamic';

function normalizeReviewSourceType(input: unknown): ReviewSourceType | null {
  if (typeof input !== 'string' || input.trim().length === 0) return null;
  const upper = input.trim().toUpperCase();
  return (Object.values(ReviewSourceType) as string[]).includes(upper) ? (upper as ReviewSourceType) : null;
}

interface RouteParams {
  params: Promise<{ id: string; locationId: string; sourceId: string }>;
}

// GET /api/companies/[id]/locations/[locationId]/sources/[sourceId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourceId } = await params;
    const source = await getSourceById(sourceId);

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    return NextResponse.json(source);
  } catch (error) {
    console.error('Error fetching source:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/companies/[id]/locations/[locationId]/sources/[sourceId]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourceId } = await params;
    const body = await request.json();

    // Client types are lowercase; Prisma enum is uppercase.
    if (body && typeof body === 'object' && 'type' in body) {
      const normalizedType = normalizeReviewSourceType((body as { type?: unknown }).type);
      if (normalizedType) {
        (body as { type?: ReviewSourceType }).type = normalizedType;
      }
    }

    const source = await updateSource(sourceId, body);
    return NextResponse.json(source);
  } catch (error: unknown) {
    console.error('Error updating source:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/companies/[id]/locations/[locationId]/sources/[sourceId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourceId } = await params;
    await deleteSource(sourceId);
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting source:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
