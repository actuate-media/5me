'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Button, Input, Select, Badge } from '@/components/ui';
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
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'notifications' | 'integrations' | 'security';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saved, setSaved] = useState(false);

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'integrations' as const, label: 'Integrations', icon: Globe },
    { id: 'security' as const, label: 'Security', icon: Shield },
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
          {activeTab === 'security' && (
            <SecuritySettings session={session} />
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
