import React from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Ruler, 
  ShieldCheck,
  TrendingUp,
  DoorOpen,
  ArrowUpDown,
  Bath,
  CircleParking,
  ScanLine
} from 'lucide-react';

interface StandardsGuideProps {
  onOpenScanner: () => void;
  highContrast: boolean;
}

export const StandardsGuide: React.FC<StandardsGuideProps> = ({
  onOpenScanner,
  highContrast,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xs ${
        highContrast
          ? 'bg-black text-white border-yellow-400'
          : 'bg-white border-[#ADBBDA]/60'
      }`}>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#3D52A0] mb-2">
          <BookOpen className="w-4 h-4 text-[#7091E6]" />
          <span>Universal Design & Field Measurement Standards</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E2548] mb-2">
          Accessibility Architecture & Computer Vision Classification
        </h2>
        <p className="text-xs sm:text-sm text-[#1E2548]/75 leading-relaxed">
          How our platform evaluates physical architecture to ensure safe, autonomous transit for manual wheelchairs, power chairs, mobility scooters, and caregivers.
        </p>
      </div>

      {/* Grid of Key Architectural Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Metric 1: Ramps */}
        <div className="p-5 rounded-2xl bg-white border border-[#ADBBDA]/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#1E2548] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#3D52A0]" />
              <span>Ramp Slope (1:12 Standard)</span>
            </h3>
            <span className="text-[11px] font-mono font-bold text-[#7091E6] bg-[#EDE8F5] px-2 py-0.5 rounded border border-[#ADBBDA]/50">
              ADA §405
            </span>
          </div>
          <p className="text-xs text-[#1E2548]/80 leading-relaxed">
            The maximum slope of a wheelchair ramp must not exceed <strong>1:12 (8.33% grade)</strong>. For every 1 inch of vertical rise, there must be at least 12 inches of horizontal run.
          </p>
          <div className="p-3 bg-[#EDE8F5]/50 rounded-xl border border-[#ADBBDA]/40 text-xs space-y-1.5 text-[#1E2548]">
            <div className="flex justify-between">
              <span className="text-[#8697C4]">Min. Clear Width:</span>
              <span className="font-semibold text-[#1E2548]">36 inches (91.5 cm)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8697C4]">Handrail Height:</span>
              <span className="font-semibold text-[#1E2548]">34 to 38 inches continuous</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8697C4]">Rest Landings:</span>
              <span className="font-semibold text-[#1E2548]">Every 30 feet of ramp run</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Door Openings */}
        <div className="p-5 rounded-2xl bg-white border border-[#ADBBDA]/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#1E2548] flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-[#3D52A0]" />
              <span>Door Width Clearance</span>
            </h3>
            <span className="text-[11px] font-mono font-bold text-[#7091E6] bg-[#EDE8F5] px-2 py-0.5 rounded border border-[#ADBBDA]/50">
              ADA §404
            </span>
          </div>
          <p className="text-xs text-[#1E2548]/80 leading-relaxed">
            Door openings must provide a minimum clear opening width of <strong>32 inches (81.5 cm)</strong> measured between the face of the door and the opposite stop. 36 inches is recommended for bariatric and power chairs.
          </p>
          <div className="p-3 bg-[#EDE8F5]/50 rounded-xl border border-[#ADBBDA]/40 text-xs space-y-1.5 text-[#1E2548]">
            <div className="flex justify-between">
              <span className="text-[#8697C4]">Threshold Height:</span>
              <span className="font-semibold text-[#1E2548]">Max 0.5" (13 mm) beveled</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8697C4]">Opening Force:</span>
              <span className="font-semibold text-[#1E2548]">Max 5.0 lbs for interior doors</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8697C4]">Auto Sensor Delay:</span>
              <span className="font-semibold text-[#1E2548]">Min 5.0 seconds hold-open</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Restrooms */}
        <div className="p-5 rounded-2xl bg-white border border-[#ADBBDA]/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#1E2548] flex items-center gap-2">
              <Bath className="w-4 h-4 text-[#3D52A0]" />
              <span>Accessible Restrooms & Stalls</span>
            </h3>
            <span className="text-[11px] font-mono font-bold text-[#7091E6] bg-[#EDE8F5] px-2 py-0.5 rounded border border-[#ADBBDA]/50">
              ADA §604
            </span>
          </div>
          <p className="text-xs text-[#1E2548]/80 leading-relaxed">
            A circular turning space of at least <strong>60 inches (152.5 cm) diameter</strong> or a T-shaped turning space is required to permit a wheelchair to make a 180-degree turn.
          </p>
          <div className="p-3 bg-[#EDE8F5]/50 rounded-xl border border-[#ADBBDA]/40 text-xs space-y-1.5 text-[#1E2548]">
            <div className="flex justify-between">
              <span className="text-[#8697C4]">Grab Bar Height:</span>
              <span className="font-semibold text-[#1E2548]">33 to 36 inches from floor</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8697C4]">Toilet Seat Height:</span>
              <span className="font-semibold text-[#1E2548]">17 to 19 inches to top</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8697C4]">Sink Knee Clearance:</span>
              <span className="font-semibold text-[#1E2548]">27" high, 30" wide</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Elevators & Parking */}
        <div className="p-5 rounded-2xl bg-white border border-[#ADBBDA]/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#1E2548] flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-[#3D52A0]" />
              <span>Elevators & Parking Bays</span>
            </h3>
            <span className="text-[11px] font-mono font-bold text-[#7091E6] bg-[#EDE8F5] px-2 py-0.5 rounded border border-[#ADBBDA]/50">
              ADA §407
            </span>
          </div>
          <p className="text-xs text-[#1E2548]/80 leading-relaxed">
            Elevator call buttons must be positioned at <strong>max 48 inches (122 cm)</strong> with raised tactile braille characters and audible floor arrival chimes.
          </p>
          <div className="p-3 bg-[#EDE8F5]/50 rounded-xl border border-[#ADBBDA]/40 text-xs space-y-1.5 text-[#1E2548]">
            <div className="flex justify-between">
              <span className="text-[#8697C4]">Van Accessible Space:</span>
              <span className="font-semibold text-[#1E2548]">132" wide + 60" aisle</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8697C4]">Door Open Duration:</span>
              <span className="font-semibold text-[#1E2548]">Min 3 seconds response</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8697C4]">Braille Height:</span>
              <span className="font-semibold text-[#1E2548]">48" to centerline</span>
            </div>
          </div>
        </div>
      </div>

      {/* CNN Transfer Learning Technical Overview */}
      <div className="p-6 rounded-3xl bg-[#1E2548] text-white border border-[#ADBBDA]/40 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#ADBBDA]">
          <Layers className="w-4 h-4 text-[#7091E6]" />
          <span>Machine Learning Architecture</span>
        </div>
        <h3 className="text-lg font-bold text-[#EDE8F5]">
          Transfer Learning with MobileNetV2 for Accessibility Classification
        </h3>
        <p className="text-xs sm:text-sm text-[#EDE8F5]/80 leading-relaxed">
          MobileNetV2 uses inverted residual blocks and depthwise separable convolutions to drastically reduce model parameters (~3.4 million parameters) while preserving high feature representation. We freeze the ImageNet feature extraction trunk and attach custom dense classification layers trained on thousands of labeled public accessibility photographs:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3.5 bg-[#141933]/90 rounded-2xl border border-[#7091E6]/30">
            <span className="text-[#7091E6] font-mono font-bold block mb-1">01. Feature Extraction</span>
            <p className="text-[#EDE8F5]/80 text-[11px]">
              Extracts high-level architectural textures (handrail cylinders, ramp edges, step risers).
            </p>
          </div>
          <div className="p-3.5 bg-[#141933]/90 rounded-2xl border border-[#7091E6]/30">
            <span className="text-[#7091E6] font-mono font-bold block mb-1">02. Dense Head</span>
            <p className="text-[#EDE8F5]/80 text-[11px]">
              Dense layer (128 units, ReLU) with Dropout (0.3) to prevent overfitting on specific lighting.
            </p>
          </div>
          <div className="p-3.5 bg-[#141933]/90 rounded-2xl border border-[#7091E6]/30">
            <span className="text-[#7091E6] font-mono font-bold block mb-1">03. Softmax Probabilities</span>
            <p className="text-[#EDE8F5]/80 text-[11px]">
              Multi-class probability distribution across ramps, step barriers, automatic doors, and lifts.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onOpenScanner}
            className="px-4 py-2 rounded-xl bg-[#3D52A0] hover:bg-[#7091E6] text-white font-bold text-xs transition-colors min-h-[44px] flex items-center gap-2 shadow-sm border border-[#7091E6]/40"
          >
            <ScanLine className="w-4 h-4 text-[#EDE8F5]" />
            <span>Test Model with Audit Photograph</span>
          </button>
        </div>
      </div>
    </div>
  );
};
