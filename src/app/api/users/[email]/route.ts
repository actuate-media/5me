import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserByEmail, updateUserRole, toggleUserActive } from '@/services/user.service';
import type { UserRole } from '@/types';

interface RouteParams {
  params: Promise<{ email: string }>;
}

// GET /api/users/[email] - Get user by email
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);
    const user = await getUserByEmail(decodedEmail);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/users/[email] - Update user role or status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    if (userRole !== 'SUPERADMIN' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);
    const body = await request.json();

    // Update role
    if (body.role !== undefined) {
      const result = await updateUserRole(decodedEmail, body.role as UserRole, session.user.email);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'Role updated' });
    }

    // Toggle active status
    if (body.toggleActive) {
      const result = await toggleUserActive(decodedEmail, session.user.email);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, isActive: result.isActive });
    }

    return NextResponse.json({ error: 'No valid action provided' }, { status: 400 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
