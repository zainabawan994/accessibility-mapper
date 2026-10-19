import React, { useState, useEffect } from 'react';
import { Place, CommunityReport } from './types/accessibility';
import { INITIAL_PLACES, INITIAL_REPORTS } from './data/mockPlaces';
import { Header, NavigationTab } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { PlaceCard } from './components/PlaceCard';
import { PlaceDetailModal } from './components/PlaceDetailModal';
import { AiClassifierModal } from './components/AiClassifierModal';
import { AiScannerView } from './components/AiScannerView';
import { MapDiscoveryView } from './components/MapDiscoveryView';
import { CommunityFeed } from './components/CommunityFeed';
import { AddPlaceModal } from './components/AddPlaceModal';
import { MLModelStudio } from './components/MLModelStudio';
import { AdminPortal } from './components/AdminPortal';
import { dbService } from './services/dbService';
import { 
  Search, 
  Camera, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  LayoutGrid,
  GraduationCap,
  Stethoscope,
  Trees,
  Landmark,
  TrainFront,
  UtensilsCrossed,
  ShieldCheck,
  TrendingUp,
  DoorOpen,
  ArrowUpDown,
  Bath,
  Volume2,
  VolumeX,
  Sparkles,
  Accessibility
} from 'lucide-react';

export default function App() {
  // Persistence state
  const [places, setPlaces] = useState<Place[]>(() => {
    try {
      const saved = localStorage.getItem('accessibility_mapper_places');
      return saved ? JSON.parse(saved) : INITIAL_PLACES;
    } catch {
      return INITIAL_PLACES;
    }
  });

  const [reports, setReports] = useState<CommunityReport[]>(() => {
    try {
      const saved = localStorage.getItem('accessibility_mapper_reports');
      return saved ? JSON.parse(saved) : INITIAL_REPORTS;
    } catch {
      return INITIAL_REPORTS;
    }
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('accessibility_mapper_high_contrast') === 'true';
  });

  // Dedicated Admin Portal routing
  const [isAdminPortal, setIsAdminPortal] = useState<boolean>(() => {
    return window.location.pathname.startsWith('/admin') || window.location.hash.startsWith('#/admin');
  });

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminPortal(window.location.pathname.startsWith('/admin') || window.location.hash.startsWith('#/admin'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation and filter states
  const [activeTab, setActiveTab] = useState<NavigationTab>('discover');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedFeature, setSelectedFeature] = useState<'all' | 'ramps' | 'stepFree' | 'elevators' | 'restrooms'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Modals
  const [selectedPlaceForDetail, setSelectedPlaceForDetail] = useState<Place | null>(null);
  const [selectedMapPlaceId, setSelectedMapPlaceId] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTargetPlace, setScannerTargetPlace] = useState<Place | null>(null);
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from backend on mount
  useEffect(() => {
    fetchBackendData();
  }, []);

  const fetchBackendData = async () => {
    try {
      const [placesRes, reportsRes] = await Promise.all([
        fetch('/api/places'),
        fetch('/api/reports'),
      ]);

      if (placesRes.ok) {
        const placesJson = await placesRes.json();
        if (Array.isArray(placesJson.data) && placesJson.data.length > 0) {
          setPlaces(placesJson.data);
        }
      }

      if (reportsRes.ok) {
        const reportsJson = await reportsRes.json();
        if (Array.isArray(reportsJson.data) && reportsJson.data.length > 0) {
          setReports(reportsJson.data);
        }
      }
    } catch (e) {
      console.warn('Backend sync fallback to local storage:', e);
    }
  };

  // Sync storage
  useEffect(() => {
    try {
      localStorage.setItem('accessibility_mapper_places', JSON.stringify(places));
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  }, [places]);

  useEffect(() => {
    try {
      localStorage.setItem('accessibility_mapper_reports', JSON.stringify(reports));
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('accessibility_mapper_high_contrast', String(highContrast));
  }, [highContrast]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleOpenScannerForPlace = (place?: Place) => {
    setScannerTargetPlace(place || null);
    setIsScannerOpen(true);
  };

  const handleReportCreated = async (newReport: CommunityReport) => {
    setReports((prev) => [newReport, ...prev]);

    setPlaces((prev) =>
      prev.map((p) => {
        if (p.id === newReport.placeId) {
          const isBarrier = newReport.featureCategory === 'stairs_barrier';
          return {
            ...p,
            reportsCount: p.reportsCount + 1,
            photosCount: p.photosCount + 1,
            accessibilityLevel: isBarrier ? 'barrier_reported' : p.accessibilityLevel,
            accessibilityScore: isBarrier
              ? Math.max(30, p.accessibilityScore - 12)
              : Math.min(100, p.accessibilityScore + 2),
            lastUpdated: newReport.date,
          };
        }
        return p;
      })
    );

    showToast(`Audit saved for ${newReport.placeName}!`);

    // Track user activity in Supabase / database
    dbService.trackActivity({
      action: 'create_report',
      targetId: newReport.id,
      targetName: newReport.placeName,
      details: {
        category: newReport.featureCategory,
        author: newReport.authorName,
      },
    });

    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport),
      });
    } catch (e) {
      console.warn('Backend report sync error:', e);
    }
  };

  const handlePlaceAdded = async (newPlace: Place) => {
    setPlaces((prev) => [newPlace, ...prev]);
    showToast(`Added ${newPlace.name}!`);

    // Track user activity in Supabase / database
    dbService.trackActivity({
      action: 'add_place',
      targetId: newPlace.id,
      targetName: newPlace.name,
      details: {
        category: newPlace.category,
        address: newPlace.address,
      },
    });

    try {
      await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlace),
      });
    } catch (e) {
      console.warn('Backend place sync error:', e);
    }
  };

  const handleUpvoteReport = async (reportId: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, upvotes: r.upvotes + 1 } : r))
    );
    showToast('Upvote recorded!');

    // Track user activity
    dbService.trackActivity({
      action: 'upvote_report',
      targetId: reportId,
    });

    try {
      await fetch(`/api/reports/${reportId}/upvote`, { method: 'POST' });
    } catch (e) {
      console.warn('Backend upvote sync error:', e);
    }
  };

  const handleSelectPlaceById = (placeId: string) => {
    const found = places.find((p) => p.id === placeId);
    if (found) {
      setSelectedPlaceForDetail(found);
      // Track place view activity
      dbService.trackActivity({
        action: 'view_place',
        targetId: found.id,
        targetName: found.name,
      });
    }
  };

  const handleViewOnMap = (place: Place) => {
    setSelectedMapPlaceId(place.id);
    setActiveTab('map');
    setSelectedPlaceForDetail(null);
  };

  // Voice overview for people with visual or reading challenges
  const handleVoiceOverview = () => {
    if (!('speechSynthesis' in window)) return;

    if (isVoiceActive) {
      window.speechSynthesis.cancel();
      setIsVoiceActive(false);
      return;
    }

    window.speechSynthesis.cancel();
    const accessibleCount = places.filter(p => p.accessibilityLevel === 'fully_accessible').length;
    const text = `Welcome to AccessMap. Found ${places.length} places. ${accessibleCount} are fully accessible with step-free entrances and ramps. Use the quick buttons below to find ramps, step-free doors, or elevators.`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setIsVoiceActive(false);
    utterance.onerror = () => setIsVoiceActive(false);

    setIsVoiceActive(true);
    window.speechSynthesis.speak(utterance);
  };

  // Filtered places
  const filteredPlaces = places.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && p.accessibilityLevel !== selectedStatus) return false;
    
    // Quick feature filter
    if (selectedFeature === 'ramps' && !p.features.wheelchairRamps) return false;
    if (selectedFeature === 'stepFree' && !p.features.stepFreeEntrance) return false;
    if (selectedFeature === 'elevators' && !p.features.elevators) return false;
    if (selectedFeature === 'restrooms' && !p.features.accessibleRestrooms) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchAddress = p.address.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      return matchName || matchAddress || matchCategory;
    }
    return true;
  });

  // Track search queries and filter changes in Supabase / Database
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() || selectedCategory !== 'all' || selectedFeature !== 'all' || selectedStatus !== 'all') {
        dbService.trackSearch({
          query: searchQuery,
          category: selectedCategory,
          statusFilter: selectedStatus,
          featureFilter: selectedFeature,
          resultsCount: filteredPlaces.length,
          source: 'discovery_bar',
        });
      }
    }, 750);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedStatus, selectedFeature, filteredPlaces.length]);

  // Feature counts for decorated cards
  const rampCount = places.filter(p => p.features.wheelchairRamps).length;
  const stepFreeCount = places.filter(p => p.features.stepFreeEntrance).length;
  const elevatorCount = places.filter(p => p.features.elevators).length;
  const restroomCount = places.filter(p => p.features.accessibleRestrooms).length;

  if (isAdminPortal) {
    return (
      <AdminPortal
        places={places}
        reports={reports}
        onPlacesUpdated={(updated) => setPlaces(updated)}
        onReportsUpdated={(updated) => setReports(updated)}
        onOpenAddPlace={() => setIsAddPlaceOpen(true)}
        onExitAdmin={() => {
          setIsAdminPortal(false);
          window.history.pushState({}, '', '/');
        }}
        highContrast={highContrast}
        onToggleContrast={() => {
          const next = !highContrast;
          setHighContrast(next);
          localStorage.setItem('accessibility_mapper_high_contrast', String(next));
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${
      highContrast ? 'bg-black text-white' : 'bg-[#EDE8F5] text-[#1E2548]'
    }`}>
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenScanner={() => handleOpenScannerForPlace()}
        onOpenAddPlace={() => setIsAddPlaceOpen(true)}
        onOpenAdmin={() => {
          setIsAdminPortal(true);
          window.history.pushState({}, '', '/admin');
        }}
        highContrast={highContrast}
        onToggleContrast={() => setHighContrast(!highContrast)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 pb-24 md:pb-10">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-20 md:bottom-6 right-6 z-50 bg-[#1E2548] text-white text-xs px-4 py-2.5 rounded-xl shadow-xl border border-[#7091E6]/40 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#7091E6]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab 1: Explore / Home View */}
        {activeTab === 'discover' && (
          <div className="space-y-4">
            {/* Decorated Accessibility Hero Banner */}
            <div className={`relative overflow-hidden rounded-3xl p-5 sm:p-7 shadow-lg border transition-all ${
              highContrast 
                ? 'bg-black border-yellow-400 text-white' 
                : 'bg-gradient-to-r from-[#1E2548] via-[#3D52A0] to-[#7091E6] text-white border-[#7091E6]/40'
            }`}>
              {/* Decorative background geometry */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 -mb-8 w-36 h-36 bg-[#ADBBDA]/20 rounded-full blur-xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[#EDE8F5] text-xs font-bold border border-white/20">
                    <Sparkles className="w-3.5 h-3.5 text-[#ADBBDA]" />
                    <span>Step-Free & Wheelchair Guide</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                    Accessible Places Near You
                  </h1>
                  <p className="text-xs sm:text-sm text-[#EDE8F5]/90 font-medium leading-relaxed">
                    Check ramps, elevators, and step-free doors. Tap any place to view details and map.
                  </p>
                </div>

                {/* Hero Quick Action Buttons */}
                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <button
                    onClick={handleVoiceOverview}
                    title="Read aloud"
                    className="px-3.5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/20 min-h-[44px]"
                  >
                    {isVoiceActive ? (
                      <VolumeX className="w-4 h-4 text-amber-300 animate-pulse" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-[#EDE8F5]" />
                    )}
                    <span>{isVoiceActive ? 'Stop Voice' : 'Voice Guide'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenScannerForPlace()}
                    className="px-4 py-2.5 rounded-2xl bg-[#EDE8F5] hover:bg-white text-[#1E2548] text-xs font-black transition-all flex items-center gap-2 shadow-md min-h-[44px]"
                  >
                    <Camera className="w-4 h-4 text-[#3D52A0]" />
                    <span>Scan Entrance</span>
                  </button>
                </div>
              </div>

              {/* 4 Interactive Feature Shortcut Cards (Decorated & Convenient for Disabled Users) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-white/20">
                {[
                  { id: 'ramps', label: 'Ramps', icon: TrendingUp, count: rampCount },
                  { id: 'stepFree', label: 'Step-Free', icon: DoorOpen, count: stepFreeCount },
                  { id: 'elevators', label: 'Elevators', icon: ArrowUpDown, count: elevatorCount },
                  { id: 'restrooms', label: 'Restrooms', icon: Bath, count: restroomCount },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedFeature === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedFeature(isSelected ? 'all' : item.id as any)}
                      className={`p-3 rounded-2xl transition-all flex items-center gap-3 text-left border ${
                        isSelected
                          ? 'bg-white text-[#1E2548] border-white shadow-md font-bold scale-[1.02]'
                          : 'bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-md'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#3D52A0] text-white' : 'bg-white/20 text-[#EDE8F5]'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold truncate">{item.label}</span>
                        <span className={`block text-[11px] ${isSelected ? 'text-[#3D52A0]' : 'text-[#EDE8F5]/80'}`}>
                          {item.count} Places
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search and Category Filter Controls */}
            <div className={`p-4 rounded-2xl border space-y-3 transition-all shadow-xs ${
              highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60'
            }`}>
              <div className="relative">
                <Search className="w-4 h-4 text-[#8697C4] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, address, or category..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#ADBBDA]/70 text-xs sm:text-sm focus:ring-2 focus:ring-[#7091E6] focus:border-[#7091E6] focus:outline-none bg-[#EDE8F5]/30 focus:bg-white text-[#1E2548] transition-all min-h-[44px]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8697C4] hover:text-[#1E2548] text-sm font-bold p-1"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Category Filter Chips with Icons */}
              <div className="flex items-center justify-between gap-2.5 flex-wrap pt-0.5">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
                  {[
                    { id: 'all', label: 'All', icon: LayoutGrid },
                    { id: 'university', label: 'Universities', icon: GraduationCap },
                    { id: 'hospital', label: 'Hospitals', icon: Stethoscope },
                    { id: 'park', label: 'Parks', icon: Trees },
                    { id: 'public_building', label: 'Civic', icon: Landmark },
                    { id: 'transit', label: 'Transit', icon: TrainFront },
                    { id: 'restaurant', label: 'Dining', icon: UtensilsCrossed },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap min-h-[38px] flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-[#3D52A0] text-white border-[#3D52A0] shadow-xs'
                            : 'bg-white text-[#3D52A0] border-[#ADBBDA]/60 hover:bg-[#EDE8F5]'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#EDE8F5]' : 'text-[#7091E6]'}`} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Status Toggle */}
                <button
                  onClick={() => setSelectedStatus(selectedStatus === 'fully_accessible' ? 'all' : 'fully_accessible')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] flex items-center gap-1.5 border ${
                    selectedStatus === 'fully_accessible'
                      ? 'bg-[#7091E6] text-white border-[#7091E6] shadow-xs'
                      : 'bg-white text-[#1E2548] border-[#ADBBDA]/60 hover:bg-[#EDE8F5]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#3D52A0]" />
                  <span>{selectedStatus === 'fully_accessible' ? 'Showing Accessible' : 'Accessible Only'}</span>
                </button>
              </div>

              {/* Active Filter Notice if any quick filter is active */}
              {selectedFeature !== 'all' && (
                <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-[#EDE8F5] text-[#3D52A0] border border-[#ADBBDA]/60">
                  <span className="font-bold flex items-center gap-1.5">
                    <span>Filtering by:</span>
                    <span className="capitalize underline">{selectedFeature.replace('stepFree', 'step-free entrance')}</span>
                  </span>
                  <button
                    onClick={() => setSelectedFeature('all')}
                    className="font-bold hover:underline text-[#1E2548]"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

            {/* Places Grid */}
            {filteredPlaces.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white rounded-2xl border border-[#ADBBDA]/60 shadow-xs">
                <AlertTriangle className="w-8 h-8 text-[#8697C4] mx-auto mb-2" />
                <h3 className="text-base font-bold text-[#1E2548] mb-1">
                  No places found
                </h3>
                <p className="text-xs text-[#8697C4] mb-3">Try clearing your filters or search term.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedStatus('all');
                    setSelectedFeature('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#3D52A0] hover:bg-[#293872] text-white text-xs font-bold transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    onSelect={(p) => setSelectedPlaceForDetail(p)}
                    onViewOnMap={(p) => handleViewOnMap(p)}
                    highContrast={highContrast}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Map View */}
        {activeTab === 'map' && (
          <MapDiscoveryView
            places={places}
            onSelectPlace={(p) => setSelectedPlaceForDetail(p)}
            onOpenReport={(p) => handleOpenScannerForPlace(p)}
            selectedPlaceId={selectedMapPlaceId}
            highContrast={highContrast}
          />
        )}

        {/* Tab 3: Dedicated AI Scanner View */}
        {activeTab === 'scanner' && (
          <AiScannerView
            places={places}
            onReportCreated={handleReportCreated}
            highContrast={highContrast}
          />
        )}

        {/* Tab 4: Reports View */}
        {activeTab === 'community' && (
          <CommunityFeed
            reports={reports}
            places={places}
            onOpenScanner={() => handleOpenScannerForPlace()}
            onUpvoteReport={handleUpvoteReport}
            onSelectPlaceById={handleSelectPlaceById}
            onAddNewReport={handleReportCreated}
            highContrast={highContrast}
          />
        )}

        {/* Tab 5: ML Model Studio & Pipeline */}
        {activeTab === 'ml-studio' && (
          <MLModelStudio highContrast={highContrast} />
        )}

        {/* Public Directory Footer with discrete Admin link */}
        <footer className="mt-16 pt-8 border-t border-[#ADBBDA]/30 text-xs text-[#8697C4]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Accessibility className="w-4 h-4 text-[#3D52A0]" />
              <span className="font-bold text-[#1E2548]">AccessMap</span>
              <span>· Step-Free Community Directory</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>ADA §405 & ISO 23599 Standards</span>
              <span>·</span>
              <button
                onClick={() => {
                  setIsAdminPortal(true);
                  window.history.pushState({}, '', '/admin');
                }}
                className="text-[#3D52A0] hover:text-[#1E2548] font-bold flex items-center gap-1.5 cursor-pointer py-1 px-2.5 rounded-xl hover:bg-[#EDE8F5] transition-colors"
                title="Go to dedicated Admin Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </button>
            </div>
          </div>
        </footer>
      </main>

      {/* Place Detail Inspection Modal */}
      <PlaceDetailModal
        place={selectedPlaceForDetail}
        reports={reports}
        onClose={() => setSelectedPlaceForDetail(null)}
        onOpenReportForPlace={(p) => handleOpenScannerForPlace(p)}
        onViewOnMap={(p) => handleViewOnMap(p)}
        highContrast={highContrast}
      />

      {/* AI Classifier Quick Modal (when opened from a Place Card) */}
      <AiClassifierModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        places={places}
        initialPlace={scannerTargetPlace}
        onReportCreated={handleReportCreated}
        highContrast={highContrast}
      />

      {/* Add New Public Place Modal */}
      <AddPlaceModal
        isOpen={isAddPlaceOpen}
        onClose={() => setIsAddPlaceOpen(false)}
        onPlaceAdded={handlePlaceAdded}
        highContrast={highContrast}
      />

      {/* Fixed Mobile Bottom Navigation Tab Bar */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        highContrast={highContrast}
      />
    </div>
  );
}
