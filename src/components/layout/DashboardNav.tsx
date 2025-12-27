'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  Settings,
  Code,
  HelpCircle,
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

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help & Support', href: '/help', icon: HelpCircle },
];

interface DashboardNavProps {
  user?: NavUser | null;
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();

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
                          ? 'bg-[#f0f3f8] text-[#586c96]'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-[#586c96]',
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

            {/* Bottom Navigation - Settings & Help */}
            <li className="mt-auto">
              <ul role="list" className="-mx-2 space-y-1">
                {bottomNavigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        pathname === item.href
                          ? 'bg-[#f0f3f8] text-[#586c96]'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-[#586c96]',
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
          </ul>
        </nav>
      </div>
    </div>
  );
}
