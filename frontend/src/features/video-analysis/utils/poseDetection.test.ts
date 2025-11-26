/**
 * Unit tests for pose detection and biomechanical analysis
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  analyzeExerciseVideo,
  analyzeSquatVideo,
  isPoseDetectionAvailable,
  getSupportedExercises,
  getExerciseConfig,
} from './poseDetection';
import type { NormalizedLandmark } from '@mediapipe/pose';
import type {
  SquatMetrics,
  DeadliftMetrics,
  SquatKeyPositions,
  DeadliftKeyPositions,
  SquatTemporalAnalysis,
  DeadliftTemporalAnalysis,
} from './poseDetection.types';

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a mock landmark with specified coordinates and visibility
 */
function createMockLandmark(
  x: number,
  y: number,
  z: number = 0,
  visibility: number = 1.0
): NormalizedLandmark {
  return { x, y, z, visibility };
}

/**
 * Create a full set of mock pose landmarks for testing
 */
function createMockPoseLandmarks(): NormalizedLandmark[] {
  // Create 33 landmarks (MediaPipe Pose has 33 landmarks)
  const landmarks: NormalizedLandmark[] = [];
  for (let i = 0; i < 33; i++) {
    landmarks.push(createMockLandmark(0.5, 0.5, 0, 1.0));
  }
  return landmarks;
}

/**
 * Create realistic squat pose landmarks for a standing position
 */
function createStandingSquatLandmarks(): NormalizedLandmark[] {
  const landmarks = createMockPoseLandmarks();

  // RIGHT side landmarks for squat (indices from POSE_LANDMARKS)
  landmarks[0] = createMockLandmark(0.5, 0.1, 0, 1.0);  // NOSE
  landmarks[8] = createMockLandmark(0.52, 0.12, 0, 1.0); // RIGHT_EAR
  landmarks[12] = createMockLandmark(0.55, 0.3, 0, 1.0); // RIGHT_SHOULDER
  landmarks[24] = createMockLandmark(0.55, 0.55, 0, 1.0); // RIGHT_HIP
  landmarks[26] = createMockLandmark(0.55, 0.75, 0, 0.8); // RIGHT_KNEE
  landmarks[28] = createMockLandmark(0.55, 0.95, 0, 0.5); // RIGHT_ANKLE

  return landmarks;
}

/**
 * Create realistic squat pose landmarks for bottom position
 */
function createBottomSquatLandmarks(): NormalizedLandmark[] {
  const landmarks = createMockPoseLandmarks();

  // Bottom position - hip lower, more knee bend, forward lean
  landmarks[0] = createMockLandmark(0.5, 0.35, 0, 1.0);  // NOSE (lower)
  landmarks[8] = createMockLandmark(0.52, 0.37, 0, 1.0); // RIGHT_EAR
  landmarks[12] = createMockLandmark(0.55, 0.5, 0, 1.0); // RIGHT_SHOULDER (lower)
  landmarks[24] = createMockLandmark(0.55, 0.75, 0, 1.0); // RIGHT_HIP (much lower)
  landmarks[26] = createMockLandmark(0.6, 0.85, 0, 0.8); // RIGHT_KNEE (bent, forward)
  landmarks[28] = createMockLandmark(0.55, 0.95, 0, 0.5); // RIGHT_ANKLE

  return landmarks;
}

/**
 * Create realistic deadlift pose landmarks for setup position
 */
function createDeadliftSetupLandmarks(): NormalizedLandmark[] {
  const landmarks = createMockPoseLandmarks();

  // Setup position - bent over, hips back
  landmarks[0] = createMockLandmark(0.5, 0.4, 0, 1.0);   // NOSE
  landmarks[8] = createMockLandmark(0.52, 0.42, 0, 1.0); // RIGHT_EAR
  landmarks[12] = createMockLandmark(0.55, 0.5, 0, 1.0); // RIGHT_SHOULDER
  landmarks[24] = createMockLandmark(0.55, 0.65, 0, 1.0); // RIGHT_HIP
  landmarks[26] = createMockLandmark(0.56, 0.8, 0, 0.8); // RIGHT_KNEE
  landmarks[28] = createMockLandmark(0.55, 0.95, 0, 0.5); // RIGHT_ANKLE
  landmarks[16] = createMockLandmark(0.55, 0.85, 0, 0.5); // RIGHT_WRIST (low, near bar)

  return landmarks;
}

/**
 * Create realistic deadlift pose landmarks for lockout position
 */
function createDeadliftLockoutLandmarks(): NormalizedLandmark[] {
  const landmarks = createMockPoseLandmarks();

  // Lockout position - standing tall
  landmarks[0] = createMockLandmark(0.5, 0.1, 0, 1.0);   // NOSE
  landmarks[8] = createMockLandmark(0.52, 0.12, 0, 1.0); // RIGHT_EAR
  landmarks[12] = createMockLandmark(0.55, 0.3, 0, 1.0); // RIGHT_SHOULDER
  landmarks[24] = createMockLandmark(0.55, 0.55, 0, 1.0); // RIGHT_HIP
  landmarks[26] = createMockLandmark(0.55, 0.75, 0, 0.8); // RIGHT_KNEE
  landmarks[28] = createMockLandmark(0.55, 0.95, 0, 0.5); // RIGHT_ANKLE
  landmarks[16] = createMockLandmark(0.55, 0.65, 0, 0.8); // RIGHT_WRIST (higher)

  return landmarks;
}

// ============================================================================
// PUBLIC API TESTS
// ============================================================================

describe('Public API Functions', () => {
  describe('getSupportedExercises', () => {
    it('should return list of supported exercises', () => {
      const exercises = getSupportedExercises();
      expect(exercises).toEqual(['squat', 'deadlift']);
      expect(exercises.length).toBe(2);
    });
  });

  describe('getExerciseConfig', () => {
    it('should return squat config for "squat"', () => {
      const config = getExerciseConfig('squat');
      expect(config).toBeDefined();
      expect(config?.name).toBe('Squat');
    });

    it('should return deadlift config for "deadlift"', () => {
      const config = getExerciseConfig('deadlift');
      expect(config).toBeDefined();
      expect(config?.name).toBe('Deadlift');
    });

    it('should be case insensitive', () => {
      const config1 = getExerciseConfig('SQUAT');
      const config2 = getExerciseConfig('Squat');
      const config3 = getExerciseConfig('squat');

      expect(config1).toBe(config2);
      expect(config2).toBe(config3);
    });

    it('should return null for unsupported exercise', () => {
      const config = getExerciseConfig('benchpress');
      expect(config).toBeNull();
    });
  });

  describe('isPoseDetectionAvailable', () => {
    it('should return true when Pose is defined', () => {
      // In test environment, we can't guarantee MediaPipe is loaded
      // but we can test the function exists and returns a boolean
      const result = isPoseDetectionAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('analyzeSquatVideo', () => {
    it('should be an alias for analyzeExerciseVideo with squat type', async () => {
      // This is a legacy function, just verify it exists
      expect(typeof analyzeSquatVideo).toBe('function');
    });
  });

  describe('analyzeExerciseVideo', () => {
    it('should throw error for unsupported exercise type', async () => {
      const mockFile = new File([''], 'test.mp4', { type: 'video/mp4' });

      await expect(
        analyzeExerciseVideo(mockFile, 'benchpress')
      ).rejects.toThrow('Unsupported exercise type: benchpress');
    });
  });
});

// ============================================================================
// SQUAT EXERCISE CONFIGURATION TESTS
// ============================================================================

describe('Squat Exercise Configuration', () => {
  const squatConfig = getExerciseConfig('squat');

  describe('calculateMetrics', () => {
    it('should calculate metrics for standing position', () => {
      const landmarks = createStandingSquatLandmarks();
      const landmarkRefs = {
        shoulder: landmarks[12],
        hip: landmarks[24],
        knee: landmarks[26],
        ankle: landmarks[28],
        nose: landmarks[0],
        ear: landmarks[8],
      };

      const metrics = squatConfig?.calculateMetrics(landmarks, landmarkRefs) as SquatMetrics;

      expect(metrics).toBeDefined();
      expect(metrics.hipAngle).toBeGreaterThan(0);
      expect(metrics.kneeAngle).toBeGreaterThan(0);
      expect(metrics.ankleAngle).toBeGreaterThanOrEqual(0); // Can be 0 when perfectly vertical
      expect(metrics.torsoLean).toBeGreaterThanOrEqual(0);
      expect(metrics.neckAngle).toBeGreaterThan(0);
      expect(metrics.hipHeight).toBeGreaterThan(0);
      expect(metrics.shoulderHeight).toBeGreaterThan(0);
      expect(typeof metrics.kneeForwardTravel).toBe('number');
    });

    it('should calculate metrics for bottom position', () => {
      const landmarks = createBottomSquatLandmarks();
      const landmarkRefs = {
        shoulder: landmarks[12],
        hip: landmarks[24],
        knee: landmarks[26],
        ankle: landmarks[28],
        nose: landmarks[0],
        ear: landmarks[8],
      };

      const metrics = squatConfig?.calculateMetrics(landmarks, landmarkRefs) as SquatMetrics;

      expect(metrics).toBeDefined();
      expect(metrics.hipHeight).toBeLessThan(0.5); // Lower in bottom position
    });

    it('should round metrics to appropriate precision', () => {
      const landmarks = createStandingSquatLandmarks();
      const landmarkRefs = {
        shoulder: landmarks[12],
        hip: landmarks[24],
        knee: landmarks[26],
        ankle: landmarks[28],
        nose: landmarks[0],
        ear: landmarks[8],
      };

      const metrics = squatConfig?.calculateMetrics(landmarks, landmarkRefs) as SquatMetrics;

      // Angles should be rounded to 1 decimal place
      expect(metrics.hipAngle.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(1);
      expect(metrics.kneeAngle.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(1);

      // Heights should be rounded to 3 decimal places
      expect(metrics.hipHeight.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(3);
    });
  });

  describe('identifyKeyPositions', () => {
    it('should identify setup, bottom, and completion positions', () => {
      const standingMetrics = squatConfig?.calculateMetrics(
        createStandingSquatLandmarks(),
        {
          shoulder: createStandingSquatLandmarks()[12],
          hip: createStandingSquatLandmarks()[24],
          knee: createStandingSquatLandmarks()[26],
          ankle: createStandingSquatLandmarks()[28],
          nose: createStandingSquatLandmarks()[0],
          ear: createStandingSquatLandmarks()[8],
        }
      ) as SquatMetrics;

      const bottomMetrics = squatConfig?.calculateMetrics(
        createBottomSquatLandmarks(),
        {
          shoulder: createBottomSquatLandmarks()[12],
          hip: createBottomSquatLandmarks()[24],
          knee: createBottomSquatLandmarks()[26],
          ankle: createBottomSquatLandmarks()[28],
          nose: createBottomSquatLandmarks()[0],
          ear: createBottomSquatLandmarks()[8],
        }
      ) as SquatMetrics;

      const allFramesMetrics = [standingMetrics, bottomMetrics, standingMetrics];

      const keyPositions = squatConfig?.identifyKeyPositions(allFramesMetrics) as SquatKeyPositions;

      expect(keyPositions).toBeDefined();
      expect(keyPositions.setup.frame).toBe(0);
      expect(keyPositions.bottomPosition.frame).toBe(1); // Should identify frame 1 as lowest
      expect(keyPositions.completion.frame).toBe(2);

      // Bottom position should have lower hip height
      expect(keyPositions.bottomPosition.hipHeight).toBeLessThan(keyPositions.setup.hipHeight);
    });
  });

  describe('calculateTemporalPatterns', () => {
    it('should calculate temporal patterns for full squat movement', () => {
      const standingMetrics = squatConfig?.calculateMetrics(
        createStandingSquatLandmarks(),
        {
          shoulder: createStandingSquatLandmarks()[12],
          hip: createStandingSquatLandmarks()[24],
          knee: createStandingSquatLandmarks()[26],
          ankle: createStandingSquatLandmarks()[28],
          nose: createStandingSquatLandmarks()[0],
          ear: createStandingSquatLandmarks()[8],
        }
      ) as SquatMetrics;

      const bottomMetrics = squatConfig?.calculateMetrics(
        createBottomSquatLandmarks(),
        {
          shoulder: createBottomSquatLandmarks()[12],
          hip: createBottomSquatLandmarks()[24],
          knee: createBottomSquatLandmarks()[26],
          ankle: createBottomSquatLandmarks()[28],
          nose: createBottomSquatLandmarks()[0],
          ear: createBottomSquatLandmarks()[8],
        }
      ) as SquatMetrics;

      const allFramesMetrics = [standingMetrics, bottomMetrics, standingMetrics];
      const keyPositions = squatConfig?.identifyKeyPositions(allFramesMetrics) as SquatKeyPositions;

      const temporalAnalysis = squatConfig?.calculateTemporalPatterns(
        allFramesMetrics,
        keyPositions
      ) as SquatTemporalAnalysis;

      expect(temporalAnalysis).toBeDefined();
      expect(temporalAnalysis.hipRiseRate).toBeGreaterThan(0);
      expect(temporalAnalysis.shoulderRiseRate).toBeGreaterThan(0);
      expect(temporalAnalysis.riseRateRatio).toBeGreaterThan(0);
      expect(typeof temporalAnalysis.maxTorsoLean).toBe('number');
      expect(typeof temporalAnalysis.maxKneeForwardTravel).toBe('number');
      expect(typeof temporalAnalysis.neckExtensionMax).toBe('number');
      expect(typeof temporalAnalysis.minHipAngle).toBe('number');
    });

    it('should return null if bottom position is at or after completion', () => {
      const standingMetrics = squatConfig?.calculateMetrics(
        createStandingSquatLandmarks(),
        {
          shoulder: createStandingSquatLandmarks()[12],
          hip: createStandingSquatLandmarks()[24],
          knee: createStandingSquatLandmarks()[26],
          ankle: createStandingSquatLandmarks()[28],
          nose: createStandingSquatLandmarks()[0],
          ear: createStandingSquatLandmarks()[8],
        }
      ) as SquatMetrics;

      const allFramesMetrics = [standingMetrics];
      const keyPositions: SquatKeyPositions = {
        setup: { frame: 0, ...standingMetrics },
        bottomPosition: { frame: 0, ...standingMetrics },
        completion: { frame: 0, ...standingMetrics },
      };

      const temporalAnalysis = squatConfig?.calculateTemporalPatterns(
        allFramesMetrics,
        keyPositions
      );

      expect(temporalAnalysis).toBeNull();
    });
  });

  describe('detectRiskFlags', () => {
    it('should detect excessive torso lean', () => {
      const temporalAnalysis: SquatTemporalAnalysis = {
        hipRiseRate: 0.01,
        shoulderRiseRate: 0.01,
        riseRateRatio: 1.0,
        maxTorsoLean: 50, // Above threshold of 45
        maxKneeForwardTravel: 10,
        neckExtensionMax: 20,
        minHipAngle: 90,
      };

      const mockKeyPositions = {} as SquatKeyPositions;
      const thresholds = squatConfig?.riskThresholds || {};

      const flags = squatConfig?.detectRiskFlags(temporalAnalysis, mockKeyPositions, thresholds) || [];

      expect(flags.length).toBeGreaterThan(0);
      expect(flags.some(flag => flag.includes('torso lean'))).toBe(true);
    });

    it('should detect hips rising faster than shoulders', () => {
      const temporalAnalysis: SquatTemporalAnalysis = {
        hipRiseRate: 0.02,
        shoulderRiseRate: 0.01,
        riseRateRatio: 1.5, // Above threshold of 1.2
        maxTorsoLean: 30,
        maxKneeForwardTravel: 10,
        neckExtensionMax: 20,
        minHipAngle: 90,
      };

      const mockKeyPositions = {} as SquatKeyPositions;
      const thresholds = squatConfig?.riskThresholds || {};

      const flags = squatConfig?.detectRiskFlags(temporalAnalysis, mockKeyPositions, thresholds) || [];

      expect(flags.some(flag => flag.includes('Hip rising faster'))).toBe(true);
    });

    it('should detect neck hyperextension', () => {
      const temporalAnalysis: SquatTemporalAnalysis = {
        hipRiseRate: 0.01,
        shoulderRiseRate: 0.01,
        riseRateRatio: 1.0,
        maxTorsoLean: 30,
        maxKneeForwardTravel: 10,
        neckExtensionMax: 40, // Above threshold of 30
        minHipAngle: 90,
      };

      const mockKeyPositions = {} as SquatKeyPositions;
      const thresholds = squatConfig?.riskThresholds || {};

      const flags = squatConfig?.detectRiskFlags(temporalAnalysis, mockKeyPositions, thresholds) || [];

      expect(flags.some(flag => flag.includes('Neck hyperextension'))).toBe(true);
    });

    it('should detect insufficient depth', () => {
      const temporalAnalysis: SquatTemporalAnalysis = {
        hipRiseRate: 0.01,
        shoulderRiseRate: 0.01,
        riseRateRatio: 1.0,
        maxTorsoLean: 30,
        maxKneeForwardTravel: 10,
        neckExtensionMax: 20,
        minHipAngle: 110, // Above threshold of 100
      };

      const mockKeyPositions = {} as SquatKeyPositions;
      const thresholds = squatConfig?.riskThresholds || {};

      const flags = squatConfig?.detectRiskFlags(temporalAnalysis, mockKeyPositions, thresholds) || [];

      expect(flags.some(flag => flag.includes('Insufficient depth'))).toBe(true);
    });

    it('should detect excessive knee forward travel', () => {
      const temporalAnalysis: SquatTemporalAnalysis = {
        hipRiseRate: 0.01,
        shoulderRiseRate: 0.01,
        riseRateRatio: 1.0,
        maxTorsoLean: 30,
        maxKneeForwardTravel: 20, // Above threshold of 15
        neckExtensionMax: 20,
        minHipAngle: 90,
      };

      const mockKeyPositions = {} as SquatKeyPositions;
      const thresholds = squatConfig?.riskThresholds || {};

      const flags = squatConfig?.detectRiskFlags(temporalAnalysis, mockKeyPositions, thresholds) || [];

      expect(flags.some(flag => flag.includes('knee forward travel'))).toBe(true);
    });

    it('should return empty array when no risks detected', () => {
      const temporalAnalysis: SquatTemporalAnalysis = {
        hipRiseRate: 0.01,
        shoulderRiseRate: 0.01,
        riseRateRatio: 1.0,
        maxTorsoLean: 30,
        maxKneeForwardTravel: 10,
        neckExtensionMax: 20,
        minHipAngle: 90,
      };

      const mockKeyPositions = {} as SquatKeyPositions;
      const thresholds = squatConfig?.riskThresholds || {};

      const flags = squatConfig?.detectRiskFlags(temporalAnalysis, mockKeyPositions, thresholds) || [];

      expect(flags).toEqual([]);
    });
  });
});

// ============================================================================
// DEADLIFT EXERCISE CONFIGURATION TESTS
// ============================================================================

describe('Deadlift Exercise Configuration', () => {
  const deadliftConfig = getExerciseConfig('deadlift');

  describe('calculateMetrics', () => {
    it('should calculate metrics for setup position', () => {
      const landmarks = createDeadliftSetupLandmarks();
      const landmarkRefs = {
        shoulder: landmarks[12],
        hip: landmarks[24],
        knee: landmarks[26],
        ankle: landmarks[28],
        nose: landmarks[0],
        ear: landmarks[8],
        wrist: landmarks[16],
      };

      const metrics = deadliftConfig?.calculateMetrics(landmarks, landmarkRefs) as DeadliftMetrics;

      expect(metrics).toBeDefined();
      expect(metrics.hipAngle).toBeGreaterThan(0);
      expect(metrics.kneeAngle).toBeGreaterThan(0);
      expect(metrics.backAngle).toBeGreaterThanOrEqual(0);
      expect(metrics.neckAngle).toBeGreaterThan(0);
      expect(metrics.hipHeight).toBeGreaterThan(0);
      expect(metrics.shoulderHeight).toBeGreaterThan(0);
      expect(metrics.wristHeight).toBeGreaterThan(0);
      expect(typeof metrics.barPathDeviation).toBe('number');
    });

    it('should calculate metrics for lockout position', () => {
      const landmarks = createDeadliftLockoutLandmarks();
      const landmarkRefs = {
        shoulder: landmarks[12],
        hip: landmarks[24],
        knee: landmarks[26],
        ankle: landmarks[28],
        nose: landmarks[0],
        ear: landmarks[8],
        wrist: landmarks[16],
      };

      const metrics = deadliftConfig?.calculateMetrics(landmarks, landmarkRefs) as DeadliftMetrics;

      expect(metrics).toBeDefined();
      expect(metrics.hipHeight).toBeGreaterThan(0.4); // Higher in lockout
    });
  });

  describe('identifyKeyPositions', () => {
    it('should identify setup, start of pull, lockout, and completion', () => {
      const setupMetrics = deadliftConfig?.calculateMetrics(
        createDeadliftSetupLandmarks(),
        {
          shoulder: createDeadliftSetupLandmarks()[12],
          hip: createDeadliftSetupLandmarks()[24],
          knee: createDeadliftSetupLandmarks()[26],
          ankle: createDeadliftSetupLandmarks()[28],
          nose: createDeadliftSetupLandmarks()[0],
          ear: createDeadliftSetupLandmarks()[8],
          wrist: createDeadliftSetupLandmarks()[16],
        }
      ) as DeadliftMetrics;

      const lockoutMetrics = deadliftConfig?.calculateMetrics(
        createDeadliftLockoutLandmarks(),
        {
          shoulder: createDeadliftLockoutLandmarks()[12],
          hip: createDeadliftLockoutLandmarks()[24],
          knee: createDeadliftLockoutLandmarks()[26],
          ankle: createDeadliftLockoutLandmarks()[28],
          nose: createDeadliftLockoutLandmarks()[0],
          ear: createDeadliftLockoutLandmarks()[8],
          wrist: createDeadliftLockoutLandmarks()[16],
        }
      ) as DeadliftMetrics;

      const allFramesMetrics = [setupMetrics, lockoutMetrics, setupMetrics];

      const keyPositions = deadliftConfig?.identifyKeyPositions(allFramesMetrics) as DeadliftKeyPositions;

      expect(keyPositions).toBeDefined();
      expect(keyPositions.setup).toBeDefined();
      expect(keyPositions.startOfPull).toBeDefined();
      expect(keyPositions.lockout).toBeDefined();
      expect(keyPositions.completion).toBeDefined();

      // Lockout should have higher hip than start of pull
      expect(keyPositions.lockout.hipHeight).toBeGreaterThan(keyPositions.startOfPull.hipHeight);
    });
  });

  describe('calculateTemporalPatterns', () => {
    it('should calculate temporal patterns for full deadlift', () => {
      const setupMetrics = deadliftConfig?.calculateMetrics(
        createDeadliftSetupLandmarks(),
        {
          shoulder: createDeadliftSetupLandmarks()[12],
          hip: createDeadliftSetupLandmarks()[24],
          knee: createDeadliftSetupLandmarks()[26],
          ankle: createDeadliftSetupLandmarks()[28],
          nose: createDeadliftSetupLandmarks()[0],
          ear: createDeadliftSetupLandmarks()[8],
          wrist: createDeadliftSetupLandmarks()[16],
        }
      ) as DeadliftMetrics;

      const lockoutMetrics = deadliftConfig?.calculateMetrics(
        createDeadliftLockoutLandmarks(),
        {
          shoulder: createDeadliftLockoutLandmarks()[12],
          hip: createDeadliftLockoutLandmarks()[24],
          knee: createDeadliftLockoutLandmarks()[26],
          ankle: createDeadliftLockoutLandmarks()[28],
          nose: createDeadliftLockoutLandmarks()[0],
          ear: createDeadliftLockoutLandmarks()[8],
          wrist: createDeadliftLockoutLandmarks()[16],
        }
      ) as DeadliftMetrics;

      const allFramesMetrics = [setupMetrics, lockoutMetrics, setupMetrics];
      const keyPositions = deadliftConfig?.identifyKeyPositions(allFramesMetrics) as DeadliftKeyPositions;

      const temporalAnalysis = deadliftConfig?.calculateTemporalPatterns(
        allFramesMetrics,
        keyPositions
      ) as DeadliftTemporalAnalysis;

      expect(temporalAnalysis).toBeDefined();
      expect(typeof temporalAnalysis.avgBarPathDeviation).toBe('number');
      expect(typeof temporalAnalysis.maxBarPathDeviation).toBe('number');
      expect(typeof temporalAnalysis.maxBackAngle).toBe('number');
      expect(typeof temporalAnalysis.backAngleChange).toBe('number');
      expect(temporalAnalysis.hipRiseRate).toBeGreaterThanOrEqual(0);
      expect(temporalAnalysis.shoulderRiseRate).toBeGreaterThanOrEqual(0);
      expect(typeof temporalAnalysis.riseRateRatio).toBe('number');
      expect(typeof temporalAnalysis.neckExtensionMax).toBe('number');
    });

    it('should return null if start of pull is at or after lockout', () => {
      const setupMetrics = deadliftConfig?.calculateMetrics(
        createDeadliftSetupLandmarks(),
        {
          shoulder: createDeadliftSetupLandmarks()[12],
          hip: createDeadliftSetupLandmarks()[24],
          knee: createDeadliftSetupLandmarks()[26],
          ankle: createDeadliftSetupLandmarks()[28],
          nose: createDeadliftSetupLandmarks()[0],
          ear: createDeadliftSetupLandmarks()[8],
          wrist: createDeadliftSetupLandmarks()[16],
        }
      ) as DeadliftMetrics;

      const allFramesMetrics = [setupMetrics];
      const keyPositions: DeadliftKeyPositions = {
        setup: { frame: 0, ...setupMetrics },
        startOfPull: { frame: 0, ...setupMetrics },
        lockout: { frame: 0, ...setupMetrics },
        completion: { frame: 0, ...setupMetrics },
      };

      const temporalAnalysis = deadliftConfig?.calculateTemporalPatterns(
        allFramesMetrics,
        keyPositions
      );

      expect(temporalAnalysis).toBeNull();
    });
  });

  describe('detectRiskFlags', () => {
    it('should detect excessive back angle', () => {
      const temporalAnalysis: DeadliftTemporalAnalysis = {
        avgBarPathDeviation: 5,
        maxBarPathDeviation: 6,
        maxBackAngle: 55, // Above threshold of 50
        backAngleChange: 10,
        hipRiseRate: 0.01,
        shoulderRiseRate: 0.01,
        riseRateRatio: 1.0,
        neckExtensionMax: 20,
      };

      const mockKeyPositions = {} as DeadliftKeyPositions;
      const thresholds = deadliftConfig?.riskThresholds || {};

      const flags = deadliftConfig?.detectRiskFlags(temporalAnalysis, mockKeyPositions, thresholds) || [];

      expect(flags.some(flag => flag.includes('back angle'))).toBe(true);
    });

    it('should detect back rounding', () => {
      const temporalAnalysis: DeadliftTemporalAnalysis = {
        avgBarPathDeviation: 5,
        maxBarPathDeviation: 6,
        maxBackAngle: 40,
        backAngleChange: 20, // Above threshold of 15
        hipRiseRate: 0.01,
        shoulderRiseRate: 0.01,
        riseRateRatio: 1.0,
        neckExtensionMax: 20,
      };

      const mockKeyPositions = {} as DeadliftKeyPositions;
      const thresholds = deadliftConfig?.riskThresholds || {};

      const flags = deadliftConfig?.detectRiskFlags(temporalAnalysis, mockKeyPositions, thresholds) || [];

      expect(flags.some(flag => flag.includes('Back rounding'))).toBe(true);
    });

    it('should detect hips rising too fast (stripper deadlift)', () => {
      const temporalAnalysis: DeadliftTemporalAnalysis = {
        avgBarPathDeviation: 5,
        maxBarPathDeviation: 6,
        maxBackAngle: 40,
        backAngleChange: 10,
        hipRiseRate: 0.02,
        shoulderRiseRate: 0.01,
        riseRateRatio: 1.5, // Above threshold of 1.3
        neckExtensionMax: 20,
      };

      const mockKeyPositions = {} as DeadliftKeyPositions;
      const thresholds = deadliftConfig?.riskThresholds || {};

      const flags = deadliftConfig?.detectRiskFlags(temporalAnalysis, mockKeyPositions, thresholds) || [];

      expect(flags.some(flag => flag.includes('Hips rising faster'))).toBe(true);
    });

    it('should detect bar path deviation', () => {
      const temporalAnalysis: DeadliftTemporalAnalysis = {
        avgBarPathDeviation: 5,
        maxBarPathDeviation: 10, // Above threshold of 8
        maxBackAngle: 40,
        backAngleChange: 10,
        hipRiseRate: 0.01,
        shoulderRiseRate: 0.01,
        riseRateRatio: 1.0,
        neckExtensionMax: 20,
      };

      const mockKeyPositions = {} as DeadliftKeyPositions;
      const thresholds = deadliftConfig?.riskThresholds || {};

      const flags = deadliftConfig?.detectRiskFlags(temporalAnalysis, mockKeyPositions, thresholds) || [];

      expect(flags.some(flag => flag.includes('Bar path'))).toBe(true);
    });

    it('should detect neck hyperextension', () => {
      const temporalAnalysis: DeadliftTemporalAnalysis = {
        avgBarPathDeviation: 5,
        maxBarPathDeviation: 6,
        maxBackAngle: 40,
        backAngleChange: 10,
        hipRiseRate: 0.01,
        shoulderRiseRate: 0.01,
        riseRateRatio: 1.0,
        neckExtensionMax: 40, // Above threshold of 35
      };

      const mockKeyPositions = {} as DeadliftKeyPositions;
      const thresholds = deadliftConfig?.riskThresholds || {};

      const flags = deadliftConfig?.detectRiskFlags(temporalAnalysis, mockKeyPositions, thresholds) || [];

      expect(flags.some(flag => flag.includes('Neck hyperextension'))).toBe(true);
    });

    it('should return empty array when no risks detected', () => {
      const temporalAnalysis: DeadliftTemporalAnalysis = {
        avgBarPathDeviation: 5,
        maxBarPathDeviation: 6,
        maxBackAngle: 40,
        backAngleChange: 10,
        hipRiseRate: 0.01,
        shoulderRiseRate: 0.01,
        riseRateRatio: 1.0,
        neckExtensionMax: 20,
      };

      const mockKeyPositions = {} as DeadliftKeyPositions;
      const thresholds = deadliftConfig?.riskThresholds || {};

      const flags = deadliftConfig?.detectRiskFlags(temporalAnalysis, mockKeyPositions, thresholds) || [];

      expect(flags).toEqual([]);
    });
  });
});
