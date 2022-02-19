import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import * as classes from './Canvas.module.css';
const worker = new Worker(new URL('../worker.ts', import.meta.url),
{type: 'module'});

type Offset = {
  x: number;
  y: number;
}

type GridOptions = {
  rows: number;
  columns: number;
  cellSize: number
}

const Canvas = () => {

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const loading = useRef(false);
  const [gridOptions, setGridOptions] = useState<GridOptions>({rows: 100, columns: 100, cellSize: 10});
  const offset = useRef<Offset>({x: 0, y: 0});
  const mouseState = useRef({
    mouseDown: false,
    action: "none"
  });
  const grid = useRef<Uint8Array>(new Uint8Array(gridOptions.rows * gridOptions.columns));

  const res = useRef<number>(1);

  const handleCanvasClick = useCallback(() => {
    loading.current = true;
    worker.postMessage({width: 3, height: res.current});
  }, []);

  const handleMouseEvents: React.MouseEventHandler<HTMLCanvasElement> = useCallback((event) => {
    switch (event.type) {
      case "mousedown":
        mouseState.current.mouseDown = true;
        break;
      case "mousemove":
        if (mouseState.current.mouseDown) {
          mouseState.current.action = "dragging";
          console.log(mouseState.current.action);
          offset.current = {
            x: offset.current.x += event.movementX,
            y: offset.current.y += event.movementY
          }
          console.log(offset.current);
        } else {
          mouseState.current.action = "none"
        }
        break;
      case "mouseup":
        mouseState.current.mouseDown = false
        break;
      default:
        break;
    }
  }, []);

  return (
    <>
      <div>
        <button>test</button>
      </div>
      <div
        className={classes.canvasWrapper}
        ref={canvasWrapperRef}>
      </div>
    </>
  );
};

export default Canvas;
