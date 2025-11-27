import { useState, useRef, ChangeEvent, DragEvent } from 'react';

interface VideoUploaderProps {
  onVideoSelected: (file: File, exerciseType: string) => void;
}

const VideoUploader = ({ onVideoSelected }: VideoUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exerciseType, setExerciseType] = useState('squat');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const MAX_DURATION = 30; // 30 seconds
  const ALLOWED_FORMATS = ['video/mp4', 'video/quicktime', 'video/x-m4v'];

  const validateVideo = (file: File): boolean => {
    if (!ALLOWED_FORMATS.includes(file.type)) {
      setError('Please upload a .mp4 or .mov file');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 100MB');
      return false;
    }

    return true;
  };

  const checkVideoDuration = (
    videoElement: HTMLVideoElement
  ): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      videoElement.onloadedmetadata = () => {
        if (videoElement.duration > MAX_DURATION) {
          reject(
            new Error(
              `Video must be ${MAX_DURATION} seconds or less. Your video is ${Math.round(videoElement.duration)} seconds.`
            )
          );
        } else {
          resolve(true);
        }
      };
    });
  };

  const handleFile = async (file: File) => {
    setError(null);

    if (!validateVideo(file)) {
      return;
    }

    // lgtm[js/xss-through-dom] - Safe: URL.createObjectURL generates a secure blob URL from File API
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;

    try {
      await checkVideoDuration(video);
      // Pass file and exercise type back to App
      onVideoSelected(file, exerciseType);
    } catch (err) {
      setError((err as Error).message);
      URL.revokeObjectURL(url);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Exercise Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Exercise Type
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setExerciseType('squat')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
              exerciseType === 'squat'
                ? 'bg-secondary text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-secondary-light hover:bg-secondary/10'
            }`}
          >
            Squat
          </button>
          <button
            onClick={() => setExerciseType('deadlift')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
              exerciseType === 'deadlift'
                ? 'bg-secondary text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-secondary-light hover:bg-secondary/10'
            }`}
          >
            Deadlift
          </button>
        </div>
      </div>

      {/* Video Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-16 text-center transition-all bg-white ${
          dragActive
            ? 'border-secondary-light bg-secondary/10'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/x-m4v"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>

        <p className="text-lg font-medium text-gray-900 mb-2">
          Drop your video here, or click to browse
        </p>
        <p className="text-sm text-gray-500 mb-8">
          MP4 or MOV • Max 30 seconds • Max 100MB
        </p>

        <button
          onClick={handleButtonClick}
          className="bg-accent text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-accent-dark transition-colors shadow-sm"
        >
          Choose File
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-error/10 border border-error/30 rounded-lg">
          <p className="text-error-dark text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
