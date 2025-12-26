import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Card, Badge } from '@/components/ui';
import { Building2, MapPin, Star, MessageSquare, ArrowUpRight, ExternalLink, Clock } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();

  // Fetch real stats from database
  const [
    companyCount,
    locationCount,
    clickCount,
    feedbackCount,
    recentFeedback,
    topLocations,
    clicksWithSources,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.location.count(),
    prisma.reviewClick.count(),
    prisma.feedback.count(),
    prisma.feedback.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        location: {
          include: {
            company: true,
          },
        },
      },
    }),
    prisma.location.findMany({
      take: 4,
      include: {
        company: true,
        _count: {
          select: { clicks: true },
        },
      },
      orderBy: {
        clicks: { _count: 'desc' },
      },
    }),
    prisma.reviewClick.findMany({
      select: {
        source: {
          select: { type: true },
        },
      },
      take: 1000,
    }),
  ]);

  // Aggregate clicks by source type
  const clicksBySourceMap = new Map<string, number>();
  for (const click of clicksWithSources) {
    const type = click.source.type;
    clicksBySourceMap.set(type, (clicksBySourceMap.get(type) ?? 0) + 1);
  }
  const clicksBySource = Array.from(clicksBySourceMap.entries())
    .map(([sourceType, count]) => ({ sourceType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Get new feedback count (status = NEW)
  const newFeedbackCount = await prisma.feedback.count({
    where: { status: 'NEW' },
  });

  const stats = [
    { name: 'Total Companies', value: companyCount.toString(), icon: Building2, color: 'bg-blue-500' },
    { name: 'Total Locations', value: locationCount.toString(), icon: MapPin, color: 'bg-green-500' },
    { name: 'Review Clicks', value: clickCount.toLocaleString(), icon: Star, color: 'bg-yellow-500' },
    { name: 'Feedback Received', value: feedbackCount.toString(), icon: MessageSquare, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name?.split(' ')[0] ?? 'User'}
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
              {stat.value !== '0' && (
                <div className="flex items-center text-sm text-green-600">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              )}
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
            <span className="text-sm text-gray-500">All time</span>
          </div>
          {clicksBySource.length > 0 ? (
            <div className="space-y-4">
              {clicksBySource.map((source) => (
                <div key={source.sourceType} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      source.sourceType === 'GOOGLE' ? 'bg-blue-100 text-blue-600' :
                      source.sourceType === 'FACEBOOK' ? 'bg-indigo-100 text-indigo-600' :
                      source.sourceType === 'YELP' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {source.sourceType?.[0] ?? '?'}
                    </div>
                    <span className="font-medium text-gray-900 capitalize">{source.sourceType?.toLowerCase() ?? 'Unknown'}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{source.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Star className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No clicks recorded yet</p>
            </div>
          )}
        </Card>

        {/* Top Locations */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Top Locations</h2>
            <Link href="/companies" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          {topLocations.length > 0 ? (
            <div className="space-y-4">
              {topLocations.map((location, index) => (
                <div key={location.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{location.name}</p>
                      <p className="text-xs text-gray-500">{location.company.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 text-sm">{location._count.clicks} clicks</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No locations yet</p>
              <Link href="/companies" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
                Add your first company
              </Link>
            </div>
          )}
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
                {newFeedbackCount > 0 && <Badge variant="error">{newFeedbackCount} new</Badge>}
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
          {recentFeedback.length > 0 ? (
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
                      <span>{feedback.location?.company.name} • {feedback.location?.name}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(feedback.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No feedback received yet</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

