import { useState } from "react";
import { useCanvas } from "./CanvasContext";

export function SerializedObject() {
  const [svg, setSvg] = useState("");
  const { canvasToSvg } = useCanvas();
  console.log("SerializedObject render");
  return (
    <div>
      <button
        type="button"
        onClick={async () => {
          const data = await canvasToSvg();
          setSvg(data);
        }}
      >
        TO SVG
      </button>
      <br />
      {svg}
    </div>
  );
}
