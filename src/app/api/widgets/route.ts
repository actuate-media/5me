import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllWidgets, createWidget, getWidgetsByCompany } from '@/services/widget.service';

export const dynamic = 'force-dynamic';

// GET /api/widgets - Get all widgets
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const widgets = companyId 
      ? await getWidgetsByCompany(companyId)
      : await getAllWidgets();

    return NextResponse.json(widgets);
  } catch (error) {
    console.error('Error fetching widgets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/widgets - Create a new widget
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, name, type, settings } = body;

    if (!companyId || !name || !type || !settings) {
      return NextResponse.json(
        { error: 'companyId, name, type, and settings are required' },
        { status: 400 }
      );
    }

    const widget = await createWidget({ companyId, name, type, settings });
    return NextResponse.json(widget, { status: 201 });
  } catch (error) {
    console.error('Error creating widget:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
