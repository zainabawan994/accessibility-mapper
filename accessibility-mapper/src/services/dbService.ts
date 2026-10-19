import { UserSearchLog, UserActivityLog } from '../types/accessibility';

// Generate or retrieve persistent anonymous session ID
function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem('accessmap_session_id');
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('accessmap_session_id', sid);
    }
    return sid;
  } catch {
    return 'sess_fallback';
  }
}

export interface DbStatusResponse {
  provider: 'supabase' | 'local_fallback';
  isConfigured: boolean;
  isConnected: boolean;
  supabaseUrl?: string;
  hasTables: {
    places: boolean;
    community_reports: boolean;
    user_searches: boolean;
    user_activities: boolean;
  };
  totalPlaces: number;
  totalReports: number;
  totalSearches: number;
  totalActivities: number;
  lastChecked: string;
  error?: string;
}

export interface SearchAnalyticsResponse {
  totalSearches: number;
  topQueries: { query: string; count: number }[];
  topCategories: { category: string; count: number }[];
  recentSearches: UserSearchLog[];
}

export const dbService = {
  // Track user search query & filters
  async trackSearch(params: {
    query: string;
    category?: string;
    statusFilter?: string;
    featureFilter?: string;
    resultsCount: number;
    source?: 'discovery_bar' | 'map_search' | 'voice_search' | 'filter_click';
  }): Promise<void> {
    if (!params.query.trim() && (!params.category || params.category === 'all') && (!params.featureFilter || params.featureFilter === 'all')) {
      return;
    }

    try {
      await fetch('/api/searches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId(),
        },
        body: JSON.stringify({
          sessionId: getSessionId(),
          query: params.query.trim(),
          category: params.category || 'all',
          statusFilter: params.statusFilter || 'all',
          featureFilter: params.featureFilter || 'all',
          resultsCount: params.resultsCount,
          source: params.source || 'discovery_bar',
        }),
      });
    } catch (e) {
      console.warn('Could not record search event:', e);
    }
  },

  // Track user actions and interaction events
  async trackActivity(params: {
    action: 'search' | 'view_place' | 'create_report' | 'upvote_report' | 'ai_classify' | 'add_place' | 'filter_change';
    targetId?: string;
    targetName?: string;
    details?: Record<string, any>;
  }): Promise<void> {
    try {
      await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId(),
        },
        body: JSON.stringify({
          sessionId: getSessionId(),
          ...params,
        }),
      });
    } catch (e) {
      console.warn('Could not record user activity:', e);
    }
  },

  // Fetch recent searches
  async getSearches(limit: number = 50): Promise<UserSearchLog[]> {
    try {
      const res = await fetch(`/api/searches?limit=${limit}`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {
      console.warn('Could not fetch searches:', e);
    }
    return [];
  },

  // Fetch search trends and analytics
  async getSearchAnalytics(): Promise<SearchAnalyticsResponse | null> {
    try {
      const res = await fetch('/api/searches/analytics');
      if (res.ok) {
        const json = await res.json();
        return json.data || null;
      }
    } catch (e) {
      console.warn('Could not fetch search analytics:', e);
    }
    return null;
  },

  // Fetch user activity audit stream
  async getActivities(limit: number = 100): Promise<UserActivityLog[]> {
    try {
      const res = await fetch(`/api/activities?limit=${limit}`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {
      console.warn('Could not fetch user activities:', e);
    }
    return [];
  },

  // Fetch database status and connectivity details
  async getDatabaseStatus(): Promise<DbStatusResponse | null> {
    try {
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const json = await res.json();
        return json.data || null;
      }
    } catch (e) {
      console.warn('Could not fetch db status:', e);
    }
    return null;
  },

  // Synchronize local seed data to Supabase
  async syncSeedToSupabase(): Promise<{ success: boolean; message: string; placesCount?: number; reportsCount?: number }> {
    try {
      const res = await fetch('/api/db/sync-seed', { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.success) {
        return {
          success: true,
          message: json.message,
          placesCount: json.placesCount,
          reportsCount: json.reportsCount,
        };
      }
      return {
        success: false,
        message: json.error || 'Failed to sync data to Supabase',
      };
    } catch (e: any) {
      return {
        success: false,
        message: e.message || 'Network error syncing to Supabase',
      };
    }
  },
};
