import AppHeader from './components/AppHeader';
import VideoAnalysisView from './features/video-analysis/VideoAnalysisView';

function App() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <AppHeader />
        <VideoAnalysisView />
      </div>
    </div>
  );
}

export default App;
