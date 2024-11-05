import { memo } from 'react';
import type { FabricObject } from 'fabric';

import { useCanvas } from './CanvasContext';

const LayersComponent = ({ layers }: { layers: FabricObject[] }) => {
  console.log('LayersComponent render', { layers });

  return (
    <ul>
      {layers.map((obj, index) => (
        <li key={index}>
          {index} - {obj.type}
        </li>
      ))}
    </ul>
  );
};

const Layers = memo(LayersComponent);

const SVG_STRING = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
<rect id="MAIN_000_CONTAIN" x="60" y="125" width="30" height="200" fill="blue"/>
<rect id="MAIN_001" title="JUSTTITLE" data-title="DATATITLE" x="520" y="50" width="360" height="425" fill="yellow"/>
<g transform="matrix(0.71 0.71 -0.71 0.71 100 100)" style="" title="{title}" text-align="right">
<text xml:space="preserve" font-family="Open Sans" font-size="64" font-style="normal" font-weight="400" style="stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,170,27); fill-rule: nonzero; opacity: 1; white-space: pre;" text-align="right">
<tspan x="-241.97" y="20.1">45 degrees right</tspan>
</text>
</g>
</svg>`;

export function Objects() {
  const { layers, canRedo, canUndo, loadSvg, undo, redo } = useCanvas();
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          loadSvg(SVG_STRING);
        }}
      >
        LOAD SVG
      </button>
      <div>
        <button type="button" disabled={!canUndo} onClick={undo}>
          UNDO
        </button>
        <button type="button" disabled={!canRedo} onClick={redo}>
          REDO
        </button>
      </div>
      <div>
        Layers:
        {<Layers layers={layers} />}
      </div>
    </div>
  );
}
