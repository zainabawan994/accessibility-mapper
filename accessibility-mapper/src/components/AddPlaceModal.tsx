import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  CheckCircle2, 
  Plus,
  TrendingUp,
  DoorOpen,
  ArrowUpDown,
  Bath,
  CircleParking,
  Building2
} from 'lucide-react';
import { Place, PlaceCategory } from '../types/accessibility';
import { createAccessibleSvg } from '../data/mockPlaces';

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceAdded: (place: Place) => void;
  highContrast: boolean;
}

export const AddPlaceModal: React.FC<AddPlaceModalProps> = ({
  isOpen,
  onClose,
  onPlaceAdded,
  highContrast,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('university');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Metro City');
  const [summary, setSummary] = useState('');
  const [hasRamp, setHasRamp] = useState(true);
  const [hasStepFree, setHasStepFree] = useState(true);
  const [hasElevator, setHasElevator] = useState(false);
  const [hasRestroom, setHasRestroom] = useState(true);
  const [hasParking, setHasParking] = useState(false);
  const [hasAutoDoors, setHasAutoDoors] = useState(false);
  const [entranceName, setEntranceName] = useState('Main Entrance');
  const [slopeRatio, setSlopeRatio] = useState('1:12 ADA Compliant');
  const [doorWidth, setDoorWidth] = useState(95);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    const themeMap: Record<PlaceCategory, 'university' | 'hospital' | 'park' | 'restaurant' | 'civic' | 'transit'> = {
      university: 'university',
      hospital: 'hospital',
      park: 'park',
      restaurant: 'restaurant',
      public_building: 'civic',
      transit: 'transit',
      library: 'civic',
    };

    const newPlace: Place = {
      id: `place-${Date.now()}`,
      name: name.trim(),
      category,
      address: address.trim(),
      city: city.trim(),
      lat: 37.77 + (Math.random() - 0.5) * 0.04,
      lng: -122.41 + (Math.random() - 0.5) * 0.04,
      distanceKm: Number((0.5 + Math.random() * 2.5).toFixed(1)),
      accessibilityLevel: hasStepFree && (hasRamp || hasAutoDoors) ? 'fully_accessible' : 'partially_accessible',
      accessibilityScore: hasStepFree && hasRamp && hasRestroom ? 94 : 76,
      summary: summary.trim() || `Verified community accessibility profile for ${name.trim()}.`,
      features: {
        wheelchairRamps: hasRamp,
        stepFreeEntrance: hasStepFree,
        elevators: hasElevator,
        accessibleRestrooms: hasRestroom,
        designatedParking: hasParking,
        automaticDoors: hasAutoDoors,
        tactilePaving: false,
        brailleSignage: hasElevator,
        hearingLoop: false,
      },
      entrances: [
        {
          id: `ent-${Date.now()}`,
          name: entranceName.trim() || 'Main Approach',
          isStepFree: hasStepFree,
          hasRamp: hasRamp,
          slopeRatio: hasRamp ? slopeRatio : 'Level Threshold',
          doorWidthCm: doorWidth,
          hasAutomaticDoor: hasAutoDoors,
          stepCount: hasStepFree ? 0 : 4,
          notes: 'User community verified entrance path.',
        },
      ],
      imageUrl: createAccessibleSvg(themeMap[category] || 'civic', name.trim()),
      imageAlt: `Accessible entrance view of ${name.trim()}`,
      photosCount: 1,
      reportsCount: 1,
      lastUpdated: new Date().toISOString().split('T')[0],
      verifiedByCommunity: true,
      openingHours: 'Regular Public Hours',
      phone: '+1 (555) 000-0000',
    };

    onPlaceAdded(newPlace);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-place-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
    >
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden transition-all my-auto max-h-[92vh] flex flex-col ${
          highContrast
            ? 'bg-black text-white border-yellow-400'
            : 'bg-white text-[#1E2548] border-[#ADBBDA]/60'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ADBBDA]/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EDE8F5] text-[#3D52A0] flex items-center justify-center font-bold border border-[#ADBBDA]/50">
              <Plus className="w-4 h-4 text-[#3D52A0]" />
            </div>
            <div>
              <h2 id="add-place-title" className="text-base font-bold tracking-tight text-[#1E2548]">
                Add Public Place
              </h2>
              <p className="text-xs text-[#8697C4]">
                Register a new location and map its wheelchair accessibility
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8697C4] hover:text-[#1E2548] hover:bg-[#EDE8F5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#1E2548] mb-1">Place Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Westside Science Library"
                className="w-full px-3 py-2 rounded-xl border border-[#ADBBDA]/70 bg-[#EDE8F5]/20 focus:bg-white text-[#1E2548] text-xs focus:ring-2 focus:ring-[#7091E6] focus:border-[#7091E6] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#1E2548] mb-1">Venue Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PlaceCategory)}
                className="w-full px-3 py-2 rounded-xl border border-[#ADBBDA]/70 bg-white text-[#1E2548] text-xs focus:ring-2 focus:ring-[#7091E6] focus:border-[#7091E6] focus:outline-none"
              >
                <option value="university">University & College</option>
                <option value="hospital">Hospital & Clinic</option>
                <option value="park">Park & Recreation</option>
                <option value="public_building">Public & Civic Building</option>
                <option value="transit">Transit & Station</option>
                <option value="restaurant">Restaurant & Dining</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#1E2548] mb-1">Street Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 720 Campus Promenade"
                className="w-full px-3 py-2 rounded-xl border border-[#ADBBDA]/70 bg-[#EDE8F5]/20 focus:bg-white text-[#1E2548] text-xs focus:ring-2 focus:ring-[#7091E6] focus:border-[#7091E6] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#1E2548] mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#ADBBDA]/70 bg-[#EDE8F5]/20 focus:bg-white text-[#1E2548] text-xs focus:ring-2 focus:ring-[#7091E6] focus:border-[#7091E6] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#1E2548] mb-1">Accessibility Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe entrance conditions, ramp slope, elevator availability, and wheelchair turn clearance..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-[#ADBBDA]/70 bg-[#EDE8F5]/20 focus:bg-white text-[#1E2548] text-xs focus:ring-2 focus:ring-[#7091E6] focus:border-[#7091E6] focus:outline-none resize-none"
            />
          </div>

          <div>
            <span className="block font-bold text-[#1E2548] mb-2 uppercase tracking-wider text-[11px]">Accessibility Features Checklist</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                hasRamp ? 'bg-[#EDE8F5] border-[#7091E6] text-[#3D52A0]' : 'border-[#ADBBDA]/60 hover:bg-[#EDE8F5]/30'
              }`}>
                <input
                  type="checkbox"
                  checked={hasRamp}
                  onChange={(e) => setHasRamp(e.target.checked)}
                  className="rounded text-[#3D52A0] focus:ring-[#7091E6]"
                />
                <TrendingUp className="w-3.5 h-3.5 text-[#7091E6]" />
                <span className="font-semibold">Wheelchair Ramp</span>
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                hasStepFree ? 'bg-[#EDE8F5] border-[#7091E6] text-[#3D52A0]' : 'border-[#ADBBDA]/60 hover:bg-[#EDE8F5]/30'
              }`}>
                <input
                  type="checkbox"
                  checked={hasStepFree}
                  onChange={(e) => setHasStepFree(e.target.checked)}
                  className="rounded text-[#3D52A0] focus:ring-[#7091E6]"
                />
                <DoorOpen className="w-3.5 h-3.5 text-[#7091E6]" />
                <span className="font-semibold">Step-Free Entry</span>
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                hasElevator ? 'bg-[#EDE8F5] border-[#7091E6] text-[#3D52A0]' : 'border-[#ADBBDA]/60 hover:bg-[#EDE8F5]/30'
              }`}>
                <input
                  type="checkbox"
                  checked={hasElevator}
                  onChange={(e) => setHasElevator(e.target.checked)}
                  className="rounded text-[#3D52A0] focus:ring-[#7091E6]"
                />
                <ArrowUpDown className="w-3.5 h-3.5 text-[#7091E6]" />
                <span className="font-semibold">Braille Elevator</span>
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                hasRestroom ? 'bg-[#EDE8F5] border-[#7091E6] text-[#3D52A0]' : 'border-[#ADBBDA]/60 hover:bg-[#EDE8F5]/30'
              }`}>
                <input
                  type="checkbox"
                  checked={hasRestroom}
                  onChange={(e) => setHasRestroom(e.target.checked)}
                  className="rounded text-[#3D52A0] focus:ring-[#7091E6]"
                />
                <Bath className="w-3.5 h-3.5 text-[#7091E6]" />
                <span className="font-semibold">ADA Restroom</span>
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                hasParking ? 'bg-[#EDE8F5] border-[#7091E6] text-[#3D52A0]' : 'border-[#ADBBDA]/60 hover:bg-[#EDE8F5]/30'
              }`}>
                <input
                  type="checkbox"
                  checked={hasParking}
                  onChange={(e) => setHasParking(e.target.checked)}
                  className="rounded text-[#3D52A0] focus:ring-[#7091E6]"
                />
                <CircleParking className="w-3.5 h-3.5 text-[#7091E6]" />
                <span className="font-semibold">Blue Zone Parking</span>
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                hasAutoDoors ? 'bg-[#EDE8F5] border-[#7091E6] text-[#3D52A0]' : 'border-[#ADBBDA]/60 hover:bg-[#EDE8F5]/30'
              }`}>
                <input
                  type="checkbox"
                  checked={hasAutoDoors}
                  onChange={(e) => setHasAutoDoors(e.target.checked)}
                  className="rounded text-[#3D52A0] focus:ring-[#7091E6]"
                />
                <DoorOpen className="w-3.5 h-3.5 text-[#7091E6]" />
                <span className="font-semibold">Automatic Doors</span>
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-[#ADBBDA]/30 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#8697C4] hover:text-[#1E2548] rounded-xl min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-[#3D52A0] hover:bg-[#293872] active:bg-[#1E2548] transition-colors min-h-[44px] shadow-sm border border-[#3D52A0]"
            >
              Save Place Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
