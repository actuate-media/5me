import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getWidgetById, updateWidget, deleteWidget } from '@/services/widget.service';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/widgets/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const widget = await getWidgetById(id);

    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    return NextResponse.json(widget);
  } catch (error) {
    console.error('Error fetching widget:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/widgets/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const widget = await updateWidget(id, body);
    return NextResponse.json(widget);
  } catch (error: unknown) {
    console.error('Error updating widget:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/widgets/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await deleteWidget(id);
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting widget:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
