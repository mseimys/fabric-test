import { useState, createContext, useRef, useEffect, useContext } from "react";

import * as fabric from "fabric";
import { initializeHistory } from "./fabricHistory";

type FabricCanvas = fabric.Canvas & {
  undo: () => Promise<void>;
  redo: () => Promise<void>;
};

const FABRIC_CUSTOM_PROPERTIES = ["selectable", "editable", "id", "title"];

// Make sure these properties are (de)serialized
fabric.FabricObject.customProperties = FABRIC_CUSTOM_PROPERTIES;
const originalGetSvgCommons = fabric.FabricObject.prototype.getSvgCommons;
fabric.FabricObject.prototype.getSvgCommons = function () {
  // Save title in SVG
  const title = (this as any).title;
  const extra = title ? ` title="${title}"` : "";
  return originalGetSvgCommons.call(this) + extra;
};

// This is extreme hack to have `text-align` output in SVG
const originalAddPaintOrder = (fabric.FabricObject.prototype as any)
  .addPaintOrder;
(fabric.FabricObject.prototype as any).addPaintOrder = function () {
  const textAlign = (this as any).textAlign;
  const extra = textAlign ? ` text-align="${textAlign}"` : "";

  // This will be inserted inside the `<text ... >` tag.
  return originalAddPaintOrder.call(this) + extra;
};

type ModifyFunction = (_: fabric.FabricObject) => void;

type SerializedObject = fabric.FabricObject & {
  [key: string]: string | number;
};

const initialContext = {
  fabric,
  ready: false,
  canvas: {} as FabricCanvas,
  initializeCanvas: (_: HTMLCanvasElement) => {},
  disposeCanvas: () => {},
  obj: undefined as SerializedObject | undefined,
  updateActiveObject: (() => {}) as (_: ModifyFunction) => void,
  layers: [] as fabric.FabricObject[],
  canUndo: false,
  canRedo: false,
  undo: async () => {},
  redo: async () => {},
  loadSvg: (svgString: string, onSuccess?: () => void) => {},
  canvasToSvg: async () => "",
};

const CanvasContext = createContext<typeof initialContext>(initialContext);

const initializeEvents = ({
  canvas,
  setActiveObject,
  setLayers,
}: {
  canvas: FabricCanvas;
  setActiveObject: (_: SerializedObject | null) => void;
  setLayers: (_: fabric.FabricObject[]) => void;
}) => {
  const handleSelection = async (
    _?: Partial<fabric.TEvent<fabric.TPointerEvent>>
  ) => {
    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.isType("activeselection")) {
      setActiveObject(null);
      return;
    }
    setActiveObject(activeObject.toDatalessObject(FABRIC_CUSTOM_PROPERTIES));
  };

  const handleObjectChanges = (
    _?: { target: fabric.FabricObject } | undefined
  ) => {
    const { objects } = canvas.toDatalessJSON(FABRIC_CUSTOM_PROPERTIES);
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

export const setTextObjectTitle = (
  obj: fabric.FabricText,
  element: Element
): fabric.FabricText => {
  const parentNode: Element = element.parentNode as Element; // Raw SVG parent group <g> node
  const title =
    parentNode?.getAttribute("title") ?? element.getAttribute("title") ?? "";
  console.log("setTextObjectTitle", title);
  obj.set({ title });
  return obj;
};

const loadSvg = async (
  canvas: FabricCanvas,
  svg: string,
  onSuccess?: () => void
) => {
  const { objects, allElements } = await fabric.loadSVGFromString(svg);
  const objectsToRender = objects
    .map((item, index) => {
      console.log("loading", item?.type);
      if (item?.isType("text")) {
        return setTextObjectTitle(
          item as fabric.FabricText,
          allElements[index]
        );
      }
      return item;
    })
    .filter((item) => item !== null);
  console.log(
    objectsToRender,
    allElements.map((i) => i.getAttributeNames())
  );
  canvas.add(...objectsToRender);
  canvas.renderAll();
  onSuccess?.();
};

const canvasToSvg = async (canvas: FabricCanvas) => {
  const svg = canvas.toSVG({ suppressPreamble: true });
  return svg;
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
  const undo = useRef(async () => {});
  const redo = useRef(async () => {});

  console.log("CanvasContextProvider render", { canvas });

  const initializeCanvas = (canvasElement: HTMLCanvasElement) => {
    const newCanvas = new fabric.Canvas(canvasElement, {
      backgroundColor: "lightgray",
    }) as FabricCanvas;
    newCanvas.add(
      new fabric.Circle({ left: 200, top: 100, radius: 50, fill: "red" })
    );
    newCanvas.add(
      new fabric.IText("Hello!", {
        left: 100,
        top: 100,
        fill: "black",
        editable: true,
      })
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
    const history = initializeHistory({
      canvas: newCanvas,
      setCanUndo,
      setCanRedo,
    });
    undo.current = history.undo;
    redo.current = history.redo;

    canvas.current = newCanvas;
    setReady(true);
  };

  const updateActiveObject = (f: ModifyFunction) => {
    const activeObject = canvas.current?.getActiveObject();
    console.log("updateActiveObject", activeObject);
    if (activeObject && !activeObject.isType("activeselection")) {
      f(activeObject);
      activeObject.setCoords();
      canvas.current?.renderAll();
      canvas.current?.fire("object:modified", { target: activeObject });
      canvas.current?.fire("selection:updated");
    }
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
        redo.current();
      } else if (key === "z" && (ctrlKey || metaKey)) {
        undo.current();
      } else if (key === "Backspace" || key === "Delete") {
        // Delete
        const activeObjects = canvas.current?.getActiveObjects().map((obj) => {
          if (!(obj as fabric.IText).isEditing) {
            canvas.current?.remove(obj);
            return true;
          }
        });
        if (activeObjects?.some(Boolean)) {
          canvas.current?.discardActiveObject();
          canvas.current?.renderAll();
        }
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
        undo: undo.current,
        redo: redo.current,
        initializeCanvas,
        disposeCanvas,
        obj: activeObject,
        layers,
        canUndo,
        canRedo,
        loadSvg: (svgString: string, onSuccess?: () => void) => {
          loadSvg(canvas.current as FabricCanvas, svgString, onSuccess);
        },
        canvasToSvg: async () => {
          return canvas.current ? canvasToSvg(canvas.current) : "";
        },
        updateActiveObject,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}

export const useCanvas = () => {
  return useContext(CanvasContext);
};
