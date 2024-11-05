import type { Canvas } from 'fabric';

const DEFAULT_MAX_UNDO_STEPS = 50;

const history = {
  undo: [] as string[],
  redo: [] as string[],
  processing: false,
  currentState: '',
};

export const initializeHistory = ({
  canvas,
  setCanUndo,
  setCanRedo,
  customProperties = [],
  maxUndoSteps = DEFAULT_MAX_UNDO_STEPS,
}: {
  canvas: Canvas;
  setCanUndo: (_: boolean) => void;
  setCanRedo: (_: boolean) => void;
  customProperties?: string[];
  maxUndoSteps?: number;
}) => {
  history.undo = [];
  history.redo = [];
  history.processing = false;
  history.currentState = JSON.stringify(canvas.toDatalessJSON(customProperties));

  const checkCanUndoRedo = () => {
    setCanUndo(history.undo.length !== 0);
    setCanRedo(history.redo.length !== 0);
  };

  const undo = async () => {
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

  const redo = async () => {
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
    console.warn('saveHistoryChanges');

    if (history.undo.length >= maxUndoSteps) {
      // Remove the first item if the array exceeds the maximum length
      history.undo.shift();
    }
    history.undo.push(history.currentState);
    history.currentState = JSON.stringify(canvas.toDatalessJSON(customProperties));
    history.redo = [];
    checkCanUndoRedo();
  };

  canvas.on({
    'object:added': handleHistoryChanges,
    'object:modified': handleHistoryChanges,
    'object:removed': handleHistoryChanges,
    'object:skewing': handleHistoryChanges,
  });

  return {
    undo,
    redo,
  };
};
