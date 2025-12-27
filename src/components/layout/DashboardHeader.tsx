'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, Settings, HelpCircle, LogOut, User, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import type { User as NextAuthUser } from 'next-auth';

interface DashboardHeaderProps {
  user?: NextAuthUser | null;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get initials from name
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      const first = parts[0]?.[0] || '';
      const last = parts[parts.length - 1]?.[0] || '';
      return `${first}${last}`.toUpperCase() || 'U';
    }
    return parts[0]?.[0]?.toUpperCase() || 'U';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" />
      </button>

      <div className="h-6 w-px bg-gray-200 lg:hidden" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1" />
        
        {/* Profile Dropdown */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 rounded-full py-1.5 px-2 hover:bg-gray-50 transition-colors"
            >
              {/* Avatar */}
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || 'Profile'}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-[#586c96] flex items-center justify-center text-white text-sm font-semibold ring-2 ring-white shadow-sm">
                  {getInitials(user?.name)}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate max-w-[150px]">{user?.email}</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-500 hidden lg:block transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-lg ring-1 ring-gray-200 py-1 z-50">
                {/* Mobile-only user info */}
                <div className="px-4 py-3 border-b border-gray-100 lg:hidden">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User className="h-4 w-4" />
                  Your Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <Link
                  href="/help"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <HelpCircle className="h-4 w-4" />
                  Help & Support
                </Link>
                
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
