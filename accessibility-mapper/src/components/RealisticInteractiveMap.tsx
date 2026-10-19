import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Place } from '../types/accessibility';
import { 
  Layers, 
  Plus, 
  Minus, 
  Crosshair, 
  Compass, 
  Sparkles, 
  Search, 
  Cloud, 
  ExternalLink, 
  MapPin, 
  X, 
  CheckCircle2, 
  KeyRound,
  Download,
  DoorOpen,
  TrendingUp
} from 'lucide-react';
import { serpApiFrontendService } from '../services/serpApiService';

// Map tile providers
export type MapLayerType = 'streets' | 'satellite' | 'voyager' | 'terrain' | 'dark';

const TILE_LAYERS: Record<MapLayerType, { url: string; attribution: string; maxZoom: number }> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
  },
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
    maxZoom: 20,
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap',
    maxZoom: 17,
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
    maxZoom: 20,
  },
};

interface RealisticInteractiveMapProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  onOpenReport?: (place: Place) => void;
  highContrast: boolean;
  userLocationActive: boolean;
  onPlaceImported?: (place: Place) => void;
}

export const RealisticInteractiveMap: React.FC<RealisticInteractiveMapProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  onOpenReport,
  highContrast,
  userLocationActive,
  onPlaceImported,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);

  // Map settings
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('voyager');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  
  // SerpApi Google Maps Live Search States
  const [isSerpModalOpen, setIsSerpModalOpen] = useState(false);
  const [serpQuery, setSerpQuery] = useState('accessible cafes and libraries');
  const [customApiKey, setCustomApiKey] = useState(() => {
    return localStorage.getItem('accessmap_serpapi_key') || '';
  });
  const [isSearchingSerp, setIsSearchingSerp] = useState(false);
  const [serpResults, setSerpResults] = useState<Place[]>([]);
  const [serpMessage, setSerpMessage] = useState<string | null>(null);
  const [isSerpLive, setIsSerpLive] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center: San Francisco Bay Area / Downtown
    const initialCenter: [number, number] = [37.7792, -122.4194];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Add Tile Layer
    const tileConfig = TILE_LAYERS[activeLayer];
    const tileLayer = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
      subdomains: 'abc',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Layer groups for markers and route polylines
    const routesGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

    routesLayerRef.current = routesGroup;
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Resize observer to ensure tiles always fit container perfectly
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Layer Switch
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileConfig = TILE_LAYERS[activeLayer];
    tileLayerRef.current.setUrl(tileConfig.url);
  }, [activeLayer]);

  // Update Markers and Routes whenever places or selectedPlace changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const routesGroup = routesLayerRef.current;
    if (!map || !markersGroup || !routesGroup) return;

    markersGroup.clearLayers();
    routesGroup.clearLayers();

    // Combine standard places and active SerpApi searched places
    const combinedPlaces = [...places];
    serpResults.forEach((sp) => {
      if (!combinedPlaces.some((p) => p.id === sp.id)) {
        combinedPlaces.push(sp);
      }
    });

    // Draw accessible step-free route lines between major fully accessible hubs
    const accessiblePoints: [number, number][] = combinedPlaces
      .filter((p) => p.accessibilityLevel === 'fully_accessible')
      .slice(0, 5)
      .map((p) => [p.lat, p.lng]);

    if (accessiblePoints.length >= 2) {
      const routePolyline = L.polyline(accessiblePoints, {
        color: '#7091E6',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.85,
        lineCap: 'round',
      });
      routesGroup.addLayer(routePolyline);
    }

    // Add custom styled accessible pins for all venues
    combinedPlaces.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const isBarrier = place.accessibilityLevel === 'barrier_reported';
      const isSerpVenue = place.id.startsWith('serp-');
      
      const pinBg = isBarrier 
        ? '#f59e0b' 
        : isSerpVenue 
        ? '#10b981' 
        : '#3D52A0';

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 44],
        popupAnchor: [0, -42],
        html: `
          <div class="relative flex flex-col items-center group cursor-pointer">
            ${isSelected ? `
              <div class="absolute -inset-1.5 rounded-full bg-[#7091E6] opacity-40 animate-ping"></div>
              <div class="absolute -inset-2 rounded-full border-2 border-white opacity-80"></div>
            ` : ''}
            
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xl border-2 border-white transition-all transform hover:scale-110" style="background-color: ${pinBg};">
              <span class="text-[11px] font-black font-mono tracking-tighter">${place.accessibilityScore}%</span>
            </div>

            <div class="w-2 h-2 -mt-1 rotate-45 border-r border-b border-white" style="background-color: ${pinBg};"></div>

            <div class="mt-1 px-2 py-0.5 rounded-md bg-[#141933]/90 text-white text-[9px] font-bold whitespace-nowrap shadow-md border border-white/20 max-w-[110px] truncate">
              ${place.name.split('·')[0].slice(0, 16)}
            </div>
          </div>
        `,
      });

      const marker = L.marker([place.lat, place.lng], { icon: customIcon });

      marker.on('click', () => {
        onSelectPlace(place);
        map.flyTo([place.lat, place.lng], 15, { duration: 0.8 });
      });

      markersGroup.addLayer(marker);
    });

    // Center map if selectedPlace changed externally
    if (selectedPlace) {
      map.flyTo([selectedPlace.lat, selectedPlace.lng], 15, { duration: 0.8 });
    }
  }, [places, selectedPlace, serpResults]);

  // Handle Geolocation to User's GPS
  const handleLocateMe = () => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;

          // Add pulsing user beacon
          const userIcon = L.divIcon({
            className: 'user-beacon-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            html: `
              <div class="relative w-6 h-6 flex items-center justify-center">
                <div class="absolute w-8 h-8 rounded-full bg-[#7091E6] opacity-40 animate-ping"></div>
                <div class="w-4 h-4 rounded-full bg-[#7091E6] border-2 border-white shadow-lg"></div>
              </div>
            `,
          });

          L.marker([userLat, userLng], { icon: userIcon }).addTo(map);
          map.flyTo([userLat, userLng], 15, { duration: 1.2 });
        },
        () => {
          // Fallback to center
          map.flyTo([37.7749, -122.4194], 14, { duration: 1 });
        }
      );
    }
  };

  // Perform Live Google Maps Search via SerpApi
  const handleSerpSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!serpQuery.trim()) return;

    setIsSearchingSerp(true);
    setSerpMessage(null);

    const center = mapInstanceRef.current?.getCenter() || { lat: 37.7749, lng: -122.4194 };

    try {
      const res = await serpApiFrontendService.searchGoogleMaps({
        query: serpQuery,
        lat: center.lat,
        lng: center.lng,
        apiKey: customApiKey.trim() || undefined,
      });

      setSerpResults(res.places || []);
      setIsSerpLive(res.source === 'serpapi_live');
      setSerpMessage(res.message || null);

      // If results returned, pan map to first place
      if (res.places && res.places.length > 0) {
        const first = res.places[0];
        onSelectPlace(first);
        mapInstanceRef.current?.flyTo([first.lat, first.lng], 14, { duration: 1 });
      }
    } catch (err: any) {
      setSerpMessage(`Search error: ${err.message}`);
    } finally {
      setIsSearchingSerp(false);
    }
  };

  // Save SerpApi key to local storage
  const handleSaveApiKey = (key: string) => {
    setCustomApiKey(key);
    localStorage.setItem('accessmap_serpapi_key', key);
  };

  // Import SerpApi place into Supabase
  const handleImportToSupabase = async (place: Place) => {
    setImportingId(place.id);
    try {
      const res = await serpApiFrontendService.importPlace(place);
      if (res.success && res.data) {
        setImportedIds((prev) => new Set([...prev, place.id]));
        if (onPlaceImported) {
          onPlaceImported(res.data);
        }
      }
    } catch {
      console.warn('Import failed');
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] lg:min-h-[560px] rounded-3xl overflow-hidden shadow-lg border border-[#ADBBDA]/60 bg-[#1E2548] flex flex-col">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        {/* Left: Live Status Badge */}
        <div className="pointer-events-auto bg-[#141933]/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-white flex items-center gap-2.5 shadow-md">
          <Compass className="w-4 h-4 text-[#7091E6]" />
          <div className="text-xs">
            <span className="font-bold block leading-tight">Realistic Accessible Map</span>
            <span className="text-[10px] text-[#ADBBDA] block">
              {places.length + serpResults.length} venues mapped · Real GPS coordinates
            </span>
          </div>
        </div>

        {/* Right: Quick Map Actions & SerpApi Button */}
        <div className="pointer-events-auto flex items-center gap-2 flex-wrap">
          {/* Google Maps Search (SerpApi) Trigger */}
          <button
            onClick={() => setIsSerpModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#1E2548] to-[#3D52A0] hover:from-[#3D52A0] hover:to-[#7091E6] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 border border-white/20 min-h-[40px] cursor-pointer"
            title="Search real Google Maps places using SerpApi"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Google Maps Search (SerpApi)</span>
            <span className="sm:hidden">Google Maps</span>
            {isSerpLive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Layer Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="p-2.5 rounded-2xl bg-white/90 hover:bg-white text-[#1E2548] shadow-md border border-[#ADBBDA]/70 transition-all flex items-center gap-1.5 cursor-pointer min-h-[40px]"
              title="Change Map Style (Satellite, Streets, Terrain)"
            >
              <Layers className="w-4 h-4 text-[#3D52A0]" />
              <span className="text-xs font-bold capitalize hidden md:inline">{activeLayer}</span>
            </button>

            {showLayerMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-[#ADBBDA]/60 p-2 space-y-1 z-50 text-xs animate-in fade-in zoom-in-95">
                {[
                  { id: 'voyager' as const, label: 'Clean Voyager' },
                  { id: 'satellite' as const, label: 'Realistic Satellite' },
                  { id: 'streets' as const, label: 'Standard Streets' },
                  { id: 'terrain' as const, label: 'Topographic Terrain' },
                  { id: 'dark' as const, label: 'Night Dark Mode' },
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      setActiveLayer(l.id);
                      setShowLayerMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-colors flex items-center justify-between ${
                      activeLayer === l.id
                        ? 'bg-[#3D52A0] text-white'
                        : 'text-[#1E2548] hover:bg-[#EDE8F5]'
                    }`}
                  >
                    <span>{l.label}</span>
                    {activeLayer === l.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Locate Me */}
          <button
            onClick={handleLocateMe}
            className="p-2.5 rounded-2xl bg-white/90 hover:bg-white text-[#3D52A0] shadow-md border border-[#ADBBDA]/70 transition-all cursor-pointer min-h-[40px]"
            title="Center on my current location"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actual Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full flex-1 h-full z-0 min-h-[480px]" />

      {/* Bottom Floating Legend & Route Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-[400] flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        <div className="pointer-events-auto bg-[#141933]/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-white flex items-center gap-3 text-xs shadow-md">
          <div className="flex items-center gap-1.5 font-bold text-[11px]">
            <span className="w-3 h-3 rounded-full bg-[#3D52A0] border border-white" />
            <span>Accessible (90%+)</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-[11px]">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white" />
            <span>Google Maps</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-[11px]">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white" />
            <span>Barrier Reported</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-2xl shadow-md border border-[#ADBBDA]/70">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#EDE8F5] text-[#1E2548] font-bold cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-[#ADBBDA]/60" />
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#EDE8F5] text-[#1E2548] font-bold cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= SERPAPI GOOGLE MAPS SEARCH MODAL ================= */}
      {isSerpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-[#ADBBDA]/60 shadow-2xl p-5 sm:p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto text-[#1E2548]">
            <div className="flex items-center justify-between pb-3 border-b border-[#ADBBDA]/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3D52A0] to-[#7091E6] text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1E2548]">
                    Live Google Maps Search (SerpApi Engine)
                  </h3>
                  <span className="text-[11px] text-[#8697C4]">
                    Discover real-world venues, photos, and wheelchair accessibility from Google Maps
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsSerpModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#EDE8F5] text-[#8697C4] hover:text-[#1E2548] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* API Key Input Accordion / Helper */}
            <div className="p-3.5 rounded-2xl bg-[#EDE8F5]/50 border border-[#ADBBDA]/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1E2548] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#3D52A0]" />
                  <span>SerpApi Key Configuration</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  customApiKey ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {customApiKey ? 'Key Provided' : 'Curated Fallback Active'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  placeholder="Paste your SerpApi Key here (or set SERPAPI_KEY in .env)"
                  className="flex-1 px-3 py-2 rounded-xl border border-[#ADBBDA]/70 text-xs text-[#1E2548] bg-white focus:outline-none focus:border-[#3D52A0]"
                />
                <button
                  type="button"
                  onClick={() => handleSaveApiKey(customApiKey)}
                  className="px-3 py-2 rounded-xl bg-[#3D52A0] text-white text-xs font-bold hover:bg-[#293872] cursor-pointer"
                >
                  Save
                </button>
              </div>
              <p className="text-[10px] text-[#8697C4]">
                Don't have a key yet? You can still test! Curated realistic Google Maps venues will be retrieved automatically.
              </p>
            </div>

            {/* Search Input Form */}
            <form onSubmit={handleSerpSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8697C4] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={serpQuery}
                  onChange={(e) => setSerpQuery(e.target.value)}
                  placeholder="e.g. coffee shops with wheelchair ramp, public libraries, museums..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#ADBBDA]/70 text-xs text-[#1E2548] focus:outline-none focus:border-[#3D52A0] bg-[#EDE8F5]/30 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSearchingSerp}
                className="px-4 py-2.5 rounded-xl bg-[#3D52A0] hover:bg-[#293872] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Search className={`w-3.5 h-3.5 ${isSearchingSerp ? 'animate-spin' : ''}`} />
                <span>{isSearchingSerp ? 'Searching...' : 'Search Google Maps'}</span>
              </button>
            </form>

            {/* Status Message */}
            {serpMessage && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
                <span>{serpMessage}</span>
                {isSerpLive && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-800">
                    Live SerpApi
                  </span>
                )}
              </div>
            )}

            {/* Search Results List */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#8697C4] uppercase tracking-wider block">
                Discovered Venues ({serpResults.length})
              </span>

              {serpResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8697C4] space-y-1">
                  <MapPin className="w-8 h-8 text-[#8697C4] mx-auto opacity-40 mb-2" />
                  <p className="font-bold">No Google Maps venues loaded yet.</p>
                  <p>Type a search query above and click "Search Google Maps" to fetch real places!</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {serpResults.map((place) => {
                    const isImported = importedIds.has(place.id);
                    return (
                      <div
                        key={place.id}
                        className="p-3 rounded-2xl border border-[#ADBBDA]/50 hover:border-[#3D52A0] transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={place.imageUrl}
                            alt={place.name}
                            className="w-14 h-14 rounded-xl object-cover bg-[#1E2548] shrink-0"
                          />
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs text-[#1E2548] line-clamp-1">{place.name}</h4>
                              <span className="px-1.5 py-0.2 bg-[#EDE8F5] text-[#3D52A0] rounded text-[10px] font-mono font-bold">
                                {place.accessibilityScore}% Score
                              </span>
                            </div>
                            <p className="text-[11px] text-[#8697C4] line-clamp-1">{place.address}</p>
                            <div className="flex items-center gap-2 text-[10px] text-[#3D52A0] font-semibold">
                              {place.features.wheelchairRamps && (
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3 text-[#7091E6]" /> Ramp
                                </span>
                              )}
                              {place.features.stepFreeEntrance && (
                                <span className="flex items-center gap-1">
                                  <DoorOpen className="w-3 h-3 text-[#7091E6]" /> Step-Free
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              onSelectPlace(place);
                              setIsSerpModalOpen(false);
                            }}
                            className="px-3 py-1.5 rounded-xl border border-[#ADBBDA]/60 hover:bg-[#EDE8F5] text-[#1E2548] text-xs font-bold transition-colors cursor-pointer"
                          >
                            View on Map
                          </button>

                          <button
                            onClick={() => handleImportToSupabase(place)}
                            disabled={isImported || importingId === place.id}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isImported
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-[#3D52A0] hover:bg-[#293872] text-white shadow-xs'
                            }`}
                          >
                            <Download className="w-3 h-3" />
                            <span>{isImported ? 'Saved in Supabase' : importingId === place.id ? 'Saving...' : 'Save to DB'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
