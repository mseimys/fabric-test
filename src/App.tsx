import "./App.css";

import { CanvasContextProvider } from "./CanvasContext";
import { Canvas } from "./Canvas";
import { Details } from "./Details";
import { Objects } from "./Objects";

function App() {
  return (
    <CanvasContextProvider>
      <h2>Fabric Test</h2>
      <div className="flex-row">
        <Objects />
        <Canvas />
        <Details />
      </div>
    </CanvasContextProvider>
  );
}

export default App;
