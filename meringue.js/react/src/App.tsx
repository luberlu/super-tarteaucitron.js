/*import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'*/
import './App.css'
import { MeringueProvider } from './MeringueContext';
import AdBlockWarning from './components/AdBlockWarning';
import Services from './components/Services';

function App() {
  return (
    <>
     <MeringueProvider>
        <h1>Meringue.js</h1>
        <Services />
        <AdBlockWarning />
      </MeringueProvider>
    </>
  )
}

export default App
