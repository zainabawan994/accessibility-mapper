export type PlaceCategory = 
  | 'university'
  | 'hospital'
  | 'park'
  | 'restaurant'
  | 'public_building'
  | 'transit'
  | 'library';

export type AccessibilityLevel = 'fully_accessible' | 'partially_accessible' | 'barrier_reported';

export type AccessibilityCategory = 
  | 'ramp'
  | 'stairs_barrier'
  | 'accessible_entrance'
  | 'elevator'
  | 'accessible_restroom'
  | 'accessible_parking'
  | 'tactile_paving'
  | 'other';

export interface EntranceDetail {
  id: string;
  name: string;
  isStepFree: boolean;
  hasRamp: boolean;
  slopeRatio?: string; // e.g., "1:12 Compliant"
  doorWidthCm: number; // e.g. 95 cm
  hasAutomaticDoor: boolean;
  stepCount: number;
  notes: string;
}

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  address: string;
  city: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  accessibilityLevel: AccessibilityLevel;
  accessibilityScore: number; // 0 - 100
  summary: string;
  features: {
    wheelchairRamps: boolean;
    stepFreeEntrance: boolean;
    elevators: boolean;
    accessibleRestrooms: boolean;
    designatedParking: boolean;
    automaticDoors: boolean;
    tactilePaving: boolean;
    brailleSignage: boolean;
    hearingLoop: boolean;
  };
  entrances: EntranceDetail[];
  imageUrl: string;
  imageAlt: string;
  photosCount: number;
  reportsCount: number;
  lastUpdated: string;
  verifiedByCommunity: boolean;
  openingHours: string;
  phone: string;
  website?: string;
}

export interface DetectedFeatureDetails {
  isBarrierFree: boolean;
  barrierSeverity: 'none' | 'minor' | 'moderate' | 'severe';
  accessibilityScore: number;
  slopeGradient?: string;
  hasHandrails?: boolean;
  handrailDetails?: string;
  hasSteps?: boolean;
  stepCount?: number;
  doorType?: string;
  estimatedDoorWidthCm?: number;
  hasTactilePaving?: boolean;
  keyObservations: string[];
}

export interface BoundingBox {
  label: string;
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  confidence: number;
}

export interface ClassificationPrediction {
  category: AccessibilityCategory;
  label: string;
  confidence: number;
}

export interface ClassificationResult {
  primaryCategory: AccessibilityCategory;
  primaryLabel: string;
  confidence: number;
  topPredictions: ClassificationPrediction[];
  features: DetectedFeatureDetails;
  summary: string;
  recommendation: string;
  detectedItems?: BoundingBox[];
}

export interface CommunityReport {
  id: string;
  placeId: string;
  placeName: string;
  placeCategory: PlaceCategory;
  authorName: string;
  authorType: 'wheelchair_user' | 'mobility_scooter' | 'caregiver' | 'guide_dog_user' | 'accessibility_auditor' | 'community_member';
  featureCategory: AccessibilityCategory;
  photoUrl: string;
  photoAlt: string;
  aiClassification: {
    predictedCategory: AccessibilityCategory;
    predictedLabel: string;
    confidence: number;
    wasUserCorrected: boolean;
    correctedCategory?: AccessibilityCategory;
    correctedLabel?: string;
    complianceScore: number;
    slopeEstimate?: string;
  };
  notes: string;
  date: string;
  upvotes: number;
  isVerified: boolean;
}

export interface UserSearchLog {
  id: string;
  sessionId?: string;
  query: string;
  category?: string;
  statusFilter?: string;
  featureFilter?: string;
  resultsCount: number;
  source: 'discovery_bar' | 'map_search' | 'voice_search' | 'filter_click';
  createdAt: string;
}

export interface UserActivityLog {
  id: string;
  sessionId?: string;
  action: 'search' | 'view_place' | 'create_report' | 'upvote_report' | 'ai_classify' | 'add_place' | 'filter_change';
  targetId?: string;
  targetName?: string;
  details?: Record<string, any>;
  createdAt: string;
}
