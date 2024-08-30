import { useState } from "react";
import { useCanvas } from "./useCanvas";

export default function Details() {
    const [number, setNumber] = useState(0);
    const { canvas, fabric } =  useCanvas();
    console.log("Details render", {canvas});
    return (
        <div>Details page
            <button onClick={() => {
                console.log("Add Circle", number);
                canvas.add(new fabric.Circle({ left: number*10, top: 100, radius: 5, fill: 'blue', absolutePositioned: true }));
                setNumber(number + 1);
            }}>Add Circle</button>
        </div>
    )
}
