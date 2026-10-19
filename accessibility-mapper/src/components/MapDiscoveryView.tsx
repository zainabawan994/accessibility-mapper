import React, { useState, useEffect } from 'react';
import { Place } from '../types/accessibility';
import { dbService } from '../services/dbService';
import { RealisticInteractiveMap } from './RealisticInteractiveMap';
import { 
  MapPin, 
  Navigation, 
  Search, 
  ChevronRight, 
  Compass, 
  Clock, 
  CheckCircle2, 
  X,
  Footprints,
  TrendingUp,
  ArrowUpDown,
  Bath,
  CircleParking,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';

interface MapDiscoveryViewProps {
  places: Place[];
  onSelectPlace: (place: Place) => void;
  onOpenReport: (place: Place) => void;
  highContrast: boolean;
  selectedPlaceId?: string | null;
}

export const MapDiscoveryView: React.FC<MapDiscoveryViewProps> = ({
  places,
  onSelectPlace,
  onOpenReport,
  highContrast,
  selectedPlaceId,
}) => {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(places[0] || null);

  useEffect(() => {
    if (selectedPlaceId) {
      const found = places.find((p) => p.id === selectedPlaceId);
      if (found) {
        setSelectedPlace(found);
      }
    }
  }, [selectedPlaceId, places]);
  const [searchQuery, setSearchQuery] = useState('');
  const [requireRamp, setRequireRamp] = useState(false);
  const [requireElevator, setRequireElevator] = useState(false);
  const [requireRestroom, setRequireRestroom] = useState(false);
  const [requireParking, setRequireParking] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocationActive, setUserLocationActive] = useState(false);
  const [activeRouteModal, setActiveRouteModal] = useState<Place | null>(null);

  // Filter places
  const filteredPlaces = places.filter((p) => {
    if (requireRamp && !p.features.wheelchairRamps) return false;
    if (requireElevator && !p.features.elevators) return false;
    if (requireRestroom && !p.features.accessibleRestrooms) return false;
    if (requireParking && !p.features.designatedParking) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q);
    }
    return true;
  });

  // Track map searches and feature toggles in Supabase / Database
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() || requireRamp || requireElevator || requireRestroom || requireParking) {
        const featureStr = [
          requireRamp ? 'ramps' : '',
          requireElevator ? 'elevators' : '',
          requireRestroom ? 'restrooms' : '',
          requireParking ? 'parking' : '',
        ].filter(Boolean).join(',');

        dbService.trackSearch({
          query: searchQuery,
          featureFilter: featureStr || 'all',
          resultsCount: filteredPlaces.length,
          source: 'map_search',
        });
      }
    }, 850);
    return () => clearTimeout(timer);
  }, [searchQuery, requireRamp, requireElevator, requireRestroom, requireParking, filteredPlaces.length]);

  const handleDetectLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setIsLocating(false);
          setUserLocationActive(true);
        },
        () => {
          setTimeout(() => {
            setIsLocating(false);
            setUserLocationActive(true);
          }, 400);
        },
        { timeout: 3000 }
      );
    } else {
      setTimeout(() => {
        setIsLocating(false);
        setUserLocationActive(true);
      }, 400);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className={`p-4 rounded-2xl border shadow-xs ${
        highContrast
          ? 'bg-black text-white border-yellow-400'
          : 'bg-white border-[#ADBBDA]/60'
      }`}>
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8697C4] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter map venues by name or street..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#ADBBDA]/70 text-xs focus:ring-2 focus:ring-[#7091E6] focus:border-[#7091E6] focus:outline-none bg-[#EDE8F5]/30 focus:bg-white text-[#1E2548]"
            />
          </div>

          <button
            onClick={handleDetectLocation}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap min-h-[38px] border ${
              userLocationActive
                ? 'bg-[#3D52A0] text-white border-[#3D52A0] shadow-xs'
                : 'bg-[#EDE8F5] hover:bg-[#ADBBDA]/40 text-[#3D52A0] border-[#ADBBDA]/70'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{userLocationActive ? 'GPS Position Active' : 'Detect Location'}</span>
          </button>
        </div>

        {/* Feature Filters with Icons */}
        <div className="mt-3 pt-3 border-t border-[#ADBBDA]/30 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-[#8697C4] uppercase tracking-wider mr-1">Require Feature:</span>
          
          <button
            onClick={() => setRequireRamp(!requireRamp)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
              requireRamp
                ? 'bg-[#3D52A0] text-white border-[#3D52A0] shadow-xs'
                : 'bg-white text-[#3D52A0] border-[#ADBBDA]/60 hover:bg-[#EDE8F5]'
            }`}
          >
            <TrendingUp className={`w-3.5 h-3.5 ${requireRamp ? 'text-[#EDE8F5]' : 'text-[#7091E6]'}`} />
            <span>Ramp (1:12)</span>
          </button>

          <button
            onClick={() => setRequireElevator(!requireElevator)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
              requireElevator
                ? 'bg-[#3D52A0] text-white border-[#3D52A0] shadow-xs'
                : 'bg-white text-[#3D52A0] border-[#ADBBDA]/60 hover:bg-[#EDE8F5]'
            }`}
          >
            <ArrowUpDown className={`w-3.5 h-3.5 ${requireElevator ? 'text-[#EDE8F5]' : 'text-[#7091E6]'}`} />
            <span>Braille Elevator</span>
          </button>

          <button
            onClick={() => setRequireRestroom(!requireRestroom)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
              requireRestroom
                ? 'bg-[#3D52A0] text-white border-[#3D52A0] shadow-xs'
                : 'bg-white text-[#3D52A0] border-[#ADBBDA]/60 hover:bg-[#EDE8F5]'
            }`}
          >
            <Bath className={`w-3.5 h-3.5 ${requireRestroom ? 'text-[#EDE8F5]' : 'text-[#7091E6]'}`} />
            <span>ADA Restroom</span>
          </button>

          <button
            onClick={() => setRequireParking(!requireParking)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
              requireParking
                ? 'bg-[#3D52A0] text-white border-[#3D52A0] shadow-xs'
                : 'bg-white text-[#3D52A0] border-[#ADBBDA]/60 hover:bg-[#EDE8F5]'
            }`}
          >
            <CircleParking className={`w-3.5 h-3.5 ${requireParking ? 'text-[#EDE8F5]' : 'text-[#7091E6]'}`} />
            <span>Van Accessible Bay</span>
          </button>
        </div>
      </div>

      {/* Map Layout: Vector Map on Left, Selected Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Realistic Interactive Map Canvas */}
        <div className="lg:col-span-8 h-full">
          <RealisticInteractiveMap
            places={filteredPlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={(p) => setSelectedPlace(p)}
            onOpenReport={onOpenReport}
            highContrast={highContrast}
            userLocationActive={userLocationActive}
            onPlaceImported={(importedPlace) => {
              setSelectedPlace(importedPlace);
            }}
          />
        </div>

        {/* Selected Place Detail Box */}
        <div className="lg:col-span-4 space-y-3">
          {selectedPlace ? (
            <div className={`p-4 rounded-2xl border shadow-xs ${
              highContrast
                ? 'bg-black text-white border-yellow-400'
                : 'bg-white border-[#ADBBDA]/60'
            }`}>
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#1E2548] mb-3">
                <img
                  src={selectedPlace.imageUrl}
                  alt={selectedPlace.imageAlt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141933]/90 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white text-xs">
                  <span className="font-semibold capitalize text-[#ADBBDA]">
                    {selectedPlace.category.replace('_', ' ')}
                  </span>
                  <span className="font-mono font-bold text-[#EDE8F5] tabular-nums bg-[#3D52A0] px-2 py-0.5 rounded">
                    {selectedPlace.accessibilityScore}% Score
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-[#1E2548] tracking-tight mb-1">
                {selectedPlace.name}
              </h3>
              <p className="text-xs text-[#8697C4] mb-3 line-clamp-1">
                {selectedPlace.address}
              </p>

              <div className="p-3 bg-[#EDE8F5]/50 rounded-xl border border-[#ADBBDA]/40 text-xs text-[#1E2548] mb-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#8697C4]">Entrance:</span>
                  <span className="font-semibold text-[#1E2548]">
                    {selectedPlace.entrances[0]?.hasRamp ? 'Wheelchair Ramp' : 'Level Threshold'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8697C4]">Clearance:</span>
                  <span className="font-semibold text-[#1E2548]">
                    {selectedPlace.entrances[0]?.doorWidthCm} cm wide
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8697C4]">Distance:</span>
                  <span className="font-semibold text-[#1E2548]">
                    {selectedPlace.distanceKm} km
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectPlace(selectedPlace)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#3D52A0] text-white font-semibold text-xs hover:bg-[#293872] transition-colors flex items-center justify-center gap-1 min-h-[38px] shadow-xs"
                >
                  <span>Profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveRouteModal(selectedPlace)}
                  className="py-2 px-3 rounded-xl bg-[#EDE8F5] hover:bg-[#ADBBDA]/40 text-[#3D52A0] border border-[#ADBBDA]/60 font-semibold text-xs transition-colors flex items-center gap-1.5 min-h-[38px]"
                >
                  <Footprints className="w-3.5 h-3.5 text-[#7091E6]" />
                  <span>Route</span>
                </button>
                <button
                  onClick={() => onOpenReport(selectedPlace)}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-[#EDE8F5] text-[#3D52A0] border border-[#ADBBDA]/60 font-medium text-xs transition-colors min-h-[38px]"
                >
                  Audit
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center bg-white rounded-2xl border border-[#ADBBDA]/60 text-[#8697C4] text-xs">
              Click any venue pin on the map to inspect accessibility details.
            </div>
          )}

          {/* Quick List */}
          <div className="bg-white p-3 rounded-2xl border border-[#ADBBDA]/60 shadow-xs">
            <span className="text-[11px] font-bold text-[#8697C4] block mb-2 uppercase tracking-wider">
              Accessible Venues ({filteredPlaces.length})
            </span>
            <div className="space-y-1 max-h-[190px] overflow-y-auto">
              {filteredPlaces.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlace(p)}
                  className={`w-full text-left p-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                    selectedPlace?.id === p.id
                      ? 'bg-[#EDE8F5] text-[#3D52A0] font-bold border border-[#ADBBDA]/70'
                      : 'hover:bg-[#EDE8F5]/40 text-[#1E2548]'
                  }`}
                >
                  <span className="truncate pr-2">{p.name}</span>
                  <span className="font-mono text-[#7091E6] font-bold tabular-nums shrink-0">{p.accessibilityScore}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step-Free Wheelchair Route Modal */}
      {activeRouteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
        >
          <div className="w-full max-w-md rounded-2xl bg-white text-[#1E2548] border border-[#ADBBDA]/60 shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ADBBDA]/30">
              <div className="flex items-center gap-2">
                <Footprints className="w-5 h-5 text-[#3D52A0]" />
                <h3 className="font-bold text-sm text-[#1E2548]">Step-Free Wheelchair Route</h3>
              </div>
              <button
                onClick={() => setActiveRouteModal(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8697C4] hover:text-[#1E2548] hover:bg-[#EDE8F5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-[#EDE8F5] rounded-xl border border-[#ADBBDA]/50 text-xs space-y-2">
              <div className="flex justify-between font-semibold text-[#1E2548]">
                <span>Destination:</span>
                <span>{activeRouteModal.name}</span>
              </div>
              <div className="flex justify-between text-[#3D52A0]">
                <span>Distance / Time:</span>
                <span className="font-mono">{(activeRouteModal.distanceKm ?? 1.2)} km (~{Math.round((activeRouteModal.distanceKm ?? 1.2) * 9)} min)</span>
              </div>
              <div className="flex justify-between text-[#3D52A0]">
                <span>Incline Profile:</span>
                <span>Max 1:14 (ADA Compliant)</span>
              </div>
              <div className="flex justify-between text-[#3D52A0]">
                <span>Stair Count:</span>
                <span className="font-bold text-[#3D52A0] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#7091E6]" />
                  0 Steps (100% Step-Free)
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-semibold text-[#1E2548] block">Turn-by-turn guidance:</span>
              <div className="space-y-2.5 border-l-2 border-[#7091E6] pl-3">
                <div>
                  <span className="font-medium text-[#1E2548] block">1. Depart from accessible curb cut</span>
                  <span className="text-[#8697C4] text-[11px]">Follow smooth concrete sidewalk with tactile ground pavers.</span>
                </div>
                <div>
                  <span className="font-medium text-[#1E2548] block">2. Navigate pedestrian crossing</span>
                  <span className="text-[#8697C4] text-[11px]">Audio crossing signal active, flush curb with zero lip.</span>
                </div>
                <div>
                  <span className="font-medium text-[#1E2548] block">3. Arrive at {activeRouteModal.entrances[0]?.name || 'Main Entrance'}</span>
                  <span className="text-[#8697C4] text-[11px]">
                    {activeRouteModal.entrances[0]?.hasRamp ? 'Use textured 1:12 ramp with handrails' : 'Direct zero-step entry'}.
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedPlace(activeRouteModal);
                setActiveRouteModal(null);
              }}
              className="w-full py-2.5 rounded-xl bg-[#3D52A0] hover:bg-[#293872] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-[#EDE8F5]" />
              <span>Show Route on In-App Map</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
