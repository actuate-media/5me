import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getLocationsByCompany, createLocation } from '@/services/location.service';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/companies/[id]/locations - Get all locations for a company
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const locations = await getLocationsByCompany(id);
    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/companies/[id]/locations - Create a new location
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, slug, address, city, state, zip, phone } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const location = await createLocation({
      companyId: id,
      name,
      slug,
      address,
      city,
      state,
      zip,
      phone,
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating location:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Location with this slug already exists for this company' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
