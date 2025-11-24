import { useState } from 'react'
import VideoUploader from './components/VideoUploader'
import VideoPreview from './components/VideoPreview'
import FormResults from './components/FormResults'
import VideoUploadTips from './components/VideoUploadTips'
import { analyzeExerciseVideo } from './utils/poseDetection'

type Stage = 'upload' | 'preview' | 'analyzing' | 'results';

interface AnalysisResults {
  analysis: string;
}

function FormCheckView() {
  // Stage management: 'upload' | 'preview' | 'analyzing' | 'results'
  const [stage, setStage] = useState<Stage>('upload');

  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [exerciseType, setExerciseType] = useState<string | null>(null);

  // Analysis state
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVideoSelected = (file: File, exercise: string) => {
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setExerciseType(exercise);
    setStage('preview');
  };

  const handleAnalyze = async () => {
    if (!videoFile || !exerciseType) {
      setError('Video file and exercise type are required');
      return;
    }

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

      const data: AnalysisResults = await response.json();
      setResults(data);
      setStage('results');

    } catch (err) {
      setError((err as Error).message);
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
    <>
      {stage === 'upload' && (
        <>
          <VideoUploader onVideoSelected={handleVideoSelected} />
          <VideoUploadTips />
        </>
      )}

      {(stage === 'preview' || stage === 'analyzing' || stage === 'results') && videoFile && videoUrl && exerciseType && (
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
        <div className="mt-8 p-4 bg-error/10 border border-error/30 rounded-lg max-w-3xl mx-auto">
          <p className="text-error-dark text-sm">{error}</p>
        </div>
      )}
    </>
  );
}

export default FormCheckView
