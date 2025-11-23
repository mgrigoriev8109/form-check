/**
 * Pose detection and biomechanical analysis for exercise form checking
 * Uses MediaPipe Pose to extract skeletal keypoints and calculate injury-risk metrics
 *
 * Supports multiple exercise types through a configuration-based approach.
 * To add a new exercise, create a new exercise config object (see EXERCISE_CONFIGS).
 */

import { Pose } from '@mediapipe/pose';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * MediaPipe Pose landmark indices
 * See: https://google.github.io/mediapipe/solutions/pose.html
 */
const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

/**
 * Default visibility thresholds for landmark detection
 */
const VISIBILITY_THRESHOLDS = {
  DEFAULT: 0.5,
  RELAXED_KNEE: 0.25,
  RELAXED_ANKLE: 0.1,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate angle between three points in degrees
 * @param {Object} point1 - First point {x, y, z}
 * @param {Object} vertex - Vertex point (angle measured here) {x, y, z}
 * @param {Object} point2 - Third point {x, y, z}
 * @returns {number} Angle in degrees
 */
function calculateAngle(point1, vertex, point2) {
  // Vector from vertex to point1
  const v1 = {
    x: point1.x - vertex.x,
    y: point1.y - vertex.y,
    z: point1.z - vertex.z,
  };

  // Vector from vertex to point2
  const v2 = {
    x: point2.x - vertex.x,
    y: point2.y - vertex.y,
    z: point2.z - vertex.z,
  };

  // Dot product
  const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;

  // Magnitudes
  const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2 + v1.z ** 2);
  const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2 + v2.z ** 2);

  // Angle in radians, then convert to degrees
  const angleRad = Math.acos(dotProduct / (mag1 * mag2));
  return (angleRad * 180) / Math.PI;
}

/**
 * Calculate angle from vertical (0° = perfectly vertical)
 * @param {Object} point1 - Upper point {x, y, z}
 * @param {Object} point2 - Lower point {x, y, z}
 * @returns {number} Angle from vertical in degrees
 */
function calculateAngleFromVertical(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;

  // atan2 gives angle from horizontal, so we subtract from 90 to get from vertical
  const angleFromHorizontal = Math.atan2(Math.abs(dx), Math.abs(dy)) * (180 / Math.PI);
  return 90 - angleFromHorizontal;
}

/**
 * Calculate vertical height in normalized coordinates (0-1)
 * MediaPipe coords are inverted (0 = top, 1 = bottom)
 */
function calculateHeight(landmark) {
  return 1 - landmark.y;
}

// ============================================================================
// EXERCISE CONFIGURATIONS
// ============================================================================

/**
 * Exercise configuration for SQUAT analysis
 */
const SQUAT_CONFIG = {
  name: 'Squat',

  // Required landmarks for analysis
  requiredLandmarks: {
    shoulder: POSE_LANDMARKS.RIGHT_SHOULDER,
    hip: POSE_LANDMARKS.RIGHT_HIP,
    knee: POSE_LANDMARKS.RIGHT_KNEE,
    ankle: POSE_LANDMARKS.RIGHT_ANKLE,
    nose: POSE_LANDMARKS.NOSE,
    ear: POSE_LANDMARKS.RIGHT_EAR,
  },

  // Visibility thresholds (use defaults if not specified)
  visibilityThresholds: {
    ankle: VISIBILITY_THRESHOLDS.RELAXED_ANKLE,
    knee: VISIBILITY_THRESHOLDS.RELAXED_KNEE,
  },

  // Metrics calculation function
  calculateMetrics: (_landmarks, landmarkRefs) => {
    const { shoulder, hip, knee, ankle, nose, ear } = landmarkRefs;

    // Joint angles
    const hipAngle = calculateAngle(shoulder, hip, knee);
    const kneeAngle = calculateAngle(hip, knee, ankle);
    const ankleAngle = 180 - calculateAngle(knee, ankle, { x: ankle.x, y: ankle.y + 0.1, z: ankle.z });

    // Torso and neck positioning
    const torsoLean = calculateAngleFromVertical(shoulder, hip);
    const neckAngle = calculateAngle(shoulder, ear, nose);

    // Height tracking for temporal analysis
    const hipHeight = calculateHeight(hip);
    const shoulderHeight = calculateHeight(shoulder);

    // Knee tracking
    const kneeForwardTravel = (knee.x - ankle.x) * 100;

    return {
      hipAngle: parseFloat(hipAngle.toFixed(1)),
      kneeAngle: parseFloat(kneeAngle.toFixed(1)),
      ankleAngle: parseFloat(ankleAngle.toFixed(1)),
      torsoLean: parseFloat(torsoLean.toFixed(1)),
      neckAngle: parseFloat(neckAngle.toFixed(1)),
      hipHeight: parseFloat(hipHeight.toFixed(3)),
      shoulderHeight: parseFloat(shoulderHeight.toFixed(3)),
      kneeForwardTravel: parseFloat(kneeForwardTravel.toFixed(1)),
    };
  },

  // Identify key positions in the movement
  identifyKeyPositions: (allFramesMetrics) => {
    const setupIdx = 0;

    // Bottom position is where hip is lowest
    let bottomIdx = 0;
    let minHipHeight = allFramesMetrics[0].hipHeight;
    allFramesMetrics.forEach((metrics, idx) => {
      if (metrics.hipHeight < minHipHeight) {
        minHipHeight = metrics.hipHeight;
        bottomIdx = idx;
      }
    });

    const completionIdx = allFramesMetrics.length - 1;

    return {
      setup: { frame: setupIdx, ...allFramesMetrics[setupIdx] },
      bottomPosition: { frame: bottomIdx, ...allFramesMetrics[bottomIdx] },
      completion: { frame: completionIdx, ...allFramesMetrics[completionIdx] },
    };
  },

  // Calculate temporal patterns specific to squats
  calculateTemporalPatterns: (allFramesMetrics, keyPositions) => {
    const bottomIdx = keyPositions.bottomPosition.frame;
    const completionIdx = keyPositions.completion.frame;

    if (bottomIdx >= completionIdx) return null;

    const ascentFrames = allFramesMetrics.slice(bottomIdx, completionIdx + 1);

    // Hip and shoulder rise during ascent
    const hipRise = ascentFrames[ascentFrames.length - 1].hipHeight - ascentFrames[0].hipHeight;
    const shoulderRise = ascentFrames[ascentFrames.length - 1].shoulderHeight - ascentFrames[0].shoulderHeight;

    const hipRiseRate = parseFloat((hipRise / ascentFrames.length).toFixed(4));
    const shoulderRiseRate = parseFloat((shoulderRise / ascentFrames.length).toFixed(4));
    const riseRateRatio = shoulderRiseRate !== 0 ? parseFloat((hipRiseRate / shoulderRiseRate).toFixed(2)) : 0;

    // Movement quality metrics
    const maxTorsoLean = Math.max(...allFramesMetrics.map(m => m.torsoLean));
    const maxKneeForwardTravel = Math.max(...allFramesMetrics.map(m => m.kneeForwardTravel));
    const maxNeckAngle = Math.max(...allFramesMetrics.map(m => m.neckAngle));
    const minHipAngle = Math.min(...allFramesMetrics.map(m => m.hipAngle));

    return {
      hipRiseRate,
      shoulderRiseRate,
      riseRateRatio,
      maxTorsoLean: parseFloat(maxTorsoLean.toFixed(1)),
      maxKneeForwardTravel: parseFloat(maxKneeForwardTravel.toFixed(1)),
      neckExtensionMax: parseFloat(maxNeckAngle.toFixed(1)),
      minHipAngle: parseFloat(minHipAngle.toFixed(1)),
    };
  },

  // Risk detection thresholds and logic
  riskThresholds: {
    maxTorsoLean: 45,
    riseRateRatio: 1.2,
    neckExtensionMax: 30,
    minHipAngle: 100,
    maxKneeForwardTravel: 15,
  },

  detectRiskFlags: (temporalAnalysis, _keyPositions, thresholds) => {
    const flags = [];

    if (temporalAnalysis.maxTorsoLean > thresholds.maxTorsoLean) {
      flags.push(`Excessive torso lean detected (${temporalAnalysis.maxTorsoLean}° - threshold: ${thresholds.maxTorsoLean}°)`);
    }

    if (temporalAnalysis.riseRateRatio > thresholds.riseRateRatio) {
      flags.push(`Hip rising faster than shoulders (ratio: ${temporalAnalysis.riseRateRatio} - threshold: ${thresholds.riseRateRatio})`);
    }

    if (temporalAnalysis.neckExtensionMax > thresholds.neckExtensionMax) {
      flags.push(`Neck hyperextension detected (${temporalAnalysis.neckExtensionMax}° - threshold: ${thresholds.neckExtensionMax}°)`);
    }

    if (temporalAnalysis.minHipAngle > thresholds.minHipAngle) {
      flags.push(`Insufficient depth (hip angle: ${temporalAnalysis.minHipAngle}° - target: <${thresholds.minHipAngle}°)`);
    }

    if (temporalAnalysis.maxKneeForwardTravel > thresholds.maxKneeForwardTravel) {
      flags.push(`Excessive knee forward travel (${temporalAnalysis.maxKneeForwardTravel}% - threshold: ${thresholds.maxKneeForwardTravel}%)`);
    }

    return flags;
  },
};

/**
 * Exercise configuration for DEADLIFT analysis
 */
const DEADLIFT_CONFIG = {
  name: 'Deadlift',

  // Required landmarks for analysis
  requiredLandmarks: {
    shoulder: POSE_LANDMARKS.RIGHT_SHOULDER,
    hip: POSE_LANDMARKS.RIGHT_HIP,
    knee: POSE_LANDMARKS.RIGHT_KNEE,
    ankle: POSE_LANDMARKS.RIGHT_ANKLE,
    nose: POSE_LANDMARKS.NOSE,
    ear: POSE_LANDMARKS.RIGHT_EAR,
    wrist: POSE_LANDMARKS.RIGHT_WRIST, // For bar path tracking
  },

  visibilityThresholds: {
    ankle: VISIBILITY_THRESHOLDS.RELAXED_ANKLE,
    knee: VISIBILITY_THRESHOLDS.RELAXED_KNEE,
    wrist: VISIBILITY_THRESHOLDS.RELAXED_ANKLE, // Wrist may be occluded by body
  },

  calculateMetrics: (_landmarks, landmarkRefs) => {
    const { shoulder, hip, knee, ankle, nose, ear, wrist } = landmarkRefs;

    // Joint angles
    const hipAngle = calculateAngle(shoulder, hip, knee);
    const kneeAngle = calculateAngle(hip, knee, ankle);

    // Back angle (critical for deadlift)
    const backAngle = calculateAngleFromVertical(shoulder, hip);

    // Neck positioning
    const neckAngle = calculateAngle(shoulder, ear, nose);

    // Height tracking
    const hipHeight = calculateHeight(hip);
    const shoulderHeight = calculateHeight(shoulder);
    const wristHeight = calculateHeight(wrist);

    // Bar path (represented by wrist position if holding bar)
    const barPathDeviation = Math.abs(wrist.x - ankle.x) * 100;

    return {
      hipAngle: parseFloat(hipAngle.toFixed(1)),
      kneeAngle: parseFloat(kneeAngle.toFixed(1)),
      backAngle: parseFloat(backAngle.toFixed(1)),
      neckAngle: parseFloat(neckAngle.toFixed(1)),
      hipHeight: parseFloat(hipHeight.toFixed(3)),
      shoulderHeight: parseFloat(shoulderHeight.toFixed(3)),
      wristHeight: parseFloat(wristHeight.toFixed(3)),
      barPathDeviation: parseFloat(barPathDeviation.toFixed(1)),
    };
  },

  identifyKeyPositions: (allFramesMetrics) => {
    const setupIdx = 0;

    // Bottom position is where wrist/bar is lowest (start of pull)
    let bottomIdx = 0;
    let minWristHeight = allFramesMetrics[0].wristHeight;
    allFramesMetrics.forEach((metrics, idx) => {
      if (metrics.wristHeight < minWristHeight) {
        minWristHeight = metrics.wristHeight;
        bottomIdx = idx;
      }
    });

    // Lockout is where hip is highest/most extended
    let lockoutIdx = 0;
    let maxHipHeight = allFramesMetrics[0].hipHeight;
    allFramesMetrics.forEach((metrics, idx) => {
      if (metrics.hipHeight > maxHipHeight) {
        maxHipHeight = metrics.hipHeight;
        lockoutIdx = idx;
      }
    });

    const completionIdx = allFramesMetrics.length - 1;

    return {
      setup: { frame: setupIdx, ...allFramesMetrics[setupIdx] },
      startOfPull: { frame: bottomIdx, ...allFramesMetrics[bottomIdx] },
      lockout: { frame: lockoutIdx, ...allFramesMetrics[lockoutIdx] },
      completion: { frame: completionIdx, ...allFramesMetrics[completionIdx] },
    };
  },

  calculateTemporalPatterns: (allFramesMetrics, keyPositions) => {
    const startIdx = keyPositions.startOfPull.frame;
    const lockoutIdx = keyPositions.lockout.frame;

    if (startIdx >= lockoutIdx) return null;

    const pullFrames = allFramesMetrics.slice(startIdx, lockoutIdx + 1);

    // Bar path quality (lower deviation = better)
    const avgBarPathDeviation = parseFloat(
      (pullFrames.reduce((sum, m) => sum + m.barPathDeviation, 0) / pullFrames.length).toFixed(1)
    );
    const maxBarPathDeviation = Math.max(...pullFrames.map(m => m.barPathDeviation));

    // Back angle consistency
    const maxBackAngle = Math.max(...allFramesMetrics.map(m => m.backAngle));
    const minBackAngle = Math.min(...allFramesMetrics.map(m => m.backAngle));
    const backAngleChange = parseFloat((maxBackAngle - minBackAngle).toFixed(1));

    // Hip and shoulder rise synchronization
    const hipRise = pullFrames[pullFrames.length - 1].hipHeight - pullFrames[0].hipHeight;
    const shoulderRise = pullFrames[pullFrames.length - 1].shoulderHeight - pullFrames[0].shoulderHeight;

    const hipRiseRate = parseFloat((hipRise / pullFrames.length).toFixed(4));
    const shoulderRiseRate = parseFloat((shoulderRise / pullFrames.length).toFixed(4));
    const riseRateRatio = shoulderRiseRate !== 0 ? parseFloat((hipRiseRate / shoulderRiseRate).toFixed(2)) : 0;

    // Neck positioning
    const maxNeckAngle = Math.max(...allFramesMetrics.map(m => m.neckAngle));

    return {
      avgBarPathDeviation,
      maxBarPathDeviation: parseFloat(maxBarPathDeviation.toFixed(1)),
      maxBackAngle: parseFloat(maxBackAngle.toFixed(1)),
      backAngleChange,
      hipRiseRate,
      shoulderRiseRate,
      riseRateRatio,
      neckExtensionMax: parseFloat(maxNeckAngle.toFixed(1)),
    };
  },

  riskThresholds: {
    maxBackAngle: 50, // Excessive forward lean
    backAngleChange: 15, // Back rounding during lift
    riseRateRatio: 1.3, // Hips rising too fast (stripper deadlift)
    maxBarPathDeviation: 8, // Bar drifting away from body
    neckExtensionMax: 35, // Looking up too much
  },

  detectRiskFlags: (temporalAnalysis, _keyPositions, thresholds) => {
    const flags = [];

    if (temporalAnalysis.maxBackAngle > thresholds.maxBackAngle) {
      flags.push(`Excessive back angle detected (${temporalAnalysis.maxBackAngle}° - threshold: ${thresholds.maxBackAngle}°)`);
    }

    if (temporalAnalysis.backAngleChange > thresholds.backAngleChange) {
      flags.push(`Back rounding detected during lift (change: ${temporalAnalysis.backAngleChange}° - threshold: ${thresholds.backAngleChange}°)`);
    }

    if (temporalAnalysis.riseRateRatio > thresholds.riseRateRatio) {
      flags.push(`Hips rising faster than shoulders (ratio: ${temporalAnalysis.riseRateRatio} - threshold: ${thresholds.riseRateRatio})`);
    }

    if (temporalAnalysis.maxBarPathDeviation > thresholds.maxBarPathDeviation) {
      flags.push(`Bar path deviating from vertical (${temporalAnalysis.maxBarPathDeviation}% - threshold: ${thresholds.maxBarPathDeviation}%)`);
    }

    if (temporalAnalysis.neckExtensionMax > thresholds.neckExtensionMax) {
      flags.push(`Neck hyperextension detected (${temporalAnalysis.neckExtensionMax}° - threshold: ${thresholds.neckExtensionMax}°)`);
    }

    return flags;
  },
};

/**
 * Registry of available exercise configurations
 */
const EXERCISE_CONFIGS = {
  squat: SQUAT_CONFIG,
  deadlift: DEADLIFT_CONFIG,
};

// ============================================================================
// CORE ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Extract biomechanical metrics from pose landmarks using exercise-specific config
 * @param {Array} landmarks - MediaPipe pose landmarks
 * @param {Object} exerciseConfig - Exercise configuration object
 * @returns {Object|null} Biomechanical metrics or null if insufficient visibility
 */
function calculateExerciseMetrics(landmarks, exerciseConfig) {
  if (!landmarks || landmarks.length === 0) {
    return null;
  }

  // Get landmark references
  const landmarkRefs = {};
  const landmarkNames = [];

  for (const [name, index] of Object.entries(exerciseConfig.requiredLandmarks)) {
    landmarkRefs[name] = landmarks[index];
    landmarkNames.push(name);
  }

  // Check visibility with exercise-specific thresholds
  const requiredLandmarks = Object.values(landmarkRefs);
  const visibilityIssues = requiredLandmarks.map((lm, idx) => {
    const name = landmarkNames[idx];
    if (!lm) return `${name}: missing`;

    const threshold = exerciseConfig.visibilityThresholds[name] || VISIBILITY_THRESHOLDS.DEFAULT;
    if (lm.visibility < threshold) {
      return `${name}: low visibility (${lm.visibility.toFixed(2)})`;
    }
    return null;
  }).filter(issue => issue !== null);

  if (visibilityIssues.length > 0) {
    // Check if we meet minimum requirements with relaxed thresholds
    const hasMinimumVisibility = requiredLandmarks.every((lm, idx) => {
      if (!lm) return false;
      const name = landmarkNames[idx];
      const threshold = exerciseConfig.visibilityThresholds[name] || VISIBILITY_THRESHOLDS.DEFAULT;
      return lm.visibility >= threshold;
    });

    if (!hasMinimumVisibility) {
      return null;
    }
  }

  // Calculate exercise-specific metrics
  return exerciseConfig.calculateMetrics(landmarks, landmarkRefs);
}

/**
 * Analyze temporal patterns across the movement
 * @param {Array} allFramesMetrics - Metrics from all frames
 * @param {Object} keyPositions - Identified key positions
 * @param {Object} exerciseConfig - Exercise configuration
 * @returns {Object|null} Temporal analysis
 */
function analyzeTemporalPatterns(allFramesMetrics, keyPositions, exerciseConfig) {
  if (!allFramesMetrics || allFramesMetrics.length < 2 || !keyPositions) {
    return null;
  }

  return exerciseConfig.calculateTemporalPatterns(allFramesMetrics, keyPositions);
}

/**
 * Detect exercise-specific risk flags
 * @param {Object} temporalAnalysis - Temporal patterns
 * @param {Object} keyPositions - Key positions
 * @param {Object} exerciseConfig - Exercise configuration
 * @returns {Array} Risk flags
 */
function detectExerciseRiskFlags(temporalAnalysis, keyPositions, exerciseConfig) {
  if (!temporalAnalysis || !keyPositions) {
    return [];
  }

  return exerciseConfig.detectRiskFlags(
    temporalAnalysis,
    keyPositions,
    exerciseConfig.riskThresholds
  );
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Process video frames and extract biomechanics data for any supported exercise
 * @param {File} videoFile - Video file to analyze
 * @param {string} exerciseType - Type of exercise ('squat', 'deadlift')
 * @param {number} frameCount - Number of frames to extract (default: 8)
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Structured biomechanics data
 */
export async function analyzeExerciseVideo(videoFile, exerciseType = 'squat', frameCount = 8, onProgress = null) {
  // Get exercise configuration
  const exerciseConfig = EXERCISE_CONFIGS[exerciseType.toLowerCase()];

  if (!exerciseConfig) {
    throw new Error(`Unsupported exercise type: ${exerciseType}. Supported types: ${Object.keys(EXERCISE_CONFIGS).join(', ')}`);
  }

  return new Promise(async (resolve, reject) => {
    try {
      // Step 1: Setup video element
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      const videoUrl = URL.createObjectURL(videoFile);
      video.src = videoUrl;
      video.preload = 'metadata';

      video.addEventListener('loadedmetadata', async () => {
        const duration = video.duration;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Step 2: Initialize MediaPipe Pose
        const pose = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          },
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        // Store results from pose detection
        const allFramesMetrics = [];

        pose.onResults((results) => {
          if (results.poseLandmarks) {
            const metrics = calculateExerciseMetrics(results.poseLandmarks, exerciseConfig);

            if (metrics) {
              allFramesMetrics.push(metrics);
            }
          }
        });

        try {
          await pose.initialize();
        } catch (initError) {
          URL.revokeObjectURL(videoUrl);
          reject(new Error(`Failed to initialize pose detection: ${initError.message}`));
          return;
        }

        // Step 3: Process each frame
        for (let i = 0; i < frameCount; i++) {
          const timePoint = (duration * i) / (frameCount - 1);

          await new Promise((resolveFrame) => {
            video.currentTime = timePoint;
            video.addEventListener('seeked', async function onSeeked() {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);

              // Send frame to MediaPipe
              await pose.send({ image: canvas });

              video.removeEventListener('seeked', onSeeked);

              if (onProgress) {
                onProgress((i + 1) / frameCount);
              }

              resolveFrame();
            }, { once: true });
          });
        }

        // Close pose instance
        pose.close();

        // Step 4: Analyze metrics
        if (allFramesMetrics.length === 0) {
          URL.revokeObjectURL(videoUrl);
          reject(new Error('Failed to detect pose in video. Ensure your full body (including feet) is visible from the front or back angle.'));
          return;
        }

        const keyPositions = exerciseConfig.identifyKeyPositions(allFramesMetrics);
        const temporalAnalysis = analyzeTemporalPatterns(allFramesMetrics, keyPositions, exerciseConfig);
        const riskFlags = detectExerciseRiskFlags(temporalAnalysis, keyPositions, exerciseConfig);

        // Step 5: Structure data for backend
        const analysisData = {
          exerciseType: exerciseConfig.name,
          frameCount: allFramesMetrics.length,
          duration: `approximately ${Math.round(duration)} seconds`,
          keyPositions,
          temporalAnalysis,
          riskFlags,
        };

        URL.revokeObjectURL(videoUrl);
        resolve(analysisData);
      });

      video.addEventListener('error', (e) => {
        URL.revokeObjectURL(videoUrl);
        reject(new Error(`Failed to load video: ${e.message}`));
      });

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Legacy function name for backwards compatibility
 * @deprecated Use analyzeExerciseVideo instead
 */
export async function analyzeSquatVideo(videoFile, frameCount = 8, onProgress = null) {
  return analyzeExerciseVideo(videoFile, 'squat', frameCount, onProgress);
}

/**
 * Validate that pose detection is available
 * @returns {boolean} True if pose detection libraries are loaded
 */
export function isPoseDetectionAvailable() {
  return typeof Pose !== 'undefined';
}

/**
 * Get list of supported exercise types
 * @returns {Array<string>} List of supported exercise types
 */
export function getSupportedExercises() {
  return Object.keys(EXERCISE_CONFIGS);
}

/**
 * Get configuration for a specific exercise
 * @param {string} exerciseType - Exercise type
 * @returns {Object|null} Exercise configuration or null if not found
 */
export function getExerciseConfig(exerciseType) {
  return EXERCISE_CONFIGS[exerciseType.toLowerCase()] || null;
}
