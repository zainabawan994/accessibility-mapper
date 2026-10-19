import React from 'react';
import { Compass, Map, ScanLine, Users, Cpu } from 'lucide-react';
import { NavigationTab } from './Header';

interface MobileNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  highContrast: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
  highContrast,
}) => {
  const tabs = [
    { id: 'discover' as const, label: 'Places', icon: Compass },
    { id: 'map' as const, label: 'Map', icon: Map },
    { id: 'scanner' as const, label: 'Scan', icon: ScanLine },
    { id: 'ml-studio' as const, label: 'ML Studio', icon: Cpu },
    { id: 'community' as const, label: 'Reports', icon: Users },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t ${
        highContrast
          ? 'bg-black text-white border-yellow-400'
          : 'bg-white/95 backdrop-blur-md text-[#8697C4] border-[#ADBBDA]/60 shadow-lg'
      }`}
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-all ${
                isActive
                  ? highContrast
                    ? 'text-yellow-400 font-bold'
                    : 'text-[#3D52A0] font-bold'
                  : highContrast
                  ? 'text-slate-300'
                  : 'text-[#8697C4] hover:text-[#7091E6]'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive && !highContrast ? 'bg-[#EDE8F5]' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-[#3D52A0]' : ''} transition-transform`} />
              </div>
              <span className="text-[11px] font-medium tracking-tight mt-0.5">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
