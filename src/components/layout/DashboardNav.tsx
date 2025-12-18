'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  Settings,
  LogOut,
  Code,
  HelpCircle,
  Users,
  Shield,
} from 'lucide-react';
import type { UserRole } from '@/types';

interface NavUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Feedback', href: '/feedback', icon: MessageSquare },
  { name: 'Widgets', href: '/widgets', icon: Code },
];

const adminNavigation = [
  { name: 'Users', href: '/users', icon: Users },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help & Support', href: '/help', icon: HelpCircle },
];

interface DashboardNavProps {
  user?: NavUser | null;
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <img
            className="h-8 w-auto"
            src="/assets/logos/5me-logo.png"
            alt="5me"
          />
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        pathname === item.href || pathname.startsWith(item.href + '/')
                          ? 'bg-gray-100 text-indigo-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                        'group flex gap-x-3 rounded-md p-2 text-sm font-medium'
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            
            {/* Admin Section */}
            {isAdmin && (
              <li>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                  <Shield className="h-3 w-3" />
                  Admin
                </div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  {adminNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          pathname === item.href
                            ? 'bg-gray-100 text-indigo-600'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                          'group flex gap-x-3 rounded-md p-2 text-sm font-medium'
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            )}

            <li>
              <div className="text-xs font-semibold text-gray-400">Support</div>
              <ul role="list" className="-mx-2 mt-2 space-y-1">
                {secondaryNavigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        pathname === item.href
                          ? 'bg-gray-100 text-indigo-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                        'group flex gap-x-3 rounded-md p-2 text-sm font-medium'
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            <li className="mt-auto">
              <div className="flex items-center gap-x-4 py-3 text-sm font-medium text-gray-900">
                {user?.image ? (
                  <img
                    className="h-8 w-8 rounded-full bg-gray-50"
                    src={user.image}
                    alt=""
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                    {user?.name?.[0] || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="block truncate">{user?.name}</span>
                  {isSuperAdmin && (
                    <span className="text-xs text-purple-600 font-medium">Super Admin</span>
                  )}
                  {user?.role === 'ADMIN' && (
                    <span className="text-xs text-blue-600 font-medium">Admin</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="group -mx-2 flex w-full gap-x-3 rounded-md p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                Sign out
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
