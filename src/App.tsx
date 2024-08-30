import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import CanvasContextProvider from './CanvasContext'
import {Canvas} from './Canvas'
import Details from './Details'

function App() {
  return (
    <CanvasContextProvider>
      <h1>Fabric Test</h1>
      <div>
          <Canvas />
          <Details />
      </div>
    </CanvasContextProvider>
  )
}

export default App
