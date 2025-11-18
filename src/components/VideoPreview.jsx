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
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Video Player */}
      <div className="relative rounded-lg overflow-hidden bg-[#303030] shadow-xl border-4 border-[#DFB960]">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full max-h-96"
        />
      </div>

      {/* File Info */}
      <div className="bg-[#F5F5F5] rounded-lg p-4 border-2 border-[#303030] border-opacity-20">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-[#303030]">{videoFile.name}</p>
            <p className="text-sm text-[#303030] opacity-70">
              {(videoFile.size / (1024 * 1024)).toFixed(2)} MB • {exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)}
            </p>
          </div>
          {!results && !isAnalyzing && (
            <button
              onClick={onUploadAnother}
              className="text-[#E26D5C] hover:text-[#d25a48] font-bold transition-colors"
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
          className={`w-full py-4 px-6 rounded-lg font-black text-xl transition-all transform shadow-lg uppercase tracking-wide ${
            isAnalyzing
              ? 'bg-[#2D5016] bg-opacity-50 text-white cursor-not-allowed'
              : 'bg-[#2D5016] text-white hover:bg-[#234010] hover:scale-105'
          }`}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
          className="w-full bg-[#E26D5C] text-white py-4 px-6 rounded-lg font-black text-xl hover:bg-[#d25a48] transition-all transform hover:scale-105 shadow-lg uppercase tracking-wide"
        >
          Upload Another Video
        </button>
      )}
    </div>
  );
};

export default VideoPreview;
