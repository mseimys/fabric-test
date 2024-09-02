import { memo } from "react";
import type { FabricObject } from "fabric";

import { useCanvas } from "./CanvasContext";

const LayersComponent = ({ layers }: { layers: FabricObject[] }) => {
  console.log("LayersComponent render", { layers });

  return layers.map((obj, index) => (
    <span key={index}>
      {index}
      {obj.type}
    </span>
  ));
};

const Layers = memo(LayersComponent);

export function Objects() {
  const { layers, canRedo, canUndo, canvas } = useCanvas();
  return (
    <>
      <div>
        Layers:
        {<Layers layers={layers} />}
      </div>
      <br />
      {JSON.stringify(canUndo)}
      <button type="button" disabled={!canUndo} onClick={() => canvas.undo()}>
        UNDO
      </button>
      <button type="button" disabled={!canRedo} onClick={() => canvas.redo()}>
        REDO
      </button>
    </>
  );
}
