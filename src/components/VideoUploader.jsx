import { useState, useRef } from 'react';

const VideoUploader = ({ onVideoSelect, onAnalyze }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [exerciseType, setExerciseType] = useState('squat');
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // Validation constants
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const MAX_DURATION = 30; // 30 seconds
  const ALLOWED_FORMATS = ['video/mp4', 'video/quicktime', 'video/x-m4v'];

  const validateVideo = (file) => {
    // Check file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
      setError('Please upload a .mp4 or .mov file');
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 100MB');
      return false;
    }

    return true;
  };

  const checkVideoDuration = (videoElement) => {
    return new Promise((resolve, reject) => {
      videoElement.onloadedmetadata = () => {
        if (videoElement.duration > MAX_DURATION) {
          reject(new Error(`Video must be ${MAX_DURATION} seconds or less. Your video is ${Math.round(videoElement.duration)} seconds.`));
        } else {
          resolve(true);
        }
      };
    });
  };

  const handleFile = async (file) => {
    setError(null);

    if (!validateVideo(file)) {
      return;
    }

    // Create object URL for preview
    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    // Create video element to check duration
    const video = document.createElement('video');
    video.src = url;

    try {
      await checkVideoDuration(video);
      setSelectedFile(file);
      if (onVideoSelect) {
        onVideoSelect(file);
      }
    } catch (err) {
      setError(err.message);
      setVideoUrl(null);
      setSelectedFile(null);
      URL.revokeObjectURL(url);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
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

  const handleRemoveVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setSelectedFile(null);
    setVideoUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = () => {
    if (selectedFile && onAnalyze) {
      onAnalyze(selectedFile, exerciseType);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Form Check</h1>
        <p className="text-gray-600">Upload your workout video for AI-powered form analysis</p>
      </div>

      {/* Exercise Type Selection */}
      {!selectedFile && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Exercise Type
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setExerciseType('squat')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                exerciseType === 'squat'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              🏋️ Squat
            </button>
            <button
              onClick={() => setExerciseType('deadlift')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                exerciseType === 'deadlift'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              💪 Deadlift
            </button>
          </div>
        </div>
      )}

      {/* Upload Area or Video Preview */}
      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/x-m4v"
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>

          <p className="text-lg font-medium text-gray-700 mb-2">
            Drop your video here, or click to browse
          </p>
          <p className="text-sm text-gray-500 mb-4">
            MP4 or MOV • Max 30 seconds • Max 100MB
          </p>

          <button
            onClick={handleButtonClick}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Choose File
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Video Preview */}
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full max-h-96"
            />
          </div>

          {/* Video Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)}
                </p>
              </div>
              <button
                onClick={handleRemoveVideo}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Remove
              </button>
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium text-lg hover:bg-green-700 transition-colors"
          >
            Analyze Form
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Tips for best results:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Record from the side view for squats and deadlifts</li>
          <li>• Ensure good lighting and the full body is visible</li>
          <li>• Keep the video under 30 seconds</li>
          <li>• Film at least one complete rep</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoUploader;