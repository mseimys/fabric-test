import { useState } from 'react';
import { useCanvas } from './CanvasContext';

export function SerializedObject() {
  const [rawdata, setRawdata] = useState('');
  const { canvasToSvg, canvasToJson } = useCanvas();
  console.log('SerializedObject render');
  return (
    <div style={{ padding: '12px' }}>
      <button
        type="button"
        onClick={async () => {
          const data = await canvasToSvg();
          setRawdata(data);
        }}
      >
        TO SVG
      </button>
      <button
        type="button"
        onClick={async () => {
          const data = await canvasToJson();
          setRawdata(data);
        }}
      >
        TO JSON
      </button>
      <br />
      <pre>{rawdata}</pre>
    </div>
  );
}
