import fs from 'fs';
import path from 'path';
import { Place, CommunityReport, UserSearchLog, UserActivityLog } from '../../src/types/accessibility';
import { INITIAL_PLACES, INITIAL_REPORTS } from '../../src/data/mockPlaces';

class DataStore {
  private places: Place[];
  private reports: CommunityReport[];
  private searches: UserSearchLog[];
  private activities: UserActivityLog[];
  private dbFilePath: string;

  constructor() {
    this.places = [...INITIAL_PLACES];
    this.reports = [...INITIAL_REPORTS];
    this.searches = [];
    this.activities = [];
    this.dbFilePath = path.resolve(process.cwd(), '.data_store.json');
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.places) && data.places.length > 0) {
          this.places = data.places;
        }
        if (Array.isArray(data.reports) && data.reports.length > 0) {
          this.reports = data.reports;
        }
        if (Array.isArray(data.searches)) {
          this.searches = data.searches;
        }
        if (Array.isArray(data.activities)) {
          this.activities = data.activities;
        }
      }
    } catch (e) {
      console.warn('Failed to read database file, using in-memory store:', e);
    }
  }

  private saveToDisk() {
    try {
      fs.writeFileSync(
        this.dbFilePath,
        JSON.stringify(
          {
            places: this.places,
            reports: this.reports,
            searches: this.searches,
            activities: this.activities,
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (e) {
      console.warn('Failed to write database file:', e);
    }
  }

  // Places
  public getAllPlaces(filters?: { category?: string; accessibilityLevel?: string; query?: string }): Place[] {
    let result = [...this.places];
    if (filters?.category && filters.category !== 'all') {
      result = result.filter((p) => p.category === filters.category);
    }
    if (filters?.accessibilityLevel && filters.accessibilityLevel !== 'all') {
      result = result.filter((p) => p.accessibilityLevel === filters.accessibilityLevel);
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return result;
  }

  public getPlaceById(id: string): Place | undefined {
    return this.places.find((p) => p.id === id);
  }

  public addPlace(placeData: Omit<Place, 'id' | 'lastUpdated' | 'photosCount' | 'reportsCount'>): Place {
    const newPlace: Place = {
      ...placeData,
      id: `place-${Date.now()}`,
      photosCount: 1,
      reportsCount: 1,
      lastUpdated: new Date().toISOString().split('T')[0],
      verifiedByCommunity: true,
    };
    this.places.unshift(newPlace);
    this.saveToDisk();

    // Log Activity
    this.addActivity({
      action: 'add_place',
      targetId: newPlace.id,
      targetName: newPlace.name,
      details: { category: newPlace.category, address: newPlace.address },
    });

    return newPlace;
  }

  public updatePlace(id: string, updates: Partial<Place>): Place | null {
    const index = this.places.findIndex((p) => p.id === id);
    if (index === -1) return null;

    this.places[index] = {
      ...this.places[index],
      ...updates,
      lastUpdated: new Date().toISOString().split('T')[0],
      features: {
        ...this.places[index].features,
        ...(updates.features || {}),
      },
    };
    this.saveToDisk();
    return this.places[index];
  }

  public deletePlace(id: string): boolean {
    const initialLen = this.places.length;
    this.places = this.places.filter((p) => p.id !== id);
    // Also remove associated reports
    this.reports = this.reports.filter((r) => r.placeId !== id);
    if (this.places.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public toggleVerifyPlace(id: string): Place | null {
    const place = this.places.find((p) => p.id === id);
    if (!place) return null;
    place.verifiedByCommunity = !place.verifiedByCommunity;
    place.lastUpdated = new Date().toISOString().split('T')[0];
    this.saveToDisk();
    return place;
  }

  // Reports
  public getAllReports(filters?: { placeId?: string; featureCategory?: string }): CommunityReport[] {
    let result = [...this.reports];
    if (filters?.placeId) {
      result = result.filter((r) => r.placeId === filters.placeId);
    }
    if (filters?.featureCategory && filters.featureCategory !== 'all') {
      result = result.filter((r) => r.featureCategory === filters.featureCategory);
    }
    return result;
  }

  public addReport(reportData: Omit<CommunityReport, 'id' | 'date' | 'upvotes' | 'isVerified'>): CommunityReport {
    const newReport: CommunityReport = {
      ...reportData,
      id: `rep-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      upvotes: 1,
      isVerified: true,
    };
    this.reports.unshift(newReport);

    // Update target place statistics
    const targetPlace = this.places.find((p) => p.id === newReport.placeId);
    if (targetPlace) {
      targetPlace.reportsCount += 1;
      targetPlace.photosCount += 1;
      targetPlace.lastUpdated = newReport.date;
      if (newReport.featureCategory === 'stairs_barrier') {
        targetPlace.accessibilityLevel = 'barrier_reported';
        targetPlace.accessibilityScore = Math.max(25, targetPlace.accessibilityScore - 15);
      } else {
        targetPlace.accessibilityScore = Math.min(100, targetPlace.accessibilityScore + 2);
      }
    }

    this.saveToDisk();

    // Log Activity
    this.addActivity({
      action: 'create_report',
      targetId: newReport.id,
      targetName: newReport.placeName,
      details: {
        featureCategory: newReport.featureCategory,
        author: newReport.authorName,
      },
    });

    return newReport;
  }

  public upvoteReport(id: string): CommunityReport | null {
    const rep = this.reports.find((r) => r.id === id);
    if (rep) {
      rep.upvotes += 1;
      this.saveToDisk();

      // Log Activity
      this.addActivity({
        action: 'upvote_report',
        targetId: rep.id,
        targetName: rep.placeName,
        details: { upvotes: rep.upvotes },
      });

      return rep;
    }
    return null;
  }

  public updateReport(id: string, updates: Partial<CommunityReport>): CommunityReport | null {
    const index = this.reports.findIndex((r) => r.id === id);
    if (index === -1) return null;
    this.reports[index] = {
      ...this.reports[index],
      ...updates,
    };
    this.saveToDisk();
    return this.reports[index];
  }

  public deleteReport(id: string): boolean {
    const initialLen = this.reports.length;
    this.reports = this.reports.filter((r) => r.id !== id);
    if (this.reports.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public toggleVerifyReport(id: string): CommunityReport | null {
    const rep = this.reports.find((r) => r.id === id);
    if (!rep) return null;
    rep.isVerified = !rep.isVerified;
    this.saveToDisk();
    return rep;
  }

  // User Searches
  public addSearch(searchData: Omit<UserSearchLog, 'id' | 'createdAt'>): UserSearchLog {
    const newSearch: UserSearchLog = {
      ...searchData,
      id: `search-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.searches.unshift(newSearch);
    if (this.searches.length > 500) {
      this.searches = this.searches.slice(0, 500); // keep recent 500 in local disk
    }
    this.saveToDisk();
    return newSearch;
  }

  public getAllSearches(limit: number = 100): UserSearchLog[] {
    return this.searches.slice(0, limit);
  }

  public getSearchAnalytics() {
    const totalSearches = this.searches.length;
    const queryCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    this.searches.forEach((s) => {
      const q = s.query.trim().toLowerCase();
      if (q) {
        queryCounts[q] = (queryCounts[q] || 0) + 1;
      }
      if (s.category && s.category !== 'all') {
        categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
      }
    });

    const topQueries = Object.entries(queryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSearches,
      topQueries,
      topCategories,
      recentSearches: this.searches.slice(0, 25),
    };
  }

  public clearSearches(): void {
    this.searches = [];
    this.saveToDisk();
  }

  // User Activities
  public addActivity(activityData: Omit<UserActivityLog, 'id' | 'createdAt'>): UserActivityLog {
    const newActivity: UserActivityLog = {
      ...activityData,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.activities.unshift(newActivity);
    if (this.activities.length > 500) {
      this.activities = this.activities.slice(0, 500);
    }
    this.saveToDisk();
    return newActivity;
  }

  public getAllActivities(limit: number = 100): UserActivityLog[] {
    return this.activities.slice(0, limit);
  }

  public resetToDefaults(): void {
    this.places = [...INITIAL_PLACES];
    this.reports = [...INITIAL_REPORTS];
    this.searches = [];
    this.activities = [];
    this.saveToDisk();
  }

  public getStats() {
    const totalPlaces = this.places.length;
    const totalReports = this.reports.length;
    const totalSearches = this.searches.length;
    const totalActivities = this.activities.length;
    const totalRamps = this.places.filter((p) => p.features.wheelchairRamps).length;
    const totalStepFree = this.places.filter((p) => p.features.stepFreeEntrance).length;
    const totalBarriers = this.places.filter((p) => p.accessibilityLevel === 'barrier_reported').length;
    const verifiedRate = totalPlaces > 0 ? Math.round((totalStepFree / totalPlaces) * 100) : 0;

    return {
      totalPlaces,
      totalReports,
      totalSearches,
      totalActivities,
      totalRamps,
      totalStepFree,
      totalBarriers,
      verifiedRate,
    };
  }
}

export const dbStore = new DataStore();
