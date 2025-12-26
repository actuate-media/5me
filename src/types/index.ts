// User roles
export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'USER';

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// The superadmin email (hardcoded)
export const SUPERADMIN_EMAIL = 'strategize@actuatemedia.com';

// Company types
export interface Company {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  locationCount?: number;
  sourceCount?: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    locations?: number;
    users?: number;
  };
}

// Location types
export interface Location {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  ratingThreshold: number; // Ratings at or above this show review platforms (default: 4)
  notificationEmails: string[]; // Email addresses to notify on low-rating feedback
  sourceCount?: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    sources?: number;
    clicks?: number;
    feedback?: number;
  };
}

// Review Source types
export type ReviewSourceType = 'google' | 'facebook' | 'yelp' | 'bbb' | 'trustpilot' | 'clutch' | 'other';

export interface ReviewSource {
  id: string;
  locationId: string;
  type: ReviewSourceType;
  name: string;
  url: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

// Feedback (internal reviews from low ratings)
export interface Feedback {
  id: string;
  locationId: string;
  companyId: string;
  rating: number;
  name: string;
  email: string;
  message: string;
  status: 'new' | 'read' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

// Review click tracking
export interface ReviewClick {
  id: string;
  locationId: string;
  sourceId: string;
  rating: number;
  createdAt: string;
}

// Review Request types (for email/SMS automation)
export interface ReviewRequest {
  id: string;
  companyId: string;
  locationId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: 'pending' | 'sent' | 'opened' | 'completed' | 'expired';
  sentAt?: string;
  openedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Widget types
export interface ReviewWidget {
  id: string;
  companyId: string;
  name: string;
  type: 'carousel' | 'grid' | 'list' | 'badge' | 'slider';
  settings: WidgetSettings;
  embedCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface WidgetSettings {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  showRating: boolean;
  showDate: boolean;
  showSource: boolean;
  minRating: number;
  maxReviews: number;
  autoRotate: boolean;
  rotateInterval: number;
}

// Analytics types
export interface ReviewStats {
  totalClicks: number;
  totalFeedback: number;
  averageRating: number;
  clicksBySource: Record<ReviewSourceType, number>;
  clicksByRating: Record<number, number>;
  recentFeedback: Feedback[];
  ratingTrend: RatingTrendPoint[];
}

export interface RatingTrendPoint {
  date: string;
  averageRating: number;
  clickCount: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
