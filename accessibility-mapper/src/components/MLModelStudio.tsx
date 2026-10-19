import React, { useState, useRef } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Play, 
  RefreshCw, 
  Upload, 
  ShieldCheck, 
  Zap, 
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { DEMO_PRESET_IMAGES } from '../data/mockPlaces';

interface MLModelStudioProps {
  highContrast: boolean;
}

export const MLModelStudio: React.FC<MLModelStudioProps> = ({ highContrast }) => {
  // Image & inference states
  const [testImage, setTestImage] = useState<string>(DEMO_PRESET_IMAGES[0].dataUrl);
  const [isCustomUpload, setIsCustomUpload] = useState<boolean>(false);
  const [customImageName, setCustomImageName] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadImageFile(file);
  };

  const loadImageFile = (file: File) => {
    setCustomImageName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setTestImage(dataUrl);
      setIsCustomUpload(true);
      setTestResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      loadImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSelectPreset = (preset: (typeof DEMO_PRESET_IMAGES)[0]) => {
    setTestImage(preset.dataUrl);
    setIsCustomUpload(false);
    setCustomImageName('');
    setTestResult(null);
  };

  const handleRunTestInference = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const matchedPreset = isCustomUpload
        ? null
        : DEMO_PRESET_IMAGES.find((p) => p.dataUrl === testImage);

      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: testImage,
          presetId: matchedPreset?.id,
          userHint: 'Test forward pass from Model Studio',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setTestResult(json);
      }
    } catch (e) {
      console.error('Classification error:', e);
    } finally {
      setIsTesting(false);
    }
  };

  const accessibilityScore = testResult?.data?.features?.accessibilityScore ?? 0;
  const isBarrierFree = testResult?.data?.features?.isBarrierFree;
  const barrierSeverity = testResult?.data?.features?.barrierSeverity;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Banner matching App.tsx styling */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-md border transition-all ${
        highContrast 
          ? 'bg-black text-white border-yellow-400' 
          : 'bg-gradient-to-r from-[#1E2548] via-[#3D52A0] to-[#7091E6] border-white/10'
      }`}>
        {/* Decorative background geometry */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-36 h-36 bg-[#ADBBDA]/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[#EDE8F5] text-xs font-bold border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#ADBBDA]" />
            <span>AI Vision Classifier</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            Accessibility Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#EDE8F5]/90 font-medium leading-relaxed">
            Upload or choose an entrance photo to evaluate wheelchair ramps, stairs, and step-free access in real time.
          </p>
        </div>
      </div>

      {/* Main Studio Area: Image Upload on Left, Classification Result on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Upload & Preview */}
        <div className={`lg:col-span-5 p-5 sm:p-6 rounded-3xl border shadow-xs space-y-5 transition-colors ${
          highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-[#ADBBDA]/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EDE8F5] text-[#3D52A0] flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#1E2548]">
                Input Image
              </h3>
            </div>
            {isCustomUpload ? (
              <span className="text-[11px] font-bold px-2.5 py-1 bg-[#EDE8F5] text-[#3D52A0] rounded-xl border border-[#ADBBDA]/50">
                Custom Upload
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-[#8697C4]">
                Sample Preset
              </span>
            )}
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#3D52A0] bg-[#EDE8F5]/80 scale-[1.01]'
                : 'border-[#7091E6]/60 hover:border-[#3D52A0] hover:bg-[#EDE8F5]/30 bg-[#EDE8F5]/10'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-[#EDE8F5] text-[#3D52A0] flex items-center justify-center mx-auto mb-2">
              <Upload className="w-5 h-5 text-[#3D52A0]" />
            </div>
            <p className="text-xs font-bold text-[#1E2548]">
              Click to upload or drag & drop photo
            </p>
            <p className="text-[11px] text-[#8697C4] mt-0.5">
              Supports JPG, PNG, WEBP from your device
            </p>
            {customImageName && (
              <div className="mt-2.5 inline-block px-2.5 py-1 bg-white rounded-xl border border-[#ADBBDA]/60 text-[11px] font-mono text-[#3D52A0] truncate max-w-[240px]">
                {customImageName}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCustomImageUpload}
              className="hidden"
            />
          </div>

          {/* Quick Presets Selector */}
          <div>
            <label className="text-xs font-bold text-[#1E2548] block mb-2">
              Or pick a sample frame:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DEMO_PRESET_IMAGES.slice(0, 4).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    !isCustomUpload && testImage === preset.dataUrl
                      ? 'border-[#3D52A0] bg-[#3D52A0] text-white font-bold shadow-xs'
                      : 'border-[#ADBBDA]/60 bg-white hover:bg-[#EDE8F5] text-[#1E2548]'
                  }`}
                >
                  <span className="block truncate text-xs font-medium">
                    {preset.title.split(' ')[0]} {preset.title.split(' ')[1] || ''}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Image Preview Box */}
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-[#1E2548] border border-[#ADBBDA]/60 shadow-inner">
            <img
              src={testImage}
              alt="Test input frame"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Action Button: Run Inference */}
          <button
            onClick={handleRunTestInference}
            disabled={isTesting}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#3D52A0] hover:bg-[#293872] active:bg-[#1E2548] disabled:opacity-75 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm min-h-[46px] cursor-pointer"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Analyzing Accessibility...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white text-white" />
                <span>Analyze Photo</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Inference Result Display */}
        <div className={`lg:col-span-7 p-5 sm:p-6 rounded-3xl border shadow-xs space-y-5 transition-colors ${
          highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white border-[#ADBBDA]/60'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-[#ADBBDA]/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EDE8F5] text-[#3D52A0] flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#1E2548]">
                Detection & Assessment
              </h3>
            </div>
            {testResult && (
              <span className="text-[11px] font-semibold text-[#3D52A0] bg-[#EDE8F5] px-3 py-1 rounded-xl border border-[#ADBBDA]/50">
                {testResult.latencyMs} ms
              </span>
            )}
          </div>

          {isTesting ? (
            <div className="py-24 text-center space-y-3 bg-[#EDE8F5]/30 rounded-2xl border border-dashed border-[#ADBBDA]/50">
              <div className="w-10 h-10 border-3 border-[#3D52A0] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-[#1E2548]">
                Scanning image features...
              </p>
              <p className="text-[11px] text-[#8697C4]">
                Checking for wheelchair ramps, stairs, handrails, and level access
              </p>
            </div>
          ) : testResult ? (
            <div className="space-y-4">
              {/* Primary Detection Card */}
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isBarrierFree
                  ? 'bg-emerald-50/80 border-emerald-200'
                  : barrierSeverity === 'severe'
                  ? 'bg-rose-50/80 border-rose-200'
                  : 'bg-amber-50/80 border-amber-200'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      {isBarrierFree ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : barrierSeverity === 'severe' ? (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      )}
                      <h4 className="font-bold text-base text-[#1E2548]">
                        {testResult.data?.primaryLabel || 'Classified Feature'}
                      </h4>
                    </div>
                    <p className="text-xs text-[#1E2548]/90 leading-relaxed">
                      {testResult.data?.summary}
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white border border-[#ADBBDA]/60 text-[#3D52A0] shadow-xs shrink-0">
                    {testResult.data?.confidence}% Conf.
                  </span>
                </div>

                {testResult.data?.recommendation && (
                  <div className="mt-3.5 pt-3 border-t border-black/5 flex items-start gap-2 text-xs text-[#1E2548]">
                    <ShieldCheck className="w-4 h-4 text-[#3D52A0] shrink-0 mt-0.5" />
                    <span><b>Recommendation:</b> {testResult.data.recommendation}</span>
                  </div>
                )}
              </div>

              {/* Accessibility Score Gauge */}
              <div className="p-4 bg-[#EDE8F5]/40 rounded-2xl border border-[#ADBBDA]/50 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1E2548]">
                    Accessibility Compliance Score
                  </span>
                  <span className={`font-mono font-black text-sm ${
                    accessibilityScore >= 80 ? 'text-emerald-600' : accessibilityScore >= 50 ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {accessibilityScore} / 100
                  </span>
                </div>
                <div className="w-full h-3 bg-white/80 rounded-full overflow-hidden p-0.5 border border-[#ADBBDA]/40">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      accessibilityScore >= 80 ? 'bg-emerald-500' : accessibilityScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, accessibilityScore))}%` }}
                  />
                </div>
              </div>

              {/* Detected Feature Breakdown Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 bg-[#EDE8F5]/50 rounded-2xl border border-[#ADBBDA]/40">
                  <span className="text-[#8697C4] block text-[10px] font-bold uppercase tracking-wider">Barrier Level</span>
                  <span className="font-bold text-[#1E2548] capitalize mt-0.5 block">
                    {barrierSeverity || 'None'}
                  </span>
                </div>

                <div className="p-3 bg-[#EDE8F5]/50 rounded-2xl border border-[#ADBBDA]/40">
                  <span className="text-[#8697C4] block text-[10px] font-bold uppercase tracking-wider">Slope / Gradient</span>
                  <span className="font-bold text-[#1E2548] truncate block mt-0.5" title={testResult.data?.features?.slopeGradient}>
                    {testResult.data?.features?.slopeGradient || 'Standard'}
                  </span>
                </div>

                <div className="p-3 bg-[#EDE8F5]/50 rounded-2xl border border-[#ADBBDA]/40">
                  <span className="text-[#8697C4] block text-[10px] font-bold uppercase tracking-wider">Steps Detected</span>
                  <span className="font-bold text-[#1E2548] mt-0.5 block">
                    {testResult.data?.features?.hasSteps ? `${testResult.data.features.stepCount || 1}+ Steps` : 'None (Level)'}
                  </span>
                </div>

                <div className="p-3 bg-[#EDE8F5]/50 rounded-2xl border border-[#ADBBDA]/40">
                  <span className="text-[#8697C4] block text-[10px] font-bold uppercase tracking-wider">Handrails</span>
                  <span className="font-bold text-[#1E2548] mt-0.5 block">
                    {testResult.data?.features?.hasHandrails ? 'Present' : 'None'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center space-y-3 bg-[#EDE8F5]/20 rounded-2xl border border-dashed border-[#ADBBDA]/50 p-6">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE8F5] text-[#3D52A0] flex items-center justify-center mx-auto mb-1">
                <ImageIcon className="w-6 h-6 text-[#7091E6]" />
              </div>
              <p className="text-sm font-bold text-[#1E2548]">
                Ready for Analysis
              </p>
              <p className="text-xs text-[#8697C4] max-w-sm mx-auto leading-relaxed">
                Upload your photo or choose a sample frame on the left, then click <b>Analyze Photo</b> to inspect accessibility features.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
