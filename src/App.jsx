import { useState } from 'react'
import VideoUploader from './components/VideoUploader'
import VideoPreview from './components/VideoPreview'
import FormResults from './components/FormResults'
import AppHeader from './components/AppHeader'
import VideoUploadTips from './components/VideoUploadTips'
import { extractFrames } from './utils/videoProcessing'

function App() {
  // Stage management: 'upload' | 'preview' | 'analyzing' | 'results'
  const [stage, setStage] = useState('upload');

  // Video state
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [exerciseType, setExerciseType] = useState(null);

  // Analysis state
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleVideoSelected = (file, exercise) => {
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setExerciseType(exercise);
    setStage('preview');
  };

  const handleAnalyze = async () => {
    setStage('analyzing');
    setError(null);

    try {
      const frames = await extractFrames(videoFile);

      // if fetch isn't sufficient we can consider using axios
      const response = await fetch('your-api-endpoint', {
        method: 'POST',
        body: JSON.stringify({ frames, exerciseType })
      });

      const data = await response.json();
      setResults(data);
      setStage('results');

    } catch (err) {
      setError(err.message);
      setStage('preview'); // Return to preview on error
    }
  };

  // Handler when user clicks "Upload Another Video"
  const handleUploadAnother = () => {
    // Clean up
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    // Reset all state
    setVideoFile(null);
    setVideoUrl(null);
    setExerciseType(null);
    setResults(null);
    setError(null);
    setStage('upload');
  };

  return (
    <div>
      <AppHeader />

      {stage === 'upload' && (
        <>
          <VideoUploader onVideoSelected={handleVideoSelected} />
          <VideoUploadTips />
        </>
      )}

      {(stage === 'preview' || stage === 'analyzing' || stage === 'results') && (
        <>
          <VideoPreview
            videoUrl={videoUrl}
            videoFile={videoFile}
            exerciseType={exerciseType}
            onAnalyze={handleAnalyze}
            onUploadAnother={handleUploadAnother}
            isAnalyzing={stage === 'analyzing'}
            results={results}
          />
          {stage === 'results' && results && (
            <FormResults results={results} exerciseType={exerciseType} />
          )}
        </>
      )}

      {error && (
        <div className="mt-4 p-4 bg-[#E26D5C] bg-opacity-10 border-2 border-[#E26D5C] rounded-lg max-w-2xl mx-auto">
          <p className="text-[#E26D5C] text-sm font-semibold">{error}</p>
        </div>
      )}
    </div>
  );
}

export default App
