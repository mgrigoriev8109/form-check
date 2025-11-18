import { useState, useRef } from 'react';

const VideoUploader = ({ onAnalyze }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [exerciseType, setExerciseType] = useState('squat');
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const MAX_DURATION = 30; // 30 seconds
  const ALLOWED_FORMATS = ['video/mp4', 'video/quicktime', 'video/x-m4v'];

  const validateVideo = (file) => {
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

    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    const video = document.createElement('video');
    video.src = url;

    try {
      await checkVideoDuration(video);
      setSelectedFile(file);
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
    <div className="max-w-2xl mx-auto">
      {/* Exercise Selection */}
      {!selectedFile && (
        <div className="mb-6">
          <label className="block text-sm font-bold text-[#303030] mb-3 uppercase tracking-wide">
            Select Exercise Type
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setExerciseType('squat')}
              className={`flex-1 py-4 px-4 rounded-lg border-2 font-bold transition-all transform hover:scale-105 ${
                exerciseType === 'squat'
                  ? 'border-[#DFB960] bg-[#DFB960] text-[#303030] shadow-lg'
                  : 'border-[#303030] border-2 bg-white text-[#303030] hover:border-[#DFB960]'
              }`}
            >
              Squat
            </button>
            <button
              onClick={() => setExerciseType('deadlift')}
              className={`flex-1 py-4 px-4 rounded-lg border-2 font-bold transition-all transform hover:scale-105 ${
                exerciseType === 'deadlift'
                  ? 'border-[#DFB960] bg-[#DFB960] text-[#303030] shadow-lg'
                  : 'border-[#303030] border-2 bg-white text-[#303030] hover:border-[#DFB960]'
              }`}
            >
              Deadlift
            </button>
          </div>
        </div>
      )}

      {/* Video Upload or Preview */}
      {!selectedFile ? (
        // Upload Area
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
            dragActive
              ? ' bg-[#DFB960] bg-opacity-10 scale-105'
              : 'border-[#303030] border-opacity-30 bg-[#F5F5F5] hover:border-[#DFB960] hover:border-opacity-50'
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
              className="mx-auto h-20 w-20 text-[#DFB960]"
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

          <p className="text-xl font-bold text-[#303030] mb-2">
            Drop your video here, or click to browse
          </p>
          <p className="text-sm text-[#303030] opacity-70 mb-6">
            MP4 or MOV • Max 30 seconds • Max 100MB
          </p>

          <button
            onClick={handleButtonClick}
            className="bg-[#E26D5C] text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-[#d25a48] transition-all transform hover:scale-105 shadow-md"
          >
            Choose File
          </button>
        </div>
      ) : (
        // Video Preview
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-[#303030] shadow-xl border-4 border-[#DFB960]">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full max-h-96"
            />
          </div>

          <div className="bg-[#F5F5F5] rounded-lg p-4 border-2 border-[#303030] border-opacity-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-[#303030]">{selectedFile.name}</p>
                <p className="text-sm text-[#303030] opacity-70">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)}
                </p>
              </div>
              <button
                onClick={handleRemoveVideo}
                className="text-[#E26D5C] hover:text-[#d25a48] font-bold transition-colors"
              >
                Remove
              </button>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            className="w-full bg-[#2D5016] text-white py-4 px-6 rounded-lg font-black text-xl hover:bg-[#234010] transition-all transform hover:scale-105 shadow-lg uppercase tracking-wide"
          >
            Analyze Form
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-[#E26D5C] bg-opacity-10 border-2 border-[#E26D5C] rounded-lg">
          <p className="text-[#E26D5C] text-sm font-semibold">{error}</p>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
