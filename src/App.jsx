import { useState } from 'react'
import VideoUploader from './components/VideoUploader'

function App() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async (videoFile, exerciseType) => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Extract frames from video
      const frames = await extractFrames(videoFile);
      
      // 2. Call your Lambda/API
      const response = await fetch('your-api-endpoint', {
        method: 'POST',
        body: JSON.stringify({ frames, exerciseType })
      });
      
      const data = await response.json();
      setResults(data);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  function RenderUploadTips() {
    return (
      <div className="mt-8 bg-[#DFB960] bg-opacity-15 rounded-lg p-5 border-l-4 border-[#DFB960]">
        <h3 className="font-black text-[#303030] mb-3 uppercase tracking-wide text-sm">
          Tips for best results:
        </h3>
        <ul className="text-sm text-[#303030] space-y-2 font-medium">
          <li className="flex items-start">
            <span className="text-[#DFB960] mr-2 font-bold">▸</span>
            Record from the side view for squats and deadlifts
          </li>
          <li className="flex items-start">
            <span className="text-[#DFB960] mr-2 font-bold">▸</span>
            Ensure good lighting and the full body is visible
          </li>
          <li className="flex items-start">
            <span className="text-[#DFB960] mr-2 font-bold">▸</span>
            Keep the video under 30 seconds
          </li>
          <li className="flex items-start">
            <span className="text-[#DFB960] mr-2 font-bold">▸</span>
            Film at least one complete rep
          </li>
        </ul>
      </div>
    )
  }

  function Header() {
    return (
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-[#303030] mb-2 tracking-tight">
          FORM CHECK
        </h1>
        <p className="text-[#303030] text-lg opacity-80">
          Upload your workout video for AI-powered form analysis
        </p>
      </div>
    )
  }


  return (
    <div>
      <Header />
      <VideoUploader onAnalyze={handleAnalyze} />
      
      {loading && (
        <div className="spinner">
          <div className="animate-spin...">Loading...</div>
        </div>
      )}
      
      {error && <div className="error">{error}</div>}
      
      {!results && <RenderUploadTips />}
    </div>
  );
}

export default App
