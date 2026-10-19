import { Place } from '../types/accessibility';

export interface SerpApiSearchResult {
  success: boolean;
  source: 'serpapi_live' | 'curated_fallback';
  query: string;
  apiKeyConfigured: boolean;
  totalResults: number;
  places: Place[];
  message?: string;
}

export const serpApiFrontendService = {
  // Check if SerpApi key is set
  async checkStatus(customApiKey?: string): Promise<{ success: boolean; isConfigured: boolean; message: string }> {
    try {
      const url = customApiKey 
        ? `/api/serpapi/status?apiKey=${encodeURIComponent(customApiKey)}`
        : '/api/serpapi/status';
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('SerpApi status check failed:', e);
    }
    return {
      success: false,
      isConfigured: false,
      message: 'Could not connect to SerpApi service',
    };
  },

  // Search real Google Maps venues via SerpApi
  async searchGoogleMaps(params: {
    query: string;
    lat?: number;
    lng?: number;
    zoom?: number;
    apiKey?: string;
  }): Promise<SerpApiSearchResult> {
    try {
      const sp = new URLSearchParams();
      sp.set('q', params.query);
      if (params.lat) sp.set('lat', String(params.lat));
      if (params.lng) sp.set('lng', String(params.lng));
      if (params.zoom) sp.set('zoom', String(params.zoom));
      if (params.apiKey) sp.set('apiKey', params.apiKey);

      const res = await fetch(`/api/serpapi/search?${sp.toString()}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e: any) {
      console.warn('SerpApi search error:', e);
    }

    return {
      success: false,
      source: 'curated_fallback',
      query: params.query,
      apiKeyConfigured: false,
      totalResults: 0,
      places: [],
      message: 'Network error calling SerpApi endpoint',
    };
  },

  // Save venue discovered via SerpApi into Supabase database
  async importPlace(place: Place): Promise<{ success: boolean; message: string; data?: Place }> {
    try {
      const res = await fetch('/api/serpapi/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(place),
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return {
        success: false,
        message: e.message || 'Error importing venue to Supabase',
      };
    }
  },
};
