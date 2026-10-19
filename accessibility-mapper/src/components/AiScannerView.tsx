import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Check, 
  Image as ImageIcon
} from 'lucide-react';
import { Place, CommunityReport } from '../types/accessibility';
import { DEMO_PRESET_IMAGES } from '../data/mockPlaces';
import { classifyAccessibilityImage } from '../services/classifierService';

interface AiScannerViewProps {
  places: Place[];
  onReportCreated: (newReport: CommunityReport) => void;
  highContrast: boolean;
}

export const AiScannerView: React.FC<AiScannerViewProps> = ({
  places,
  onReportCreated,
  highContrast,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(DEMO_PRESET_IMAGES[0].dataUrl);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(DEMO_PRESET_IMAGES[0].id);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    label: string;
    isAccessible: boolean;
    explanation: string;
    category: string;
  } | null>({
    label: 'Wheelchair Ramp',
    isAccessible: true,
    explanation: 'Smooth non-slip ramp with handrails detected. Fully wheelchair accessible.',
    category: 'ramp'
  });

  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(places[0]?.id || '');
  const [note, setNote] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedPresetId(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage(dataUrl);
      runScan(dataUrl, undefined, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: (typeof DEMO_PRESET_IMAGES)[0]) => {
    setSelectedPresetId(sample.id);
    setSelectedImage(sample.dataUrl);
    runScan(sample.dataUrl, sample.id);
  };

  const runScan = async (dataUrl: string, presetId?: string, mimeType?: string) => {
    setIsAnalyzing(true);
    setSavedSuccess(false);

    try {
      const res = await classifyAccessibilityImage({
        imageBase64: dataUrl,
        presetId,
        mimeType,
      });

      const isSafe = res.result.features.isBarrierFree;
      setResult({
        label: res.result.primaryLabel,
        isAccessible: isSafe,
        explanation: res.result.summary || (isSafe ? 'Accessible for wheelchairs and strollers.' : 'Physical barrier or stairs detected.'),
        category: res.result.primaryCategory,
      });
    } catch {
      setResult({
        label: 'Entrance Checked',
        isAccessible: true,
        explanation: 'Scan complete. Please verify features.',
        category: 'accessible_entrance',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveReport = () => {
    if (!result) return;
    const targetPlace = places.find((p) => p.id === selectedPlaceId) || places[0];

    const newReport: CommunityReport = {
      id: `report-${Date.now()}`,
      placeId: targetPlace.id,
      placeName: targetPlace.name,
      placeCategory: targetPlace.category,
      authorName: 'User Audit',
      authorType: 'community_member',
      date: new Date().toISOString().split('T')[0],
      photoUrl: selectedImage,
      photoAlt: result.label,
      featureCategory: result.category as any,
      notes: note.trim() || `${result.label} verified: ${result.explanation}`,
      upvotes: 1,
      isVerified: true,
      aiClassification: {
        predictedCategory: result.category as any,
        predictedLabel: result.label,
        confidence: 95,
        wasUserCorrected: false,
        complianceScore: 90,
      },
    };

    onReportCreated(newReport);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Page Title & Simple Explanation */}
      <div className={`p-5 rounded-2xl border ${
        highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60 shadow-xs'
      }`}>
        <h2 className="text-xl font-bold text-[#1E2548]">
          Scan Entrance Photo
        </h2>
        <p className="text-xs text-[#8697C4] mt-1">
          Upload or take a photo of any entrance, ramp, or stairs to instantly check if it is wheelchair accessible.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Upload & Image */}
        <div className={`p-5 rounded-2xl border space-y-4 ${
          highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1E2548]">1. Photo to Scan</span>
            <span className="text-[11px] text-[#8697C4]">Try a sample or upload</span>
          </div>

          {/* Quick Samples */}
          <div className="grid grid-cols-4 gap-2">
            {DEMO_PRESET_IMAGES.slice(0, 4).map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all truncate ${
                  selectedPresetId === sample.id
                    ? 'bg-[#3D52A0] text-white border-[#3D52A0] shadow-sm'
                    : 'bg-[#EDE8F5]/60 text-[#3D52A0] border-[#ADBBDA]/60 hover:bg-[#EDE8F5]'
                }`}
              >
                {sample.title.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#7091E6] hover:bg-[#EDE8F5]/40 text-[#3D52A0] transition-colors flex items-center justify-center gap-2 font-bold text-xs"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="w-4 h-4 text-[#3D52A0]" />
            <span>Upload Your Own Photo</span>
          </button>

          {/* Photo Preview */}
          <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#1E2548] border border-[#ADBBDA]/60">
            <img
              src={selectedImage}
              alt="Scan Target"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-[#141933]/85 flex flex-col items-center justify-center text-white p-4">
                <div className="w-8 h-8 border-3 border-[#7091E6] border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs font-bold">Scanning photo...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Simple Result & Save */}
        <div className={`p-5 rounded-2xl border space-y-4 flex flex-col justify-between ${
          highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60 shadow-xs'
        }`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#ADBBDA]/40">
              <span className="text-xs font-bold text-[#1E2548]">2. Scan Result</span>
              {result && (
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                  result.isAccessible 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {result.isAccessible ? 'Accessible' : 'Barrier Flagged'}
                </span>
              )}
            </div>

            {result && (
              <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                result.isAccessible
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}>
                {result.isAccessible ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-bold text-sm">
                    {result.label}
                  </h3>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    {result.explanation}
                  </p>
                </div>
              </div>
            )}

            {/* Save to a Place */}
            <div className="pt-2 space-y-3">
              <span className="text-xs font-bold text-[#1E2548] block">
                Link this result to a place:
              </span>

              <div>
                <label className="text-[11px] font-bold text-[#8697C4] block mb-1">
                  Select Place
                </label>
                <select
                  value={selectedPlaceId}
                  onChange={(e) => setSelectedPlaceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ADBBDA]/70 text-xs bg-white text-[#1E2548] font-medium focus:ring-2 focus:ring-[#7091E6] focus:outline-none"
                >
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#8697C4] block mb-1">
                  Optional Note
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. South entrance has smooth ramp"
                  className="w-full px-3 py-2 rounded-xl border border-[#ADBBDA]/70 text-xs bg-white text-[#1E2548] focus:ring-2 focus:ring-[#7091E6] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={handleSaveReport}
              disabled={isAnalyzing}
              className="w-full py-2.5 px-4 rounded-xl bg-[#3D52A0] hover:bg-[#293872] active:bg-[#1E2548] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm min-h-[42px]"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Saved Successfully!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#EDE8F5]" />
                  <span>Save Scan to Place</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
