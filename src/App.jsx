import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import VideoUploader from './components/VideoUploader'

function App() {
  const [count, setCount] = useState(0)

  return (
    < VideoUploader ></VideoUploader>)
}

export default App
