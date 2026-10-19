import React, { useState } from 'react';
import { Place } from '../types/accessibility';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  MapPin, 
  ShieldCheck,
  TrendingUp,
  DoorOpen,
  ArrowUpDown,
  Bath,
  Volume2,
  VolumeX,
  CircleParking,
  Compass
} from 'lucide-react';

interface PlaceCardProps {
  place: Place;
  onSelect: (place: Place) => void;
  onViewOnMap: (place: Place) => void;
  highContrast: boolean;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  onSelect,
  onViewOnMap,
  highContrast,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isFullyAccessible = place.accessibilityLevel === 'fully_accessible';
  const isBarrierReported = place.accessibilityLevel === 'barrier_reported';

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const statusText = isFullyAccessible
      ? 'Fully accessible with step-free entry.'
      : isBarrierReported
      ? 'Warning: stairs or barrier reported.'
      : 'Partially accessible.';

    const featuresText = [
      place.features.wheelchairRamps ? 'Wheelchair ramp available' : '',
      place.features.stepFreeEntrance ? 'Step-free entrance' : '',
      place.features.elevators ? 'Elevator available' : '',
      place.features.accessibleRestrooms ? 'Accessible restroom' : '',
    ].filter(Boolean).join(', ');

    const speechText = `${place.name}. ${place.category.replace('_', ' ')}. ${statusText} ${featuresText ? 'Features: ' + featuresText : ''}`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <article
      onClick={() => onSelect(place)}
      className={`group cursor-pointer rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
        highContrast
          ? 'bg-black text-white border-yellow-400'
          : 'bg-white border-[#ADBBDA]/60 hover:border-[#7091E6] hover:shadow-md'
      }`}
    >
      <div>
        {/* Photo Container */}
        <div className="relative aspect-[16/10] overflow-hidden bg-[#1E2548]">
          <img
            src={place.imageUrl}
            alt={place.imageAlt}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141933]/90 via-[#1E2548]/30 to-transparent" />

          {/* Status Badge & Audio Readout */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold backdrop-blur-md shadow-xs ${
              isFullyAccessible
                ? 'bg-[#3D52A0]/95 text-[#EDE8F5] border border-[#7091E6]/50'
                : isBarrierReported
                ? 'bg-amber-600/95 text-white'
                : 'bg-[#7091E6]/95 text-white border border-[#ADBBDA]/50'
            }`}>
              {isFullyAccessible ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#EDE8F5]" />
                  <span>Accessible</span>
                </>
              ) : isBarrierReported ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-white" />
                  <span>Stairs / Barrier</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>Partial Access</span>
                </>
              )}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSpeak}
                title={isSpeaking ? 'Stop voice readout' : 'Read accessibility out loud'}
                className="w-7 h-7 rounded-lg bg-[#141933]/80 hover:bg-[#3D52A0] text-[#EDE8F5] flex items-center justify-center transition-colors border border-[#ADBBDA]/40"
                aria-label="Listen to accessibility info"
              >
                {isSpeaking ? (
                  <VolumeX className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-[#EDE8F5]" />
                )}
              </button>

              <span className="font-mono font-bold text-xs text-[#EDE8F5] bg-[#141933]/80 px-2 py-0.5 rounded-lg border border-[#ADBBDA]/30">
                {place.accessibilityScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Content Area - Minimal and High Legibility */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-[#8697C4]">
            <span className="font-bold text-[#3D52A0] uppercase tracking-wide text-[11px]">
              {place.category.replace('_', ' ')}
            </span>
            <span className="font-medium">{place.distanceKm} km away</span>
          </div>

          <h3 className="font-bold text-base text-[#1E2548] group-hover:text-[#3D52A0] transition-colors line-clamp-1">
            {place.name}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-[#8697C4] line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-[#7091E6] shrink-0" />
            <span>{place.address}</span>
          </div>

          {/* Quick Access Feature Badges */}
          <div className="pt-1 flex flex-wrap gap-1.5 text-xs">
            {place.features.wheelchairRamps && (
              <span className="px-2.5 py-1 rounded-xl bg-[#EDE8F5] text-[#3D52A0] border border-[#ADBBDA]/60 font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#7091E6]" />
                <span>Ramp</span>
              </span>
            )}
            {place.features.stepFreeEntrance && (
              <span className="px-2.5 py-1 rounded-xl bg-[#EDE8F5] text-[#3D52A0] border border-[#ADBBDA]/60 font-semibold flex items-center gap-1.5">
                <DoorOpen className="w-3.5 h-3.5 text-[#7091E6]" />
                <span>Step-Free</span>
              </span>
            )}
            {place.features.elevators && (
              <span className="px-2.5 py-1 rounded-xl bg-[#EDE8F5] text-[#3D52A0] border border-[#ADBBDA]/60 font-semibold flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#7091E6]" />
                <span>Elevator</span>
              </span>
            )}
            {place.features.accessibleRestrooms && (
              <span className="px-2.5 py-1 rounded-xl bg-[#EDE8F5] text-[#3D52A0] border border-[#ADBBDA]/60 font-semibold flex items-center gap-1.5">
                <Bath className="w-3.5 h-3.5 text-[#7091E6]" />
                <span>Restroom</span>
              </span>
            )}
            {place.features.designatedParking && (
              <span className="px-2.5 py-1 rounded-xl bg-[#EDE8F5] text-[#3D52A0] border border-[#ADBBDA]/60 font-semibold flex items-center gap-1.5">
                <CircleParking className="w-3.5 h-3.5 text-[#7091E6]" />
                <span>Parking</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons - 100% In-App, Zero External Map API Required */}
      <div className="p-3 bg-[#EDE8F5]/50 border-t border-[#ADBBDA]/40 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(place);
          }}
          className="flex-1 py-2 px-3 rounded-xl bg-white border border-[#ADBBDA]/80 text-[#3D52A0] font-bold text-xs hover:bg-[#EDE8F5] transition-colors flex items-center justify-center gap-1 min-h-[42px] shadow-xs"
        >
          <span>Details</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#8697C4]" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewOnMap(place);
          }}
          className="py-2 px-4 rounded-xl bg-[#3D52A0] hover:bg-[#293872] active:bg-[#1E2548] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[42px] shadow-sm border border-[#3D52A0]"
        >
          <Compass className="w-3.5 h-3.5 text-[#EDE8F5]" />
          <span>Show on Map</span>
        </button>
      </div>
    </article>
  );
};
