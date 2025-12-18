import api from './api';
import type { ReviewWidget, WidgetSettings, PaginatedResponse } from '@/types';

export const widgetsService = {
  async getWidgets(businessId?: string): Promise<PaginatedResponse<ReviewWidget>> {
    const response = await api.get<PaginatedResponse<ReviewWidget>>('/widgets', {
      params: { businessId },
    });
    return response.data;
  },

  async getWidget(id: string): Promise<ReviewWidget> {
    const response = await api.get<ReviewWidget>(`/widgets/${id}`);
    return response.data;
  },

  async createWidget(data: {
    businessId: string;
    name: string;
    type: ReviewWidget['type'];
    settings: WidgetSettings;
  }): Promise<ReviewWidget> {
    const response = await api.post<ReviewWidget>('/widgets', data);
    return response.data;
  },

  async updateWidget(id: string, data: Partial<{
    name: string;
    type: ReviewWidget['type'];
    settings: Partial<WidgetSettings>;
  }>): Promise<ReviewWidget> {
    const response = await api.patch<ReviewWidget>(`/widgets/${id}`, data);
    return response.data;
  },

  async deleteWidget(id: string): Promise<void> {
    await api.delete(`/widgets/${id}`);
  },

  async getEmbedCode(id: string): Promise<string> {
    const response = await api.get<{ embedCode: string }>(`/widgets/${id}/embed`);
    return response.data.embedCode;
  },
};
