import { useState } from 'react'
import VideoUploader from './components/VideoUploader'
import VideoPreview from './components/VideoPreview'
import FormResults from './components/FormResults'
import AppHeader from './components/AppHeader'
import VideoUploadTips from './components/VideoUploadTips'
import { analyzeSquatVideo } from './utils/poseDetection'

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

    const totalStart = performance.now();

    try {
      // Extract pose keypoints and biomechanical metrics from video
      const poseStart = performance.now();
      const biomechanicsData = await analyzeSquatVideo(videoFile, 8, (progress) => {
        // Optional: could add progress indicator to UI later
        console.log(`Processing: ${Math.round(progress * 100)}%`);
      });
      const poseTime = ((performance.now() - poseStart) / 1000).toFixed(2);
      console.log(`[TIMING] Frontend pose detection: ${poseTime}s`);

      // Send keypoint data to backend for LLM analysis
      const apiStart = performance.now();
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
      const apiTime = ((performance.now() - apiStart) / 1000).toFixed(2);
      const totalTime = ((performance.now() - totalStart) / 1000).toFixed(2);

      console.log(`[TIMING] Backend API call: ${apiTime}s`);
      console.log(`[TIMING] Total end-to-end: ${totalTime}s`);
      console.log(`[TIMING] Breakdown: Pose ${poseTime}s (${Math.round(poseTime/totalTime*100)}%) + API ${apiTime}s (${Math.round(apiTime/totalTime*100)}%)`);

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
