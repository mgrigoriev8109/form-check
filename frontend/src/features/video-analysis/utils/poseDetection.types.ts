/**
 * Type definitions for pose detection and biomechanical analysis
 */

import { NormalizedLandmark } from '@mediapipe/pose';

// ============================================================================
// BASIC TYPES
// ============================================================================

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

// ============================================================================
// EXERCISE METRICS
// ============================================================================

export interface SquatMetrics {
  hipAngle: number;
  kneeAngle: number;
  ankleAngle: number;
  torsoLean: number;
  neckAngle: number;
  hipHeight: number;
  shoulderHeight: number;
  kneeForwardTravel: number;
}

export interface DeadliftMetrics {
  hipAngle: number;
  kneeAngle: number;
  backAngle: number;
  neckAngle: number;
  hipHeight: number;
  shoulderHeight: number;
  wristHeight: number;
  barPathDeviation: number;
}

export type ExerciseMetrics = SquatMetrics | DeadliftMetrics;

// ============================================================================
// KEY POSITIONS
// ============================================================================

export interface SquatKeyPositions {
  setup: SquatMetrics & { frame: number };
  bottomPosition: SquatMetrics & { frame: number };
  completion: SquatMetrics & { frame: number };
}

export interface DeadliftKeyPositions {
  setup: DeadliftMetrics & { frame: number };
  startOfPull: DeadliftMetrics & { frame: number };
  lockout: DeadliftMetrics & { frame: number };
  completion: DeadliftMetrics & { frame: number };
}

export type KeyPositions = SquatKeyPositions | DeadliftKeyPositions;

// ============================================================================
// TEMPORAL ANALYSIS
// ============================================================================

export interface SquatTemporalAnalysis {
  hipRiseRate: number;
  shoulderRiseRate: number;
  riseRateRatio: number;
  maxTorsoLean: number;
  maxKneeForwardTravel: number;
  neckExtensionMax: number;
  minHipAngle: number;
}

export interface DeadliftTemporalAnalysis {
  avgBarPathDeviation: number;
  maxBarPathDeviation: number;
  maxBackAngle: number;
  backAngleChange: number;
  hipRiseRate: number;
  shoulderRiseRate: number;
  riseRateRatio: number;
  neckExtensionMax: number;
}

export type TemporalAnalysis = SquatTemporalAnalysis | DeadliftTemporalAnalysis;

// ============================================================================
// EXERCISE CONFIGURATION
// ============================================================================

export interface ExerciseConfig<
  M extends ExerciseMetrics = ExerciseMetrics,
  K extends KeyPositions = KeyPositions,
  T extends TemporalAnalysis = TemporalAnalysis,
> {
  name: string;
  requiredLandmarks: Record<string, number>;
  visibilityThresholds: Record<string, number>;
  calculateMetrics: (
    landmarks: NormalizedLandmark[],
    landmarkRefs: Record<string, NormalizedLandmark>
  ) => M;
  identifyKeyPositions: (allFramesMetrics: M[]) => K;
  calculateTemporalPatterns: (
    allFramesMetrics: M[],
    keyPositions: K
  ) => T | null;
  riskThresholds: Record<string, number>;
  detectRiskFlags: (
    temporalAnalysis: T,
    keyPositions: K,
    thresholds: Record<string, number>
  ) => string[];
}

// ============================================================================
// ANALYSIS OUTPUT
// ============================================================================

export interface AnalysisData {
  exerciseType: string;
  frameCount: number;
  duration: string;
  keyPositions: KeyPositions;
  temporalAnalysis: TemporalAnalysis | null;
  riskFlags: string[];
}
