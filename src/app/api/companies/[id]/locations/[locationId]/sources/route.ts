import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSourcesByLocation, createSource } from '@/services/source.service';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string; locationId: string }>;
}

// GET /api/companies/[id]/locations/[locationId]/sources
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { locationId } = await params;
    const sources = await getSourcesByLocation(locationId);
    return NextResponse.json(sources);
  } catch (error) {
    console.error('Error fetching sources:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/companies/[id]/locations/[locationId]/sources
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { locationId } = await params;
    const body = await request.json();
    const { type, name, url, icon } = body;

    if (!type || !name || !url) {
      return NextResponse.json({ error: 'Type, name, and URL are required' }, { status: 400 });
    }

    const source = await createSource({
      locationId,
      type,
      name,
      url,
      icon,
    });

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    console.error('Error creating source:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
