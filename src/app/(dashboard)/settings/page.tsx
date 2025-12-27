'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Button, Input, Select, Badge, Modal } from '@/components/ui';
import { 
  User,
  Bell,
  Mail,
  Shield,
  Palette,
  Globe,
  Key,
  Smartphone,
  Check,
  AlertTriangle,
  Users,
  ShieldCheck,
  User as UserIcon,
  MoreVertical,
  Search,
  UserPlus,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User as UserType, UserRole } from '@/types';

type SettingsTab = 'profile' | 'notifications' | 'integrations' | 'smtp' | 'security' | 'users';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saved, setSaved] = useState(false);
  
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN';

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'integrations' as const, label: 'Integrations', icon: Globe },
    { id: 'smtp' as const, label: 'SMTP', icon: Mail },
    { id: 'security' as const, label: 'Security', icon: Shield },
    ...(isAdmin ? [{ id: 'users' as const, label: 'Users', icon: Users }] : []),
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <Card className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-[#f0f3f8] text-[#586c96]'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <ProfileSettings session={session} onSave={handleSave} saved={saved} />
          )}
          {activeTab === 'notifications' && (
            <NotificationSettings onSave={handleSave} saved={saved} />
          )}
          {activeTab === 'integrations' && (
            <IntegrationSettings />
          )}
          {activeTab === 'smtp' && (
            <SmtpSettings onSave={handleSave} saved={saved} />
          )}
          {activeTab === 'security' && (
            <SecuritySettings session={session} />
          )}
          {activeTab === 'users' && isAdmin && (
            <UsersSettings session={session} />
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileSettings({ session, onSave, saved }: { session: ReturnType<typeof useSession>['data']; onSave: () => void; saved: boolean }) {
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    company: 'Actuate Media',
    timezone: 'America/Los_Angeles',
  });

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Settings</h2>
      
      <div className="flex items-center gap-6 mb-8">
        <div className="h-20 w-20 rounded-full bg-[#f0f3f8] flex items-center justify-center overflow-hidden">
          {session?.user?.image ? (
            <img src={session.user.image} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <User className="h-10 w-10 text-[#586c96]" />
          )}
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{session?.user?.name}</h3>
          <p className="text-sm text-gray-500">{session?.user?.email}</p>
          <button className="text-sm text-[#586c96] hover:underline mt-1">
            Change avatar
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          />
          <Select
            label="Timezone"
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
          >
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/New_York">Eastern Time (ET)</option>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 border-t">
        <p className="text-sm text-gray-500">
          Changes will be reflected across all your companies.
        </p>
        <Button onClick={onSave}>
          {saved ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Saved!
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </Card>
  );
}

function NotificationSettings({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  const [settings, setSettings] = useState({
    emailNewFeedback: true,
    emailWeeklySummary: true,
    emailLowRating: true,
    pushNewFeedback: false,
    pushLowRating: true,
    smsLowRating: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Settings</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Notifications
          </h3>
          <div className="space-y-3">
            <NotificationToggle
              label="New feedback received"
              description="Get notified when a customer submits feedback"
              checked={settings.emailNewFeedback}
              onChange={() => toggleSetting('emailNewFeedback')}
            />
            <NotificationToggle
              label="Weekly summary"
              description="Receive a weekly report of your review activity"
              checked={settings.emailWeeklySummary}
              onChange={() => toggleSetting('emailWeeklySummary')}
            />
            <NotificationToggle
              label="Low rating alerts"
              description="Immediate notification for 1-2 star ratings"
              checked={settings.emailLowRating}
              onChange={() => toggleSetting('emailLowRating')}
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Push Notifications
          </h3>
          <div className="space-y-3">
            <NotificationToggle
              label="New feedback"
              description="Push notification for new feedback"
              checked={settings.pushNewFeedback}
              onChange={() => toggleSetting('pushNewFeedback')}
            />
            <NotificationToggle
              label="Low rating alerts"
              description="Immediate push for 1-2 star ratings"
              checked={settings.pushLowRating}
              onChange={() => toggleSetting('pushLowRating')}
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            SMS Notifications
          </h3>
          <div className="space-y-3">
            <NotificationToggle
              label="Low rating SMS alerts"
              description="Text message for critical feedback"
              checked={settings.smsLowRating}
              onChange={() => toggleSetting('smsLowRating')}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8 pt-6 border-t">
        <Button onClick={onSave}>
          {saved ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Saved!
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </Card>
  );
}

function NotificationToggle({ 
  label, 
  description, 
  checked, 
  onChange 
}: { 
  label: string; 
  description: string; 
  checked: boolean; 
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          checked ? 'bg-[#ee5f64]' : 'bg-gray-200'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}

function SmtpSettings({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  const [formData, setFormData] = useState({
    channelName: '',
    apiKey: '',
    senderEmail: '',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load SMTP settings from env vars on mount
  useEffect(() => {
    fetch('/api/settings/smtp')
      .then((res) => res.json())
      .then((data) => {
        setFormData({
          channelName: data.channelName || '',
          apiKey: data.apiKey || '',
          senderEmail: data.senderEmail || '',
        });
        setIsConfigured(data.isConfigured || false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // SMTP settings are stored in env vars (read-only from UI for now)
    onSave();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900">SMTP Settings</h2>
        {!loading && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isConfigured 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isConfigured ? '✓ Configured' : 'Not Configured'}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Configure SMTP.com to send email notifications for feedback and alerts.
      </p>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading settings...</div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Channel Name"
          placeholder="e.g., 5me-notifications"
          value={formData.channelName}
          onChange={(e) => setFormData({ ...formData, channelName: e.target.value })}
          disabled={isConfigured}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              placeholder="Enter your SMTP.com API key"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              disabled={isConfigured}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#586c96] focus:border-transparent pr-20 ${isConfigured ? 'bg-gray-50' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#586c96] hover:underline"
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Find your API key at{' '}
            <a href="https://my.smtp.com/settings/api" target="_blank" rel="noopener noreferrer" className="text-[#586c96] hover:underline">
              my.smtp.com/settings/api
            </a>
          </p>
        </div>

        <Input
          label="Sender Email"
          type="email"
          placeholder="noreply@yourdomain.com"
          value={formData.senderEmail}
          onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
          disabled={isConfigured}
        />

        {isConfigured ? (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">
              ✓ SMTP settings are configured via environment variables.
            </p>
          </div>
        ) : (
          <div className="pt-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Add SMTP settings to your .env.local file.
            </p>
          </div>
        )}
      </form>
      )}

      <TestEmailSection isConfigured={isConfigured} />
    </Card>
  );
}

function TestEmailSection({ isConfigured }: { isConfigured: boolean }) {
  const { data: session } = useSession();
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Pre-populate with user's email on first load
  useEffect(() => {
    if (session?.user?.email && !testEmail) {
      setTestEmail(session.user.email);
    }
  }, [session?.user?.email, testEmail]);

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      setResult({ success: false, message: 'Please enter an email address' });
      return;
    }
    
    setSending(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/settings/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail.trim() }),
      });
      
      const data = await response.json();
      setResult({
        success: data.success,
        message: data.success ? `Test email sent to ${testEmail.trim()}` : (data.error || 'Failed to send'),
      });
    } catch {
      setResult({ success: false, message: 'Network error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-6 p-4 bg-[#586c96]/10 rounded-lg border border-[#586c96]/20">
      <h3 className="font-medium text-[#586c96] mb-1 flex items-center gap-2">
        <Mail className="h-4 w-4" />
        Test Connection
      </h3>
      <p className="text-sm text-gray-600 mb-3">
        Send a test email to verify your SMTP configuration is working.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder={session?.user?.email || 'Enter email address'}
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#586c96] focus:border-transparent"
        />
        <Button 
          variant="primary" 
          size="sm" 
          disabled={!isConfigured || sending}
          onClick={handleSendTest}
        >
          {sending ? 'Sending...' : 'Send Test Email'}
        </Button>
      </div>
      {result && (
        <div className={`mt-3 text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
          {result.success ? '✓' : '✗'} {result.message}
        </div>
      )}
    </div>
  );
}

function IntegrationSettings() {
  const integrations = [
    { 
      name: 'Hub.ActuateMedia.com', 
      description: 'Central management hub', 
      connected: true,
      icon: '🏢'
    },
    { 
      name: 'Google Business Profile', 
      description: 'Sync reviews from Google', 
      connected: true,
      icon: 'G'
    },
    { 
      name: 'Facebook', 
      description: 'Sync reviews from Facebook', 
      connected: false,
      icon: 'f'
    },
    { 
      name: 'Yelp', 
      description: 'Sync reviews from Yelp', 
      connected: false,
      icon: 'Y'
    },
    { 
      name: 'Zapier', 
      description: 'Automate workflows', 
      connected: false,
      icon: '⚡'
    },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Integrations</h2>
      <p className="text-sm text-gray-500 mb-6">Connect your accounts to sync reviews and automate workflows.</p>
      
      <div className="space-y-4">
        {integrations.map((integration) => (
          <div 
            key={integration.name}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-bold">
                {integration.icon}
              </div>
              <div>
                <p className="font-medium text-gray-900">{integration.name}</p>
                <p className="text-sm text-gray-500">{integration.description}</p>
              </div>
            </div>
            {integration.connected ? (
              <div className="flex items-center gap-2">
                <Badge variant="success">Connected</Badge>
                <Button variant="outline" size="sm">Disconnect</Button>
              </div>
            ) : (
              <Button variant="outline" size="sm">Connect</Button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-1 flex items-center gap-2">
          <Key className="h-4 w-4" />
          API Access
        </h3>
        <p className="text-sm text-blue-700 mb-3">
          Use the 5me API to integrate with your custom applications.
        </p>
        <Button variant="outline" size="sm">Generate API Key</Button>
      </div>
    </Card>
  );
}

function SecuritySettings({ session }: { session: ReturnType<typeof useSession>['data'] }) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Security</h2>
      
      <div className="space-y-6">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <Check className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <p className="font-medium text-green-900">Google OAuth Connected</p>
            <p className="text-sm text-green-700">
              You&apos;re signed in with your Google account ({session?.user?.email})
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Active Sessions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Current Session</p>
                  <p className="text-xs text-gray-500">Windows • Chrome • Seattle, WA</p>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Security Actions</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Key className="h-4 w-4 mr-2" />
              Sign out of all other sessions
            </Button>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-red-600 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
            Delete Account
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Users Settings Component (Admin Only)
const roleConfig: Record<UserRole, { label: string; icon: typeof Shield; color: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  SUPERADMIN: { label: 'Super Admin', icon: ShieldCheck, color: 'text-[#ee5f64]', variant: 'default' },
  ADMIN: { label: 'Admin', icon: Shield, color: 'text-[#586c96]', variant: 'info' },
  USER: { label: 'User', icon: UserIcon, color: 'text-gray-600', variant: 'default' },
};

function UsersSettings({ session }: { session: ReturnType<typeof useSession>['data'] }) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
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

  const isSuperAdmin = session?.user?.role === 'SUPERADMIN';
  const canManageUsers = session?.user?.role === 'ADMIN' || isSuperAdmin;

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleEditUser = (user: UserType) => {
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
    regularUsers: users.filter(u => u.role === 'USER').length,
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#586c96]" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchUsers}>Retry</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
            <p className="text-sm text-gray-600">Manage team members and their permissions</p>
          </div>
          {canManageUsers && (
            <Button onClick={() => setIsInviteModalOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-lg font-bold">{stats.total}</span>
            </div>
            <p className="text-xs text-gray-500">Total Users</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-lg font-bold">{stats.active}</span>
            </div>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          <div className="p-3 bg-[#fef2f2] rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#ee5f64]" />
              <span className="text-lg font-bold">{stats.admins}</span>
            </div>
            <p className="text-xs text-gray-500">Admins</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-600" />
              <span className="text-lg font-bold">{stats.regularUsers}</span>
            </div>
            <p className="text-xs text-gray-500">Regular Users</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#586c96] to-[#ee5f64] flex items-center justify-center text-white font-medium">
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
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#586c96] to-[#ee5f64] flex items-center justify-center text-white font-medium">
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
                        ? 'border-[#586c96] bg-[#f0f3f8]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Shield className="w-5 h-5 text-[#586c96]" />
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
                      ? 'border-[#586c96] bg-[#f0f3f8]'
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
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!email) {
      setFormError('Email is required');
      return;
    }

    if (!email.endsWith('@actuatemedia.com')) {
      setFormError('Only @actuatemedia.com emails are allowed');
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
          error={formError}
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
                    ? 'border-[#586c96] bg-[#f0f3f8]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Shield className="w-5 h-5 text-[#586c96]" />
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
                  ? 'border-[#586c96] bg-[#f0f3f8]'
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
