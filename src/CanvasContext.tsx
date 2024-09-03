import { useState, createContext, useRef, useEffect, useContext } from "react";

import * as fabric from "fabric";

type FabricCanvas = fabric.Canvas & {
  undo: () => Promise<void>;
  redo: () => Promise<void>;
};

const FABRIC_SAVE_TO_JSON = ["selectable", "editable", "id", "title"];
const MAX_UNDO_STEPS = 5;

const initialContext = {
  fabric,
  ready: false,
  canvas: {} as FabricCanvas,
  initializeCanvas: (_: HTMLCanvasElement) => {},
  disposeCanvas: () => {},
  obj: null as fabric.FabricObject | null,
  layers: [] as fabric.FabricObject[],
  canUndo: false,
  canRedo: false,
  loadSvg: (svgString: string, onSuccess?: () => void) => {},
};

const CanvasContext = createContext<typeof initialContext>(initialContext);

const initializeEvents = ({
  canvas,
  setActiveObject,
  setLayers,
}: {
  canvas: FabricCanvas;
  setActiveObject: (_: fabric.FabricObject | null) => void;
  setLayers: (_: fabric.FabricObject[]) => void;
}) => {
  const handleSelection = (
    _?: Partial<fabric.TEvent<fabric.TPointerEvent>>
  ) => {
    const activeObject = canvas.getActiveObject() || null;
    console.log("handleSelection", { activeObject });
    setActiveObject(activeObject);
  };

  const handleObjectChanges = (
    _?: { target: fabric.FabricObject } | undefined
  ) => {
    const { objects } = canvas.toDatalessJSON(FABRIC_SAVE_TO_JSON);
    setLayers(objects as fabric.FabricObject[]);
  };

  canvas.on({
    "selection:updated": handleSelection,
    "selection:created": handleSelection,
    "selection:cleared": handleSelection,
  });

  canvas.on({
    "object:added": handleObjectChanges,
    "object:modified": handleObjectChanges,
    "object:removed": handleObjectChanges,
    "object:skewing": handleObjectChanges,
  });

  // Call on initialization to set the initial state
  handleSelection();
  handleObjectChanges();
};

const history = {
  undo: [] as string[],
  redo: [] as string[],
  processing: false,
  currentState: "",
};

const loadSvg = async (
  canvas: FabricCanvas,
  svg: string,
  onSuccess?: () => void
) => {
  const { objects } = await fabric.loadSVGFromString(svg);
  const objectsToRender = objects.filter((item) => item !== null);
  canvas.add(...objectsToRender);
  canvas.renderAll();
  onSuccess?.();
};

const initializeHistory = ({
  canvas,
  setCanUndo,
  setCanRedo,
}: {
  canvas: FabricCanvas;
  setCanUndo: (_: boolean) => void;
  setCanRedo: (_: boolean) => void;
}) => {
  history.undo = [];
  history.redo = [];
  history.processing = false;
  history.currentState = JSON.stringify(
    canvas.toDatalessJSON(FABRIC_SAVE_TO_JSON)
  );

  const checkCanUndoRedo = () => {
    setCanUndo(history.undo.length !== 0);
    setCanRedo(history.redo.length !== 0);
  };

  canvas.undo = async () => {
    if (history.undo.length === 0) return;
    history.processing = true;
    const historyItem = history.undo.pop() as string;
    history.redo.push(history.currentState);
    history.currentState = historyItem;
    await canvas.loadFromJSON(historyItem);
    canvas.renderAll();
    history.processing = false;
    checkCanUndoRedo();
  };

  canvas.redo = async () => {
    console.log("DOING redo", history.redo.length);
    if (history.redo.length === 0) return;
    history.processing = true;
    const historyItem = history.redo.pop() as string;
    history.undo.push(history.currentState);
    history.currentState = historyItem;
    await canvas.loadFromJSON(historyItem);
    canvas.renderAll();
    history.processing = false;
    checkCanUndoRedo();
  };

  const handleHistoryChanges = () => {
    if (history.processing) return;
    console.warn("saveHistoryChanges");

    if (history.undo.length >= MAX_UNDO_STEPS) {
      // Remove the first item if the array exceeds the maximum length
      history.undo.shift();
    }
    history.undo.push(history.currentState);
    history.currentState = JSON.stringify(
      canvas.toDatalessJSON(FABRIC_SAVE_TO_JSON)
    );
    history.redo = [];
    checkCanUndoRedo();
  };

  canvas.on({
    "object:added": handleHistoryChanges,
    "object:modified": handleHistoryChanges,
    "object:removed": handleHistoryChanges,
    "object:skewing": handleHistoryChanges,
  });
};

export function CanvasContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [activeObject, setActiveObject] = useState<fabric.FabricObject | null>(
    null
  );
  const [layers, setLayers] = useState<fabric.FabricObject[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const canvas = useRef<FabricCanvas | null>(null);

  console.log("CanvasContextProvider render", { canvas });

  const initializeCanvas = (canvasElement: HTMLCanvasElement) => {
    const newCanvas = new fabric.Canvas(canvasElement, {
      backgroundColor: "lightgray",
    }) as FabricCanvas;
    newCanvas.add(
      new fabric.Circle({ left: 200, top: 100, radius: 50, fill: "red" })
    );
    newCanvas.add(
      new fabric.Rect({
        left: 300,
        top: 200,
        width: 50,
        height: 100,
        fill: "green",
      })
    );
    initializeEvents({ canvas: newCanvas, setActiveObject, setLayers });
    initializeHistory({ canvas: newCanvas, setCanUndo, setCanRedo });

    canvas.current = newCanvas;
    setReady(true);
  };

  const disposeCanvas = () => {
    canvas.current?.dispose();
    canvas.current = null;
  };

  useEffect(() => {
    function handleKeyboardShortcuts(event: KeyboardEvent) {
      const { key, metaKey, shiftKey, ctrlKey } = event;

      if (event?.target && (event.target as HTMLElement).tagName === "INPUT")
        return;

      if (!canvas) return;

      if (key === "z" && (ctrlKey || metaKey) && shiftKey) {
        canvas.current?.redo();
      } else if (key === "z" && (ctrlKey || metaKey)) {
        canvas.current?.undo();
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
        canvas: canvas.current as FabricCanvas,
        initializeCanvas,
        disposeCanvas,
        obj: activeObject,
        layers,
        canUndo,
        canRedo,
        loadSvg: (svgString: string, onSuccess?: () => void) => {
          loadSvg(canvas.current as FabricCanvas, svgString, onSuccess);
        },
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}

export const useCanvas = () => {
  return useContext(CanvasContext);
};
