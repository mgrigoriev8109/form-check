/**
 * Pose detection and biomechanical analysis for squat form checking
 * Uses MediaPipe Pose to extract skeletal keypoints and calculate injury-risk metrics
 */

import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

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
 * Extract squat-specific biomechanical metrics from pose landmarks
 * @param {Array} landmarks - MediaPipe pose landmarks
 * @returns {Object} Biomechanical metrics
 */
function calculateSquatMetrics(landmarks) {
  if (!landmarks || landmarks.length === 0) {
    return null;
  }

  // Use right side for primary measurements (can be averaged with left side in production)
  const shoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const hip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const knee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
  const ankle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
  const nose = landmarks[POSE_LANDMARKS.NOSE];
  const ear = landmarks[POSE_LANDMARKS.RIGHT_EAR];

  // Check if all required landmarks are visible
  const requiredLandmarks = [shoulder, hip, knee, ankle, nose, ear];
  const landmarkNames = ['shoulder', 'hip', 'knee', 'ankle', 'nose', 'ear'];
  const visibilityIssues = requiredLandmarks.map((lm, idx) => {
    if (!lm) return `${landmarkNames[idx]}: missing`;
    if (lm.visibility < 0.5) return `${landmarkNames[idx]}: low visibility (${lm.visibility.toFixed(2)})`;
    return null;
  }).filter(issue => issue !== null);

  // Lower threshold for more lenient detection (0.3 instead of 0.5)
  // This helps with videos where lower body has partial occlusion
  if (visibilityIssues.length > 0) {
    console.warn('[Pose Detection] Visibility issues:', visibilityIssues);

    // Try with relaxed threshold for knee and ankle (common occlusion points)
    const relaxedCheck = requiredLandmarks.every((lm, idx) => {
      if (!lm) return false;
      // Use different thresholds based on landmark:
      // - Ankle: 0.1 (often partially occluded or out of frame)
      // - Knee: 0.25 (sometimes occluded)
      // - Others: 0.5 (should be clearly visible)
      let threshold = 0.5;
      if (landmarkNames[idx] === 'ankle') threshold = 0.1;
      else if (landmarkNames[idx] === 'knee') threshold = 0.25;
      return lm.visibility >= threshold;
    });

    if (!relaxedCheck) {
      return null; // Still not enough visible landmarks even with relaxed threshold
    }
    console.log('[Pose Detection] Using relaxed visibility threshold for knee/ankle');
  }

  // Calculate joint angles
  const hipAngle = calculateAngle(shoulder, hip, knee);
  const kneeAngle = calculateAngle(hip, knee, ankle);
  const ankleAngle = 180 - calculateAngle(knee, ankle, { x: ankle.x, y: ankle.y + 0.1, z: ankle.z }); // Ankle dorsiflexion

  // Calculate torso lean (angle from vertical)
  const torsoLean = calculateAngleFromVertical(shoulder, hip);

  // Calculate neck angle (head position relative to spine)
  const neckAngle = calculateAngle(shoulder, ear, nose);

  // Hip and shoulder vertical positions (for tracking rise rates)
  const hipHeight = 1 - hip.y; // MediaPipe coords are 0-1, inverted (0 = top)
  const shoulderHeight = 1 - shoulder.y;

  // Knee forward travel (x-position relative to ankle)
  const kneeForwardTravel = (knee.x - ankle.x) * 100; // Convert to percentage

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
}

/**
 * Identify key positions in the squat movement
 * @param {Array} allFramesMetrics - Metrics from all frames
 * @returns {Object} Key position indices and data
 */
function identifyKeyPositions(allFramesMetrics) {
  if (!allFramesMetrics || allFramesMetrics.length === 0) {
    return null;
  }

  // Setup is first frame
  const setupIdx = 0;

  // Bottom position is where hip is lowest (minimum hipHeight)
  let bottomIdx = 0;
  let minHipHeight = allFramesMetrics[0].hipHeight;

  allFramesMetrics.forEach((metrics, idx) => {
    if (metrics.hipHeight < minHipHeight) {
      minHipHeight = metrics.hipHeight;
      bottomIdx = idx;
    }
  });

  // Completion is last frame
  const completionIdx = allFramesMetrics.length - 1;

  return {
    setup: { frame: setupIdx, ...allFramesMetrics[setupIdx] },
    bottomPosition: { frame: bottomIdx, ...allFramesMetrics[bottomIdx] },
    completion: { frame: completionIdx, ...allFramesMetrics[completionIdx] },
  };
}

/**
 * Calculate temporal patterns across the movement
 * @param {Array} allFramesMetrics - Metrics from all frames
 * @param {Object} keyPositions - Identified key positions
 * @returns {Object} Temporal analysis
 */
function calculateTemporalPatterns(allFramesMetrics, keyPositions) {
  if (!allFramesMetrics || allFramesMetrics.length < 2 || !keyPositions) {
    return null;
  }

  const bottomIdx = keyPositions.bottomPosition.frame;
  const completionIdx = keyPositions.completion.frame;

  // Only analyze ascent phase (bottom to completion)
  if (bottomIdx >= completionIdx) {
    return null; // Invalid movement pattern
  }

  const ascentFrames = allFramesMetrics.slice(bottomIdx, completionIdx + 1);

  // Calculate hip rise and shoulder rise
  const hipRise = ascentFrames[ascentFrames.length - 1].hipHeight - ascentFrames[0].hipHeight;
  const shoulderRise = ascentFrames[ascentFrames.length - 1].shoulderHeight - ascentFrames[0].shoulderHeight;

  // Rise rates (per frame)
  const hipRiseRate = parseFloat((hipRise / ascentFrames.length).toFixed(4));
  const shoulderRiseRate = parseFloat((shoulderRise / ascentFrames.length).toFixed(4));

  // Ratio (>1.2 indicates "good morning" pattern)
  const riseRateRatio = shoulderRiseRate !== 0 ? parseFloat((hipRiseRate / shoulderRiseRate).toFixed(2)) : 0;

  // Max torso lean across all frames
  const maxTorsoLean = Math.max(...allFramesMetrics.map(m => m.torsoLean));

  // Max knee forward travel
  const maxKneeForwardTravel = Math.max(...allFramesMetrics.map(m => m.kneeForwardTravel));

  // Max neck angle
  const maxNeckAngle = Math.max(...allFramesMetrics.map(m => m.neckAngle));

  // Depth achieved (minimum hip angle)
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
}

/**
 * Detect squat-specific risk flags based on biomechanical thresholds
 * @param {Object} temporalAnalysis - Temporal patterns
 * @param {Object} keyPositions - Key positions
 * @returns {Array} Risk flags
 */
function detectRiskFlags(temporalAnalysis, keyPositions) {
  const flags = [];

  if (!temporalAnalysis || !keyPositions) {
    return flags;
  }

  // Excessive torso lean (>45° for high-bar squat)
  if (temporalAnalysis.maxTorsoLean > 45) {
    flags.push(`Excessive torso lean detected (${temporalAnalysis.maxTorsoLean}° - threshold: 45°)`);
  }

  // "Good morning" pattern (hips rising faster than shoulders)
  if (temporalAnalysis.riseRateRatio > 1.2) {
    flags.push(`Hip rising faster than shoulders (ratio: ${temporalAnalysis.riseRateRatio} - threshold: 1.2)`);
  }

  // Neck hyperextension (looking up too much)
  if (temporalAnalysis.neckExtensionMax > 30) {
    flags.push(`Neck hyperextension detected (${temporalAnalysis.neckExtensionMax}° - threshold: 30°)`);
  }

  // Insufficient depth (hip angle should be <100° at bottom)
  if (temporalAnalysis.minHipAngle > 100) {
    flags.push(`Insufficient depth (hip angle: ${temporalAnalysis.minHipAngle}° - target: <100°)`);
  }

  // Excessive knee forward travel (may indicate ankle mobility issues or weight shift)
  if (temporalAnalysis.maxKneeForwardTravel > 15) {
    flags.push(`Excessive knee forward travel (${temporalAnalysis.maxKneeForwardTravel}% - threshold: 15%)`);
  }

  return flags;
}

/**
 * Process video frames and extract squat biomechanics data
 * @param {File} videoFile - Video file to analyze
 * @param {number} frameCount - Number of frames to extract (default: 8)
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Structured biomechanics data
 */
export async function analyzeSquatVideo(videoFile, frameCount = 8, onProgress = null) {
  return new Promise(async (resolve, reject) => {
    try {
      // Step 1: Extract frames from video (reuse existing logic)
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

        console.log('[Pose Detection] Video loaded:', {
          duration: `${duration.toFixed(2)}s`,
          dimensions: `${video.videoWidth}x${video.videoHeight}`,
          frameCount,
        });

        // Initialize MediaPipe Pose
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
        let currentFrameIdx = 0;

        pose.onResults((results) => {
          console.log(`[Pose Detection] Frame ${currentFrameIdx} - Landmarks detected:`, !!results.poseLandmarks);
          if (results.poseLandmarks) {
            console.log(`[Pose Detection] Frame ${currentFrameIdx} - Landmark count:`, results.poseLandmarks.length);
            const metrics = calculateSquatMetrics(results.poseLandmarks);
            console.log(`[Pose Detection] Frame ${currentFrameIdx} - Metrics calculated:`, !!metrics, metrics);
            if (metrics) {
              allFramesMetrics.push(metrics);
            }
          } else {
            console.warn(`[Pose Detection] Frame ${currentFrameIdx} - No landmarks detected in this frame`);
          }
          currentFrameIdx++;
        });

        try {
          await pose.initialize();
          console.log('[Pose Detection] MediaPipe initialized successfully');
        } catch (initError) {
          console.error('[Pose Detection] MediaPipe initialization failed:', initError);
          URL.revokeObjectURL(videoUrl);
          reject(new Error(`Failed to initialize pose detection: ${initError.message}`));
          return;
        }

        // Process each frame
        for (let i = 0; i < frameCount; i++) {
          const timePoint = (duration * i) / (frameCount - 1);
          console.log(`[Pose Detection] Processing frame ${i + 1}/${frameCount} at ${timePoint.toFixed(2)}s`);

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

        console.log(`[Pose Detection] Processing complete - Valid frames: ${allFramesMetrics.length}/${frameCount}`);

        // Step 2: Analyze metrics
        if (allFramesMetrics.length === 0) {
          console.error('[Pose Detection] FAILED: No valid pose metrics extracted from any frame');
          console.error('[Pose Detection] Common issues: body parts out of frame, poor lighting, or side camera angle');
          console.error('[Pose Detection] Tip: Record from the front or back with your full body visible, including feet');
          URL.revokeObjectURL(videoUrl);
          reject(new Error('Failed to detect pose in video. Ensure your full body (including feet) is visible from the front or back angle. Check the console for details.'));
          return;
        }

        console.log('[Pose Detection] SUCCESS: Metrics extracted from all frames');

        const keyPositions = identifyKeyPositions(allFramesMetrics);
        const temporalAnalysis = calculateTemporalPatterns(allFramesMetrics, keyPositions);
        const riskFlags = detectRiskFlags(temporalAnalysis, keyPositions);

        // Step 3: Structure data for backend (excluding allFramesData to reduce payload size)
        const analysisData = {
          exerciseType: 'Squat',
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
 * Validate that pose detection is available
 * @returns {boolean} True if pose detection libraries are loaded
 */
export function isPoseDetectionAvailable() {
  return typeof Pose !== 'undefined';
}
