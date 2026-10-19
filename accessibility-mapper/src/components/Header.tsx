import React from 'react';
import { 
  Plus, 
  Compass, 
  Map, 
  ScanLine, 
  Users, 
  Accessibility,
  SlidersHorizontal,
  Cpu,
  ShieldCheck,
  Database
} from 'lucide-react';

export type NavigationTab = 'discover' | 'map' | 'scanner' | 'community' | 'ml-studio';

interface HeaderProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onOpenScanner: () => void;
  onOpenAddPlace: () => void;
  onOpenAdmin?: () => void;
  highContrast: boolean;
  onToggleContrast: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenScanner,
  onOpenAddPlace,
  onOpenAdmin,
  highContrast,
  onToggleContrast,
}) => {
  return (
    <header className={`sticky top-0 z-30 transition-colors border-b ${
      highContrast 
        ? 'bg-black text-white border-yellow-400' 
        : 'bg-white/95 backdrop-blur-md text-[#1E2548] border-[#ADBBDA]/60 shadow-xs'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          onClick={() => onTabChange('discover')}
          className="flex items-center gap-2.5 text-left group focus:outline-none rounded-xl p-1"
          aria-label="AccessMap Home"
        >
          <div className="w-10 h-10 rounded-xl bg-[#3D52A0] group-hover:bg-[#7091E6] text-[#EDE8F5] flex items-center justify-center font-bold shadow-sm transition-colors border border-[#ADBBDA]/40 shrink-0">
            <Accessibility className="w-6 h-6 text-[#EDE8F5]" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-[#1E2548] group-hover:text-[#3D52A0] transition-colors block leading-tight">
              AccessMap
            </span>
            <span className="text-[11px] font-semibold text-[#8697C4] block">
              Step-Free Guide & ML Studio
            </span>
          </div>
        </button>

        {/* Navigation Tabs - Simple & Clear */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-4 text-sm font-semibold">
          <button
            onClick={() => onTabChange('discover')}
            className={`flex items-center gap-2 py-2 px-2.5 rounded-xl transition-all ${
              activeTab === 'discover'
                ? 'bg-[#EDE8F5] text-[#3D52A0] font-bold'
                : 'text-[#8697C4] hover:text-[#3D52A0]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Places</span>
          </button>

          <button
            onClick={() => onTabChange('map')}
            className={`flex items-center gap-2 py-2 px-2.5 rounded-xl transition-all ${
              activeTab === 'map'
                ? 'bg-[#EDE8F5] text-[#3D52A0] font-bold'
                : 'text-[#8697C4] hover:text-[#3D52A0]'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Map</span>
          </button>

          <button
            onClick={() => onTabChange('scanner')}
            className={`flex items-center gap-2 py-2 px-2.5 rounded-xl transition-all ${
              activeTab === 'scanner'
                ? 'bg-[#EDE8F5] text-[#3D52A0] font-bold'
                : 'text-[#8697C4] hover:text-[#3D52A0]'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan Photo</span>
          </button>

          <button
            onClick={() => onTabChange('ml-studio')}
            className={`flex items-center gap-2 py-2 px-2.5 rounded-xl transition-all ${
              activeTab === 'ml-studio'
                ? 'bg-[#EDE8F5] text-[#3D52A0] font-bold ring-1 ring-[#7091E6]'
                : 'text-[#8697C4] hover:text-[#3D52A0]'
            }`}
          >
            <Cpu className="w-4 h-4 text-[#7091E6]" />
            <span>ML Studio</span>
          </button>

          <button
            onClick={() => onTabChange('community')}
            className={`flex items-center gap-2 py-2 px-2.5 rounded-xl transition-all ${
              activeTab === 'community'
                ? 'bg-[#EDE8F5] text-[#3D52A0] font-bold'
                : 'text-[#8697C4] hover:text-[#3D52A0]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Reports</span>
          </button>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onToggleContrast}
            title="High Contrast Mode for Easy Reading"
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] flex items-center gap-1.5 border ${
              highContrast
                ? 'bg-yellow-400 text-black border-yellow-400'
                : 'bg-[#EDE8F5] text-[#3D52A0] border-[#ADBBDA]/70 hover:bg-[#ADBBDA]/30'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Contrast</span>
          </button>

          <button
            onClick={onOpenAdmin || (() => { window.location.hash = '#/admin'; })}
            title="Admin Portal & Supabase Database Logs"
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] flex items-center gap-1.5 border ${
              highContrast
                ? 'bg-black text-white border-yellow-400'
                : 'bg-[#EDE8F5] text-[#3D52A0] border-[#ADBBDA]/70 hover:bg-[#ADBBDA]/30'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#7091E6]" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          <button
            onClick={onOpenAddPlace}
            className="px-3.5 py-2 text-xs font-bold text-white bg-[#3D52A0] hover:bg-[#293872] active:bg-[#1E2548] rounded-xl transition-all min-h-[40px] flex items-center gap-1.5 shadow-sm border border-[#3D52A0]"
          >
            <Plus className="w-4 h-4 text-[#EDE8F5]" />
            <span>Add Place</span>
          </button>
        </div>
      </div>
    </header>
  );
};
