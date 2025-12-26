'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  Users, 
  Shield, 
  ShieldCheck, 
  User as UserIcon,
  MoreVertical,
  Search,
  UserPlus,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { Card, Button, Input, Badge, Modal, Select } from '@/components/ui';
import type { User, UserRole } from '@/types';

const roleConfig: Record<UserRole, { label: string; icon: typeof Shield; color: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  SUPERADMIN: { label: 'Super Admin', icon: ShieldCheck, color: 'text-purple-600', variant: 'default' },
  ADMIN: { label: 'Admin', icon: Shield, color: 'text-blue-600', variant: 'info' },
  USER: { label: 'User', icon: UserIcon, color: 'text-gray-600', variant: 'default' },
};

export default function UsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Check if user has permission to view this page
  const userRole = session?.user?.role;
  const canManageUsers = userRole === 'SUPERADMIN' || userRole === 'ADMIN';
  const isSuperAdmin = userRole === 'SUPERADMIN';

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <Button onClick={fetchUsers}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!canManageUsers) {
    redirect('/dashboard');
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
    setDropdownOpen(null);
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      const res = await fetch(`/api/users/${user.email}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error('Failed to update user');
      await fetchUsers();
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      const res = await fetch(`/api/users/${user.email}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) throw new Error('Failed to update user');
      await fetchUsers();
      setDropdownOpen(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleInviteUser = async (email: string, role: UserRole) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to invite user');
      }
      await fetchUsers();
      setIsInviteModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to invite user');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  // Stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    admins: users.filter(u => u.role === 'ADMIN' || u.role === 'SUPERADMIN').length,
    users: users.filter(u => u.role === 'USER').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage team members and their permissions</p>
        </div>
        {canManageUsers && (
          <Button onClick={() => setIsInviteModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.admins}</p>
              <p className="text-sm text-gray-600">Admins</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <UserIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.users}</p>
              <p className="text-sm text-gray-600">Regular Users</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-40"
          >
            <option value="all">All Roles</option>
            <option value="SUPERADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">User</option>
          </Select>
        </div>
      </Card>

      {/* Users List */}
      <Card>
        <div className="divide-y divide-gray-100">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No users found</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const config = roleConfig[user.role];
              const RoleIcon = config.icon;
              const isSuperAdminUser = user.role === 'SUPERADMIN';
              const canEditThisUser = isSuperAdmin || (!isSuperAdminUser && canManageUsers);

              return (
                <div key={user.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {user.firstName[0]}{user.lastName[0] || ''}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </h3>
                      {!user.isActive && (
                        <Badge variant="error">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </span>
                      <span className="hidden sm:flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Joined {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 ${config.color}`}>
                      <RoleIcon className="w-3.5 h-3.5" />
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                  </div>

                  {/* Last Login */}
                  <div className="hidden md:block text-sm text-gray-500 w-24 text-right">
                    {formatRelativeTime(user.lastLoginAt)}
                  </div>

                  {/* Actions */}
                  {canEditThisUser && !isSuperAdminUser && (
                    <div className="relative">
                      <button
                        onClick={() => setDropdownOpen(dropdownOpen === user.id ? null : user.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>

                      {dropdownOpen === user.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Shield className="w-4 h-4" />
                            Change Role
                          </button>
                          <button
                            onClick={() => handleToggleActive(user.id)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            {user.isActive ? (
                              <>
                                <XCircle className="w-4 h-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Activate
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Edit Role Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        title="Change User Role"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                {selectedUser.firstName[0]}{selectedUser.lastName[0] || ''}
              </div>
              <div>
                <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Role
              </label>
              <div className="space-y-2">
                {isSuperAdmin && (
                  <button
                    onClick={() => handleUpdateRole(selectedUser.id, 'ADMIN')}
                    className={`w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 transition-colors ${
                      selectedUser.role === 'ADMIN'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Admin</p>
                      <p className="text-sm text-gray-500">Can manage users and all content</p>
                    </div>
                  </button>
                )}
                <button
                  onClick={() => handleUpdateRole(selectedUser.id, 'USER')}
                  className={`w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 transition-colors ${
                    selectedUser.role === 'USER'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <UserIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">User</p>
                    <p className="text-sm text-gray-500">Can view content and manage assigned areas</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteUser}
        canAssignAdmin={isSuperAdmin}
      />

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setDropdownOpen(null)}
        />
      )}
    </div>
  );
}

// Invite User Modal Component
function InviteUserModal({
  isOpen,
  onClose,
  onInvite,
  canAssignAdmin,
}: {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: UserRole) => void;
  canAssignAdmin: boolean;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!email.endsWith('@actuatemedia.com')) {
      setError('Only @actuatemedia.com emails are allowed');
      return;
    }

    onInvite(email.toLowerCase(), role);
    setEmail('');
    setRole('USER');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite User">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="user@actuatemedia.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <div className="space-y-2">
            {canAssignAdmin && (
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 transition-colors ${
                  role === 'ADMIN'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Shield className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">Admin</p>
                  <p className="text-sm text-gray-500">Can manage users and all content</p>
                </div>
              </button>
            )}
            <button
              type="button"
              onClick={() => setRole('USER')}
              className={`w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 transition-colors ${
                role === 'USER'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <UserIcon className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium">User</p>
                <p className="text-sm text-gray-500">Can view content and manage assigned areas</p>
              </div>
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          An email invitation will be sent. Users must sign in with their Google @actuatemedia.com account.
        </p>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <Mail className="w-4 h-4 mr-2" />
            Send Invite
          </Button>
        </div>
      </form>
    </Modal>
  );
}
