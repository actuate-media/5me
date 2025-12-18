import api from './api';
import type { Company, Location, ReviewSource, PaginatedResponse } from '@/types';

export const companyService = {
  // Companies
  async getCompanies(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Company>> {
    const response = await api.get<PaginatedResponse<Company>>('/companies', { params });
    return response.data;
  },

  async getCompany(id: string): Promise<Company> {
    const response = await api.get<Company>(`/companies/${id}`);
    return response.data;
  },

  async getCompanyBySlug(slug: string): Promise<Company & { locations: Location[] }> {
    const response = await api.get<Company & { locations: Location[] }>(`/companies/slug/${slug}`);
    return response.data;
  },

  async createCompany(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'locationCount' | 'sourceCount'>): Promise<Company> {
    const response = await api.post<Company>('/companies', data);
    return response.data;
  },

  async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
    const response = await api.patch<Company>(`/companies/${id}`, data);
    return response.data;
  },

  async deleteCompany(id: string): Promise<void> {
    await api.delete(`/companies/${id}`);
  },

  // Locations
  async getLocations(companyId: string): Promise<Location[]> {
    const response = await api.get<Location[]>(`/companies/${companyId}/locations`);
    return response.data;
  },

  async getLocation(companyId: string, locationId: string): Promise<Location> {
    const response = await api.get<Location>(`/companies/${companyId}/locations/${locationId}`);
    return response.data;
  },

  async getLocationBySlug(companySlug: string, locationSlug: string): Promise<Location & { sources: ReviewSource[] }> {
    const response = await api.get<Location & { sources: ReviewSource[] }>(`/locations/slug/${companySlug}/${locationSlug}`);
    return response.data;
  },

  async createLocation(companyId: string, data: Omit<Location, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'sourceCount'>): Promise<Location> {
    const response = await api.post<Location>(`/companies/${companyId}/locations`, data);
    return response.data;
  },

  async updateLocation(companyId: string, locationId: string, data: Partial<Location>): Promise<Location> {
    const response = await api.patch<Location>(`/companies/${companyId}/locations/${locationId}`, data);
    return response.data;
  },

  async deleteLocation(companyId: string, locationId: string): Promise<void> {
    await api.delete(`/companies/${companyId}/locations/${locationId}`);
  },

  // Sources
  async getSources(locationId: string): Promise<ReviewSource[]> {
    const response = await api.get<ReviewSource[]>(`/locations/${locationId}/sources`);
    return response.data;
  },

  async createSource(locationId: string, data: Omit<ReviewSource, 'id' | 'locationId' | 'createdAt' | 'updatedAt'>): Promise<ReviewSource> {
    const response = await api.post<ReviewSource>(`/locations/${locationId}/sources`, data);
    return response.data;
  },

  async updateSource(locationId: string, sourceId: string, data: Partial<ReviewSource>): Promise<ReviewSource> {
    const response = await api.patch<ReviewSource>(`/locations/${locationId}/sources/${sourceId}`, data);
    return response.data;
  },

  async deleteSource(locationId: string, sourceId: string): Promise<void> {
    await api.delete(`/locations/${locationId}/sources/${sourceId}`);
  },
};
