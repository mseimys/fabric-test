import { useState } from 'react';

import { useCanvas } from './CanvasContext';

export function Details() {
  const { canvas, obj, updateActiveObject } = useCanvas();
  console.log('Details render', { canvas, obj });

  if (!obj) return <div style={{ width: '33%' }}>No object selected</div>;

  return (
    <div style={{ width: '33%' }}>
      Details page ID={obj.id} | TITLE={obj.title}
      <br />
      Actions:{' '}
      <button
        type="button"
        onClick={() => {
          updateActiveObject(obj => obj.set({ title: 'NEW TITLE' }));
        }}
      >
        SET TITLE
      </button>
      <button
        type="button"
        onClick={() => {
          updateActiveObject(obj => obj.set({ left: obj.left + 5 }));
        }}
      >
        SLIDE RIGHT
      </button>
      <br />
      <div>SELECTED OBJ: {JSON.stringify(obj, undefined, 1)}</div>
    </div>
  );
}
