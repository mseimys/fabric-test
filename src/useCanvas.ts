import { useContext } from "react";

import { CanvasContext } from "./CanvasContext";

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  return context;
};
