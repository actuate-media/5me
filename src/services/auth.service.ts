import api from './api';
import type { User } from '@/types';

const TOKEN_KEY = '5me_access_token';
const REFRESH_TOKEN_KEY = '5me_refresh_token';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface ApiKey {
  id: string;
  name: string;
  scopes: string[];
  lastUsed: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export const authService = {
  // Google OAuth - Primary login method for Actuate Media employees
  async getGoogleAuthUrl(): Promise<{ url: string }> {
    const response = await api.get<{ url: string }>('/auth/google');
    return response.data;
  },

  async handleGoogleCallback(code: string): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await api.post<{ user: User; tokens: AuthTokens }>('/auth/google/callback', { code });
    const { user, tokens } = response.data;
    this.setTokens(tokens);
    return { user, tokens };
  },

  // Traditional login (fallback for non-Google users)
  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await api.post<{ user: User; tokens: AuthTokens }>('/auth/login', {
      email,
      password,
    });
    const { user, tokens } = response.data;
    this.setTokens(tokens);
    return { user, tokens };
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      this.clearTokens();
    }
  },

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await api.post<AuthTokens>('/auth/refresh', { refreshToken });
    this.setTokens(response.data);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password });
  },

  // API Key management (for external integrations from hub.actuatemedia.com)
  async getApiKeys(): Promise<ApiKey[]> {
    const response = await api.get<ApiKey[]>('/auth/api-keys');
    return response.data;
  },

  async createApiKey(name: string, scopes: string[]): Promise<ApiKey & { key: string }> {
    const response = await api.post<ApiKey & { key: string }>('/auth/api-keys', { name, scopes });
    return response.data;
  },

  async revokeApiKey(id: string): Promise<void> {
    await api.delete(`/auth/api-keys/${id}`);
  },

  // Token management
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens(tokens: AuthTokens): void {
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
  },

  clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },
};
