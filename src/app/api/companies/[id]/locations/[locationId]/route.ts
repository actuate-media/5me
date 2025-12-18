import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getLocationById, updateLocation, deleteLocation } from '@/services/location.service';

interface RouteParams {
  params: Promise<{ id: string; locationId: string }>;
}

// GET /api/companies/[id]/locations/[locationId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { locationId } = await params;
    const location = await getLocationById(locationId);

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/companies/[id]/locations/[locationId]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { locationId } = await params;
    const body = await request.json();

    const location = await updateLocation(locationId, body);
    return NextResponse.json(location);
  } catch (error: unknown) {
    console.error('Error updating location:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/companies/[id]/locations/[locationId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { locationId } = await params;
    await deleteLocation(locationId);
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting location:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
