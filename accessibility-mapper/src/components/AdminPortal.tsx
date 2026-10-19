import React, { useState, useMemo } from 'react';
import { Place, CommunityReport, PlaceCategory, AccessibilityLevel } from '../types/accessibility';
import { 
  ShieldCheck, 
  Lock,
  LogOut,
  ArrowLeft,
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  Search, 
  Plus, 
  Download, 
  RefreshCw, 
  DoorOpen, 
  TrendingUp, 
  ArrowUpDown, 
  Sparkles,
  Building2,
  X,
  Check,
  Save,
  RotateCcw,
  Users,
  MapPin,
  SlidersHorizontal,
  KeyRound,
  ExternalLink,
  Database,
  Cloud,
  Radio,
  Activity,
  History,
  Copy
} from 'lucide-react';
import { UserSearchLog, UserActivityLog } from '../types/accessibility';
import { dbService, DbStatusResponse, SearchAnalyticsResponse } from '../services/dbService';

interface AdminPortalProps {
  places: Place[];
  reports: CommunityReport[];
  onPlacesUpdated: (updatedPlaces: Place[]) => void;
  onReportsUpdated: (updatedReports: CommunityReport[]) => void;
  onOpenAddPlace: () => void;
  onExitAdmin: () => void;
  highContrast: boolean;
  onToggleContrast: () => void;
}

export type AdminTab = 'places' | 'reports' | 'searches' | 'system';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  places,
  reports,
  onPlacesUpdated,
  onReportsUpdated,
  onOpenAddPlace,
  onExitAdmin,
  highContrast,
  onToggleContrast,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('accessmap_admin_auth') === 'true';
  });
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [authError, setAuthError] = useState('');

  // Dashboard States
  const [activeTab, setActiveTab] = useState<AdminTab>('places');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'verified' | 'barriers'>('all');
  
  // Database & Searches States
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [searches, setSearches] = useState<UserSearchLog[]>([]);
  const [activities, setActivities] = useState<UserActivityLog[]>([]);
  const [searchAnalytics, setSearchAnalytics] = useState<SearchAnalyticsResponse | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [searchFilterSource, setSearchFilterSource] = useState<string>('all');
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Edit Place State
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      setIsAuthenticated(true);
      sessionStorage.setItem('accessmap_admin_auth', 'true');
      setAuthError('');
      showToast('Welcome to AccessMap Admin Portal!');
    } else {
      setAuthError('Please enter valid admin credentials.');
    }
  };

  const handleQuickDemoLogin = () => {
    setUsername('admin');
    setPassword('admin123');
    setIsAuthenticated(true);
    sessionStorage.setItem('accessmap_admin_auth', 'true');
    setAuthError('');
    showToast('Authenticated as Administrator.');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('accessmap_admin_auth');
    showToast('Logged out of Admin Portal.');
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalPlaces = places.length;
    const fullyAccessible = places.filter((p) => p.accessibilityLevel === 'fully_accessible').length;
    const barriersReported = places.filter((p) => p.accessibilityLevel === 'barrier_reported').length;
    const verifiedPlaces = places.filter((p) => p.verifiedByCommunity).length;
    const rampCoverage = totalPlaces > 0 ? Math.round((places.filter((p) => p.features.wheelchairRamps).length / totalPlaces) * 100) : 0;
    const stepFreeCoverage = totalPlaces > 0 ? Math.round((places.filter((p) => p.features.stepFreeEntrance).length / totalPlaces) * 100) : 0;
    const totalReports = reports.length;
    const pendingReports = reports.filter((r) => !r.isVerified).length;

    return {
      totalPlaces,
      fullyAccessible,
      barriersReported,
      verifiedPlaces,
      rampCoverage,
      stepFreeCoverage,
      totalReports,
      pendingReports,
    };
  }, [places, reports]);

  // Filtered Places
  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchesSearch =
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || place.category === categoryFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'verified' && place.verifiedByCommunity) ||
        (statusFilter === 'unverified' && !place.verifiedByCommunity) ||
        place.accessibilityLevel === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [places, searchQuery, categoryFilter, statusFilter]);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      const matchesSearch =
        rep.placeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.notes.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (reportFilter === 'pending') return !rep.isVerified;
      if (reportFilter === 'verified') return rep.isVerified;
      if (reportFilter === 'barriers') return rep.featureCategory === 'stairs_barrier';
      return true;
    });
  }, [reports, searchQuery, reportFilter]);

  // Filtered Searches
  const filteredSearches = useMemo(() => {
    return searches.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchQuery = 
        s.query.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.featureFilter && s.featureFilter.toLowerCase().includes(q));
      const matchSource = searchFilterSource === 'all' || s.source === searchFilterSource;
      return matchQuery && matchSource;
    });
  }, [searches, searchQuery, searchFilterSource]);

  const loadDatabaseInfo = async () => {
    setIsLoadingDb(true);
    try {
      const [status, searchList, analytics, activityList] = await Promise.all([
        dbService.getDatabaseStatus(),
        dbService.getSearches(100),
        dbService.getSearchAnalytics(),
        dbService.getActivities(100),
      ]);
      if (status) setDbStatus(status);
      if (searchList) setSearches(searchList);
      if (analytics) setSearchAnalytics(analytics);
      if (activityList) setActivities(activityList);
    } catch {
      console.warn('Could not load database info');
    } finally {
      setIsLoadingDb(false);
    }
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      loadDatabaseInfo();
    }
  }, [isAuthenticated, activeTab]);

  const handleSyncSupabase = async () => {
    setIsSyncingSupabase(true);
    try {
      const res = await dbService.syncSeedToSupabase();
      if (res.success) {
        showToast(res.message);
        await loadDatabaseInfo();
      } else {
        showToast(res.message);
      }
    } catch (e: any) {
      showToast(e.message || 'Error syncing data to Supabase');
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  // Actions
  const handleToggleVerifyPlace = async (placeId: string) => {
    try {
      const res = await fetch(`/api/places/${placeId}/verify`, { method: 'PATCH' });
      if (res.ok) {
        const json = await res.json();
        const updated = places.map((p) => (p.id === placeId ? json.data : p));
        onPlacesUpdated(updated);
        showToast(json.data.verifiedByCommunity ? 'Venue verified successfully!' : 'Venue marked unverified.');
      }
    } catch {
      showToast('Failed to update verification status.');
    }
  };

  const handleDeletePlace = async (placeId: string, placeName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${placeName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/places/${placeId}`, { method: 'DELETE' });
      if (res.ok) {
        const updated = places.filter((p) => p.id !== placeId);
        onPlacesUpdated(updated);
        showToast(`"${placeName}" deleted successfully.`);
      }
    } catch {
      showToast('Error deleting place.');
    }
  };

  const handleSavePlaceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlace) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/places/${editingPlace.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPlace),
      });

      if (res.ok) {
        const json = await res.json();
        const updated = places.map((p) => (p.id === editingPlace.id ? json.data : p));
        onPlacesUpdated(updated);
        setEditingPlace(null);
        showToast('Venue details updated successfully!');
      } else {
        showToast('Failed to save changes.');
      }
    } catch {
      showToast('Error connecting to backend server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVerifyReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/verify`, { method: 'PATCH' });
      if (res.ok) {
        const json = await res.json();
        const updated = reports.map((r) => (r.id === reportId ? json.data : r));
        onReportsUpdated(updated);
        showToast(json.data.isVerified ? 'Report approved & verified!' : 'Report verification marked pending.');
      }
    } catch {
      showToast('Failed to update report status.');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm('Delete this community report?')) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      if (res.ok) {
        const updated = reports.filter((r) => r.id !== reportId);
        onReportsUpdated(updated);
        showToast('Community report deleted.');
      }
    } catch {
      showToast('Error deleting report.');
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset all places and reports to default initial seed data?')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' });
      if (res.ok) {
        const [placesRes, reportsRes] = await Promise.all([
          fetch('/api/places'),
          fetch('/api/reports'),
        ]);
        if (placesRes.ok && reportsRes.ok) {
          const pj = await placesRes.json();
          const rj = await reportsRes.json();
          onPlacesUpdated(pj.data);
          onReportsUpdated(rj.data);
          showToast('Data store reset to initial sample venues.');
        }
      }
    } catch {
      showToast('Failed to reset data store.');
    }
  };

  const handleExportJson = () => {
    const data = {
      exportTimestamp: new Date().toISOString(),
      placesCount: places.length,
      reportsCount: reports.length,
      places,
      reports,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessmap-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON backup downloaded successfully!');
  };

  // ================= 1. LOGIN GATE VIEW =================
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
        highContrast ? 'bg-black text-white' : 'bg-[#F4F2F8]'
      }`}>
        <div className="w-full max-w-md space-y-6">
          {/* Back button */}
          <button
            onClick={onExitAdmin}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#3D52A0] hover:text-[#1E2548] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Public App</span>
          </button>

          {/* Login Card */}
          <div className={`rounded-3xl border shadow-xl p-7 sm:p-8 space-y-6 ${
            highContrast ? 'bg-black border-yellow-400 text-white' : 'bg-white border-[#ADBBDA]/60'
          }`}>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#3D52A0] text-white flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck className="w-8 h-8 text-[#EDE8F5]" />
              </div>
              <h1 className="text-2xl font-black text-[#1E2548] tracking-tight">
                AccessMap Admin Portal
              </h1>
              <p className="text-xs text-[#8697C4] max-w-xs mx-auto leading-relaxed">
                Restricted administrative zone. Sign in to manage venues, audit data, and moderate community reports.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1E2548] mb-1">
                  Admin Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ADBBDA]/60 text-xs text-[#1E2548] focus:outline-none focus:border-[#3D52A0]"
                  placeholder="admin"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2548] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ADBBDA]/60 text-xs text-[#1E2548] focus:outline-none focus:border-[#3D52A0]"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#3D52A0] hover:bg-[#293872] active:bg-[#1E2548] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Sign In to Admin Portal</span>
              </button>

              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="w-full py-2.5 rounded-2xl bg-[#EDE8F5] hover:bg-[#ADBBDA]/30 text-[#3D52A0] text-xs font-bold transition-all border border-[#ADBBDA]/60 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#7091E6]" />
                <span>Quick Demo Sign-In</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. AUTHENTICATED ADMIN PORTAL =================
  return (
    <div className={`min-h-screen pb-16 transition-colors ${
      highContrast ? 'bg-black text-white' : 'bg-[#F4F2F8]'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E2548] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-[#7091E6]/40 text-xs font-bold animate-in fade-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-[#7091E6]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dedicated Admin Portal Header */}
      <header className={`sticky top-0 z-30 transition-colors border-b ${
        highContrast
          ? 'bg-black text-white border-yellow-400'
          : 'bg-[#1E2548] text-white border-white/10 shadow-sm'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#EDE8F5]" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white block leading-tight">
                AccessMap Admin Portal
              </span>
              <span className="text-[10px] font-semibold text-[#ADBBDA] block">
                Verification & Audit Management Suite
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onToggleContrast}
              title="Toggle High Contrast Mode"
              className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                highContrast
                  ? 'bg-yellow-400 text-black border-yellow-400'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <button
              onClick={onExitAdmin}
              className="px-3.5 py-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
              title="Return to Public App"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Public App</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 text-xs font-bold text-rose-200 bg-rose-500/20 hover:bg-rose-500/30 rounded-xl transition-all border border-rose-400/30 flex items-center gap-1.5 cursor-pointer"
              title="Logout from admin session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Hero Banner */}
        <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-md border transition-all ${
          highContrast 
            ? 'bg-black text-white border-yellow-400' 
            : 'bg-gradient-to-r from-[#1E2548] via-[#3D52A0] to-[#7091E6] border-white/10'
        }`}>
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-8 w-36 h-36 bg-[#ADBBDA]/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[#EDE8F5] text-xs font-bold border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5 text-[#ADBBDA]" />
                <span>Authorized Administrator Active</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Venue & Compliance Operations
              </h1>
              <p className="text-xs sm:text-sm text-[#EDE8F5]/90 font-medium leading-relaxed">
                Approve verified entrances, audit ADA ramp features, moderate community barrier reports, and download database backups.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <button
                onClick={onOpenAddPlace}
                className="px-4 py-2.5 rounded-2xl bg-white text-[#1E2548] hover:bg-[#EDE8F5] text-xs font-bold transition-all flex items-center gap-2 shadow-sm min-h-[42px] cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#3D52A0]" />
                <span>Add New Place</span>
              </button>

              <button
                onClick={handleExportJson}
                className="px-3.5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/20 min-h-[42px] cursor-pointer"
                title="Download full JSON data backup"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export JSON</span>
              </button>

              <button
                onClick={handleResetData}
                className="px-3.5 py-2.5 rounded-2xl bg-white/15 hover:bg-rose-500/30 backdrop-blur-md text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/20 min-h-[42px] cursor-pointer"
                title="Reset data store to sample records"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset Seed</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Stats Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs space-y-1 transition-colors ${
            highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60'
          }`}>
            <div className="flex items-center justify-between text-xs text-[#8697C4]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Total Venues</span>
              <Building2 className="w-4 h-4 text-[#7091E6]" />
            </div>
            <div className="text-2xl font-black text-[#1E2548]">
              {stats.totalPlaces}
            </div>
            <div className="text-[11px] text-[#3D52A0] font-medium flex items-center gap-1.5 pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{stats.fullyAccessible} accessible · {stats.barriersReported} barriers</span>
            </div>
          </div>

          <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs space-y-1 transition-colors ${
            highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60'
          }`}>
            <div className="flex items-center justify-between text-xs text-[#8697C4]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Step-Free Entrances</span>
              <DoorOpen className="w-4 h-4 text-[#7091E6]" />
            </div>
            <div className="text-2xl font-black text-[#1E2548]">
              {stats.stepFreeCoverage}%
            </div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1.5 pt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Compliant entrances</span>
            </div>
          </div>

          <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs space-y-1 transition-colors ${
            highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60'
          }`}>
            <div className="flex items-center justify-between text-xs text-[#8697C4]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Ramp Coverage</span>
              <TrendingUp className="w-4 h-4 text-[#7091E6]" />
            </div>
            <div className="text-2xl font-black text-[#1E2548]">
              {stats.rampCoverage}%
            </div>
            <div className="text-[11px] text-[#3D52A0] font-medium flex items-center gap-1.5 pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ADA §405 ramps</span>
            </div>
          </div>

          <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs space-y-1 transition-colors ${
            highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60'
          }`}>
            <div className="flex items-center justify-between text-xs text-[#8697C4]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Community Audits</span>
              <Users className="w-4 h-4 text-[#7091E6]" />
            </div>
            <div className="text-2xl font-black text-[#1E2548]">
              {stats.totalReports}
            </div>
            <div className="text-[11px] text-amber-600 font-medium flex items-center gap-1.5 pt-0.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{stats.pendingReports} pending moderation</span>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Switcher */}
        <div className={`p-2 rounded-2xl border shadow-xs flex items-center gap-2 overflow-x-auto ${
          highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60'
        }`}>
          <button
            onClick={() => setActiveTab('places')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'places'
                ? 'bg-[#3D52A0] text-white shadow-xs'
                : 'text-[#8697C4] hover:text-[#1E2548] hover:bg-[#EDE8F5]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Manage Places ({places.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-[#3D52A0] text-white shadow-xs'
                : 'text-[#8697C4] hover:text-[#1E2548] hover:bg-[#EDE8F5]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Moderate Reports ({reports.length})</span>
            {stats.pendingReports > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[10px]">
                {stats.pendingReports}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('searches')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'searches'
                ? 'bg-[#3D52A0] text-white shadow-xs'
                : 'text-[#8697C4] hover:text-[#1E2548] hover:bg-[#EDE8F5]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database & Searches ({searches.length})</span>
            {dbStatus?.isConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'system'
                ? 'bg-[#3D52A0] text-white shadow-xs'
                : 'text-[#8697C4] hover:text-[#1E2548] hover:bg-[#EDE8F5]'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>System & Health</span>
          </button>
        </div>

        {/* ================= TAB 1: PLACES MANAGEMENT ================= */}
        {activeTab === 'places' && (
          <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-5 transition-colors ${
            highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60'
          }`}>
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8697C4] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search venue name, address, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#EDE8F5]/30 rounded-2xl border border-[#ADBBDA]/60 text-xs text-[#1E2548] placeholder-[#8697C4] focus:outline-none focus:border-[#3D52A0]"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-white rounded-xl border border-[#ADBBDA]/60 text-xs font-semibold text-[#1E2548] focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="university">University</option>
                  <option value="hospital">Hospital</option>
                  <option value="public_building">Civic Building</option>
                  <option value="transit">Transit Hub</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="park">Park</option>
                  <option value="library">Library</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white rounded-xl border border-[#ADBBDA]/60 text-xs font-semibold text-[#1E2548] focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="verified">Verified Only</option>
                  <option value="unverified">Unverified Only</option>
                  <option value="fully_accessible">Fully Accessible</option>
                  <option value="partially_accessible">Partially Accessible</option>
                  <option value="barrier_reported">Barrier Reported</option>
                </select>
              </div>
            </div>

            {/* Places List */}
            <div className="divide-y divide-[#ADBBDA]/30 overflow-hidden">
              {filteredPlaces.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8697C4]">
                  No places found matching your filter criteria.
                </div>
              ) : (
                filteredPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#EDE8F5]/20 px-2 rounded-2xl transition-colors"
                  >
                    {/* Venue Info */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <img
                        src={place.imageUrl}
                        alt={place.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-2xl object-cover border border-[#ADBBDA]/50 shrink-0"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-[#1E2548] truncate">
                            {place.name}
                          </h4>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-[#EDE8F5] text-[#3D52A0] rounded-lg border border-[#ADBBDA]/50">
                            {place.category}
                          </span>
                          {place.verifiedByCommunity ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg flex items-center gap-1 border border-emerald-300">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Verified
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-lg border border-amber-300">
                              Pending Review
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#8697C4] truncate flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{place.address}, {place.city}</span>
                        </p>

                        {/* Feature Badges */}
                        <div className="flex items-center gap-2 pt-1 flex-wrap text-[10px]">
                          <span className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                            place.features.wheelchairRamps ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <TrendingUp className="w-3 h-3" />
                            Ramp: {place.features.wheelchairRamps ? 'Yes' : 'No'}
                          </span>

                          <span className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                            place.features.stepFreeEntrance ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <DoorOpen className="w-3 h-3" />
                            Step-Free: {place.features.stepFreeEntrance ? 'Yes' : 'No'}
                          </span>

                          <span className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                            place.features.elevators ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <ArrowUpDown className="w-3 h-3" />
                            Elevator: {place.features.elevators ? 'Yes' : 'No'}
                          </span>

                          <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-[#3D52A0]/10 text-[#3D52A0]">
                            Score: {place.accessibilityScore}/100
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => handleToggleVerifyPlace(place.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                          place.verifiedByCommunity
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                        title="Toggle verification status"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{place.verifiedByCommunity ? 'Verified' : 'Verify'}</span>
                      </button>

                      <button
                        onClick={() => setEditingPlace({ ...place })}
                        className="p-2 rounded-xl border border-[#ADBBDA]/60 hover:bg-[#EDE8F5] text-[#3D52A0] transition-colors cursor-pointer"
                        title="Edit venue details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeletePlace(place.id, place.name)}
                        className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                        title="Delete place"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: COMMUNITY REPORTS MODERATION ================= */}
        {activeTab === 'reports' && (
          <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-5 transition-colors ${
            highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60'
          }`}>
            {/* Sub Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setReportFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    reportFilter === 'all'
                      ? 'bg-[#3D52A0] text-white'
                      : 'bg-[#EDE8F5]/60 text-[#3D52A0] hover:bg-[#EDE8F5]'
                  }`}
                >
                  All Reports ({reports.length})
                </button>
                <button
                  onClick={() => setReportFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    reportFilter === 'pending'
                      ? 'bg-amber-500 text-white'
                      : 'bg-[#EDE8F5]/60 text-amber-700 hover:bg-[#EDE8F5]'
                  }`}
                >
                  Pending Review ({stats.pendingReports})
                </button>
                <button
                  onClick={() => setReportFilter('barriers')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    reportFilter === 'barriers'
                      ? 'bg-rose-600 text-white'
                      : 'bg-[#EDE8F5]/60 text-rose-700 hover:bg-[#EDE8F5]'
                  }`}
                >
                  Architectural Barriers
                </button>
                <button
                  onClick={() => setReportFilter('verified')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    reportFilter === 'verified'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#EDE8F5]/60 text-emerald-700 hover:bg-[#EDE8F5]'
                  }`}
                >
                  Approved & Verified
                </button>
              </div>
            </div>

            {/* Reports Moderation List */}
            <div className="space-y-3">
              {filteredReports.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8697C4]">
                  No community reports found in this view.
                </div>
              ) : (
                filteredReports.map((report) => {
                  const isBarrier = report.featureCategory === 'stairs_barrier';
                  return (
                    <div
                      key={report.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        report.isVerified
                          ? 'border-[#ADBBDA]/60 bg-white'
                          : 'border-amber-300 bg-amber-50/40'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                              isBarrier ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isBarrier ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                              {isBarrier ? 'Stairs Barrier Alert' : 'Step-Free / Ramp'}
                            </span>

                            <span className="text-xs font-bold text-[#1E2548]">
                              {report.placeName}
                            </span>

                            <span className="text-[11px] text-[#8697C4]">
                              by {report.authorName} ({report.authorType.replace('_', ' ')})
                            </span>

                            <span className="text-[10px] text-[#8697C4]">
                              · {report.date}
                            </span>
                          </div>

                          <p className="text-xs text-[#1E2548] leading-relaxed bg-[#EDE8F5]/30 p-2.5 rounded-xl border border-[#ADBBDA]/40">
                            "{report.notes}"
                          </p>

                          <div className="flex items-center gap-2 text-[11px] text-[#3D52A0] font-medium">
                            <span>AI Assessment: <b>{report.aiClassification.predictedLabel}</b></span>
                            <span>·</span>
                            <span>Score: {report.aiClassification.complianceScore}/100</span>
                            <span>·</span>
                            <span>Upvotes: {report.upvotes}</span>
                          </div>
                        </div>

                        {/* Moderation Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleToggleVerifyReport(report.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                              report.isVerified
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{report.isVerified ? 'Approved' : 'Approve'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                            title="Reject and delete report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: DATABASE & USER SEARCHES INTELLIGENCE ================= */}
        {activeTab === 'searches' && (
          <div className="space-y-5">
            {/* Supabase Connection & Synchronization Card */}
            <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-4 transition-colors ${
              highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#ADBBDA]/30">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    dbStatus?.isConnected
                      ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-400/30'
                      : 'bg-[#3D52A0]/15 text-[#3D52A0] border border-[#3D52A0]/30'
                  }`}>
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-sm text-[#1E2548]">
                        Supabase Database System
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        dbStatus?.isConnected
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : dbStatus?.isConfigured
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-[#EDE8F5] text-[#3D52A0] border-[#ADBBDA]/60'
                      }`}>
                        {dbStatus?.isConnected
                          ? '● Supabase Cloud Active'
                          : dbStatus?.isConfigured
                          ? '▲ Configured (Tables Pending)'
                          : 'ℹ Local Resilient Store Active'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8697C4] mt-0.5">
                      {dbStatus?.supabaseUrl
                        ? `Connected to: ${dbStatus.supabaseUrl}`
                        : 'Stores places, community reports, user searches, and activity logs with real-time sync and local failover.'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={loadDatabaseInfo}
                    disabled={isLoadingDb}
                    className="px-3 py-2 rounded-xl border border-[#ADBBDA]/60 hover:bg-[#EDE8F5] text-[#1E2548] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDb ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>

                  <button
                    onClick={handleSyncSupabase}
                    disabled={isSyncingSupabase}
                    className="px-4 py-2 rounded-xl bg-[#3D52A0] hover:bg-[#293872] active:bg-[#1E2548] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Cloud className={`w-3.5 h-3.5 ${isSyncingSupabase ? 'animate-bounce' : ''}`} />
                    <span>{isSyncingSupabase ? 'Syncing to Supabase...' : 'Sync Local Data to Supabase'}</span>
                  </button>
                </div>
              </div>

              {/* Table Schema Status Checklist */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { key: 'places', label: 'Places Table', count: dbStatus?.totalPlaces ?? places.length, hasTable: dbStatus?.hasTables?.places },
                  { key: 'community_reports', label: 'Reports Table', count: dbStatus?.totalReports ?? reports.length, hasTable: dbStatus?.hasTables?.community_reports },
                  { key: 'user_searches', label: 'User Searches', count: dbStatus?.totalSearches ?? searches.length, hasTable: dbStatus?.hasTables?.user_searches },
                  { key: 'user_activities', label: 'Activity Logs', count: dbStatus?.totalActivities ?? activities.length, hasTable: dbStatus?.hasTables?.user_activities },
                ].map((tbl) => (
                  <div key={tbl.key} className="p-3 rounded-2xl bg-[#EDE8F5]/30 border border-[#ADBBDA]/40 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#8697C4]">{tbl.label}</span>
                      {tbl.hasTable ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <span className="text-[10px] text-amber-600 font-bold">Local</span>
                      )}
                    </div>
                    <div className="text-lg font-black text-[#1E2548]">
                      {tbl.count} <span className="text-[10px] font-normal text-[#8697C4]">records</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Search Intelligence & Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs space-y-2 transition-colors ${
                highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60'
              }`}>
                <div className="flex items-center justify-between text-xs text-[#8697C4]">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Total Search Queries</span>
                  <History className="w-4 h-4 text-[#7091E6]" />
                </div>
                <div className="text-3xl font-black text-[#1E2548]">
                  {searchAnalytics?.totalSearches ?? searches.length}
                </div>
                <p className="text-[11px] text-[#8697C4]">
                  Logged from discovery search bar, feature filters, and map search
                </p>
              </div>

              {/* Top Searched Queries */}
              <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs space-y-2 md:col-span-2 transition-colors ${
                highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60'
              }`}>
                <div className="flex items-center justify-between text-xs text-[#8697C4]">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Top Searched Keywords & Trends</span>
                  <TrendingUp className="w-4 h-4 text-[#7091E6]" />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {searchAnalytics?.topQueries && searchAnalytics.topQueries.length > 0 ? (
                    searchAnalytics.topQueries.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#EDE8F5] text-[#1E2548] text-xs font-semibold border border-[#ADBBDA]/60"
                      >
                        <Search className="w-3 h-3 text-[#7091E6]" />
                        <span>"{item.query}"</span>
                        <span className="px-1.5 py-0.2 bg-[#3D52A0] text-white rounded-md text-[10px] font-bold">
                          {item.count}
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#8697C4] italic">
                      No search keywords recorded yet. Type a venue or street name in the app to populate live data.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Live User Search History Stream */}
            <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-4 transition-colors ${
              highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ADBBDA]/30">
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-[#7091E6]" />
                  <h4 className="font-bold text-sm text-[#1E2548]">
                    Live User Searches Log ({filteredSearches.length})
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={searchFilterSource}
                    onChange={(e) => setSearchFilterSource(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[#ADBBDA]/60 text-xs text-[#1E2548] focus:outline-none focus:border-[#3D52A0] cursor-pointer"
                  >
                    <option value="all">All Sources</option>
                    <option value="discovery_bar">Discovery Bar</option>
                    <option value="map_search">Map Search</option>
                    <option value="filter_click">Filter Button</option>
                  </select>
                </div>
              </div>

              {filteredSearches.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <History className="w-8 h-8 text-[#8697C4] mx-auto opacity-40" />
                  <p className="text-xs font-semibold text-[#8697C4]">No searches found matching criteria</p>
                  <p className="text-[11px] text-[#8697C4]/80">Try performing searches on the home page or map view.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#ADBBDA]/20 max-h-[420px] overflow-y-auto pr-1">
                  {filteredSearches.map((s) => (
                    <div key={s.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#EDE8F5]/30 px-2 rounded-xl transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-[#1E2548] flex items-center gap-1.5">
                            <Search className="w-3.5 h-3.5 text-[#3D52A0]" />
                            {s.query ? `"${s.query}"` : <span className="text-[#8697C4] italic">(All / Filter Browse)</span>}
                          </span>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            s.source === 'map_search'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {s.source === 'map_search' ? 'Map Search' : 'Discovery Bar'}
                          </span>

                          {s.category && s.category !== 'all' && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#EDE8F5] text-[#3D52A0]">
                              {s.category}
                            </span>
                          )}

                          {s.featureFilter && s.featureFilter !== 'all' && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                              Features: {s.featureFilter}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-[#8697C4] flex items-center gap-2">
                          <span>Results matched: <b>{s.resultsCount}</b> venues</span>
                          {s.sessionId && (
                            <>
                              <span>·</span>
                              <span className="font-mono text-[10px] text-[#8697C4]/80">Session: {s.sessionId.substring(0, 14)}...</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-[10px] font-semibold text-[#8697C4] shrink-0 self-start sm:self-center">
                        {new Date(s.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live User Activity Stream */}
            <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-4 transition-colors ${
              highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-[#ADBBDA]/30">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-[#7091E6]" />
                  <h4 className="font-bold text-sm text-[#1E2548]">
                    Real-time User Activity Stream ({activities.length})
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-[#8697C4] uppercase">Live Action Log</span>
              </div>

              {activities.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#8697C4]">
                  No user activity recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-[#ADBBDA]/20 max-h-[300px] overflow-y-auto pr-1">
                  {activities.slice(0, 50).map((act) => (
                    <div key={act.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          act.action === 'create_report'
                            ? 'bg-emerald-500'
                            : act.action === 'add_place'
                            ? 'bg-blue-500'
                            : act.action === 'ai_classify'
                            ? 'bg-purple-500'
                            : 'bg-[#7091E6]'
                        }`} />
                        <div>
                          <span className="font-bold text-[#1E2548]">
                            {act.action === 'create_report' && 'Submitted Audit Report'}
                            {act.action === 'add_place' && 'Added New Venue'}
                            {act.action === 'upvote_report' && 'Upvoted Community Report'}
                            {act.action === 'ai_classify' && 'Ran AI Vision Classifier'}
                            {act.action === 'view_place' && 'Viewed Venue Profile'}
                            {act.action === 'search' && 'Executed Search'}
                          </span>
                          {act.targetName && (
                            <span className="text-[#3D52A0] font-medium ml-1.5">
                              — {act.targetName}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-[#8697C4] shrink-0 font-mono">
                        {new Date(act.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Supabase SQL Migration Instructions Helper */}
            <div className={`p-5 rounded-2xl border bg-gradient-to-br from-[#EDE8F5]/50 to-white border-[#ADBBDA]/60 space-y-3 ${
              highContrast ? 'bg-black text-white border-yellow-400' : ''
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-[#3D52A0]" />
                  <h4 className="font-bold text-xs text-[#1E2548]">
                    Supabase Database Setup Guide
                  </h4>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`-- AccessMap Database Schema\n-- Run this in Supabase SQL Editor\n-- File: supabase/schema.sql`);
                    setCopiedSchema(true);
                    setTimeout(() => setCopiedSchema(false), 2500);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-[#ADBBDA]/60 bg-white hover:bg-[#EDE8F5] text-[11px] font-bold text-[#3D52A0] flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedSchema ? 'Copied Reference!' : 'Schema: supabase/schema.sql'}</span>
                </button>
              </div>

              <p className="text-[11px] text-[#8697C4] leading-relaxed">
                To connect your live Supabase cloud project:
                <br />
                <b>1.</b> Create a project on <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-bold text-[#3D52A0]">supabase.com</a>
                <br />
                <b>2.</b> Open the <b>SQL Editor</b> in your Supabase dashboard and run the script in <code className="bg-[#EDE8F5] px-1 py-0.5 rounded text-[#1E2548]">supabase/schema.sql</code>.
                <br />
                <b>3.</b> Paste your <code className="bg-[#EDE8F5] px-1 py-0.5 rounded text-[#1E2548]">SUPABASE_URL</code> and <code className="bg-[#EDE8F5] px-1 py-0.5 rounded text-[#1E2548]">SUPABASE_ANON_KEY</code> into <code className="bg-[#EDE8F5] px-1 py-0.5 rounded text-[#1E2548]">.env</code>.
                <br />
                <b>4.</b> Click <b>"Sync Local Data to Supabase"</b> above to populate all existing places and reports!
              </p>
            </div>
          </div>
        )}

        {/* ================= TAB 4: SYSTEM HEALTH & DIAGNOSTICS ================= */}
        {activeTab === 'system' && (
          <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-5 transition-colors ${
            highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-[#ADBBDA]/30">
              <h3 className="font-bold text-sm text-[#1E2548] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#7091E6]" />
                <span>Platform Health & Diagnostics</span>
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                All Systems Operational
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-[#EDE8F5]/40 rounded-2xl border border-[#ADBBDA]/50 space-y-2">
                <span className="text-[#8697C4] uppercase text-[10px] font-bold">Express REST API</span>
                <p className="font-bold text-[#1E2548] text-sm">Active & Responding</p>
                <p className="text-[11px] text-[#8697C4]">Endpoints mounted at /api/places, /api/reports, /api/classify</p>
              </div>

              <div className="p-4 bg-[#EDE8F5]/40 rounded-2xl border border-[#ADBBDA]/50 space-y-2">
                <span className="text-[#8697C4] uppercase text-[10px] font-bold">
                  {dbStatus?.isConnected ? 'Supabase Cloud DB' : 'Resilient Local DB'}
                </span>
                <p className="font-bold text-[#1E2548] text-sm">
                  {dbStatus?.isConnected ? 'Cloud PostgreSQL Synced' : 'Persistent on Disk'}
                </p>
                <p className="text-[11px] text-[#8697C4]">
                  {places.length} places, {reports.length} reports, {searches.length} user searches tracked
                </p>
              </div>

              <div className="p-4 bg-[#EDE8F5]/40 rounded-2xl border border-[#ADBBDA]/50 space-y-2">
                <span className="text-[#8697C4] uppercase text-[10px] font-bold">YOLOv8 best.pt Service</span>
                <p className="font-bold text-[#1E2548] text-sm">Port 8000 Microservice</p>
                <p className="text-[11px] text-[#8697C4]">Weights active with mobile/vision fallbacks enabled</p>
              </div>
            </div>

            {/* Data Management Action Card */}
            <div className="p-4 rounded-2xl border border-[#ADBBDA]/60 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-xs text-[#1E2548]">Database Backup & Reset</h4>
                <p className="text-[11px] text-[#8697C4] mt-0.5">
                  Download a complete JSON export of all venues or reset the data store to initial sample seeds.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportJson}
                  className="px-3.5 py-2 rounded-xl bg-[#3D52A0] hover:bg-[#293872] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={handleResetData}
                  className="px-3.5 py-2 rounded-xl border border-rose-300 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Store</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= EDIT PLACE MODAL ================= */}
        {editingPlace && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl p-6 sm:p-7 space-y-5 my-8 max-h-[90vh] overflow-y-auto ${
              highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-[#ADBBDA]/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EDE8F5] text-[#3D52A0] flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-[#1E2548]">
                    Edit Venue Details
                  </h3>
                </div>
                <button
                  onClick={() => setEditingPlace(null)}
                  className="p-1.5 rounded-xl hover:bg-[#EDE8F5] text-[#8697C4] hover:text-[#1E2548] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePlaceEdit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1E2548] mb-1">Place Name</label>
                    <input
                      type="text"
                      required
                      value={editingPlace.name}
                      onChange={(e) => setEditingPlace({ ...editingPlace, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#ADBBDA]/60 text-xs text-[#1E2548] focus:outline-none focus:border-[#3D52A0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E2548] mb-1">Category</label>
                    <select
                      value={editingPlace.category}
                      onChange={(e) => setEditingPlace({ ...editingPlace, category: e.target.value as PlaceCategory })}
                      className="w-full px-3 py-2 rounded-xl border border-[#ADBBDA]/60 text-xs text-[#1E2548] focus:outline-none focus:border-[#3D52A0] cursor-pointer"
                    >
                      <option value="university">University</option>
                      <option value="hospital">Hospital</option>
                      <option value="public_building">Public Building</option>
                      <option value="transit">Transit Hub</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="park">Park</option>
                      <option value="library">Library</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1E2548] mb-1">Address</label>
                    <input
                      type="text"
                      required
                      value={editingPlace.address}
                      onChange={(e) => setEditingPlace({ ...editingPlace, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#ADBBDA]/60 text-xs text-[#1E2548] focus:outline-none focus:border-[#3D52A0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E2548] mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={editingPlace.city}
                      onChange={(e) => setEditingPlace({ ...editingPlace, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#ADBBDA]/60 text-xs text-[#1E2548] focus:outline-none focus:border-[#3D52A0]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1E2548] mb-1">Accessibility Level</label>
                    <select
                      value={editingPlace.accessibilityLevel}
                      onChange={(e) => setEditingPlace({ ...editingPlace, accessibilityLevel: e.target.value as AccessibilityLevel })}
                      className="w-full px-3 py-2 rounded-xl border border-[#ADBBDA]/60 text-xs text-[#1E2548] focus:outline-none focus:border-[#3D52A0] cursor-pointer"
                    >
                      <option value="fully_accessible">Fully Accessible</option>
                      <option value="partially_accessible">Partially Accessible</option>
                      <option value="barrier_reported">Barrier Reported</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E2548] mb-1">
                      Compliance Score ({editingPlace.accessibilityScore}/100)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editingPlace.accessibilityScore}
                      onChange={(e) => setEditingPlace({ ...editingPlace, accessibilityScore: Number(e.target.value) })}
                      className="w-full accent-[#3D52A0] cursor-pointer mt-2"
                    />
                  </div>
                </div>

                {/* Feature Checkboxes */}
                <div>
                  <label className="block text-xs font-bold text-[#1E2548] mb-2">Architectural Features</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      { key: 'wheelchairRamps' as const, label: 'Wheelchair Ramps' },
                      { key: 'stepFreeEntrance' as const, label: 'Step-Free Entrance' },
                      { key: 'elevators' as const, label: 'Elevators' },
                      { key: 'accessibleRestrooms' as const, label: 'Accessible Restroom' },
                      { key: 'designatedParking' as const, label: 'Accessible Parking' },
                      { key: 'automaticDoors' as const, label: 'Automatic Doors' },
                      { key: 'tactilePaving' as const, label: 'Tactile Paving' },
                      { key: 'brailleSignage' as const, label: 'Braille Signage' },
                    ].map((feat) => (
                      <label key={feat.key} className="flex items-center gap-2 p-2 rounded-xl border border-[#ADBBDA]/40 hover:bg-[#EDE8F5]/30 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingPlace.features[feat.key]}
                          onChange={(e) => setEditingPlace({
                            ...editingPlace,
                            features: {
                              ...editingPlace.features,
                              [feat.key]: e.target.checked,
                            },
                          })}
                          className="rounded accent-[#3D52A0]"
                        />
                        <span className="font-medium text-[#1E2548] text-[11px]">{feat.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2548] mb-1">Summary & Accessibility Notes</label>
                  <textarea
                    rows={3}
                    value={editingPlace.summary}
                    onChange={(e) => setEditingPlace({ ...editingPlace, summary: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ADBBDA]/60 text-xs text-[#1E2548] focus:outline-none focus:border-[#3D52A0]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#ADBBDA]/30">
                  <button
                    type="button"
                    onClick={() => setEditingPlace(null)}
                    className="px-4 py-2.5 rounded-xl border border-[#ADBBDA]/60 hover:bg-[#EDE8F5] text-xs font-bold text-[#1E2548] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-[#3D52A0] hover:bg-[#293872] active:bg-[#1E2548] text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-75"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
