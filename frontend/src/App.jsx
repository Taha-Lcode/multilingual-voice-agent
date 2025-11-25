import { useState } from 'react'
import './App.css'
import './components/VoiceOrb'
import VoiceAgent from './components/VoiceAgent'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <VoiceAgent />
    </>
  )
}

export default App
