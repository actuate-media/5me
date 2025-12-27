'use client';

import { useState, use, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { 
  ArrowLeft,
  Building2,
  MapPin,
  Globe,
  Eye,
  Star,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Users,
  MousePointerClick,
  Calendar,
  BarChart3,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Company } from '@/types';

interface AnalyticsData {
  pageViews: number;
  pageViewsTrend: number;
  uniqueVisitors: number;
  uniqueVisitorsTrend: number;
  totalClicks: number;
  clicksTrend: number;
  feedbackCount: number;
  feedbackTrend: number;
  averageRating: number;
  ratingTrend: number;
  positiveRatings: number;
  negativeRatings: number;
  locationStats: {
    id: string;
    name: string;
    city: string;
    state: string;
    pageViews: number;
    clicks: number;
    feedbackCount: number;
    averageRating: number;
  }[];
  sourceStats: {
    type: string;
    name: string;
    clicks: number;
    percentage: number;
  }[];
  ratingDistribution: {
    rating: number;
    count: number;
  }[];
  recentFeedback: {
    id: string;
    rating: number;
    comment: string;
    locationName: string;
    createdAt: string;
  }[];
  dailyStats: {
    date: string;
    pageViews: number;
    clicks: number;
    feedback: number;
  }[];
}

export default function CompanyAnalyticsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const [company, setCompany] = useState<Company | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch company data
      const companyRes = await fetch(`/api/companies/${companyId}`);
      if (!companyRes.ok) throw new Error('Failed to fetch company');
      const companyData = await companyRes.json();
      setCompany(companyData);
      
      // Fetch analytics data
      const analyticsRes = await fetch(`/api/companies/${companyId}/analytics?range=${dateRange}`);
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      } else {
        // If analytics endpoint doesn't exist yet, use mock data
        setAnalytics(generateMockAnalytics(companyData));
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-[#586c96] animate-spin" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Company not found'}</p>
        <Link href="/companies">
          <Button variant="outline" className="mt-4">
            Back to Companies
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/companies" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Companies
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-[#f0f3f8] flex items-center justify-center">
                <Building2 className="h-8 w-8 text-[#586c96]" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{company.name} Analytics</h1>
              <p className="text-gray-600">Performance metrics and insights</p>
            </div>
          </div>
          
          {/* Date Range Selector */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                  dateRange === range
                    ? 'bg-white shadow-sm text-[#586c96]'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {analytics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <MetricCard
              icon={Eye}
              label="Page Views"
              value={analytics.pageViews.toLocaleString()}
              trend={analytics.pageViewsTrend}
              color="blue"
            />
            <MetricCard
              icon={Users}
              label="Unique Visitors"
              value={analytics.uniqueVisitors.toLocaleString()}
              trend={analytics.uniqueVisitorsTrend}
              color="purple"
            />
            <MetricCard
              icon={MousePointerClick}
              label="Review Clicks"
              value={analytics.totalClicks.toLocaleString()}
              trend={analytics.clicksTrend}
              color="green"
            />
            <MetricCard
              icon={MessageSquare}
              label="Feedback Received"
              value={analytics.feedbackCount.toLocaleString()}
              trend={analytics.feedbackTrend}
              color="orange"
            />
            <MetricCard
              icon={Star}
              label="Avg. Rating"
              value={analytics.averageRating.toFixed(1)}
              trend={analytics.ratingTrend}
              color="yellow"
              suffix="/5"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Rating Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-[#ee5f64]" />
                Rating Distribution
              </h3>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const data = analytics.ratingDistribution.find(r => r.rating === rating);
                  const count = data?.count || 0;
                  const total = analytics.ratingDistribution.reduce((sum, r) => sum + r.count, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-12">
                        <span className="text-sm font-medium text-gray-700">{rating}</span>
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      </div>
                      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            rating >= 4 ? "bg-green-500" : rating === 3 ? "bg-yellow-500" : "bg-red-500"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-16 text-right">{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                <span className="text-green-600 font-medium">
                  👍 {analytics.positiveRatings} positive ({analytics.feedbackCount > 0 ? ((analytics.positiveRatings / analytics.feedbackCount) * 100).toFixed(0) : 0}%)
                </span>
                <span className="text-red-600 font-medium">
                  👎 {analytics.negativeRatings} negative ({analytics.feedbackCount > 0 ? ((analytics.negativeRatings / analytics.feedbackCount) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </Card>

            {/* Top Review Sources */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-[#586c96]" />
                Top Review Sources
              </h3>
              {analytics.sourceStats.length > 0 ? (
                <div className="space-y-3">
                  {analytics.sourceStats.slice(0, 5).map((source, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{source.name}</p>
                        <p className="text-xs text-gray-500">{source.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{source.clicks} clicks</p>
                        <p className="text-xs text-gray-500">{source.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Globe className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No click data yet</p>
                </div>
              )}
            </Card>
          </div>

          {/* Location Performance */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#ee5f64]" />
              Location Performance
            </h3>
            {analytics.locationStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Location</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Page Views</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Clicks</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Feedback</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Avg. Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.locationStats.map((location) => (
                      <tr key={location.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{location.name}</p>
                            <p className="text-sm text-gray-500">{location.city}, {location.state}</p>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 font-medium">{location.pageViews.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 font-medium">{location.clicks.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 font-medium">{location.feedbackCount}</td>
                        <td className="text-right py-3 px-4">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium",
                            location.averageRating >= 4 ? "bg-green-100 text-green-700" :
                            location.averageRating >= 3 ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          )}>
                            <Star className="h-3 w-3" />
                            {location.averageRating.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No location data yet</p>
              </div>
            )}
          </Card>

          {/* Recent Feedback */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#586c96]" />
              Recent Feedback
            </h3>
            {analytics.recentFeedback.length > 0 ? (
              <div className="space-y-4">
                {analytics.recentFeedback.map((feedback) => (
                  <div key={feedback.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                      feedback.rating >= 4 ? "bg-green-100" : feedback.rating >= 3 ? "bg-yellow-100" : "bg-red-100"
                    )}>
                      <span className={cn(
                        "text-lg font-bold",
                        feedback.rating >= 4 ? "text-green-600" : feedback.rating >= 3 ? "text-yellow-600" : "text-red-600"
                      )}>
                        {feedback.rating}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{feedback.locationName}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{feedback.comment || 'No comment provided'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No feedback yet</p>
              </div>
            )}
            {analytics.recentFeedback.length > 0 && (
              <div className="mt-4 text-center">
                <Link href="/feedback">
                  <Button variant="outline" size="sm">View All Feedback</Button>
                </Link>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  trend?: number;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'yellow';
  suffix?: string;
}

function MetricCard({ icon: Icon, label, value, trend, color, suffix }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={cn('p-2 rounded-lg', colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={cn(
            'flex items-center gap-0.5 text-sm font-medium',
            trend > 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </Card>
  );
}

// Generate mock analytics data for demo
function generateMockAnalytics(company: Company): AnalyticsData {
  const locations = company.locations || [];
  
  return {
    pageViews: Math.floor(Math.random() * 5000) + 500,
    pageViewsTrend: Math.floor(Math.random() * 40) - 10,
    uniqueVisitors: Math.floor(Math.random() * 2000) + 200,
    uniqueVisitorsTrend: Math.floor(Math.random() * 30) - 5,
    totalClicks: Math.floor(Math.random() * 1000) + 100,
    clicksTrend: Math.floor(Math.random() * 50) - 15,
    feedbackCount: Math.floor(Math.random() * 100) + 10,
    feedbackTrend: Math.floor(Math.random() * 20) - 5,
    averageRating: 3.5 + Math.random() * 1.5,
    ratingTrend: Math.floor(Math.random() * 10) - 3,
    positiveRatings: Math.floor(Math.random() * 80) + 20,
    negativeRatings: Math.floor(Math.random() * 20) + 5,
    locationStats: locations.map((loc: { id: string; name: string; city?: string; state?: string }) => ({
      id: loc.id,
      name: loc.name,
      city: loc.city || 'Unknown',
      state: loc.state || '',
      pageViews: Math.floor(Math.random() * 1000) + 100,
      clicks: Math.floor(Math.random() * 200) + 20,
      feedbackCount: Math.floor(Math.random() * 30) + 5,
      averageRating: 3 + Math.random() * 2,
    })),
    sourceStats: [
      { type: 'GOOGLE', name: 'Google Reviews', clicks: Math.floor(Math.random() * 300) + 50, percentage: 45 },
      { type: 'FACEBOOK', name: 'Facebook', clicks: Math.floor(Math.random() * 200) + 30, percentage: 25 },
      { type: 'YELP', name: 'Yelp', clicks: Math.floor(Math.random() * 100) + 20, percentage: 15 },
      { type: 'TRIPADVISOR', name: 'TripAdvisor', clicks: Math.floor(Math.random() * 50) + 10, percentage: 10 },
      { type: 'OTHER', name: 'Other', clicks: Math.floor(Math.random() * 30) + 5, percentage: 5 },
    ],
    ratingDistribution: [
      { rating: 5, count: Math.floor(Math.random() * 50) + 20 },
      { rating: 4, count: Math.floor(Math.random() * 30) + 15 },
      { rating: 3, count: Math.floor(Math.random() * 15) + 5 },
      { rating: 2, count: Math.floor(Math.random() * 10) + 2 },
      { rating: 1, count: Math.floor(Math.random() * 5) + 1 },
    ],
    recentFeedback: [
      {
        id: '1',
        rating: 5,
        comment: 'Excellent service! Would highly recommend to friends and family.',
        locationName: locations[0]?.name || 'Main Location',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '2',
        rating: 4,
        comment: 'Great experience overall, minor issues with wait time.',
        locationName: locations[0]?.name || 'Main Location',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: '3',
        rating: 2,
        comment: 'Service was slower than expected. Room for improvement.',
        locationName: locations[1]?.name || 'Secondary Location',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
      },
    ],
    dailyStats: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0] as string,
      pageViews: Math.floor(Math.random() * 200) + 50,
      clicks: Math.floor(Math.random() * 50) + 10,
      feedback: Math.floor(Math.random() * 5),
    })),
  };
}
