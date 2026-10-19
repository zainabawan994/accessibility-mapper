import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  Navigation, 
  Share2, 
  Globe,
  TrendingUp,
  DoorOpen,
  ArrowUpDown,
  Bath,
  CircleParking,
  ShieldCheck,
  Volume2,
  VolumeX,
  Compass
} from 'lucide-react';
import { Place, CommunityReport } from '../types/accessibility';

interface PlaceDetailModalProps {
  place: Place | null;
  reports: CommunityReport[];
  onClose: () => void;
  onOpenReportForPlace: (place: Place) => void;
  onViewOnMap: (place: Place) => void;
  highContrast: boolean;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
  place,
  reports,
  onClose,
  onOpenReportForPlace,
  onViewOnMap,
  highContrast,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  if (!place) return null;

  const placeReports = reports.filter((r) => r.placeId === place.id);
  const isFullyAccessible = place.accessibilityLevel === 'fully_accessible';
  const isBarrierReported = place.accessibilityLevel === 'barrier_reported';

  const handleSpeak = () => {
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
      ? 'Stairs or physical barrier reported.'
      : 'Partially accessible.';

    const entrancesSummary = place.entrances.map((e) => `${e.name}: ${e.isStepFree ? 'Step free' : `${e.stepCount} steps`}`).join('. ');

    const speechText = `${place.name}. Located at ${place.address}. ${statusText} Entrances: ${entrancesSummary}`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="place-detail-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
    >
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all my-auto max-h-[90vh] flex flex-col ${
          highContrast
            ? 'bg-black text-white border-yellow-400'
            : 'bg-white text-[#1E2548] border-[#ADBBDA]/60'
        }`}
      >
        {/* Modal Top Image Header */}
        <div className="relative aspect-[16/7] bg-[#1E2548] overflow-hidden shrink-0">
          <img
            src={place.imageUrl}
            alt={place.imageAlt}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141933]/95 via-[#1E2548]/35 to-transparent" />

          {/* Action buttons on image */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <button
              onClick={handleSpeak}
              title={isSpeaking ? 'Stop voice' : 'Listen to accessibility info'}
              className="w-9 h-9 rounded-full bg-[#141933]/80 hover:bg-[#3D52A0] text-[#EDE8F5] flex items-center justify-center transition-colors border border-[#ADBBDA]/30"
              aria-label="Listen out loud"
            >
              {isSpeaking ? (
                <VolumeX className="w-4 h-4 text-amber-300 animate-pulse" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#EDE8F5]" />
              )}
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: place.name,
                    text: `${place.name} - Accessibility Guide`,
                    url: window.location.href,
                  }).catch(() => {});
                }
              }}
              className="w-9 h-9 rounded-full bg-[#141933]/70 hover:bg-[#141933] text-white flex items-center justify-center transition-colors border border-[#ADBBDA]/30"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (isSpeaking && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                onClose();
              }}
              className="w-9 h-9 rounded-full bg-[#141933]/70 hover:bg-[#141933] text-white flex items-center justify-center transition-colors border border-[#ADBBDA]/30"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title Overlay */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex items-center gap-2 text-xs text-[#ADBBDA] mb-0.5">
              <span className="font-bold text-[#EDE8F5] uppercase tracking-wider text-[11px]">{place.category.replace('_', ' ')}</span>
              <span>·</span>
              <span>{place.distanceKm} km away</span>
            </div>

            <h2 id="place-detail-title" className="text-lg sm:text-xl font-bold tracking-tight text-white mb-1">
              {place.name}
            </h2>

            <div className="flex items-center gap-2 text-xs">
              {isFullyAccessible ? (
                <span className="flex items-center gap-1 text-[#EDE8F5] bg-[#3D52A0]/90 px-2.5 py-0.5 rounded-lg font-bold border border-[#7091E6]/40">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#7091E6]" />
                  Fully Accessible
                </span>
              ) : isBarrierReported ? (
                <span className="flex items-center gap-1 text-white bg-amber-600/90 px-2.5 py-0.5 rounded-lg font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-white" />
                  Stairs / Barrier
                </span>
              ) : (
                <span className="flex items-center gap-1 text-white bg-[#7091E6]/90 px-2.5 py-0.5 rounded-lg font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  Partial Access
                </span>
              )}
              <span className="bg-[#141933]/80 px-2.5 py-0.5 rounded-lg font-mono font-bold text-[#EDE8F5] text-xs border border-[#ADBBDA]/30">
                {place.accessibilityScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Essential Location Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-3 border-b border-[#ADBBDA]/30 text-[#1E2548]">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#7091E6] shrink-0" />
              <span className="font-medium">{place.address}, {place.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#7091E6] shrink-0" />
              <span className="font-medium">{place.openingHours}</span>
            </div>
            {place.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#7091E6] shrink-0" />
                <a href={`tel:${place.phone.replace(/[^0-9+]/g, '')}`} className="text-[#3D52A0] hover:underline font-bold">
                  {place.phone}
                </a>
              </div>
            )}
            {place.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#7091E6] shrink-0" />
                <a href={place.website} target="_blank" rel="noreferrer" className="text-[#3D52A0] hover:underline font-bold truncate max-w-[200px]">
                  Website
                </a>
              </div>
            )}
          </div>

          {/* Feature Badges - Prominent and Visual */}
          <div>
            <h3 className="text-xs font-bold text-[#3D52A0] uppercase tracking-wide mb-2">
              Accessibility Features
            </h3>
            <div className="flex flex-wrap gap-2">
              {place.features.wheelchairRamps && (
                <span className="px-3 py-1.5 rounded-xl bg-[#EDE8F5] text-[#3D52A0] border border-[#ADBBDA]/60 font-bold flex items-center gap-1.5 text-xs">
                  <TrendingUp className="w-4 h-4 text-[#7091E6]" />
                  <span>Wheelchair Ramp</span>
                </span>
              )}
              {place.features.stepFreeEntrance && (
                <span className="px-3 py-1.5 rounded-xl bg-[#EDE8F5] text-[#3D52A0] border border-[#ADBBDA]/60 font-bold flex items-center gap-1.5 text-xs">
                  <DoorOpen className="w-4 h-4 text-[#7091E6]" />
                  <span>Step-Free Entrance</span>
                </span>
              )}
              {place.features.elevators && (
                <span className="px-3 py-1.5 rounded-xl bg-[#EDE8F5] text-[#3D52A0] border border-[#ADBBDA]/60 font-bold flex items-center gap-1.5 text-xs">
                  <ArrowUpDown className="w-4 h-4 text-[#7091E6]" />
                  <span>Braille Elevator</span>
                </span>
              )}
              {place.features.accessibleRestrooms && (
                <span className="px-3 py-1.5 rounded-xl bg-[#EDE8F5] text-[#3D52A0] border border-[#ADBBDA]/60 font-bold flex items-center gap-1.5 text-xs">
                  <Bath className="w-4 h-4 text-[#7091E6]" />
                  <span>Accessible Restroom</span>
                </span>
              )}
              {place.features.designatedParking && (
                <span className="px-3 py-1.5 rounded-xl bg-[#EDE8F5] text-[#3D52A0] border border-[#ADBBDA]/60 font-bold flex items-center gap-1.5 text-xs">
                  <CircleParking className="w-4 h-4 text-[#7091E6]" />
                  <span>Accessible Parking</span>
                </span>
              )}
            </div>
          </div>

          {/* Entrances Breakdown - Scannable Cards */}
          <div>
            <h3 className="text-xs font-bold text-[#3D52A0] uppercase tracking-wide mb-2">
              Entrances ({place.entrances.length})
            </h3>

            <div className="space-y-2">
              {place.entrances.map((ent) => (
                <div
                  key={ent.id}
                  className={`p-3 rounded-xl border ${
                    ent.isStepFree ? 'bg-[#EDE8F5]/60 border-[#ADBBDA]/70' : 'bg-amber-50 border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[#1E2548] flex items-center gap-1.5 text-xs">
                      {ent.isStepFree ? (
                        <CheckCircle2 className="w-4 h-4 text-[#3D52A0] shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <span>{ent.name}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                      ent.isStepFree ? 'bg-[#3D52A0] text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {ent.isStepFree ? 'Step-Free' : `${ent.stepCount} Steps`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#3D52A0] font-medium">
                    <span>Door: <strong>{ent.doorWidthCm} cm</strong></span>
                    <span>•</span>
                    <span>Type: <strong>{ent.hasAutomaticDoor ? 'Automatic' : 'Manual'}</strong></span>
                    {ent.hasRamp && (
                      <>
                        <span>•</span>
                        <span>Ramp: <strong>{ent.slopeRatio || 'Yes'}</strong></span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Community Photos / Audits */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-[#3D52A0] uppercase tracking-wide">
                Community Audits ({placeReports.length})
              </h3>
              <button
                type="button"
                onClick={() => onOpenReportForPlace(place)}
                className="text-[#3D52A0] font-bold hover:text-[#7091E6] flex items-center gap-1 text-xs"
              >
                <Camera className="w-3.5 h-3.5 text-[#7091E6]" />
                <span>Add Photo Audit</span>
              </button>
            </div>

            {placeReports.length === 0 ? (
              <p className="text-[#8697C4] py-1 text-xs">No audits yet. Be the first to audit this location!</p>
            ) : (
              <div className="space-y-2">
                {placeReports.map((report) => (
                  <div key={report.id} className="p-2.5 rounded-xl border border-[#ADBBDA]/50 bg-[#EDE8F5]/40 flex gap-3 items-center">
                    <img
                      src={report.photoUrl}
                      alt={report.photoAlt}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover bg-[#1E2548] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1E2548] text-xs">{report.authorName}</span>
                        <span className="text-[#8697C4] text-[10px]">{report.date}</span>
                      </div>
                      <span className="text-xs text-[#3D52A0] font-bold block">
                        {report.aiClassification.predictedLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:px-5 border-t border-[#ADBBDA]/30 flex items-center justify-between gap-3 shrink-0 bg-[#EDE8F5]/30">
          <button
            onClick={() => onOpenReportForPlace(place)}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-[#3D52A0] bg-white border border-[#ADBBDA]/70 hover:bg-[#EDE8F5] transition-colors min-h-[42px] flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Camera className="w-4 h-4 text-[#7091E6]" />
            <span>Audit Photo</span>
          </button>
          <button
            onClick={() => {
              onViewOnMap(place);
              onClose();
            }}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#3D52A0] hover:bg-[#293872] active:bg-[#1E2548] transition-colors min-h-[42px] flex items-center justify-center gap-1.5 shadow-sm border border-[#3D52A0]"
          >
            <Compass className="w-4 h-4 text-[#EDE8F5]" />
            <span>Show on Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};
