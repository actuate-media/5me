import api from './api';
import type { Feedback, ReviewClick, ReviewStats, PaginatedResponse } from '@/types';

export const feedbackService = {
  // Feedback (internal reviews from low ratings)
  async getFeedback(params?: {
    companyId?: string;
    locationId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Feedback>> {
    const response = await api.get<PaginatedResponse<Feedback>>('/feedback', { params });
    return response.data;
  },

  async getFeedbackItem(id: string): Promise<Feedback> {
    const response = await api.get<Feedback>(`/feedback/${id}`);
    return response.data;
  },

  async submitFeedback(data: {
    locationId: string;
    rating: number;
    name: string;
    email: string;
    message: string;
  }): Promise<Feedback> {
    const response = await api.post<Feedback>('/feedback', data);
    return response.data;
  },

  async updateFeedbackStatus(id: string, status: Feedback['status']): Promise<Feedback> {
    const response = await api.patch<Feedback>(`/feedback/${id}`, { status });
    return response.data;
  },

  // Review Clicks (tracking when users click to leave reviews)
  async trackClick(data: {
    locationId: string;
    sourceId: string;
    rating: number;
  }): Promise<ReviewClick> {
    const response = await api.post<ReviewClick>('/clicks', data);
    return response.data;
  },

  // Stats
  async getStats(params?: {
    companyId?: string;
    locationId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ReviewStats> {
    const response = await api.get<ReviewStats>('/stats', { params });
    return response.data;
  },
};
