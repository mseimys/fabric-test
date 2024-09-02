import { memo, useEffect, useRef } from "react";
import { useCanvas } from "./CanvasContext";

function CanvasComponent() {
  const { initializeCanvas, disposeCanvas } = useCanvas();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  console.log("Canvas render");

  useEffect(() => {
    if (!canvasRef.current) return;

    initializeCanvas(canvasRef.current);
    return () => disposeCanvas();
  }, [canvasRef]);

  return <canvas ref={canvasRef} width="800" height="400" />;
}

export const Canvas = memo(CanvasComponent);
