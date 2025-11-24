import AppHeader from './components/AppHeader'
import FormCheckView from './features/form-check/FormCheckView'

function App() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <AppHeader />
        <FormCheckView />
      </div>
    </div>
  );
}

export default App
