import { useState } from "react";

import { useCanvas } from "./CanvasContext";

export function Details() {
  const { canvas, obj } = useCanvas();
  console.log("Details render", { canvas, obj });
  return (
    <div key={JSON.stringify(obj)} style={{ width: "33%" }}>
      Details page
      <br />
      <div>SELECTED OBJ: {JSON.stringify(obj, undefined, 1)}</div>
    </div>
  );
}
