import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Place, CommunityReport, UserSearchLog, UserActivityLog } from '../../src/types/accessibility';
import { dbStore } from './store';
import { INITIAL_PLACES, INITIAL_REPORTS } from '../../src/data/mockPlaces';

export interface DatabaseStatus {
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

class SupabaseService {
  private client: SupabaseClient | null = null;
  private isConfigured: boolean = false;
  private isConnected: boolean = false;
  private tableStatus = {
    places: false,
    community_reports: false,
    user_searches: false,
    user_activities: false,
  };
  private lastError: string | null = null;

  constructor() {
    this.initialize();
  }

  public initialize() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = 
      process.env.SUPABASE_SERVICE_ROLE_KEY || 
      process.env.SUPABASE_ANON_KEY || 
      process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_SUPABASE_PROJECT_URL')) {
      try {
        this.client = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        });
        this.isConfigured = true;
        console.log(`🔌 Supabase Client initialized for project: ${supabaseUrl}`);
        this.verifyConnection();
      } catch (err: any) {
        console.warn('⚠️ Supabase client initialization failed:', err.message);
        this.isConfigured = false;
        this.client = null;
        this.lastError = err.message;
      }
    } else {
      this.isConfigured = false;
      this.client = null;
      console.log('ℹ️ Supabase credentials not found or placeholder used; active in Local Resilient Fallback mode.');
    }
  }

  public async verifyConnection(): Promise<boolean> {
    if (!this.client || !this.isConfigured) {
      this.isConnected = false;
      return false;
    }

    try {
      // Check places table
      const { data: placesData, error: placesErr } = await this.client
        .from('places')
        .select('id')
        .limit(1);

      this.tableStatus.places = !placesErr;

      // Check reports table
      const { data: repData, error: repErr } = await this.client
        .from('community_reports')
        .select('id')
        .limit(1);

      this.tableStatus.community_reports = !repErr;

      // Check searches table
      const { data: searchData, error: searchErr } = await this.client
        .from('user_searches')
        .select('id')
        .limit(1);

      this.tableStatus.user_searches = !searchErr;

      // Check activities table
      const { data: actData, error: actErr } = await this.client
        .from('user_activities')
        .select('id')
        .limit(1);

      this.tableStatus.user_activities = !actErr;

      this.isConnected = !placesErr || !repErr || !searchErr;
      if (this.isConnected) {
        console.log('✅ Supabase connected successfully to database tables.');
      } else {
        console.warn('⚠️ Supabase reached but tables might not exist yet. Please execute supabase/schema.sql in Supabase SQL Editor.');
      }
      return this.isConnected;
    } catch (e: any) {
      this.isConnected = false;
      this.lastError = e.message;
      console.warn('⚠️ Supabase connection check failed:', e.message);
      return false;
    }
  }

  public async getStatus(): Promise<DatabaseStatus> {
    const stats = dbStore.getStats();
    let supabasePlacesCount = stats.totalPlaces;
    let supabaseReportsCount = stats.totalReports;
    let supabaseSearchesCount = stats.totalSearches;
    let supabaseActivitiesCount = stats.totalActivities;

    if (this.client && this.isConfigured) {
      try {
        if (this.tableStatus.places) {
          const { count } = await this.client.from('places').select('*', { count: 'exact', head: true });
          if (typeof count === 'number') supabasePlacesCount = count;
        }
        if (this.tableStatus.community_reports) {
          const { count } = await this.client.from('community_reports').select('*', { count: 'exact', head: true });
          if (typeof count === 'number') supabaseReportsCount = count;
        }
        if (this.tableStatus.user_searches) {
          const { count } = await this.client.from('user_searches').select('*', { count: 'exact', head: true });
          if (typeof count === 'number') supabaseSearchesCount = count;
        }
        if (this.tableStatus.user_activities) {
          const { count } = await this.client.from('user_activities').select('*', { count: 'exact', head: true });
          if (typeof count === 'number') supabaseActivitiesCount = count;
        }
      } catch {}
    }

    return {
      provider: this.client && this.isConnected ? 'supabase' : 'local_fallback',
      isConfigured: this.isConfigured,
      isConnected: this.isConnected,
      supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || undefined,
      hasTables: { ...this.tableStatus },
      totalPlaces: supabasePlacesCount,
      totalReports: supabaseReportsCount,
      totalSearches: supabaseSearchesCount,
      totalActivities: supabaseActivitiesCount,
      lastChecked: new Date().toISOString(),
      error: this.lastError || undefined,
    };
  }

  // --- PLACES ---

  public async getAllPlaces(filters?: { category?: string; accessibilityLevel?: string; query?: string }): Promise<Place[]> {
    if (this.client && this.isConfigured && this.tableStatus.places) {
      try {
        let query = this.client.from('places').select('*');
        if (filters?.category && filters.category !== 'all') {
          query = query.eq('category', filters.category);
        }
        if (filters?.accessibilityLevel && filters.accessibilityLevel !== 'all') {
          query = query.eq('accessibility_level', filters.accessibilityLevel);
        }
        if (filters?.query) {
          query = query.or(`name.ilike.%${filters.query}%,address.ilike.%${filters.query}%,category.ilike.%${filters.query}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map(this.mapRowToPlace);
        }
      } catch (err: any) {
        console.warn('Supabase getAllPlaces failed, falling back to local store:', err.message);
      }
    }

    return dbStore.getAllPlaces(filters);
  }

  public async getPlaceById(id: string): Promise<Place | undefined> {
    if (this.client && this.isConfigured && this.tableStatus.places) {
      try {
        const { data, error } = await this.client
          .from('places')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) {
          return this.mapRowToPlace(data);
        }
      } catch (err: any) {
        console.warn('Supabase getPlaceById failed, falling back to local store:', err.message);
      }
    }
    return dbStore.getPlaceById(id);
  }

  public async addPlace(placeData: Omit<Place, 'id' | 'lastUpdated' | 'photosCount' | 'reportsCount'>): Promise<Place> {
    // Always persist to local store first for resilience
    const localPlace = dbStore.addPlace(placeData);

    if (this.client && this.isConfigured && this.tableStatus.places) {
      try {
        const row = this.mapPlaceToRow(localPlace);
        const { error } = await this.client.from('places').upsert(row);
        if (error) {
          console.warn('Supabase addPlace sync error:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase addPlace exception:', err.message);
      }
    }

    return localPlace;
  }

  public async updatePlace(id: string, updates: Partial<Place>): Promise<Place | null> {
    const updatedLocal = dbStore.updatePlace(id, updates);
    if (!updatedLocal) return null;

    if (this.client && this.isConfigured && this.tableStatus.places) {
      try {
        const row = this.mapPlaceToRow(updatedLocal);
        await this.client.from('places').upsert(row);
      } catch (err: any) {
        console.warn('Supabase updatePlace sync error:', err.message);
      }
    }
    return updatedLocal;
  }

  public async deletePlace(id: string): Promise<boolean> {
    const success = dbStore.deletePlace(id);

    if (this.client && this.isConfigured && this.tableStatus.places) {
      try {
        await this.client.from('places').delete().eq('id', id);
        if (this.tableStatus.community_reports) {
          await this.client.from('community_reports').delete().eq('place_id', id);
        }
      } catch (err: any) {
        console.warn('Supabase deletePlace sync error:', err.message);
      }
    }
    return success;
  }

  public async toggleVerifyPlace(id: string): Promise<Place | null> {
    const place = dbStore.toggleVerifyPlace(id);
    if (!place) return null;

    if (this.client && this.isConfigured && this.tableStatus.places) {
      try {
        await this.client
          .from('places')
          .update({
            verified_by_community: place.verifiedByCommunity,
            last_updated: place.lastUpdated,
          })
          .eq('id', id);
      } catch (err: any) {
        console.warn('Supabase toggleVerifyPlace sync error:', err.message);
      }
    }
    return place;
  }

  // --- COMMUNITY REPORTS ---

  public async getAllReports(filters?: { placeId?: string; featureCategory?: string }): Promise<CommunityReport[]> {
    if (this.client && this.isConfigured && this.tableStatus.community_reports) {
      try {
        let query = this.client.from('community_reports').select('*');
        if (filters?.placeId) {
          query = query.eq('place_id', filters.placeId);
        }
        if (filters?.featureCategory && filters.featureCategory !== 'all') {
          query = query.eq('feature_category', filters.featureCategory);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map(this.mapRowToReport);
        }
      } catch (err: any) {
        console.warn('Supabase getAllReports failed, falling back to local store:', err.message);
      }
    }

    return dbStore.getAllReports(filters);
  }

  public async addReport(reportData: Omit<CommunityReport, 'id' | 'date' | 'upvotes' | 'isVerified'>): Promise<CommunityReport> {
    const localReport = dbStore.addReport(reportData);

    if (this.client && this.isConfigured && this.tableStatus.community_reports) {
      try {
        const row = this.mapReportToRow(localReport);
        const { error } = await this.client.from('community_reports').upsert(row);
        if (error) {
          console.warn('Supabase addReport sync error:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase addReport exception:', err.message);
      }
    }

    return localReport;
  }

  public async upvoteReport(id: string): Promise<CommunityReport | null> {
    const updated = dbStore.upvoteReport(id);
    if (!updated) return null;

    if (this.client && this.isConfigured && this.tableStatus.community_reports) {
      try {
        await this.client
          .from('community_reports')
          .update({ upvotes: updated.upvotes })
          .eq('id', id);
      } catch (err: any) {
        console.warn('Supabase upvoteReport sync error:', err.message);
      }
    }
    return updated;
  }

  public async updateReport(id: string, updates: Partial<CommunityReport>): Promise<CommunityReport | null> {
    const updated = dbStore.updateReport(id, updates);
    if (!updated) return null;

    if (this.client && this.isConfigured && this.tableStatus.community_reports) {
      try {
        const row = this.mapReportToRow(updated);
        await this.client.from('community_reports').upsert(row);
      } catch (err: any) {
        console.warn('Supabase updateReport sync error:', err.message);
      }
    }
    return updated;
  }

  public async deleteReport(id: string): Promise<boolean> {
    const success = dbStore.deleteReport(id);

    if (this.client && this.isConfigured && this.tableStatus.community_reports) {
      try {
        await this.client.from('community_reports').delete().eq('id', id);
      } catch (err: any) {
        console.warn('Supabase deleteReport sync error:', err.message);
      }
    }
    return success;
  }

  public async toggleVerifyReport(id: string): Promise<CommunityReport | null> {
    const rep = dbStore.toggleVerifyReport(id);
    if (!rep) return null;

    if (this.client && this.isConfigured && this.tableStatus.community_reports) {
      try {
        await this.client
          .from('community_reports')
          .update({ is_verified: rep.isVerified })
          .eq('id', id);
      } catch (err: any) {
        console.warn('Supabase toggleVerifyReport sync error:', err.message);
      }
    }
    return rep;
  }

  // --- USER SEARCHES ---

  public async logSearch(searchData: Omit<UserSearchLog, 'id' | 'createdAt'>): Promise<UserSearchLog> {
    const localSearch = dbStore.addSearch(searchData);

    if (this.client && this.isConfigured && this.tableStatus.user_searches) {
      try {
        const row = {
          id: localSearch.id,
          session_id: localSearch.sessionId || '',
          query: localSearch.query,
          category: localSearch.category || 'all',
          status_filter: localSearch.statusFilter || 'all',
          feature_filter: localSearch.featureFilter || 'all',
          results_count: localSearch.resultsCount,
          source: localSearch.source,
          created_at: localSearch.createdAt,
        };
        const { error } = await this.client.from('user_searches').insert(row);
        if (error) {
          console.warn('Supabase logSearch sync error:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase logSearch exception:', err.message);
      }
    }

    return localSearch;
  }

  public async getAllSearches(limit: number = 100): Promise<UserSearchLog[]> {
    if (this.client && this.isConfigured && this.tableStatus.user_searches) {
      try {
        const { data, error } = await this.client
          .from('user_searches')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({
            id: r.id,
            sessionId: r.session_id,
            query: r.query,
            category: r.category,
            statusFilter: r.status_filter,
            featureFilter: r.feature_filter,
            resultsCount: r.results_count,
            source: r.source,
            createdAt: r.created_at,
          }));
        }
      } catch (err: any) {
        console.warn('Supabase getAllSearches fallback to local:', err.message);
      }
    }
    return dbStore.getAllSearches(limit);
  }

  public async getSearchAnalytics() {
    return dbStore.getSearchAnalytics();
  }

  // --- USER ACTIVITIES ---

  public async logActivity(activityData: Omit<UserActivityLog, 'id' | 'createdAt'>): Promise<UserActivityLog> {
    const localActivity = dbStore.addActivity(activityData);

    if (this.client && this.isConfigured && this.tableStatus.user_activities) {
      try {
        const row = {
          id: localActivity.id,
          session_id: localActivity.sessionId || '',
          action: localActivity.action,
          target_id: localActivity.targetId || '',
          target_name: localActivity.targetName || '',
          details: localActivity.details || {},
          created_at: localActivity.createdAt,
        };
        const { error } = await this.client.from('user_activities').insert(row);
        if (error) {
          console.warn('Supabase logActivity sync error:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase logActivity exception:', err.message);
      }
    }

    return localActivity;
  }

  public async getAllActivities(limit: number = 100): Promise<UserActivityLog[]> {
    if (this.client && this.isConfigured && this.tableStatus.user_activities) {
      try {
        const { data, error } = await this.client
          .from('user_activities')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({
            id: r.id,
            sessionId: r.session_id,
            action: r.action,
            targetId: r.target_id,
            targetName: r.target_name,
            details: r.details,
            createdAt: r.created_at,
          }));
        }
      } catch (err: any) {
        console.warn('Supabase getAllActivities fallback to local:', err.message);
      }
    }
    return dbStore.getAllActivities(limit);
  }

  // --- SEED DATABASE TO SUPABASE ---
  public async seedToSupabase(): Promise<{ placesCount: number; reportsCount: number; message: string }> {
    if (!this.client || !this.isConfigured) {
      throw new Error('Supabase client is not configured. Please supply SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
    }

    const places = dbStore.getAllPlaces();
    const reports = dbStore.getAllReports();

    let placesCount = 0;
    let reportsCount = 0;

    // Seed places
    if (places.length > 0) {
      const rows = places.map(this.mapPlaceToRow);
      const { error } = await this.client.from('places').upsert(rows);
      if (error) throw new Error(`Failed to seed places to Supabase: ${error.message}`);
      placesCount = rows.length;
    }

    // Seed reports
    if (reports.length > 0) {
      const repRows = reports.map(this.mapReportToRow);
      const { error } = await this.client.from('community_reports').upsert(repRows);
      if (error) throw new Error(`Failed to seed reports to Supabase: ${error.message}`);
      reportsCount = repRows.length;
    }

    // Verify after seeding
    await this.verifyConnection();

    return {
      placesCount,
      reportsCount,
      message: `Successfully synchronized ${placesCount} places and ${reportsCount} community reports to Supabase!`,
    };
  }

  // Row Mappers
  private mapPlaceToRow(place: Place) {
    return {
      id: place.id,
      name: place.name,
      category: place.category,
      address: place.address,
      city: place.city || 'Metro Area',
      lat: place.lat || 0,
      lng: place.lng || 0,
      distance_km: place.distanceKm || 0,
      accessibility_level: place.accessibilityLevel,
      accessibility_score: place.accessibilityScore,
      summary: place.summary || '',
      features: place.features,
      entrances: place.entrances || [],
      image_url: place.imageUrl || '',
      image_alt: place.imageAlt || '',
      photos_count: place.photosCount || 1,
      reports_count: place.reportsCount || 1,
      last_updated: place.lastUpdated,
      verified_by_community: place.verifiedByCommunity,
      opening_hours: place.openingHours || '',
      phone: place.phone || '',
      website: place.website || '',
    };
  }

  private mapRowToPlace(row: any): Place {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      address: row.address,
      city: row.city || 'Metro Area',
      lat: Number(row.lat) || 0,
      lng: Number(row.lng) || 0,
      distanceKm: Number(row.distance_km) || 0,
      accessibilityLevel: row.accessibility_level,
      accessibilityScore: Number(row.accessibility_score) || 75,
      summary: row.summary || '',
      features: row.features || {},
      entrances: row.entrances || [],
      imageUrl: row.image_url || '',
      imageAlt: row.image_alt || '',
      photosCount: Number(row.photos_count) || 1,
      reportsCount: Number(row.reports_count) || 1,
      lastUpdated: row.last_updated || '',
      verifiedByCommunity: Boolean(row.verified_by_community),
      openingHours: row.opening_hours || '',
      phone: row.phone || '',
      website: row.website || '',
    };
  }

  private mapReportToRow(rep: CommunityReport) {
    return {
      id: rep.id,
      place_id: rep.placeId,
      place_name: rep.placeName,
      place_category: rep.placeCategory,
      author_name: rep.authorName,
      author_type: rep.authorType,
      feature_category: rep.featureCategory,
      photo_url: rep.photoUrl || '',
      photo_alt: rep.photoAlt || '',
      ai_classification: rep.aiClassification,
      notes: rep.notes || '',
      date: rep.date,
      upvotes: rep.upvotes || 1,
      is_verified: rep.isVerified,
    };
  }

  private mapRowToReport(row: any): CommunityReport {
    return {
      id: row.id,
      placeId: row.place_id,
      placeName: row.place_name,
      placeCategory: row.place_category,
      authorName: row.author_name,
      authorType: row.author_type,
      featureCategory: row.feature_category,
      photoUrl: row.photo_url || '',
      photoAlt: row.photo_alt || '',
      aiClassification: row.ai_classification || {},
      notes: row.notes || '',
      date: row.date || '',
      upvotes: Number(row.upvotes) || 1,
      isVerified: Boolean(row.is_verified),
    };
  }
}

export const supabaseService = new SupabaseService();
