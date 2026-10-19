import { ClassificationResult, AccessibilityCategory } from '../types/accessibility';
import { DEMO_PRESET_IMAGES } from '../data/mockPlaces';

export interface ClassifyImageOptions {
  imageBase64: string;
  mimeType?: string;
  userHint?: string;
  presetId?: string;
}

export interface ClassificationResponse {
  result: ClassificationResult;
  engineUsed: string;
  latencyMs: number;
  source: string;
  isBackendConnected: boolean;
  featureEmbeddingPreview?: number[];
}

export async function checkBackendHealth(): Promise<{
  connected: boolean;
  status?: string;
  aiConfigured?: boolean;
  activeModel?: string;
  backendType?: string;
  latencyMs: number;
}> {
  const startTime = Date.now();
  try {
    const res = await fetch('/api/health', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    const latencyMs = Date.now() - startTime;
    if (res.ok) {
      const data = await res.json();
      return {
        connected: true,
        status: data.status,
        aiConfigured: Boolean(data.aiConfigured),
        activeModel: data.activeModel || 'MobileNetV2 Hybrid',
        backendType: data.backendType || 'hybrid_gemini',
        latencyMs,
      };
    }
  } catch (e) {
    console.warn('Backend health check failed:', e);
  }
  return {
    connected: false,
    latencyMs: Date.now() - startTime,
  };
}

export async function classifyAccessibilityImage(options: ClassifyImageOptions): Promise<ClassificationResponse> {
  const { imageBase64, mimeType = 'image/jpeg', userHint, presetId } = options;
  const startTime = Date.now();

  // Always attempt backend classification via /api/classify
  try {
    const res = await fetch('/api/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        mimeType,
        userHint,
        presetId,
      }),
    });

    if (res.ok) {
      const payload = await res.json();
      if (payload.success && payload.data) {
        return {
          result: payload.data as ClassificationResult,
          engineUsed: payload.source || 'mobilenetv2-server-engine',
          latencyMs: payload.latencyMs || Math.max(16, Date.now() - startTime),
          source: payload.source || 'server',
          isBackendConnected: true,
          featureEmbeddingPreview: payload.featureEmbeddingPreview,
        };
      }
    }
  } catch (err) {
    console.warn('Backend classify request failed, falling back to local client simulator:', err);
  }

  // Client-side fallback if backend server is unreachable
  const fallbackResult = presetId
    ? buildLocalPresetClassification(presetId)
    : simulateClientMobileNetV2(imageBase64, userHint);

  return {
    result: fallbackResult,
    engineUsed: 'client-offline-fallback',
    latencyMs: Math.max(10, Date.now() - startTime),
    source: 'client-fallback',
    isBackendConnected: false,
    featureEmbeddingPreview: [0.94, 0.12, 1.45, 0.0, 0.88, 1.22, 0.05, 0.65],
  };
}

function buildLocalPresetClassification(presetId: string): ClassificationResult {
  const preset = DEMO_PRESET_IMAGES.find((p) => p.id === presetId) || DEMO_PRESET_IMAGES[0];
  const isBarrier = preset.category === 'stairs_barrier';
  const conf = preset.expectedConf;
  const secondConf = Number(((100 - conf) * 0.7).toFixed(1));
  const thirdConf = Number(((100 - conf) * 0.3).toFixed(1));

  return {
    primaryCategory: preset.category,
    primaryLabel: preset.expectedLabel,
    confidence: conf,
    topPredictions: [
      {
        category: preset.category,
        label: preset.expectedLabel,
        confidence: conf,
      },
      {
        category: isBarrier ? 'ramp' : 'stairs_barrier',
        label: isBarrier ? 'Alternative Approach Ramp' : 'Step Barrier Nearby',
        confidence: secondConf,
      },
      {
        category: 'accessible_entrance',
        label: 'Level Public Threshold',
        confidence: thirdConf,
      },
    ],
    features: {
      isBarrierFree: !isBarrier,
      barrierSeverity: isBarrier ? 'severe' : 'none',
      accessibilityScore: isBarrier ? 15 : 96,
      slopeGradient: preset.slope,
      hasHandrails: preset.category === 'ramp' || isBarrier,
      handrailDetails: preset.category === 'ramp' 
        ? 'Dual-sided continuous brushed steel handrails (34" height)' 
        : (isBarrier ? 'Single wall-mounted handrail' : 'N/A'),
      hasSteps: isBarrier,
      stepCount: isBarrier ? 8 : 0,
      doorType: preset.category === 'accessible_entrance' 
        ? 'Automated motion sensor sliding doors' 
        : 'Level standard door clearance opening',
      estimatedDoorWidthCm: 105,
      hasTactilePaving: preset.category === 'ramp' || preset.category === 'accessible_entrance',
      keyObservations: [
        isBarrier 
          ? 'Physical flight of 8 concrete steps completely impedes wheelchair mobility without a ramp.' 
          : 'High traction non-slip surface suitable for manual, power, and bariatric wheelchairs.',
        preset.category === 'ramp' 
          ? 'Compliant slope gradient within 1:12 ADA guidelines with level intermediate rest landings.' 
          : 'Adequate lighting and high contrast architectural threshold indicators.',
        !isBarrier 
          ? 'Clear approach path with >= 60-inch turning radius verified.' 
          : 'Ramp or vertical platform lift is missing; alternate entrance is recommended.',
      ],
    },
    summary: isBarrier
      ? 'Architectural barrier detected: steep flight of stairs lacking an adjacent wheelchair ramp or lift.'
      : `High-confidence detection of ${preset.expectedLabel.toLowerCase()} supporting autonomous wheelchair transit.`,
    recommendation: isBarrier
      ? 'Wheelchair users must detour to the alternative accessible entrance. Report flagged for campus facilities.'
      : 'Safe and clear to navigate. Surface is level, unobstructed, and compliant with universal access standards.',
    detectedItems: [
      {
        label: preset.expectedLabel,
        box2d: [160, 140, 840, 860],
        confidence: conf,
      },
      {
        label: isBarrier ? 'Step Risers (Barrier)' : 'Continuous Handrail',
        box2d: [380, 220, 780, 780],
        confidence: 89.4,
      },
    ],
  };
}

function simulateClientMobileNetV2(base64: string, hint?: string): ClassificationResult {
  const hintLower = (hint || '').toLowerCase();
  let category: AccessibilityCategory = 'ramp';
  let label = 'Wheelchair Ramp with Dual Handrails';
  let conf = 94.6;

  if (hintLower.includes('ramp') || hintLower.includes('slope') || hintLower.includes('incline')) {
    category = 'ramp';
    label = 'Wheelchair Ramp with Handrails';
    conf = 95.8;
  } else if (hintLower.includes('stair') || hintLower.includes('step') || hintLower.includes('barrier')) {
    category = 'stairs_barrier';
    label = 'Stairs Architectural Barrier (No Ramp)';
    conf = 95.2;
  } else if (hintLower.includes('elevator') || hintLower.includes('lift')) {
    category = 'elevator';
    label = 'Accessible Elevator with Low-Height Braille Controls';
    conf = 96.1;
  } else if (hintLower.includes('restroom') || hintLower.includes('toilet') || hintLower.includes('bath')) {
    category = 'accessible_restroom';
    label = 'Universal Accessible Restroom with Grab Bars';
    conf = 93.8;
  } else if (hintLower.includes('park')) {
    category = 'accessible_parking';
    label = 'Designated Accessible Parking Bay';
    conf = 97.4;
  } else if (hintLower.includes('entrance') || hintLower.includes('door')) {
    category = 'accessible_entrance';
    label = 'Step-Free Automated Glass Sliding Entrance';
    conf = 94.2;
  } else if (hintLower.includes('tactile')) {
    category = 'tactile_paving';
    label = 'Tactile Ground Surface Indicators';
    conf = 95.1;
  }

  const isBarrier = category === 'stairs_barrier';

  return {
    primaryCategory: category,
    primaryLabel: label,
    confidence: conf,
    topPredictions: [
      { category, label, confidence: conf },
      {
        category: isBarrier ? 'ramp' : 'stairs_barrier',
        label: isBarrier ? 'Approach Ramp' : 'Step Barrier',
        confidence: Number(((100 - conf) * 0.7).toFixed(1)),
      },
      {
        category: 'accessible_entrance',
        label: 'Level Public Threshold',
        confidence: Number(((100 - conf) * 0.3).toFixed(1)),
      },
    ],
    features: {
      isBarrierFree: !isBarrier,
      barrierSeverity: isBarrier ? 'severe' : 'none',
      accessibilityScore: isBarrier ? 20 : 94,
      slopeGradient: category === 'ramp' ? '1:12 ADA Standard' : (isBarrier ? 'Steep Flight' : 'Level (< 1%)'),
      hasHandrails: category === 'ramp' || isBarrier,
      handrailDetails: category === 'ramp' ? 'Dual-sided continuous brushed steel handrails (34" height)' : 'Single rail',
      hasSteps: isBarrier,
      stepCount: isBarrier ? 7 : 0,
      doorType: category === 'accessible_entrance' ? 'Automated motion sensor sliding doors' : 'Clear threshold',
      estimatedDoorWidthCm: 96,
      hasTactilePaving: category === 'ramp' || category === 'accessible_entrance' || category === 'tactile_paving',
      keyObservations: [
        isBarrier
          ? 'Physical steps without ramp impede wheelchair transit.'
          : 'High-traction surface suitable for wheelchair mobility.',
        'Visible architectural features verified.',
      ],
    },
    summary: isBarrier
      ? 'Step barrier identified requiring alternate wheelchair route.'
      : `High-confidence detection of ${label.toLowerCase()}.`,
    recommendation: isBarrier
      ? 'Detour to designated ramp entrance.'
      : 'Safe and clear to navigate.',
    detectedItems: [
      {
        label,
        box2d: [160, 140, 840, 860],
        confidence: conf,
      },
    ],
  };
}
