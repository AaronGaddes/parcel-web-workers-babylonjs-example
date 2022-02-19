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

const drawBasicGrid = (ctx: CanvasRenderingContext2D, canvasWrapper: HTMLDivElement, offset: Offset, gridOptions: GridOptions) => {

  if (ctx.canvas.height != canvasWrapper.clientHeight || ctx.canvas.width != canvasWrapper.clientWidth) {
    ctx.canvas.height = canvasWrapper.clientHeight;
    ctx.canvas.width = canvasWrapper.clientWidth;
  }
  ctx.fillStyle = "salmon";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.strokeStyle = "white";
  ctx.beginPath();
  for (let x = offset.x % gridOptions.cellSize; x <= ctx.canvas.width; x += gridOptions.cellSize) {
    // const xCoord = i * gridOptions.cellSize + offset.x
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ctx.canvas.height);
  }
  ctx.stroke();

  ctx.beginPath();
  for (let y = offset.y % gridOptions.cellSize; y <= ctx.canvas.height; y += gridOptions.cellSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(ctx.canvas.width, y);
  }
  ctx.stroke();
};

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

  const draw = () => {

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const canvasWrapper = canvasWrapperRef.current;

    if (canvas && ctx && canvasWrapper) {
      drawBasicGrid(ctx, canvasWrapper, offset.current, gridOptions);
    }
  
    setTimeout(() => {
      requestAnimationFrame(draw);
    }, 1000/60);
  }

  useLayoutEffect(() => {
    draw();

    const handleMessageEvent = (d: MessageEvent<number>) => {
      console.log(d);
      res.current = d.data;
      loading.current = false;
    };

    worker.addEventListener('message', handleMessageEvent)

    return () => {
      // window.removeEventListener("resize", handleResize);
      worker.removeEventListener('message', handleMessageEvent);
    };
  }, []);

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
        <canvas
          ref={canvasRef}
          // onClick={handleCanvasClick}
          onMouseDown={handleMouseEvents}
          onMouseMove={handleMouseEvents}
          onMouseUp={handleMouseEvents}
        />
      </div>
    </>
  );
};

export default Canvas;
