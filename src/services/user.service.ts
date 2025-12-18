import prisma from '@/lib/prisma';
import type { UserRole } from '@/types';

// Superadmin email (hardcoded - cannot be changed)
const SUPERADMIN_EMAIL = 'strategize@actuatemedia.com';

export interface UserWithRole {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  avatar: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get user by email, creating if doesn't exist
 */
export async function getOrCreateUser(email: string, name?: string | null, avatar?: string | null): Promise<UserWithRole> {
  const normalizedEmail = email.toLowerCase();
  
  // Determine role - superadmin is always superadmin
  const role: UserRole = normalizedEmail === SUPERADMIN_EMAIL ? 'SUPERADMIN' : 'USER';
  
  // Split name into first/last
  const nameParts = name?.split(' ') || [];
  const firstName = nameParts[0] || null;
  const lastName = nameParts.slice(1).join(' ') || null;

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      lastLoginAt: new Date(),
      avatar: avatar || undefined,
      // Don't update role if user exists - preserve admin assignments
    },
    create: {
      email: normalizedEmail,
      firstName,
      lastName,
      role,
      avatar,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  return user as UserWithRole;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<UserWithRole | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  return user as UserWithRole | null;
}

/**
 * Get user role by email
 */
export async function getUserRole(email: string): Promise<UserRole> {
  const normalizedEmail = email.toLowerCase();
  
  // Superadmin is always superadmin
  if (normalizedEmail === SUPERADMIN_EMAIL) {
    return 'SUPERADMIN';
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { role: true },
  });

  return (user?.role as UserRole) || 'USER';
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<UserWithRole[]> {
  const users = await prisma.user.findMany({
    orderBy: [
      { role: 'asc' }, // SUPERADMIN first, then ADMIN, then USER
      { createdAt: 'asc' },
    ],
  });
  return users as UserWithRole[];
}

/**
 * Update user role
 */
export async function updateUserRole(
  email: string, 
  newRole: UserRole, 
  updaterEmail: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase();
  const updaterNormalizedEmail = updaterEmail.toLowerCase();

  // Cannot change superadmin's role
  if (normalizedEmail === SUPERADMIN_EMAIL) {
    return { success: false, error: 'Cannot change superadmin role' };
  }

  // Get updater's role
  const updater = await prisma.user.findUnique({
    where: { email: updaterNormalizedEmail },
    select: { role: true },
  });

  if (!updater) {
    return { success: false, error: 'Updater not found' };
  }

  // Only SUPERADMIN can assign ADMIN role
  if (newRole === 'ADMIN' && updater.role !== 'SUPERADMIN') {
    return { success: false, error: 'Only superadmin can assign admin role' };
  }

  // Only SUPERADMIN and ADMIN can change roles
  if (updater.role !== 'SUPERADMIN' && updater.role !== 'ADMIN') {
    return { success: false, error: 'Insufficient permissions' };
  }

  // ADMIN cannot change other ADMIN's role
  const targetUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { role: true },
  });

  if (targetUser?.role === 'ADMIN' && updater.role === 'ADMIN') {
    return { success: false, error: 'Admins cannot modify other admins' };
  }

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { role: newRole },
  });

  return { success: true };
}

/**
 * Toggle user active status
 */
export async function toggleUserActive(
  email: string,
  updaterEmail: string
): Promise<{ success: boolean; isActive?: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase();
  const updaterNormalizedEmail = updaterEmail.toLowerCase();

  // Cannot deactivate superadmin
  if (normalizedEmail === SUPERADMIN_EMAIL) {
    return { success: false, error: 'Cannot deactivate superadmin' };
  }

  // Get updater's role
  const updater = await prisma.user.findUnique({
    where: { email: updaterNormalizedEmail },
    select: { role: true },
  });

  if (!updater || (updater.role !== 'SUPERADMIN' && updater.role !== 'ADMIN')) {
    return { success: false, error: 'Insufficient permissions' };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { isActive: true, role: true },
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // ADMIN cannot deactivate other ADMIN
  if (user.role === 'ADMIN' && updater.role === 'ADMIN') {
    return { success: false, error: 'Admins cannot modify other admins' };
  }

  const updatedUser = await prisma.user.update({
    where: { email: normalizedEmail },
    data: { isActive: !user.isActive },
  });

  return { success: true, isActive: updatedUser.isActive };
}

/**
 * Create/invite a new user
 */
export async function createUser(
  email: string,
  role: UserRole,
  creatorEmail: string
): Promise<{ success: boolean; user?: UserWithRole; error?: string }> {
  const normalizedEmail = email.toLowerCase();
  const creatorNormalizedEmail = creatorEmail.toLowerCase();

  // Validate email domain
  if (!normalizedEmail.endsWith('@actuatemedia.com')) {
    return { success: false, error: 'Only @actuatemedia.com emails allowed' };
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return { success: false, error: 'User already exists' };
  }

  // Get creator's role
  const creator = await prisma.user.findUnique({
    where: { email: creatorNormalizedEmail },
    select: { role: true },
  });

  if (!creator || (creator.role !== 'SUPERADMIN' && creator.role !== 'ADMIN')) {
    return { success: false, error: 'Insufficient permissions' };
  }

  // Only SUPERADMIN can create ADMIN
  if (role === 'ADMIN' && creator.role !== 'SUPERADMIN') {
    return { success: false, error: 'Only superadmin can create admin users' };
  }

  // Cannot create SUPERADMIN
  if (role === 'SUPERADMIN') {
    return { success: false, error: 'Cannot create superadmin users' };
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      firstName: normalizedEmail.split('@')[0],
      role,
      isActive: true,
    },
  });

  return { success: true, user: user as UserWithRole };
}
