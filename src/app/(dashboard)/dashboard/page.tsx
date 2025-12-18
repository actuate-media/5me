import { auth } from '@/lib/auth';
import { Card } from '@/components/ui';
import { Building2, MapPin, Star, MessageSquare } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();

  const stats = [
    { name: 'Total Companies', value: '12', icon: Building2, color: 'bg-blue-500' },
    { name: 'Total Locations', value: '48', icon: MapPin, color: 'bg-green-500' },
    { name: 'Review Clicks', value: '2,847', icon: Star, color: 'bg-yellow-500' },
    { name: 'Feedback Received', value: '156', icon: MessageSquare, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-gray-600">Here&apos;s what&apos;s happening with your reviews today.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500 truncate">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <p className="text-gray-500">No recent activity to show.</p>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/companies"
              className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm font-medium text-gray-900">Manage Companies</span>
              </div>
            </a>
            <a
              href="/feedback"
              className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm font-medium text-gray-900">View Feedback</span>
              </div>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
