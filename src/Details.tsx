import { useState } from "react";

import { useCanvas } from "./CanvasContext";

const SVG_STRING = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
        <rect id="MAIN_000_CONTAIN" x="60" y="125" width="30" height="200" fill="blue"/>
        <rect id="MAIN_001" x="520" y="50" width="360" height="425" fill="yellow"/>
      </svg>`;

export function Details() {
  const { canvas, obj, loadSvg } = useCanvas();
  console.log("Details render", { canvas, obj });
  return (
    <div key={JSON.stringify(obj)}>
      Details page
      <button
        type="button"
        onClick={() => {
          loadSvg(SVG_STRING);
        }}
      >
        LOAD SVG
      </button>
      <br />
      SELECTED OBJ: {JSON.stringify(obj, undefined, 1)}
    </div>
  );
}
