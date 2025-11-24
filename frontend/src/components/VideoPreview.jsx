import { useRef } from 'react';

const VideoPreview = ({
  videoUrl,
  videoFile,
  exerciseType,
  onAnalyze,
  onUploadAnother,
  isAnalyzing,
  results
}) => {
  const videoRef = useRef(null);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Video Player */}
      <div className="relative rounded-xl overflow-hidden bg-white shadow-md border border-gray-200">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full"
        />
      </div>

      {/* File Info */}
      <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">{videoFile.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              {(videoFile.size / (1024 * 1024)).toFixed(2)} MB • {exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)}
            </p>
          </div>
          {!results && !isAnalyzing && (
            <button
              onClick={onUploadAnother}
              className="text-gray-500 hover:text-gray-700 font-medium transition-colors text-sm"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Action Button */}
      {!results ? (
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className={`w-full py-4 px-6 rounded-lg font-medium text-lg transition-all shadow-sm ${
            isAnalyzing
              ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
              : 'bg-accent text-gray-900 hover:bg-accent-dark'
          }`}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </span>
          ) : (
            'Analyze Form'
          )}
        </button>
      ) : (
        <button
          onClick={onUploadAnother}
          className="w-full bg-primary text-white py-4 px-6 rounded-lg font-medium text-lg hover:bg-primary-dark transition-colors shadow-sm"
        >
          Upload Another Video
        </button>
      )}
    </div>
  );
};

export default VideoPreview;
