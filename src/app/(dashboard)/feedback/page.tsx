'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Select, Modal, Textarea } from '@/components/ui';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { 
  MessageSquare, 
  Search, 
  Filter,
  Eye,
  Check,
  Star,
  Mail,
  Calendar,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';

interface FeedbackItem {
  id: string;
  locationId: string;
  rating: number;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  status: 'NEW' | 'READ' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  location?: {
    name: string;
    company: {
      id: string;
      name: string;
    };
  };
}

const statusConfig = {
  NEW: { label: 'New', variant: 'error' as const },
  READ: { label: 'Read', variant: 'warning' as const },
  RESOLVED: { label: 'Resolved', variant: 'success' as const },
};

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);

  const fetchFeedback = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      
      const res = await fetch(`/api/feedback?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch feedback');
      const data = await res.json();
      setFeedback(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update feedback');
      await fetchFeedback();
      setSelectedFeedback(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const filteredFeedback = feedback.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.message.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const newCount = feedback.filter(f => f.status === 'NEW').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
          <p className="text-gray-600">
            View and manage customer feedback from low ratings
            {newCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                {newCount} new
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{feedback.length}</p>
              <p className="text-sm text-gray-500">Total Feedback</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{newCount}</p>
              <p className="text-sm text-gray-500">New</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Eye className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {feedback.filter(f => f.status === 'READ').length}
              </p>
              <p className="text-sm text-gray-500">Read</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {feedback.filter(f => f.status === 'RESOLVED').length}
              </p>
              <p className="text-sm text-gray-500">Resolved</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#586c96] focus:border-transparent"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        >
          <option value="all">All Status</option>
          <option value="NEW">New</option>
          <option value="READ">Read</option>
          <option value="RESOLVED">Resolved</option>
        </Select>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-[#586c96] animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchFeedback} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Company / Location</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFeedback.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          'h-4 w-4',
                          star <= item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-sm text-gray-900">{item.location?.company?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{item.location?.name || 'Unknown'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-gray-600 max-w-xs truncate">{item.message}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig[item.status]?.variant || 'default'}>
                    {statusConfig[item.status]?.label || item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </TableCell>
                <TableCell align="right">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedFeedback(item)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}

        {!isLoading && !error && filteredFeedback.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No feedback found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Showing {filteredFeedback.length} of {feedback.length} results
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Feedback Detail Modal */}
      <Modal
        isOpen={!!selectedFeedback}
        onClose={() => setSelectedFeedback(null)}
        title="Feedback Details"
        size="lg"
      >
        {selectedFeedback && (
          <FeedbackDetail
            feedback={selectedFeedback}
            onUpdateStatus={handleUpdateStatus}
            onClose={() => setSelectedFeedback(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function FeedbackDetail({ 
  feedback, 
  onUpdateStatus,
  onClose 
}: { 
  feedback: FeedbackItem; 
  onUpdateStatus: (id: string, status: string) => void;
  onClose: () => void;
}) {
  const [response, setResponse] = useState('');

  return (
    <div className="space-y-6">
      {/* Customer Info */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{feedback.name}</h3>
          <a href={`mailto:${feedback.email}`} className="text-sm text-[#586c96] hover:underline">
            {feedback.email}
          </a>
        </div>
        <Badge variant={statusConfig[feedback.status]?.variant || 'default'}>
          {statusConfig[feedback.status]?.label || feedback.status}
        </Badge>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Rating:</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'h-5 w-5',
                star <= feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              )}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-900">{feedback.rating}/5</span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Building2 className="h-4 w-4" />
          {feedback.location?.company?.name || 'Unknown'}
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {feedback.location?.name || 'Unknown'}
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {formatRelativeTime(feedback.createdAt)}
        </div>
      </div>

      {/* Message */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-500 mb-2">Customer Message:</p>
        <p className="text-gray-900">{feedback.message}</p>
      </div>

      {/* Response */}
      <div>
        <Textarea
          label="Send Response (via email)"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Type your response to the customer..."
          rows={4}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          {feedback.status === 'NEW' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onUpdateStatus(feedback.id, 'READ')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Mark as Read
            </Button>
          )}
          {feedback.status !== 'RESOLVED' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onUpdateStatus(feedback.id, 'RESOLVED')}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark Resolved
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button disabled={!response.trim()}>
            <Mail className="h-4 w-4 mr-1" />
            Send Response
          </Button>
        </div>
      </div>
    </div>
  );
}
