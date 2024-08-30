import { useState, createContext, useRef, useEffect } from "react";

import * as fabric from "fabric";

const initialContext = {
  fabric,
  ready: false,
  canvas: {} as fabric.Canvas,
  initializeCanvas: (_: HTMLCanvasElement) => {},
  disposeCanvas: () => {},
};

export const CanvasContext =
  createContext<typeof initialContext>(initialContext);

const initializeEvents = (canvas: fabric.Canvas) => {
  canvas.on("object:added", (e) => {
    console.log("object:added event", e);
  });
};

export default function CanvasContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  // const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const canvas = useRef<fabric.Canvas | null>(null);

  console.log("CanvasContextProvider render", { canvas });

  const initializeCanvas = (canvasElement: HTMLCanvasElement) => {
    console.log("initializeCanvas", { canvasElement });
    const newCanvas = new fabric.Canvas(canvasElement, {
      backgroundColor: "lightgray",
    });
    newCanvas.add(
      new fabric.Circle({ x: 200, y: 100, radius: 50, fill: "red" })
    );
    newCanvas.add(
      new fabric.Rect({ x: 300, y: 200, width: 50, height: 100, fill: "green" })
    );
    initializeEvents(newCanvas);
    canvas.current = newCanvas;
    setReady(true);
  };

  const disposeCanvas = () => {
    console.log("disposeCanvas");
    canvas.current?.dispose();
    canvas.current = null;
    // canvas?.dispose();
  };

  useEffect(() => {
    console.log("Calling useEffect", canvas);
    function handleKeyboardShortcuts(event: KeyboardEvent) {
      const { key, metaKey, shiftKey, ctrlKey } = event;

      if (event?.target && (event.target as HTMLElement).tagName === "INPUT")
        return;

      if (!canvas) return;

      if (key === "z" && (ctrlKey || metaKey) && shiftKey) {
        console.log("REDO");
      } else if (key === "z" && (ctrlKey || metaKey)) {
        console.log("UNDO");
      }
    }

    document.addEventListener("keydown", handleKeyboardShortcuts);

    return () => {
      document.removeEventListener("keydown", handleKeyboardShortcuts);
    };
  }, [canvas]);

  return (
    <CanvasContext.Provider
      value={{
        ready,
        fabric,
        canvas: canvas.current!,
        initializeCanvas,
        disposeCanvas,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}
