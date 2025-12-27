'use client';

import { useState, use, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, Button, Badge, Select, Modal, Textarea } from '@/components/ui';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { 
  MessageSquare, 
  Search, 
  Eye,
  Check,
  Star,
  Mail,
  Calendar,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Company } from '@/types';

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

export default function CompanyFeedbackPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const [company, setCompany] = useState<Company | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch company
      const companyRes = await fetch(`/api/companies/${companyId}`);
      if (!companyRes.ok) throw new Error('Failed to fetch company');
      const companyData = await companyRes.json();
      setCompany(companyData);
      
      // Fetch feedback for this company
      const params = new URLSearchParams();
      params.set('companyId', companyId);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      
      const feedbackRes = await fetch(`/api/feedback?${params.toString()}`);
      if (!feedbackRes.ok) throw new Error('Failed to fetch feedback');
      const feedbackData = await feedbackRes.json();
      setFeedback(feedbackData);
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, statusFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update feedback');
      await fetchData();
      setSelectedFeedback(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    try {
      const res = await fetch(`/api/feedback/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete feedback');
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const filteredFeedback = feedback.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.message.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredFeedback.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFeedback = filteredFeedback.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, itemsPerPage]);

  const newCount = feedback.filter(f => f.status === 'NEW').length;

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
              <h1 className="text-2xl font-bold text-gray-900">{company.name} Feedback</h1>
              <p className="text-gray-600">
                View and manage customer feedback
                {newCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    {newCount} new
                  </span>
                )}
              </p>
            </div>
          </div>
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#586c96] focus:border-transparent transition-all"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="NEW">New</option>
            <option value="READ">Read</option>
            <option value="RESOLVED">Resolved</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Feedback</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFeedback.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="text-sm text-gray-600 whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                    <br />
                    <span className="text-gray-400">
                      {new Date(item.createdAt).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      }).toLowerCase()}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-gray-900">{item.name}</span>
                </TableCell>
                <TableCell>
                  <a href={`mailto:${item.email}`} className="text-[#586c96] hover:underline">
                    {item.email}
                  </a>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-700">{item.location?.name || 'Unknown'}</span>
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
                    <span className="text-sm text-gray-500 ml-1">({item.rating}/5)</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <p className="text-sm text-gray-600 truncate">{item.message}</p>
                    <button 
                      onClick={() => setSelectedFeedback(item)}
                      className="text-[#586c96] text-sm hover:underline"
                    >
                      View Full
                    </button>
                  </div>
                </TableCell>
                <TableCell align="right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setSelectedFeedback(item)}
                      className="p-2 text-[#586c96] hover:bg-[#f0f3f8] rounded-lg transition-colors"
                      title="Send Email Response"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFeedback(item.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Feedback"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredFeedback.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No feedback found</h3>
            <p className="text-gray-500">
              {search || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'No feedback has been submitted for this company yet.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500">
              Showing {Math.min(startIndex + 1, filteredFeedback.length)}-{Math.min(endIndex, filteredFeedback.length)} of {filteredFeedback.length} results
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Show:</span>
              <Select
                value={itemsPerPage.toString()}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="w-20"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[80px] text-center">
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
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
          {feedback.phone && (
            <p className="text-sm text-gray-500">{feedback.phone}</p>
          )}
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
          <MapPin className="h-4 w-4" />
          {feedback.location?.name || 'Unknown'}
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {formatRelativeTime(feedback.createdAt)}
        </div>
      </div>

      {/* Feedback */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-500 mb-2">Customer Feedback:</p>
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
