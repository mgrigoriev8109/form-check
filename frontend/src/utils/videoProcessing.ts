/**
 * Extracts evenly distributed frames from a video file and converts them to base64 images
 * @param videoFile - The video file to extract frames from
 * @param frameCount - Number of frames to extract (default: 8)
 * @returns Array of base64-encoded image strings
 */
export async function extractFrames(videoFile: File, frameCount: number = 8): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const frames: string[] = [];

    if (!context) {
      reject(new Error('Failed to get canvas 2D context'));
      return;
    }

    // Create object URL for the video file
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.preload = 'metadata';

    // Once metadata is loaded, we know the duration
    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration;

      // Set canvas size to match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Function to capture a frame at a specific time
      const captureFrame = (timePoint: number): Promise<void> => {
        return new Promise((resolveFrame) => {
          video.currentTime = timePoint;

          video.addEventListener('seeked', function onSeeked() {
            // Draw the current video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert canvas to base64 image
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            // Remove the data URL prefix (data:image/jpeg;base64,) to get pure base64
            const base64Image = dataUrl.split(',')[1];
            frames.push(base64Image);

            // Remove this event listener to avoid duplicates
            video.removeEventListener('seeked', onSeeked);
            resolveFrame();
          }, { once: true });
        });
      };

      // Extract frames sequentially
      const extractAllFrames = async () => {
        for (let i = 0; i < frameCount; i++) {
          // Calculate evenly distributed time points
          // For frameCount=8 and duration=10s: 0s, 1.43s, 2.86s, 4.29s, 5.71s, 7.14s, 8.57s, 10s
          const timePoint = (duration * i) / (frameCount - 1);
          await captureFrame(timePoint);
        }

        // Clean up
        URL.revokeObjectURL(videoUrl);
        resolve(frames);
      };

      extractAllFrames().catch(reject);
    });

    video.addEventListener('error', (e) => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error(`Failed to load video: ${e.message}`));
    });
  });
}
