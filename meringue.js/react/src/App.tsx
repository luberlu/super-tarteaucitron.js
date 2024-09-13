/*import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'*/
import './App.css'
import { MeringueProvider } from './MeringueContext';
import AdBlockWarning from './components/AdBlockWarning';

function App() {
  return (
    <>
     <MeringueProvider>
        <h1>Vite + React</h1>
        <AdBlockWarning />
      </MeringueProvider>
    </>
  )
}

export default App
