import { useState } from 'react'
import VideoUploader from './components/VideoUploader'
import VideoPreview from './components/VideoPreview'
import FormResults from './components/FormResults'
import AppHeader from './components/AppHeader'
import VideoUploadTips from './components/VideoUploadTips'
import { analyzeExerciseVideo } from './utils/poseDetection'

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
      // Extract pose keypoints and biomechanical metrics from video
      const biomechanicsData = await analyzeExerciseVideo(videoFile, exerciseType, 8);

      // Send keypoint data to backend for LLM analysis
      const response = await fetch('http://localhost:8000/api/analyze-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(biomechanicsData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Analysis failed');
      }

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
            <FormResults results={results} />
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
