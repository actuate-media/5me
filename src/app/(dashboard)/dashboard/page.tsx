import { auth } from '@/lib/auth';
import { Card, Badge } from '@/components/ui';
import { Building2, MapPin, Star, MessageSquare, TrendingUp, ArrowUpRight, ArrowDownRight, ExternalLink, Clock } from 'lucide-react';
import Link from 'next/link';

// Mock data for dashboard
const recentFeedback = [
  { id: '1', name: 'John Smith', rating: 2, message: 'Service was slower than expected...', company: 'Actuate Media', location: 'Seattle HQ', time: '30 min ago' },
  { id: '2', name: 'Sarah Johnson', rating: 3, message: 'Product was okay but could be better...', company: 'Actuate Media', location: 'Portland', time: '2 hours ago' },
  { id: '3', name: 'Mike Wilson', rating: 1, message: 'Very disappointed with my experience...', company: 'Seattle Coffee', location: 'Downtown', time: '5 hours ago' },
];

const recentClicks = [
  { source: 'Google', count: 45, change: 12 },
  { source: 'Facebook', count: 28, change: -3 },
  { source: 'Yelp', count: 19, change: 8 },
];

const topLocations = [
  { name: 'Seattle HQ', company: 'Actuate Media', clicks: 127, rating: 4.8 },
  { name: 'Downtown', company: 'Seattle Coffee', clicks: 98, rating: 4.6 },
  { name: 'Portland Office', company: 'Actuate Media', clicks: 76, rating: 4.5 },
  { name: 'Main Office', company: 'PNW Dental', clicks: 54, rating: 4.9 },
];

export default async function DashboardPage() {
  const session = await auth();

  const stats = [
    { name: 'Total Companies', value: '12', icon: Building2, color: 'bg-blue-500', change: '+2', trend: 'up' },
    { name: 'Total Locations', value: '48', icon: MapPin, color: 'bg-green-500', change: '+5', trend: 'up' },
    { name: 'Review Clicks', value: '2,847', icon: Star, color: 'bg-yellow-500', change: '+18%', trend: 'up' },
    { name: 'Feedback Received', value: '156', icon: MessageSquare, color: 'bg-purple-500', change: '+3', trend: 'up' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-gray-600">Here&apos;s what&apos;s happening with your reviews today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-6">
            <div className="flex items-center justify-between">
              <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className={`flex items-center text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Click Sources */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Clicks by Source</h2>
            <span className="text-sm text-gray-500">Last 7 days</span>
          </div>
          <div className="space-y-4">
            {recentClicks.map((source) => (
              <div key={source.source} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    source.source === 'Google' ? 'bg-blue-100 text-blue-600' :
                    source.source === 'Facebook' ? 'bg-indigo-100 text-indigo-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {source.source[0]}
                  </div>
                  <span className="font-medium text-gray-900">{source.source}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">{source.count}</span>
                  <span className={`text-sm ${source.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {source.change >= 0 ? '+' : ''}{source.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Simple Bar Chart */}
          <div className="mt-6 flex items-end gap-2 h-24">
            {recentClicks.map((source, i) => (
              <div key={source.source} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full rounded-t ${
                    source.source === 'Google' ? 'bg-blue-500' :
                    source.source === 'Facebook' ? 'bg-indigo-500' :
                    'bg-red-500'
                  }`}
                  style={{ height: `${(source.count / 45) * 100}%` }}
                />
                <span className="text-xs text-gray-500 mt-2">{source.source}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Locations */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Top Locations</h2>
            <Link href="/companies" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-4">
            {topLocations.map((location, index) => (
              <div key={location.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{location.name}</p>
                    <p className="text-xs text-gray-500">{location.company}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 text-sm">{location.clicks} clicks</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-500">{location.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/companies"
              className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Manage Companies</span>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </div>
            </Link>
            <Link
              href="/feedback"
              className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm font-medium text-gray-900">View Feedback</span>
                </div>
                <Badge variant="error">3 new</Badge>
              </div>
            </Link>
            <Link
              href="/widgets"
              className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Create Widget</span>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </div>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Feedback */}
      <div className="mt-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Feedback</h2>
            <Link href="/feedback" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-4">
            {recentFeedback.map((feedback) => (
              <div key={feedback.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {feedback.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900">{feedback.name}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${star <= feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{feedback.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{feedback.company} • {feedback.location}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {feedback.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

