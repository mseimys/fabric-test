import "./App.css";

import { CanvasContextProvider } from "./CanvasContext";
import { Canvas } from "./Canvas";
import { Details } from "./Details";
import { Objects } from "./Objects";

function App() {
  return (
    <CanvasContextProvider>
      <h1>Fabric Test</h1>
      <div>
        <Canvas />
        <Details />
        <Objects />
      </div>
    </CanvasContextProvider>
  );
}

export default App;
