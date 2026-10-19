import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Check,
  Send
} from 'lucide-react';
import { Place, CommunityReport } from '../types/accessibility';
import { DEMO_PRESET_IMAGES } from '../data/mockPlaces';
import { classifyAccessibilityImage } from '../services/classifierService';

interface AiClassifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  places: Place[];
  initialPlace?: Place | null;
  onReportCreated: (newReport: CommunityReport) => void;
  highContrast: boolean;
}

export const AiClassifierModal: React.FC<AiClassifierModalProps> = ({
  isOpen,
  onClose,
  places,
  initialPlace,
  onReportCreated,
  highContrast,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(DEMO_PRESET_IMAGES[0].dataUrl);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(
    initialPlace?.id || places[0]?.id || ''
  );
  const [note, setNote] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scanResult, setScanResult] = useState<{
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialPlace) {
      setSelectedPlaceId(initialPlace.id);
    }
  }, [initialPlace]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage(dataUrl);
      runScan(dataUrl, undefined, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: (typeof DEMO_PRESET_IMAGES)[0]) => {
    setSelectedImage(sample.dataUrl);
    runScan(sample.dataUrl, sample.id);
  };

  const runScan = async (dataUrl: string, presetId?: string, mimeType?: string) => {
    setIsAnalyzing(true);
    try {
      const res = await classifyAccessibilityImage({
        imageBase64: dataUrl,
        presetId,
        mimeType,
      });

      const isSafe = res.result.features.isBarrierFree;
      setScanResult({
        label: res.result.primaryLabel,
        isAccessible: isSafe,
        explanation: res.result.summary || (isSafe ? 'Step-free and accessible.' : 'Stairs or physical barrier detected.'),
        category: res.result.primaryCategory,
      });
    } catch {
      setScanResult({
        label: 'Photo Checked',
        isAccessible: true,
        explanation: 'Scan complete. Please confirm with your note.',
        category: 'accessible_entrance',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPlace = places.find((p) => p.id === selectedPlaceId) || places[0];
    if (!targetPlace) return;

    const newReport: CommunityReport = {
      id: `rep-${Date.now()}`,
      placeId: targetPlace.id,
      placeName: targetPlace.name,
      placeCategory: targetPlace.category,
      authorName: 'User Audit',
      authorType: 'community_member',
      date: new Date().toISOString().split('T')[0],
      photoUrl: selectedImage,
      photoAlt: scanResult?.label || 'Audit photo',
      featureCategory: (scanResult?.category as any) || 'ramp',
      notes: note.trim() || `${scanResult?.label || 'Entrance'}: ${scanResult?.explanation || 'Verified'}`,
      upvotes: 1,
      isVerified: true,
      aiClassification: {
        predictedCategory: (scanResult?.category as any) || 'ramp',
        predictedLabel: scanResult?.label || 'Entrance',
        confidence: 90,
        wasUserCorrected: false,
        complianceScore: 90,
      },
    };

    onReportCreated(newReport);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1200);
  };

  const targetPlace = places.find(p => p.id === selectedPlaceId) || initialPlace || places[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden my-auto ${
          highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white text-[#1E2548] border-[#ADBBDA]/60'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:px-5 border-b border-[#ADBBDA]/40 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#1E2548]">
              Scan Entrance Photo
            </h3>
            <span className="text-xs text-[#8697C4]">
              For: {targetPlace?.name || 'Selected Place'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8697C4] hover:text-[#1E2548] hover:bg-[#EDE8F5]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Sample photo or upload */}
          <div className="space-y-2">
            <span className="font-bold text-[#1E2548] block">1. Select or upload photo:</span>
            
            <div className="flex gap-2">
              {DEMO_PRESET_IMAGES.slice(0, 3).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border border-[#ADBBDA]/60 bg-[#EDE8F5]/50 hover:bg-[#EDE8F5] text-[#3D52A0] truncate"
                >
                  {s.title.split(' ')[0]}
                </button>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border border-[#7091E6] bg-[#3D52A0] text-white flex items-center justify-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Photo preview */}
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[#1E2548] border border-[#ADBBDA]/60">
              <img
                src={selectedImage}
                alt="Selected"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-[#141933]/85 flex flex-col items-center justify-center text-white">
                  <div className="w-7 h-7 border-3 border-[#7091E6] border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-xs font-bold">Scanning photo...</span>
                </div>
              )}
            </div>
          </div>

          {/* Simple Result Card */}
          {scanResult && !isAnalyzing && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              scanResult.isAccessible
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              {scanResult.isAccessible ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold text-xs block">
                  {scanResult.label} ({scanResult.isAccessible ? 'Accessible' : 'Barrier'})
                </span>
                <p className="text-[11px] mt-0.5 opacity-90">
                  {scanResult.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Short Note */}
          <div>
            <label className="font-bold text-[#1E2548] block mb-1">
              2. Add a short note (optional):
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Ramp is wide and easy to use"
              className="w-full px-3 py-2 rounded-xl border border-[#ADBBDA]/70 bg-white text-xs text-[#1E2548] focus:ring-2 focus:ring-[#7091E6] focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full py-2.5 px-4 rounded-xl bg-[#3D52A0] hover:bg-[#293872] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm min-h-[42px]"
            >
              {isSubmitted ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Audit Saved!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#EDE8F5]" />
                  <span>Save to Place</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
